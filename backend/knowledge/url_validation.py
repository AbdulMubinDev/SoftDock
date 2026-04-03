"""
Block SSRF when fetching user-supplied URLs for knowledge ingestion.
"""

import ipaddress
import socket
from urllib.parse import urlparse


def is_safe_http_url_for_fetch(url: str) -> bool:
    """
    Allow only http(s) URLs whose host does not resolve to loopback, private,
    link-local, or reserved ranges (mitigates SSRF from Celery fetch).
    """
    if not url or not isinstance(url, str):
        return False
    try:
        parsed = urlparse(url.strip())
    except Exception:
        return False
    if parsed.scheme not in ("http", "https"):
        return False
    host = parsed.hostname
    if not host:
        return False
    host_lower = host.lower()
    if host_lower in ("localhost", "127.0.0.1", "0.0.0.0", "::1"):
        return False

    try:
        ip = ipaddress.ip_address(host)
        if ip.is_private or ip.is_loopback or ip.is_link_local or ip.is_reserved or ip.is_multicast:
            return False
        return True
    except ValueError:
        pass

    try:
        for res in socket.getaddrinfo(host, None, type=socket.SOCK_STREAM):
            addr = res[4][0]
            ip = ipaddress.ip_address(addr)
            if ip.is_private or ip.is_loopback or ip.is_link_local or ip.is_reserved or ip.is_multicast:
                return False
    except OSError:
        return False

    return True
