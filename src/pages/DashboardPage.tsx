import { format } from 'date-fns';
import { GlassCard } from '../components/ui/GlassCard';
import { OfflineBadge } from '../components/ui/OfflineBadge';
import { SectionHeader } from '../components/ui/SectionHeader';
import { Users, Truck, Flame, Clock } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../lib/db';

export function DashboardPage() {
  const currentDate = format(new Date(), 'EEEE, MMMM do');
  const currentTime = format(new Date(), 'HH:mm');

  const activeApparatus = useLiveQuery(() => 
    db.apparatus.where('status').equals('active').first()
  );
  
  const personnelCount = useLiveQuery(() => 
    activeApparatus 
      ? db.personnel.where('apparatusId').equals(activeApparatus.id).count() 
      : 0
  , [activeApparatus?.id]) ?? 0;

  const activeIncidentsCount = useLiveQuery(() => 
    db.incidents.where('status').equals('active').count()
  ) ?? 0;


  return (
    <div className="flex flex-col gap-4 animate-in fade-in duration-700">
      
      {/* 1. Header Card (Full Width) */}
      <GlassCard className="p-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black uppercase tracking-tighter text-white">Wildland Companion</h1>
          <div className="flex items-center gap-2 mt-1 text-white/60 text-sm">
            <Clock className="w-3 h-3" />
            <span>{currentDate} • {currentTime}</span>
          </div>
        </div>
        <OfflineBadge />
      </GlassCard>

      {/* Bento Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        
        {/* Apparatus Card */}
        <Link to="/apparatus" className="col-span-2">
          <GlassCard className="p-5 h-full hover:bg-white/10 transition-all group">
            <div className="flex items-center justify-between mb-4">
              <Truck className="w-6 h-6 text-green-500 group-hover:scale-110 transition-transform" />
              <div className="px-2 py-1 rounded bg-green-500/10 text-green-500 text-[10px] font-bold uppercase">Active Unit</div>
            </div>
            <SectionHeader 
              title={activeApparatus?.unitId || "No Active Unit"} 
              subtitle={activeApparatus ? `${activeApparatus.makeModel} • ${activeApparatus.equipmentType}` : "Assign an apparatus to start"} 
            />
          </GlassCard>
        </Link>

        {/* Personnel Card */}
        <Link to="/personnel">
          <GlassCard className="p-5 h-full hover:bg-white/10 transition-all group flex flex-col justify-between">
            <Users className="w-6 h-6 text-blue-400 mb-4 group-hover:scale-110 transition-transform" />
            <div>
              <span className="text-3xl font-black text-white leading-none">{personnelCount}</span>
              <p className="text-xs text-white/60 uppercase tracking-wider font-bold mt-1">Crew Members</p>
            </div>
          </GlassCard>
        </Link>

        {/* Incidents Card */}
        <Link to="/incidents">
          <GlassCard className="p-5 h-full hover:bg-white/10 transition-all group flex flex-col justify-between">
            <Flame className="w-6 h-6 text-rose-500 mb-4 group-hover:scale-110 transition-transform" />
            <div>
              <span className="text-3xl font-black text-white leading-none">{activeIncidentsCount}</span>
              <p className="text-xs text-white/60 uppercase tracking-wider font-bold mt-1">Active Fires</p>
            </div>
          </GlassCard>
        </Link>
      </div>
    </div>
  );
}
