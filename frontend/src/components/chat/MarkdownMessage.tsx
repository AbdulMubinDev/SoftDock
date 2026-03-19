import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import { useState, useCallback } from 'react';

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [text]);

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="absolute top-2 right-2 px-2 py-1 rounded-md text-[11px] font-medium bg-[rgba(255,255,255,0.06)] text-text-dim hover:text-[var(--text)] hover:bg-[rgba(255,255,255,0.1)] transition-colors cursor-pointer opacity-0 group-hover:opacity-100"
    >
      {copied ? 'Copied!' : 'Copy'}
    </button>
  );
}

interface MarkdownMessageProps {
  content: string;
}

export function MarkdownMessage({ content }: MarkdownMessageProps) {
  return (
    <div className="markdown-body">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeHighlight]}
        components={{
          pre({ children, ...props }) {
            const codeText = extractText(children);
            return (
              <div className="relative group">
                <CopyButton text={codeText} />
                <pre {...props}>{children}</pre>
              </div>
            );
          },
          a({ href, children, ...props }) {
            return (
              <a href={href} target="_blank" rel="noopener noreferrer" {...props}>
                {children}
              </a>
            );
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}

function extractText(node: React.ReactNode): string {
  if (typeof node === 'string') return node;
  if (Array.isArray(node)) return node.map(extractText).join('');
  if (node && typeof node === 'object' && 'props' in node) {
    return extractText((node as React.ReactElement<{ children?: React.ReactNode }>).props.children);
  }
  return '';
}
