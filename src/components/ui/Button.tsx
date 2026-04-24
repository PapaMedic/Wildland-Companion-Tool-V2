import { type ButtonHTMLAttributes, forwardRef } from 'react';
import { cn } from '../../lib/utils';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'glass' | 'danger';
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center rounded-xl px-4 py-2.5 text-sm font-semibold transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-black disabled:opacity-50 disabled:pointer-events-none active:scale-[0.98]",
          variant === 'primary' && "bg-green-700 hover:bg-green-600 text-white focus:ring-green-600",
          variant === 'glass' && "bg-white/10 hover:bg-white/20 text-white border border-white/10 backdrop-blur-md focus:ring-white/20",
          variant === 'danger' && "bg-red-600/80 hover:bg-red-600 text-white focus:ring-red-600",
          className
        )}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";
