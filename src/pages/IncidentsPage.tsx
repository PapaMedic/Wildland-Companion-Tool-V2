import { useState } from 'react';
import { GlassCard } from '../components/ui/GlassCard';
import { SectionHeader } from '../components/ui/SectionHeader';
import { Link } from 'react-router-dom';
import { ArrowLeft, Flame, Plus, MapPin } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { FormInput } from '../components/ui/FormInput';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { db } from '../lib/db';
import { useLiveQuery } from 'dexie-react-hooks';

const schema = z.object({
  name: z.string().min(1, 'Incident Name is required'),
  number: z.string().min(1, 'Incident Number is required'),
  location: z.string().min(1, 'Location is required'),
  financialCode: z.string().min(1, 'Financial Code is required'),
  resourceOrderNumber: z.string().min(1, 'Resource Order Number is required'),
});

type FormValues = z.infer<typeof schema>;

export function IncidentsPage() {
  const [isAdding, setIsAdding] = useState(false);

  const activeIncidents = useLiveQuery(() => 
    db.incidents.where('status').equals('active').toArray()
  ) ?? [];

  const closedIncidents = useLiveQuery(() => 
    db.incidents.where('status').equals('closed').toArray()
  ) ?? [];

  const { register, handleSubmit, formState: { errors }, reset } = useForm<FormValues>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormValues) => {
    try {
      await db.incidents.add({
        id: crypto.randomUUID(),
        ...data,
        status: 'active',
      });
      reset();
      setIsAdding(false);
    } catch (error) {
      console.error('Failed to create incident:', error);
    }
  };

  return (
    <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to="/"><Button variant="glass" className="w-10 h-10 p-0"><ArrowLeft className="w-5 h-5" /></Button></Link>
          <div>
            <h1 className="text-2xl font-black uppercase tracking-tighter leading-none">Incidents</h1>
            <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest mt-1">Fire Assignments & Logs</p>
          </div>
        </div>
        <Button onClick={() => setIsAdding(!isAdding)} className="w-10 h-10 p-0 sm:w-auto sm:px-4">
          <Plus className="w-4 h-4 sm:mr-2" />
          <span className="hidden sm:inline">New Incident</span>
        </Button>
      </div>

      {isAdding && (
        <GlassCard className="p-6 border-rose-500/30">
          <SectionHeader title="Create New Incident" subtitle="Register a new fire assignment" />
          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-white/40 ml-1">Incident Name</label>
                <FormInput {...register('name')} placeholder="e.g. Bear Fire" />
                {errors.name && <p className="text-[10px] font-bold text-red-500 uppercase mt-1 ml-1">{errors.name.message}</p>}
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-white/40 ml-1">Incident Number</label>
                <FormInput {...register('number')} placeholder="e.g. CA-PNF-001234" />
                {errors.number && <p className="text-[10px] font-bold text-red-500 uppercase mt-1 ml-1">{errors.number.message}</p>}
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-white/40 ml-1">Location</label>
                <FormInput {...register('location')} placeholder="e.g. Plumas National Forest" />
                {errors.location && <p className="text-[10px] font-bold text-red-500 uppercase mt-1 ml-1">{errors.location.message}</p>}
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-white/40 ml-1">Financial Code</label>
                <FormInput {...register('financialCode')} placeholder="e.g. P5ABCD" />
                {errors.financialCode && <p className="text-[10px] font-bold text-red-500 uppercase mt-1 ml-1">{errors.financialCode.message}</p>}
              </div>
              <div className="flex flex-col gap-1.5 md:col-span-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-white/40 ml-1">Resource Order Number</label>
                <FormInput {...register('resourceOrderNumber')} placeholder="e.g. E-12" />
                {errors.resourceOrderNumber && <p className="text-[10px] font-bold text-red-500 uppercase mt-1 ml-1">{errors.resourceOrderNumber.message}</p>}
              </div>
            </div>
            <div className="flex justify-end gap-3">
              <Button variant="glass" type="button" onClick={() => setIsAdding(false)}>Cancel</Button>
              <Button type="submit">Initialize Incident</Button>
            </div>
          </form>
        </GlassCard>
      )}

      <div className="flex flex-col gap-8">
        <div>
          <div className="flex items-center gap-2 mb-4 ml-1">
            <Flame className="w-4 h-4 text-rose-500" />
            <h2 className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em]">Active Assignments</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {activeIncidents.length === 0 && !isAdding && (
              <div className="col-span-full py-12 text-center text-white/20 font-black uppercase tracking-widest text-sm bg-white/5 border border-dashed border-white/10 rounded-2xl">
                No Active Incidents
              </div>
            )}
            {activeIncidents.map(inc => (
              <Link key={inc.id} to={`/incidents/${inc.id}`} className="block group">
                <GlassCard className="p-5 h-full hover:bg-white/10 transition-all group-hover:border-rose-500/30">
                  <div className="flex justify-between items-start mb-4">
                    <div className="w-10 h-10 rounded-lg bg-rose-500/10 flex items-center justify-center border border-rose-500/20">
                      <Flame className="w-5 h-5 text-rose-500" />
                    </div>
                    <span className="text-[8px] font-black bg-rose-500 text-white px-2 py-0.5 rounded uppercase tracking-[0.2em]">Active</span>
                  </div>
                  <h3 className="font-bold text-lg text-white mb-1 group-hover:text-rose-400 transition-colors uppercase tracking-tight">{inc.name}</h3>
                  <p className="text-[10px] font-black text-white/40 font-mono mb-3 tracking-widest uppercase">{inc.number}</p>
                  <div className="flex items-center gap-1.5 text-white/40">
                    <MapPin className="w-3 h-3" />
                    <span className="text-[10px] font-bold uppercase tracking-wider truncate">{inc.location}</span>
                  </div>
                </GlassCard>
              </Link>
            ))}
          </div>
        </div>

        {closedIncidents.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-4 ml-1">
              <h2 className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em]">Archive</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {closedIncidents.map(inc => (
                <Link key={inc.id} to={`/incidents/${inc.id}`} className="block opacity-60 hover:opacity-100 transition-all">
                  <GlassCard className="p-5 h-full hover:bg-white/10">
                    <div className="flex justify-between items-start mb-3">
                      <h3 className="font-bold text-white uppercase tracking-tight">{inc.name}</h3>
                      <span className="text-[8px] font-black bg-white/10 text-white/40 px-2 py-0.5 rounded uppercase tracking-[0.2em]">Closed</span>
                    </div>
                    <p className="text-[10px] font-bold text-white/40 font-mono uppercase tracking-widest">{inc.number}</p>
                  </GlassCard>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
