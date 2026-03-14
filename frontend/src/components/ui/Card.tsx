import { type HTMLAttributes, forwardRef } from 'react';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'surface' | 'elevated';
}

const variantClasses = {
  default: 'bg-surface border border-[var(--border)]',
  surface: 'bg-[var(--surface2)] border border-[var(--border)]',
  elevated: 'bg-surface border border-[var(--border)] shadow-lg',
};

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className = '', variant = 'default', ...props }, ref) => (
    <div
      ref={ref}
      className={`rounded-xl ${variantClasses[variant]} ${className}`}
      {...props}
    />
  )
);
Card.displayName = 'Card';

export const CardHeader = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className = '', ...props }, ref) => (
    <div ref={ref} className={`p-4 border-b border-[var(--border)] ${className}`} {...props} />
  )
);
CardHeader.displayName = 'CardHeader';

export const CardContent = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className = '', ...props }, ref) => <div ref={ref} className={`p-4 ${className}`} {...props} />
);
CardContent.displayName = 'CardContent';
