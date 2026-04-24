import { useState } from 'react';
import { GlassCard } from '../components/ui/GlassCard';
import { SectionHeader } from '../components/ui/SectionHeader';
import { Link } from 'react-router-dom';
import { ArrowLeft, UserPlus, Trash2, History, Users } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { FormInput } from '../components/ui/FormInput';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { db } from '../lib/db';
import { useLiveQuery } from 'dexie-react-hooks';

const schema = z.object({
  name: z.string().min(1, 'Name is required'),
  qualification: z.string().min(1, 'Qualification is required'),
  homeUnit: z.string().min(1, 'Home Unit is required'),
});

type FormValues = z.infer<typeof schema>;

export function PersonnelPage() {
  const [isAdding, setIsAdding] = useState(false);

  const activeApparatus = useLiveQuery(() => 
    db.apparatus.where('status').equals('active').first()
  );

  const crew = useLiveQuery(() => 
    activeApparatus ? db.personnel.where('apparatusId').equals(activeApparatus.id).toArray() : []
  , [activeApparatus?.id]) ?? [];

  const { register, handleSubmit, formState: { errors }, reset } = useForm<FormValues>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormValues) => {
    if (!activeApparatus) return;
    try {
      await db.personnel.add({
        id: crypto.randomUUID(),
        apparatusId: activeApparatus.id,
        ...data,
      });
      reset();
      setIsAdding(false);
    } catch (error) {
      console.error('Failed to add personnel:', error);
    }
  };

  const removePersonnel = async (id: string) => {
    try {
      await db.personnel.delete(id);
    } catch (error) {
      console.error('Failed to remove personnel:', error);
    }
  };

  const usePreviousCrew = async () => {
    if (!activeApparatus) return;
    try {
      await db.transaction('rw', db.personnel, async () => {
        const previousCrew = await db.personnel
          .filter(p => p.apparatusId !== activeApparatus.id)
          .toArray();

        for (const person of previousCrew) {
          await db.personnel.update(person.id, { apparatusId: activeApparatus.id });
        }
      });
    } catch (error) {
      console.error('Failed to copy previous crew:', error);
    }
  };

  if (!activeApparatus) {
    return (
      <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="flex items-center gap-4">
          <Link to="/"><Button variant="glass" className="w-10 h-10 p-0"><ArrowLeft className="w-5 h-5" /></Button></Link>
          <h1 className="text-2xl font-black uppercase tracking-tighter">Personnel</h1>
        </div>
        <GlassCard className="p-12 text-center flex flex-col items-center gap-6">
          <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center border border-white/10">
            <Users className="w-8 h-8 text-white/20" />
          </div>
          <div>
            <SectionHeader 
              title="No Active Apparatus" 
              subtitle="You must set up an active apparatus before managing personnel." 
              className="mb-0"
            />
          </div>
          <Link to="/apparatus">
            <Button>Configure Apparatus</Button>
          </Link>
        </GlassCard>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to="/"><Button variant="glass" className="w-10 h-10 p-0"><ArrowLeft className="w-5 h-5" /></Button></Link>
          <div>
            <h1 className="text-2xl font-black uppercase tracking-tighter leading-none">Crew Management</h1>
            <p className="text-[10px] font-bold text-green-500 uppercase tracking-widest mt-1">Unit: {activeApparatus.unitId}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="glass" onClick={usePreviousCrew} className="w-10 h-10 p-0 sm:w-auto sm:px-4" title="Assign previous crew">
            <History className="w-4 h-4 sm:mr-2" />
            <span className="hidden sm:inline">History</span>
          </Button>
          <Button onClick={() => setIsAdding(!isAdding)} className="w-10 h-10 p-0 sm:w-auto sm:px-4">
            <UserPlus className="w-4 h-4 sm:mr-2" />
            <span className="hidden sm:inline">Add Crew</span>
          </Button>
        </div>
      </div>

      {isAdding && (
        <GlassCard className="p-6 border-green-500/30">
          <SectionHeader title="Add Crew Member" subtitle="Enter details for the new personnel" />
          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6">
            <div className="grid grid-cols-1 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-white/40 ml-1">Full Name</label>
                <FormInput {...register('name')} placeholder="e.g. John Doe" />
                {errors.name && <p className="text-[10px] font-bold text-red-500 uppercase mt-1 ml-1">{errors.name.message}</p>}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-white/40 ml-1">Qualification</label>
                  <FormInput {...register('qualification')} placeholder="e.g. ENGB" />
                  {errors.qualification && <p className="text-[10px] font-bold text-red-500 uppercase mt-1 ml-1">{errors.qualification.message}</p>}
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-white/40 ml-1">Home Unit</label>
                  <FormInput {...register('homeUnit')} placeholder="e.g. ANF" />
                  {errors.homeUnit && <p className="text-[10px] font-bold text-red-500 uppercase mt-1 ml-1">{errors.homeUnit.message}</p>}
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-3">
              <Button variant="glass" type="button" onClick={() => setIsAdding(false)}>Cancel</Button>
              <Button type="submit">Save Personnel</Button>
            </div>
          </form>
        </GlassCard>
      )}

      <div className="flex flex-col gap-3">
        {crew.length === 0 && !isAdding && (
          <div className="py-20 text-center text-white/20 font-black uppercase tracking-widest text-sm bg-white/5 border border-dashed border-white/10 rounded-2xl">
            Empty Manifest
          </div>
        )}
        
        {crew.map((person) => (
          <GlassCard key={person.id} className="p-5 flex items-center justify-between group hover:bg-white/10">
            <div>
              <h3 className="font-bold text-lg text-white leading-tight">{person.name}</h3>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-[10px] font-black bg-green-500/10 text-green-500 px-1.5 py-0.5 rounded uppercase tracking-widest">{person.qualification}</span>
                <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">{person.homeUnit}</span>
              </div>
            </div>
            <Button 
              variant="glass" 
              className="w-10 h-10 p-0 text-white/20 hover:text-red-500 hover:bg-red-500/10 border-transparent hover:border-red-500/20" 
              onClick={() => removePersonnel(person.id)}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </GlassCard>
        ))}
      </div>
    </div>
  );
}
