import { useState, useEffect } from 'react';
import { GlassCard } from '../components/ui/GlassCard';
import { SectionHeader } from '../components/ui/SectionHeader';
import { Link } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, Trash2, Truck } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { FormInput } from '../components/ui/FormInput';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { db } from '../lib/db';
import { useLiveQuery } from 'dexie-react-hooks';
import { cn } from '../lib/utils';

const schema = z.object({
  unitId: z.string().min(1, 'Unit ID is required'),
  makeModel: z.string().min(1, 'Make / Model is required'),
  equipmentType: z.string().min(1, 'Equipment Type is required'),
  serialVin: z.string().min(1, 'Serial / VIN is required'),
  licenseId: z.string().min(1, 'License / ID is required'),
  homeUnit: z.string().min(1, 'Home Unit is required'),
});

type FormValues = z.infer<typeof schema>;

export function ApparatusPage() {
  const [successMsg, setSuccessMsg] = useState('');

  const activeApparatus = useLiveQuery(() => 
    db.apparatus.where('status').equals('active').first()
  );

  const allApparatus = useLiveQuery(() => 
    db.apparatus.toArray()
  ) ?? [];

  const handleDeleteApparatus = async (id: string, unitId: string) => {
    if (!confirm(`Are you sure you want to delete apparatus "${unitId}"? This will also unassign any personnel attached to it.`)) return;
    
    try {
      await db.transaction('rw', [db.apparatus, db.personnel], async () => {
        await db.personnel.where('apparatusId').equals(id).modify({ apparatusId: '' });
        await db.apparatus.delete(id);
      });
    } catch (error) {
      console.error('Failed to delete apparatus:', error);
      alert('Failed to delete apparatus.');
    }
  };

  const { register, handleSubmit, formState: { errors }, reset, setValue } = useForm<FormValues>({
    resolver: zodResolver(schema),
  });

  useEffect(() => {
    if (activeApparatus) {
      setValue('unitId', activeApparatus.unitId);
      setValue('makeModel', activeApparatus.makeModel);
      setValue('equipmentType', activeApparatus.equipmentType);
      setValue('serialVin', activeApparatus.serialVin);
      setValue('licenseId', activeApparatus.licenseId);
      setValue('homeUnit', activeApparatus.homeUnit);
    } else {
      reset();
    }
  }, [activeApparatus, setValue, reset]);

  const onSubmit = async (data: FormValues) => {
    try {
      await db.transaction('rw', db.apparatus, async () => {
        await db.apparatus.where('status').equals('active').modify({ status: 'inactive' });
        
        if (activeApparatus) {
          await db.apparatus.update(activeApparatus.id, {
            ...data,
            status: 'active'
          });
        } else {
          await db.apparatus.add({
            id: crypto.randomUUID(),
            ...data,
            status: 'active'
          });
        }
      });
      
      setSuccessMsg('Apparatus configuration saved.');
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (error) {
      console.error('Failed to save apparatus:', error);
    }
  };

  return (
    <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center gap-4">
        <Link to="/"><Button variant="glass" className="w-10 h-10 p-0"><ArrowLeft className="w-5 h-5" /></Button></Link>
        <div>
          <h1 className="text-2xl font-black uppercase tracking-tighter leading-none">Apparatus</h1>
          <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest mt-1">Vehicle & Equipment Profile</p>
        </div>
      </div>

      {successMsg && (
        <div className="p-4 rounded-2xl bg-green-500/10 border border-green-500/20 text-green-500 flex items-center gap-3 animate-in zoom-in-95 duration-300">
          <CheckCircle2 className="w-5 h-5" />
          <p className="text-xs font-bold uppercase tracking-widest">{successMsg}</p>
        </div>
      )}

      <GlassCard className="p-6">
        <SectionHeader title="Vehicle Details" subtitle="Enter your current assignment identification" />
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-black uppercase tracking-widest text-white/40 ml-1">Unit ID (E-number)</label>
              <FormInput {...register('unitId')} placeholder="e.g. E-123" />
              {errors.unitId && <p className="text-[10px] font-bold text-red-500 uppercase mt-1 ml-1">{errors.unitId.message}</p>}
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-black uppercase tracking-widest text-white/40 ml-1">Make / Model</label>
              <FormInput {...register('makeModel')} placeholder="e.g. Ford F-550" />
              {errors.makeModel && <p className="text-[10px] font-bold text-red-500 uppercase mt-1 ml-1">{errors.makeModel.message}</p>}
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-black uppercase tracking-widest text-white/40 ml-1">Equipment Type</label>
              <FormInput {...register('equipmentType')} placeholder="e.g. Type 6 Engine" />
              {errors.equipmentType && <p className="text-[10px] font-bold text-red-500 uppercase mt-1 ml-1">{errors.equipmentType.message}</p>}
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-black uppercase tracking-widest text-white/40 ml-1">Serial / VIN</label>
              <FormInput {...register('serialVin')} placeholder="Chassis ID" />
              {errors.serialVin && <p className="text-[10px] font-bold text-red-500 uppercase mt-1 ml-1">{errors.serialVin.message}</p>}
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-black uppercase tracking-widest text-white/40 ml-1">License / ID</label>
              <FormInput {...register('licenseId')} placeholder="License Plate" />
              {errors.licenseId && <p className="text-[10px] font-bold text-red-500 uppercase mt-1 ml-1">{errors.licenseId.message}</p>}
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-black uppercase tracking-widest text-white/40 ml-1">Home Unit</label>
              <FormInput {...register('homeUnit')} placeholder="e.g. USFS ANF" />
              {errors.homeUnit && <p className="text-[10px] font-bold text-red-500 uppercase mt-1 ml-1">{errors.homeUnit.message}</p>}
            </div>
          </div>

          <div className="pt-6 border-t border-white/5 flex justify-end">
            <Button type="submit">
              {activeApparatus ? 'Update Configuration' : 'Save & Set Active'}
            </Button>
          </div>
        </form>
      </GlassCard>

      <div className="flex flex-col gap-4 mt-4">
        <div className="flex items-center gap-2 mb-2 ml-1">
          <Truck className="w-4 h-4 text-white/40" />
          <h2 className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em]">Saved Fleet</h2>
        </div>
        
        {allApparatus.length === 0 && (
          <div className="py-12 text-center text-white/20 font-black uppercase tracking-widest text-sm bg-white/5 border border-dashed border-white/10 rounded-2xl">
            No Saved Apparatus
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {allApparatus.map((app) => (
            <GlassCard key={app.id} className={cn("p-5 flex items-center justify-between group hover:bg-white/10", app.status === 'active' && "border-green-500/20")}>
              <div className="flex items-center gap-4">
                <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center border", app.status === 'active' ? "bg-green-500/10 border-green-500/20 text-green-500" : "bg-white/5 border-white/10 text-white/40")}>
                  <Truck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-white tracking-tight uppercase">{app.unitId}</h3>
                  <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest mt-1">{app.makeModel}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {app.status === 'active' && (
                  <span className="text-[8px] font-black bg-green-500 text-white px-2 py-0.5 rounded uppercase tracking-[0.2em] mr-2">Active</span>
                )}
                <Button 
                  variant="glass" 
                  className="w-10 h-10 p-0 text-white/20 hover:text-red-500 hover:bg-red-500/10 border-transparent hover:border-red-500/20" 
                  onClick={() => handleDeleteApparatus(app.id, app.unitId)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </GlassCard>
          ))}
        </div>
      </div>
    </div>
  );
}
