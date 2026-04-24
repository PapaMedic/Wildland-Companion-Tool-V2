import { cn } from '../../lib/utils';

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  className?: string;
}

export function SectionHeader({ title, subtitle, className }: SectionHeaderProps) {
  return (
    <div className={cn("mb-4", className)}>
      <h3 className="text-lg font-bold text-white leading-tight">{title}</h3>
      {subtitle && <p className="text-sm text-white/60 mt-1">{subtitle}</p>}
    </div>
  );
}
