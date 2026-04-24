import { useNetworkStatus } from '../../lib/hooks/useNetworkStatus';
import { cn } from '../../lib/utils';

export function OfflineBadge({ className }: { className?: string }) {
  const isOnline = useNetworkStatus();

  return (
    <div
      className={cn(
        "inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium bg-white/5 border border-white/10 backdrop-blur-md",
        className
      )}
    >
      <span className={cn(
        "w-2 h-2 rounded-full",
        isOnline ? "bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]" : "bg-zinc-500"
      )} />
      <span className={isOnline ? "text-white" : "text-zinc-400"}>
        {isOnline ? "Online" : "Offline"}
      </span>
    </div>
  );
}
