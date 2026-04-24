import { type HTMLAttributes, forwardRef } from 'react';
import { cn } from '../../lib/utils';

export const GlassCard = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xl shadow-lg transition-all duration-300",
          className
        )}
        {...props}
      />
    );
  }
);
GlassCard.displayName = "GlassCard";
