import re
import logging

import httpx
from bs4 import BeautifulSoup
from celery import shared_task

logger = logging.getLogger(__name__)

CHUNK_SIZE = 2000
CHUNK_OVERLAP = 200
URL_FETCH_TIMEOUT = 30


def _clean_html(html: str) -> str:
    """Extract readable text from HTML using BeautifulSoup."""
    soup = BeautifulSoup(html, "html.parser")
    for tag in soup(["script", "style", "nav", "footer", "header", "aside", "noscript"]):
        tag.decompose()
    text = soup.get_text(separator="\n")
    text = re.sub(r"\n{3,}", "\n\n", text)
    text = re.sub(r"[ \t]+", " ", text)
    return text.strip()


def _clean_text(text: str) -> str:
    """Strip HTML tags and normalize whitespace for plain text."""
    text = re.sub(r"<[^>]+>", " ", text)
    text = re.sub(r"\s+", " ", text).strip()
    return text


def _chunk_text(text: str, size: int = CHUNK_SIZE, overlap: int = CHUNK_OVERLAP) -> list[str]:
    """Split text into overlapping chunks for context injection."""
    chunks = []
    start = 0
    while start < len(text):
        end = start + size
        chunks.append(text[start:end])
        start = end - overlap
    return [c for c in chunks if c.strip()]


def _fetch_url(url: str) -> str:
    """Fetch a URL and return its text content."""
    headers = {
        "User-Agent": "SoftDock/1.0 (Documentation Ingestion Bot)",
        "Accept": "text/html,application/xhtml+xml,text/plain,application/json",
    }
    resp = httpx.get(url, headers=headers, timeout=URL_FETCH_TIMEOUT, follow_redirects=True)
    resp.raise_for_status()

    content_type = resp.headers.get("content-type", "")
    if "html" in content_type:
        return _clean_html(resp.text)
    return resp.text


@shared_task(bind=True, max_retries=3, default_retry_delay=30)
def process_document(self, document_id: str):
    """Clean and chunk a KnowledgeDocument asynchronously."""
    from knowledge.models import KnowledgeDocument

    try:
        doc = KnowledgeDocument.objects.get(id=document_id)
    except KnowledgeDocument.DoesNotExist:
        logger.error("Document %s not found", document_id)
        return

    doc.processing_status = KnowledgeDocument.ProcessingStatus.PROCESSING
    doc.save(update_fields=["processing_status"])

    try:
        raw = doc.raw_content or ""

        if doc.source_url and not raw:
            logger.info("Fetching URL for document %s: %s", document_id, doc.source_url)
            raw = _fetch_url(doc.source_url)
            doc.raw_content = raw
            doc.save(update_fields=["raw_content"])

        if not raw:
            doc.processing_status = KnowledgeDocument.ProcessingStatus.FAILED
            doc.save(update_fields=["processing_status"])
            logger.warning("Document %s has no content to process", document_id)
            return

        cleaned = _clean_text(raw)
        chunks = _chunk_text(cleaned)
        doc.processed_chunks = chunks
        doc.char_count = len(cleaned)
        doc.chunk_count = len(chunks)
        doc.processing_status = KnowledgeDocument.ProcessingStatus.READY
        doc.save(update_fields=[
            "processed_chunks", "char_count", "chunk_count",
            "processing_status", "raw_content",
        ])
        logger.info("Document %s processed: %d chunks", document_id, len(chunks))
    except Exception as exc:
        doc.processing_status = KnowledgeDocument.ProcessingStatus.FAILED
        doc.save(update_fields=["processing_status"])
        logger.exception("Failed processing document %s", document_id)
        raise self.retry(exc=exc)
