import { useState, useEffect, useCallback } from 'react';
import { GlassCard } from '../components/ui/GlassCard';
import { SectionHeader } from '../components/ui/SectionHeader';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, Lock, Trash2, AlertCircle, FileDown, Eye, Loader2, Plus } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { FormInput } from '../components/ui/FormInput';
import { SignaturePad } from '../components/ui/SignaturePad';
import { useForm, useWatch, useFieldArray } from 'react-hook-form';
import { db, type ShiftTicket, type EquipmentRow, type OperatorRow } from '../lib/db';
import { useLiveQuery } from 'dexie-react-hooks';
import { generateOF297 } from '../pdf/generateOF297';
import { cn } from '../lib/utils';

type FormValues = ShiftTicket;

const EMPTY_EQ_ROW: EquipmentRow = { date: '', start: '', stop: '', total: '', quantity: '', type: '', remarks: '' };
const EMPTY_OP_ROW: OperatorRow  = { date: '', name: '', start1: '', stop1: '', start2: '', stop2: '', total: '', remarks: '' };

const Label = ({ children }: { children: React.ReactNode }) => (
  <label className="text-[10px] font-black uppercase tracking-widest text-white/40 ml-1 mb-1 block">{children}</label>
);

export function ShiftTicketPage() {
  const { incidentId, ticketId } = useParams<{ incidentId: string; ticketId: string }>();
  const navigate = useNavigate();

  const [mode, setMode] = useState<'edit' | 'review'>('edit');
  const [saveStatus, setSaveStatus] = useState<'' | 'saving' | 'saved'>('');
  const [contractorSig, setContractorSig] = useState<string | undefined>();
  const [supervisorSig, setSupervisorSig] = useState<string | undefined>();
  const [finalizing, setFinalizing] = useState(false);

  const ticket = useLiveQuery(() => db.shiftTickets.get(ticketId ?? ''));
  const storedPdf = useLiveQuery(() => db.pdfFiles.where('ticketId').equals(ticketId ?? '').first());

  const { register, control, reset, getValues, setValue } = useForm<FormValues>();
  const watchedValues = useWatch({ control });

  const transportRetained = useWatch({ control, name: 'transportRetained' });
  const activityType      = useWatch({ control, name: 'activityType' });
  const useType           = useWatch({ control, name: 'useType' });

  const { fields: eqFields, append: appendEq, remove: removeEq } = useFieldArray({ control, name: 'equipmentRows' });
  const { fields: opFields, append: appendOp, remove: removeOp } = useFieldArray({ control, name: 'operatorRows' });

  useEffect(() => {
    if (!ticket) return;
    reset(ticket as FormValues);
    if (ticket.contractorSignature) setContractorSig(ticket.contractorSignature);
    if (ticket.supervisorSignature)  setSupervisorSig(ticket.supervisorSignature);

    const today = ticket.equipmentRows?.[0]?.date || new Date().toISOString().split('T')[0];
    if ((!ticket.operatorRows || ticket.operatorRows.length === 0) && ticket.snapshotCrew?.length) {
      const seeded = ticket.snapshotCrew.slice(0, 4).map(c => ({
        date: today, name: c.name, start1: '0600', stop1: '1800',
        start2: '', stop2: '', total: '12', remarks: '',
      }));
      setValue('operatorRows', seeded);
    }
  }, [ticket?.id]); // eslint-disable-line

  useEffect(() => {
    if (!ticket || ticket.status === 'locked' || mode !== 'edit') return;
    setSaveStatus('saving');
    const t = setTimeout(async () => {
      try {
        await db.shiftTickets.update(ticket.id, { ...getValues(), contractorSignature: contractorSig, supervisorSignature: supervisorSig, updatedAt: new Date().toISOString() });
        setSaveStatus('saved');
        setTimeout(() => setSaveStatus(''), 2000);
      } catch (e) { console.error('Auto-save failed', e); }
    }, 1500);
    return () => clearTimeout(t);
  }, [watchedValues, contractorSig, supervisorSig]); // eslint-disable-line

  const getMissing = useCallback(() => {
    const v = getValues();
    const m: string[] = [];
    if (!v.snapshotIncident?.name)          m.push('Incident Name (missing snapshot)');
    if (!v.snapshotApparatus?.makeModel)    m.push('Equipment Make/Model');
    if ((v.equipmentRows ?? []).length === 0) m.push('At least one Equipment Row');
    if ((v.operatorRows  ?? []).length === 0) m.push('At least one Operator Row');
    if (!contractorSig)                     m.push('Contractor Signature');
    if (!v.contractorPrintedName)           m.push('Contractor Printed Name');
    return m;
  }, [getValues, contractorSig]);

  const handleFinalize = async () => {
    if (!ticket) return;
    setFinalizing(true);
    try {
      const vals = getValues();
      await db.shiftTickets.update(ticket.id, { ...vals, contractorSignature: contractorSig, supervisorSignature: supervisorSig, updatedAt: new Date().toISOString() });
      const fresh = await db.shiftTickets.get(ticket.id);
      if (!fresh) throw new Error('Ticket missing');
      const blob = await generateOF297({ ...fresh, contractorSignature: contractorSig, supervisorSignature: supervisorSig });
      const existing = await db.pdfFiles.where('ticketId').equals(ticket.id).first();
      if (existing) await db.pdfFiles.delete(existing.id);
      await db.pdfFiles.add({ id: crypto.randomUUID(), ticketId: ticket.id, blob });
      await db.shiftTickets.update(ticket.id, { status: 'locked', updatedAt: new Date().toISOString() });
      navigate(`/incidents/${incidentId}`);
    } catch (e) {
      console.error('Finalize failed', e);
      alert(`PDF generation failed: ${(e as Error).message}`);
    } finally { setFinalizing(false); }
  };

  const openPdf = () => { if (!storedPdf) return; window.open(URL.createObjectURL(storedPdf.blob), '_blank'); };
  const downloadPdf = () => {
    if (!storedPdf) return;
    const a = document.createElement('a'); a.href = URL.createObjectURL(storedPdf.blob);
    a.download = `OF297_${ticket?.snapshotIncident?.number ?? ticketId}.pdf`; a.click();
  };

  if (ticket === undefined) return null;
  if (ticket === null) return <div className="p-8 text-center text-white">Ticket not found.</div>;

  const isLocked = ticket.status === 'locked';
  const missingFields = getMissing();

  return (
    <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link to={`/incidents/${incidentId}`}><Button variant="glass" className="w-10 h-10 p-0"><ArrowLeft className="w-5 h-5" /></Button></Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-black uppercase tracking-tighter leading-none">Shift Ticket</h1>
              <span className={cn(
                "text-[8px] font-black px-2 py-0.5 rounded uppercase tracking-[0.2em]",
                isLocked ? "bg-amber-500 text-white" : "bg-blue-500 text-white"
              )}>
                {isLocked ? 'Finalized' : 'Draft'}
              </span>
            </div>
            <div className="flex items-center gap-2 mt-2 h-4">
              {saveStatus === 'saving' && <span className="flex items-center gap-1 text-[8px] font-black uppercase tracking-widest text-white/40"><Loader2 className="w-2 h-2 animate-spin" />Syncing…</span>}
              {saveStatus === 'saved'  && <span className="text-green-500 flex items-center gap-1 text-[8px] font-black uppercase tracking-widest"><CheckCircle2 className="w-2 h-2" />Saved Offline</span>}
            </div>
          </div>
        </div>

        {!isLocked && (
          <div className="flex bg-white/5 p-1 rounded-xl border border-white/10">
            {(['edit','review'] as const).map(m => (
              <button 
                key={m} 
                onClick={() => setMode(m)} 
                className={cn(
                  "px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all",
                  mode === m ? "bg-white/10 text-white shadow-lg" : "text-white/40 hover:text-white"
                )}
              >
                {m === 'review' ? 'Verify & Sign' : 'Edit Form'}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ─── EDIT MODE ─────────────────────────────────────────────────── */}
      {mode === 'edit' && !isLocked && (
        <form className="flex flex-col gap-6">

          {/* Section 1-11 */}
          <GlassCard className="p-6">
            <SectionHeader title="Identification" subtitle="Fields 1–11: Auto-populated from profile" />
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 mt-6">
              <div className="flex flex-col"><Label>Agreement Number</Label><FormInput {...register('agreementNumber')} placeholder="ID-XXX" /></div>
              <div className="flex flex-col"><Label>Contractor Name</Label><FormInput {...register('contractorAgencyName')} /></div>
              <div className="flex flex-col"><Label>Resource Order #</Label><FormInput value={ticket.snapshotIncident?.resourceOrderNumber ?? ''} readOnly className="opacity-40" /></div>
              <div className="flex flex-col"><Label>Incident Name</Label><FormInput value={ticket.snapshotIncident?.name ?? ''} readOnly className="opacity-40" /></div>
              <div className="flex flex-col"><Label>Incident #</Label><FormInput value={ticket.snapshotIncident?.number ?? ''} readOnly className="opacity-40" /></div>
              <div className="flex flex-col"><Label>Financial Code</Label><FormInput value={ticket.snapshotIncident?.financialCode ?? ''} readOnly className="opacity-40" /></div>
              <div className="flex flex-col"><Label>Make / Model</Label><FormInput {...register('snapshotApparatus.makeModel')} /></div>
              <div className="flex flex-col"><Label>Serial / VIN</Label><FormInput {...register('snapshotApparatus.serialVin')} /></div>
              <div className="flex flex-col"><Label>Unit ID</Label><FormInput {...register('snapshotApparatus.unitId')} /></div>
            </div>
          </GlassCard>

          {/* Section 12-14 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <GlassCard className="p-5">
              <Label>12. Transport Retained?</Label>
              <div className="flex gap-2 mt-2">
                {(['yes', 'no'] as const).map(v => (
                  <Button 
                    key={v} type="button" variant="glass"
                    onClick={() => setValue('transportRetained', transportRetained === v ? '' : v, { shouldDirty: true })}
                    className={cn("flex-1 h-10 text-[10px]", transportRetained === v && "bg-green-600/20 border-green-600/50 text-green-500")}
                  >
                    {v.toUpperCase()}
                  </Button>
                ))}
              </div>
            </GlassCard>
            <GlassCard className="p-5">
              <Label>13. Activity Type</Label>
              <div className="flex gap-2 mt-2">
                {(['mobilization', 'demobilization'] as const).map(v => (
                  <Button 
                    key={v} type="button" variant="glass"
                    onClick={() => setValue('activityType', activityType === v ? '' : v, { shouldDirty: true })}
                    className={cn("flex-1 h-10 text-[10px] capitalize", activityType === v && "bg-amber-600/20 border-amber-600/50 text-amber-500")}
                  >
                    {v}
                  </Button>
                ))}
              </div>
            </GlassCard>
            <GlassCard className="p-5">
              <Label>14. Measure By</Label>
              <div className="flex gap-2 mt-2">
                {(['miles', 'hours'] as const).map(v => (
                  <Button 
                    key={v} type="button" variant="glass"
                    onClick={() => setValue('useType', useType === v ? '' : v, { shouldDirty: true })}
                    className={cn("flex-1 h-10 text-[10px] capitalize", useType === v && "bg-blue-600/20 border-blue-600/50 text-blue-500")}
                  >
                    {v}
                  </Button>
                ))}
              </div>
            </GlassCard>
          </div>

          {/* Tables */}
          <GlassCard className="p-6">
            <SectionHeader title="Operational Logs" subtitle="Fields 15–29: Daily equipment & operator usage" />
            <div className="overflow-x-auto mt-6">
              <table className="w-full text-[10px] font-black uppercase tracking-widest text-white/40 mb-4">
                <thead><tr className="border-b border-white/5"><th className="text-left pb-2">Equipment Log</th></tr></thead>
              </table>
              <div className="flex flex-col gap-3">
                {eqFields.map((field, i) => (
                  <div key={field.id} className="grid grid-cols-4 sm:grid-cols-8 gap-2 items-end">
                    <div className="col-span-2 sm:col-span-1"><Label>Date</Label><FormInput type="date" {...register(`equipmentRows.${i}.date`)} className="h-9 px-2 text-[10px]" /></div>
                    <div className="col-span-1"><Label>Start</Label><FormInput {...register(`equipmentRows.${i}.start`)} placeholder="0600" className="h-9 px-2 text-[10px]" /></div>
                    <div className="col-span-1"><Label>Stop</Label><FormInput {...register(`equipmentRows.${i}.stop`)} placeholder="1800" className="h-9 px-2 text-[10px]" /></div>
                    <div className="col-span-1"><Label>Total</Label><FormInput {...register(`equipmentRows.${i}.total`)} className="h-9 px-2 text-[10px]" /></div>
                    <div className="col-span-2 sm:col-span-2"><Label>Remarks</Label><FormInput {...register(`equipmentRows.${i}.remarks`)} className="h-9 px-2 text-[10px]" /></div>
                    <Button variant="glass" type="button" onClick={() => removeEq(i)} className="h-9 w-9 p-0 text-white/20 hover:text-red-500"><Trash2 className="w-3.5 h-3.5" /></Button>
                  </div>
                ))}
              </div>
              <Button type="button" variant="glass" onClick={() => appendEq({ ...EMPTY_EQ_ROW })} className="mt-4 h-8 text-[8px]"><Plus className="w-3 h-3 mr-1" /> Add Row</Button>
            </div>
          </GlassCard>

          <GlassCard className="p-6">
            <SectionHeader title="Operator Manifest" subtitle="Fields 22–29: Personnel assigned to shift" />
            <div className="flex flex-col gap-4 mt-6">
              {opFields.map((field, i) => (
                <div key={field.id} className="p-4 rounded-xl bg-white/5 border border-white/10">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div className="col-span-2"><Label>Operator Name</Label><FormInput {...register(`operatorRows.${i}.name`)} /></div>
                    <div><Label>Shift Start</Label><FormInput {...register(`operatorRows.${i}.start1`)} placeholder="0600" /></div>
                    <div><Label>Shift End</Label><FormInput {...register(`operatorRows.${i}.stop1`)} placeholder="1800" /></div>
                  </div>
                  <div className="flex justify-end mt-2">
                    <button type="button" onClick={() => removeOp(i)} className="text-[10px] font-black uppercase text-red-500/50 hover:text-red-500 transition-colors tracking-widest">Remove Operator</button>
                  </div>
                </div>
              ))}
              <Button type="button" variant="glass" onClick={() => appendOp({ ...EMPTY_OP_ROW })} className="h-8 text-[8px] self-start"><Plus className="w-3 h-3 mr-1" /> Add Operator</Button>
            </div>
          </GlassCard>

          {/* Footer */}
          <GlassCard className="p-6">
            <SectionHeader title="Finalization" subtitle="Field 30–34: Signatures & Remarks" />
            <div className="flex flex-col gap-6 mt-6">
              <div className="flex flex-col gap-1.5"><Label>30. Remarks</Label><textarea {...register('remarks')} rows={3} className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-green-600 transition-all resize-none" /></div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <div><Label>31. Contractor Printed Name</Label><FormInput {...register('contractorPrintedName')} /></div>
                  <SignaturePad label="32. Contractor Signature" value={contractorSig} onSave={setContractorSig} onClear={() => setContractorSig(undefined)} />
                </div>
                <div className="space-y-4">
                  <div><Label>33. Supervisor Printed Name</Label><FormInput {...register('supervisorPrintedName')} /></div>
                  <SignaturePad label="34. Supervisor Signature" value={supervisorSig} onSave={setSupervisorSig} onClear={() => setSupervisorSig(undefined)} />
                </div>
              </div>
            </div>
          </GlassCard>
        </form>
      )}

      {/* ─── REVIEW MODE ───────────────────────────────────────────────── */}
      {(mode === 'review' || isLocked) && (
        <div className="flex flex-col gap-6 animate-in slide-in-from-right-4 duration-500">
          {!isLocked && missingFields.length > 0 && (
            <GlassCard className="p-5 border-rose-500/30 bg-rose-500/5">
              <h3 className="text-rose-500 font-black uppercase tracking-widest text-xs flex items-center gap-2 mb-3"><AlertCircle className="w-4 h-4" />Form Incomplete</h3>
              <ul className="space-y-1">{missingFields.map(f => <li key={f} className="text-[10px] font-bold text-rose-300 uppercase tracking-widest opacity-60">• {f}</li>)}</ul>
            </GlassCard>
          )}

          <GlassCard className="p-8">
            <SectionHeader title="Review Document" subtitle="Final OF-297 verification before lock" />
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-8 py-6 border-y border-white/5">
              {[
                ['Incident', ticket.snapshotIncident?.name],
                ['Unit ID', ticket.snapshotApparatus?.unitId],
                ['Operator', ticket.operatorRows?.[0]?.name || 'N/A'],
                ['Total Hours', ticket.equipmentRows?.[0]?.total || '0'],
              ].map(([l, v]) => (
                <div key={l as string}><p className="text-[8px] font-black uppercase tracking-[0.2em] text-white/20 mb-1">{l}</p><p className="font-bold text-white uppercase tracking-tight">{v || '—'}</p></div>
              ))}
            </div>

            {!isLocked && (
              <div className="flex flex-col sm:flex-row justify-end gap-3 mt-10">
                <Button variant="glass" onClick={() => navigate(`/incidents/${incidentId}`)}>Save Draft</Button>
                <Button 
                  onClick={handleFinalize} 
                  disabled={missingFields.length > 0 || finalizing}
                  className="px-8"
                >
                  {finalizing ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Generating...</> : <><Lock className="w-4 h-4 mr-2" />Finalize & Generate PDF</>}
                </Button>
              </div>
            )}
          </GlassCard>

          {isLocked && storedPdf && (
            <GlassCard className="p-6 border-amber-500/20 bg-amber-500/5 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-amber-500/10 flex items-center justify-center border border-amber-500/20"><Lock className="w-6 h-6 text-amber-500" /></div>
                <div>
                  <h3 className="font-bold text-amber-500 uppercase tracking-tight">Ticket Finalized</h3>
                  <p className="text-[10px] font-bold text-amber-500/60 uppercase tracking-widest mt-1">This document is locked and stored locally.</p>
                </div>
              </div>
              <div className="flex gap-2 w-full sm:w-auto">
                <Button variant="glass" onClick={openPdf} className="flex-1 sm:flex-initial"><Eye className="w-4 h-4 mr-2" />View</Button>
                <Button variant="glass" onClick={downloadPdf} className="flex-1 sm:flex-initial"><FileDown className="w-4 h-4 mr-2" />Download</Button>
              </div>
            </GlassCard>
          )}
        </div>
      )}
    </div>
  );
}
