import Dexie, { type EntityTable } from 'dexie';

export interface Apparatus {
  id: string;
  unitId: string;
  makeModel: string;
  equipmentType: string;
  serialVin: string;
  licenseId: string;
  homeUnit: string;
  status: string;
}

export interface Personnel {
  id: string;
  apparatusId?: string; // Optional if not assigned to apparatus
  name: string;
  qualification: string;
  homeUnit: string;
}

export interface Incident {
  id: string;
  name: string;
  number: string;
  location: string;
  financialCode: string;
  resourceOrderNumber: string;
  status: 'active' | 'closed';
}

// One row in the Equipment Use section (fields 15–21)
export interface EquipmentRow {
  date: string;       // field 15
  start: string;      // field 16
  stop: string;       // field 17
  total: string;      // field 18
  quantity: string;   // field 19
  type: string;       // field 20 (Miles / Hours)
  remarks: string;    // field 21
}

// One row in the Operator section (fields 22–29)
export interface OperatorRow {
  date: string;         // field 22
  name: string;         // field 23 (First Last)
  start1: string;       // field 24
  stop1: string;        // field 25
  start2: string;       // field 26
  stop2: string;        // field 27
  total: string;        // field 28
  remarks: string;      // field 29
}

export interface ShiftTicket {
  id: string;
  incidentId: string;

  // ── Header fields (1–10) ──────────────────────────────────────────────
  agreementNumber: string;          // field 1
  contractorAgencyName: string;     // field 2 (auto from apparatus)

  // Snapshot of incident data at creation time
  snapshotIncident?: {
    name: string;
    number: string;
    financialCode: string;
    resourceOrderNumber: string;
  };

  // Snapshot of apparatus at creation time (editable per ticket)
  snapshotApparatus: {
    unitId: string;
    makeModel: string;
    equipmentType: string;
    serialVin: string;
    licenseId: string;
  };

  // Crew snapshot (editable per ticket)
  snapshotCrew: { id: string; name: string; qualification: string }[];

  // ── Checkboxes (12–14) ────────────────────────────────────────────────
  transportRetained: 'yes' | 'no' | '';  // field 12
  activityType: 'mobilization' | 'demobilization' | '';  // field 13
  useType: 'miles' | 'hours' | '';       // field 14

  // ── Equipment use rows (15–21, up to 4 rows) ─────────────────────────
  equipmentRows: EquipmentRow[];

  // ── Operator rows (22–29, up to 4 rows) ──────────────────────────────
  operatorRows: OperatorRow[];

  // ── Footer (30–34) ───────────────────────────────────────────────────
  remarks: string;                       // field 30
  contractorPrintedName: string;         // field 31
  contractorSignature?: string;          // field 32 (base64 PNG)
  supervisorPrintedName: string;         // field 33
  supervisorSignature?: string;          // field 34 (base64 PNG)

  status: 'draft' | 'locked';
  updatedAt: string;
}

export interface PdfFile {
  id: string;
  ticketId: string;
  blob: Blob;
}

const db = new Dexie('WildlandDatabase') as Dexie & {
  apparatus: EntityTable<Apparatus, 'id'>;
  personnel: EntityTable<Personnel, 'id'>;
  incidents: EntityTable<Incident, 'id'>;
  shiftTickets: EntityTable<ShiftTicket, 'id'>;
  pdfFiles: EntityTable<PdfFile, 'id'>;
};

// Version 2 — existing data (kept for migration continuity)
db.version(2).stores({
  apparatus: 'id, unitId, status',
  personnel: 'id, apparatusId, name',
  incidents: 'id, status',
  shiftTickets: 'id, incidentId, apparatusId, status'
});

// Version 3 — adds pdfFiles table and new fields on shiftTickets
db.version(3).stores({
  apparatus: 'id, unitId, status',
  personnel: 'id, apparatusId, name',
  incidents: 'id, status',
  shiftTickets: 'id, incidentId, status',
  pdfFiles: 'id, ticketId',
});

export { db };
