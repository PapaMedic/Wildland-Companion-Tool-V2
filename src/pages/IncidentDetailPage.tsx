import { GlassCard } from '../components/ui/GlassCard';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, FileText, Plus, Lock, Eye, FileDown, Hash, Target, Trash2 } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { db } from '../lib/db';
import { useLiveQuery } from 'dexie-react-hooks';

export function IncidentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const incident = useLiveQuery(() => db.incidents.get(id ?? ''));
  const shiftTickets = useLiveQuery(() =>
    db.shiftTickets.where('incidentId').equals(id ?? '').toArray()
  ) ?? [];

  const handleDeleteIncident = async () => {
    if (!id || !incident) return;
    if (!confirm(`Are you sure you want to delete "${incident.name}"? This will delete all associated shift tickets and PDFs.`)) return;

    try {
      await db.transaction('rw', [db.incidents, db.shiftTickets, db.pdfFiles], async () => {
        // Delete shift tickets
        const tickets = await db.shiftTickets.where('incidentId').equals(id).toArray();
        const ticketIds = tickets.map(t => t.id);
        
        if (ticketIds.length > 0) {
          await db.pdfFiles.where('ticketId').anyOf(ticketIds).delete();
          await db.shiftTickets.where('incidentId').equals(id).delete();
        }

        // Delete incident
        await db.incidents.delete(id);
      });
      navigate('/incidents');
    } catch (error) {
      console.error('Failed to delete incident:', error);
      alert('Failed to delete incident.');
    }
  };

  const handleDeleteTicket = async (ticketId: string, date: string) => {
    if (!confirm(`Are you sure you want to delete the shift ticket for ${date || 'this date'}? This will also delete the associated PDF.`)) return;

    try {
      await db.transaction('rw', [db.shiftTickets, db.pdfFiles], async () => {
        await db.pdfFiles.where('ticketId').equals(ticketId).delete();
        await db.shiftTickets.delete(ticketId);
      });
    } catch (error) {
      console.error('Failed to delete shift ticket:', error);
      alert('Failed to delete shift ticket.');
    }
  };

  const allPdfs = useLiveQuery(async () => {
    const ticketIds = shiftTickets.map(t => t.id);
    if (ticketIds.length === 0) return {};
    const pdfs = await db.pdfFiles.where('ticketId').anyOf(ticketIds).toArray();
    return Object.fromEntries(pdfs.map(p => [p.ticketId, p]));
  }, [shiftTickets]) ?? {};

  const createShiftTicket = async () => {
    if (!incident) return;
    try {
      const activeApparatus = await db.apparatus.where('status').equals('active').first();
      if (!activeApparatus) {
        alert('You must have an active apparatus configured first.');
        return;
      }
      const crew = await db.personnel.where('apparatusId').equals(activeApparatus.id).toArray();
      const today = new Date().toISOString().split('T')[0];

      const newTicketId = crypto.randomUUID();
      await db.shiftTickets.add({
        id: newTicketId,
        incidentId: incident.id,
        agreementNumber: '',
        contractorAgencyName: activeApparatus.unitId,
        snapshotIncident: {
          name: incident.name,
          number: incident.number,
          financialCode: incident.financialCode,
          resourceOrderNumber: incident.resourceOrderNumber,
        },
        snapshotApparatus: {
          unitId: activeApparatus.unitId,
          makeModel: activeApparatus.makeModel,
          equipmentType: activeApparatus.equipmentType,
          serialVin: activeApparatus.serialVin,
          licenseId: activeApparatus.licenseId,
          unitId_2: activeApparatus.unitId, // Ensure all fields match
        } as any,
        snapshotCrew: crew.map(c => ({ id: c.id, name: c.name, qualification: c.qualification })),
        transportRetained: '',
        activityType: '',
        useType: 'hours',
        equipmentRows: [{ date: today, start: '0600', stop: '1800', total: '12', quantity: '', type: '', remarks: '' }],
        operatorRows: crew.slice(0, 4).map(c => ({
          date: today, name: c.name, start1: '0600', stop1: '1800', start2: '', stop2: '', total: '12', remarks: '',
        })),
        remarks: '',
        contractorPrintedName: '',
        supervisorPrintedName: '',
        status: 'draft',
        updatedAt: new Date().toISOString(),
      });

      navigate(`/incidents/${incident.id}/shift-ticket/${newTicketId}`);
    } catch (error) {
      console.error('Failed to create shift ticket:', error);
    }
  };

  const viewPdf = (ticketId: string) => {
    const pdf = allPdfs[ticketId];
    if (!pdf) return;
    const url = URL.createObjectURL(pdf.blob);
    window.open(url, '_blank');
  };

  const downloadPdf = (ticketId: string, date: string) => {
    const pdf = allPdfs[ticketId];
    if (!pdf) return;
    const url = URL.createObjectURL(pdf.blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `OF297_${date || ticketId}.pdf`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (incident === undefined) return null;
  if (incident === null) return <div className="p-8 text-center text-white">Incident not found.</div>;

  return (
    <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to="/incidents"><Button variant="glass" className="w-10 h-10 p-0"><ArrowLeft className="w-5 h-5" /></Button></Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-black uppercase tracking-tighter leading-none">{incident.name}</h1>
              <span className={`text-[8px] font-black px-2 py-0.5 rounded uppercase tracking-[0.2em] ${
                incident.status === 'active' ? 'bg-rose-500 text-white' : 'bg-white/10 text-white/40'
              }`}>
                {incident.status}
              </span>
            </div>
            <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest mt-2">{incident.number} • {incident.location}</p>
          </div>
        </div>
        <Button variant="glass" className="w-10 h-10 p-0 text-white/20 hover:text-red-500 hover:border-red-500/20" onClick={handleDeleteIncident}>
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <GlassCard className="p-4 flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center border border-white/10">
            <Hash className="w-5 h-5 text-white/40" />
          </div>
          <div>
            <p className="text-[8px] font-black uppercase tracking-widest text-white/40 mb-1">Financial Code</p>
            <p className="font-bold text-white uppercase tracking-tight">{incident.financialCode}</p>
          </div>
        </GlassCard>
        <GlassCard className="p-4 flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center border border-white/10">
            <Target className="w-5 h-5 text-white/40" />
          </div>
          <div>
            <p className="text-[8px] font-black uppercase tracking-widest text-white/40 mb-1">Resource Order</p>
            <p className="font-bold text-white uppercase tracking-tight">{incident.resourceOrderNumber}</p>
          </div>
        </GlassCard>
      </div>

      <div className="mt-4">
        <div className="flex items-center justify-between mb-4 ml-1">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-amber-500" />
            <h2 className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em]">Operational Shift Tickets</h2>
          </div>
          {incident.status === 'active' && (
            <Button onClick={createShiftTicket} className="h-8 text-[10px] px-3">
              <Plus className="w-3.5 h-3.5 mr-1.5" /> New Ticket
            </Button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {shiftTickets.length === 0 && (
            <div className="col-span-full py-16 text-center text-white/20 font-black uppercase tracking-widest text-sm bg-white/5 border border-dashed border-white/10 rounded-2xl">
              No Tickets Found
            </div>
          )}

          {shiftTickets.map(ticket => {
            const isLocked = ticket.status === 'locked';
            const hasPdf = !!allPdfs[ticket.id];

            return (
              <GlassCard
                key={ticket.id}
                className={`p-5 flex flex-col gap-4 group hover:bg-white/10 transition-all ${
                  isLocked ? 'border-amber-500/20' : 'border-dashed border-white/10'
                }`}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-bold text-white tracking-tight">{ticket.equipmentRows?.[0]?.date || 'No Date'}</h3>
                    <p className="text-[10px] font-black text-white/40 uppercase tracking-widest mt-1">Unit: {ticket.snapshotApparatus?.unitId}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-[8px] font-black px-2 py-0.5 rounded uppercase tracking-[0.2em] flex items-center gap-1 ${
                      isLocked ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20' : 'bg-white/5 text-white/40'
                    }`}>
                      {isLocked && <Lock className="w-2.5 h-2.5" />}
                      {ticket.status}
                    </span>
                    <Button 
                      variant="glass" 
                      className="w-7 h-7 p-0 border-transparent text-white/20 hover:text-red-500 hover:bg-red-500/10"
                      onClick={(e) => {
                        e.preventDefault();
                        handleDeleteTicket(ticket.id, ticket.equipmentRows?.[0]?.date || '');
                      }}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 py-3 border-y border-white/5">
                  <div>
                    <p className="text-[8px] font-black text-white/20 uppercase tracking-widest mb-1">Crew Size</p>
                    <p className="text-sm font-bold text-white">{ticket.snapshotCrew?.length ?? 0} Personnel</p>
                  </div>
                  <div>
                    <p className="text-[8px] font-black text-white/20 uppercase tracking-widest mb-1">Shift Total</p>
                    <p className="text-sm font-bold text-white">{ticket.equipmentRows?.[0]?.total || '0'} Hours</p>
                  </div>
                </div>

                <div className="flex gap-2">
                  {isLocked ? (
                    <>
                      {hasPdf && (
                        <div className="flex gap-2 w-full">
                          <Button variant="glass" onClick={() => viewPdf(ticket.id)} className="flex-1 h-8 text-[10px]">
                            <Eye className="w-3 h-3 mr-1.5" /> View
                          </Button>
                          <Button variant="glass" onClick={() => downloadPdf(ticket.id, ticket.equipmentRows?.[0]?.date ?? ticket.id)} className="w-10 h-8 p-0">
                            <FileDown className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      )}
                    </>
                  ) : (
                    <Link to={`/incidents/${incident.id}/shift-ticket/${ticket.id}`} className="w-full">
                      <Button className="w-full h-8 text-[10px]">Continue Editing</Button>
                    </Link>
                  )}
                </div>
              </GlassCard>
            );
          })}
        </div>
      </div>
    </div>
  );
}
