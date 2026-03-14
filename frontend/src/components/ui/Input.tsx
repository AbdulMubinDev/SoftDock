import { type InputHTMLAttributes, forwardRef } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className = '', label, error, type = 'text', ...props }, ref) => (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-text-secondary mb-1.5">{label}</label>
      )}
      <input
        ref={ref}
        type={type}
        className={`w-full bg-surface-2 border border-[var(--border)] rounded-lg px-4 py-2.5 text-[var(--text)] placeholder:text-text-dim focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent ${error ? 'border-destructive' : ''} ${className}`}
        {...props}
      />
      {error && <p className="mt-1 text-sm text-destructive">{error}</p>}
    </div>
  )
);
Input.displayName = 'Input';
