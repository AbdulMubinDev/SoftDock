import { type ButtonHTMLAttributes, forwardRef } from 'react';

type Variant = 'primary' | 'secondary' | 'ghost' | 'destructive';
type Size = 'sm' | 'md' | 'lg';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  asChild?: boolean;
}

const variantClasses: Record<Variant, string> = {
  primary: 'bg-primary text-white border-transparent hover:bg-primary-bright hover:shadow-glow',
  secondary: 'border border-[var(--border)] bg-transparent text-text-muted hover:border-primary hover:text-[var(--text)]',
  ghost: 'border border-[var(--border)] bg-transparent text-text-muted hover:border-primary hover:text-[var(--text)]',
  destructive: 'bg-destructive text-white border-transparent hover:opacity-90',
};

const sizeClasses: Record<Size, string> = {
  sm: 'px-4 py-2 text-sm rounded-lg',
  md: 'px-5 py-2.5 text-sm rounded-lg',
  lg: 'px-8 py-3.5 text-base rounded-xl',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className = '', variant = 'primary', size = 'md', asChild, ...props }, ref) => {
    const classes = `inline-flex items-center justify-center font-medium transition-all duration-200 ${variantClasses[variant]} ${sizeClasses[size]} ${className}`;
    return <button ref={ref} className={classes} {...props} />;
  }
);
Button.displayName = 'Button';
