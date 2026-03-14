import { type HTMLAttributes } from 'react';

type Status = 'open' | 'resolved' | 'archived' | 'info' | 'success' | 'error';

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  status?: Status;
  dot?: boolean;
}

const statusClasses: Record<Status, string> = {
  open: 'bg-primary/15 text-[#60A5FA] border border-primary/25',
  resolved: 'bg-success/12 text-[#4ADE80] border border-success/25',
  archived: 'bg-surface-2 text-text-dim border border-[var(--border)]',
  info: 'bg-primary/15 text-primary-bright border border-primary/25',
  success: 'bg-success/12 text-success border border-success/25',
  error: 'bg-destructive/15 text-destructive border border-destructive/25',
};

export function Badge({ className = '', status = 'info', dot = false, children, ...props }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${statusClasses[status]} ${className}`}
      {...props}
    >
      {dot && <span className="w-1.5 h-1.5 rounded-full bg-current" />}
      {children}
    </span>
  );
}
