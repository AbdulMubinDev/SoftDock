import { MarkdownMessage } from './MarkdownMessage';
import { useSmoothStream } from '../../hooks/useSmoothStream';

interface Props {
  content: string;
  isStreaming: boolean;
}

export function AssistantMessage({ content, isStreaming }: Props) {
  const displayed = useSmoothStream(content, isStreaming);

  if (!displayed && isStreaming) {
    return (
      <span className="inline-flex items-center gap-1.5 text-text-dim">
        <span className="w-1.5 h-1.5 rounded-full bg-primary-bright animate-pulse" />
        SoftDock is thinking
        <span className="inline-flex gap-0.5">
          <span className="w-1 h-1 rounded-full bg-current opacity-70 animate-pulse" />
          <span className="w-1 h-1 rounded-full bg-current opacity-70 animate-pulse" style={{ animationDelay: '0.15s' }} />
          <span className="w-1 h-1 rounded-full bg-current opacity-70 animate-pulse" style={{ animationDelay: '0.3s' }} />
        </span>
      </span>
    );
  }

  return (
    <>
      <MarkdownMessage content={displayed} />
      {isStreaming && (
        <span className="inline-block w-0.5 h-4 bg-primary-bright ml-0.5 align-middle animate-blink" />
      )}
    </>
  );
}
