import { type ReactNode } from 'react';
import { cn } from '../../lib/utils';
import fireBg from '../../assets/images/fire-bg.png';

import { BottomNav } from '../BottomNav';

interface AppShellProps {
  children: ReactNode;
  className?: string;
}

export function AppShell({ children, className }: AppShellProps) {
  return (
    <div className="relative min-h-screen bg-black text-white selection:bg-green-500/30 selection:text-white">
      {/* Background Image Layer */}
      <div 
        className="fixed inset-0 z-0 bg-cover bg-center bg-no-repeat pointer-events-none"
        style={{ backgroundImage: `url(${fireBg})` }}
      />
      
      {/* Dark Overlay & Blur Layer */}
      <div className="fixed inset-0 z-0 bg-black/70 backdrop-blur-[2px] pointer-events-none" />

      {/* Content Layer */}
      <div className={cn("relative z-10 flex flex-col min-h-screen", className)}>
        <main className="flex-1 overflow-y-auto px-4 pb-32 pt-6 sm:px-6 lg:px-8">
          <div className="max-w-5xl mx-auto">
            {children}
          </div>
        </main>
      </div>

      <BottomNav />
    </div>
  );
}
