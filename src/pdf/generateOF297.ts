/**
 * OF-297 PDF Generator — v2
 * -------------------------
 * Uses the EXACT field names extracted from OF297-24.pdf via inspectPdf.mjs.
 * All 81 fields are mapped. Signatures are embedded as PNG images.
 *
 * Field reference (from inspection):
 *  1  topmostSubform[0].Page1[0]._1_Agreement_Number[0]
 *  2  topmostSubform[0].Page1[0]._2_ContractorAgency_Name[0]
 *  3  topmostSubform[0].Page1[0]._3_Resource_Order_Number[0]
 *  4  topmostSubform[0].Page1[0]._4_Incident_Name[0]
 *  5  topmostSubform[0].Page1[0]._5_Incident_Number[0]
 *  6  topmostSubform[0].Page1[0]._6_Financial_Code[0]
 *  7  topmostSubform[0].Page1[0]._7_Equipment_MakeModel[0]
 *  8  topmostSubform[0].Page1[0]._8_Equipment_Type[0]
 *  9  topmostSubform[0].Page1[0]._9_SerialVIN_Number[0]
 *  10 topmostSubform[0].Page1[0]._10_LicenseID_Number[0]
 *  12 [CheckBox] Transport Retained Yes/No
 *  13 [CheckBox] Demobilization / Mobilization
 *  14 [CheckBox] Miles / Hours
 *  15-21 Equipment rows (x4)
 *  22-29 Operator rows (x4)
 *  30 Remarks
 *  31 Contractor/Agency Rep Printed Name
 *  32 [PDFSignature] Contractor signature
 *  33 Supervisor Printed Name / Resource Order
 *  34 [PDFSignature] Supervisor signature
 */
import { PDFDocument, StandardFonts } from 'pdf-lib';
import pdfTemplateUrl from '../assets/pdf/OF297-24.pdf';
import type { ShiftTicket } from '../lib/db';

const P = 'topmostSubform[0].Page1[0]';

// Helper to safely set a text field (logs warn if missing)
function setText(form: ReturnType<PDFDocument['getForm']>, name: string, value: string) {
  try {
    form.getTextField(name).setText(value ?? '');
  } catch {
    console.warn(`[OF297] TextField not found: "${name}"`);
  }
}

// Helper to safely check a checkbox
function checkBox(form: ReturnType<PDFDocument['getForm']>, name: string) {
  try {
    form.getCheckBox(name).check();
  } catch {
    console.warn(`[OF297] CheckBox not found: "${name}"`);
  }
}

function dataUrlToUint8Array(dataUrl: string): Uint8Array {
  const base64 = dataUrl.split(',')[1];
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

export async function generateOF297(ticket: ShiftTicket): Promise<Blob> {
  // ── 1. Load template ──────────────────────────────────────────────────
  const res = await fetch(pdfTemplateUrl as string);
  if (!res.ok) throw new Error('Failed to fetch OF297-24.pdf');
  const bytes = await res.arrayBuffer();

  const pdfDoc = await PDFDocument.load(bytes, { ignoreEncryption: true });
  const form = pdfDoc.getForm();

  // ── 2. Header fields (1–10) ───────────────────────────────────────────
  setText(form, `${P}._1_Agreement_Number[0]`,       ticket.agreementNumber ?? '');
  setText(form, `${P}._2_ContractorAgency_Name[0]`,  ticket.contractorAgencyName ?? '');
  setText(form, `${P}._3_Resource_Order_Number[0]`,  ticket.snapshotIncident?.resourceOrderNumber ?? '');
  setText(form, `${P}._4_Incident_Name[0]`,           ticket.snapshotIncident?.name ?? '');
  setText(form, `${P}._5_Incident_Number[0]`,         ticket.snapshotIncident?.number ?? '');
  setText(form, `${P}._6_Financial_Code[0]`,          ticket.snapshotIncident?.financialCode ?? '');
  setText(form, `${P}._7_Equipment_MakeModel[0]`,     ticket.snapshotApparatus?.makeModel ?? '');
  setText(form, `${P}._8_Equipment_Type[0]`,          ticket.snapshotApparatus?.equipmentType ?? '');
  setText(form, `${P}._9_SerialVIN_Number[0]`,        ticket.snapshotApparatus?.serialVin ?? '');
  setText(form, `${P}._10_LicenseID_Number[0]`,       ticket.snapshotApparatus?.licenseId ?? '');

  // ── 3. Checkboxes (12–14) ─────────────────────────────────────────────
  if (ticket.transportRetained === 'yes')
    checkBox(form, `${P}._12_Transport_Retained_Yes[0]`);
  if (ticket.transportRetained === 'no')
    checkBox(form, `${P}._12_Transport_Retained_No[0]`);
  if (ticket.activityType === 'demobilization')
    checkBox(form, `${P}._13_Demobilization[0]`);
  if (ticket.activityType === 'mobilization')
    checkBox(form, `${P}._13_Mobilization[0]`);
  if (ticket.useType === 'miles')
    checkBox(form, `${P}._14_Miles[0]`);
  if (ticket.useType === 'hours')
    checkBox(form, `${P}._14_Hours[0]`);

  // ── 4. Equipment rows (15–21, rows 1–4) ──────────────────────────────
  const eqRows = ticket.equipmentRows ?? [];
  for (let i = 0; i < 4; i++) {
    const n = i + 1;
    const row = eqRows[i];
    setText(form, `${P}._15_DateRow${n}[0]`,                    row?.date ?? '');
    setText(form, `${P}._16_StartRow${n}[0]`,                   row?.start ?? '');
    setText(form, `${P}._17_StopRow${n}[0]`,                    row?.stop ?? '');
    setText(form, `${P}._18_TotalRow${n}[0]`,                   row?.total ?? '');
    setText(form, `${P}._19_QuantityRow${n}[0]`,                row?.quantity ?? '');
    setText(form, `${P}._20_TypeRow${n}[0]`,                    row?.type ?? '');
    setText(form, `${P}._21_Note_Travel_Other_remarksRow${n}[0]`, row?.remarks ?? '');
  }

  // ── 5. Operator rows (22–29, rows 1–4) ───────────────────────────────
  const opRows = ticket.operatorRows ?? [];
  for (let i = 0; i < 4; i++) {
    const n = i + 1;
    const row = opRows[i];
    setText(form, `${P}._22_DateRow${n}[0]`,                    row?.date ?? '');
    setText(form, `${P}._23_Operator_Name_First__LastRow${n}[0]`, row?.name ?? '');
    setText(form, `${P}._24_StartRow${n}[0]`,                   row?.start1 ?? '');
    setText(form, `${P}._25_StopRow${n}[0]`,                    row?.stop1 ?? '');
    setText(form, `${P}._26_StartRow${n}[0]`,                   row?.start2 ?? '');
    setText(form, `${P}._27_StopRow${n}[0]`,                    row?.stop2 ?? '');
    setText(form, `${P}._28_TotalRow${n}[0]`,                   row?.total ?? '');
    setText(form, `${P}._29_Note_Travel_Other_remarksRow${n}[0]`, row?.remarks ?? '');
  }

  // ── 6. Footer text fields (30–31, 33) ────────────────────────────────
  setText(form,
    `${P}._30_Remarks__Provide_details_of_any_equipment_breakdown_or_operating_issues_Include_other_information_as_necessary[0]`,
    ticket.remarks ?? ''
  );
  setText(form, `${P}._31_ContractorAgency_Representative_Printed_Name[0]`, ticket.contractorPrintedName ?? '');
  setText(form, `${P}._33_Incident_Supervisor_Printed_Name__Resource_Order_number[0]`, ticket.supervisorPrintedName ?? '');

  // ── 7. Embed signatures as PNG images ────────────────────────────────
  // The signature fields (32, 34) are PDFSignature type which pdf-lib cannot
  // write to directly — we draw the image on the page over the field area.
  const page = pdfDoc.getPage(0);

  // Coordinates calibrated from PDF inspection:
  // Field 32 (Contractor): x=312.4, y=428.9, w=273.3, h=15.1
  // Field 34 (Supervisor): x=312.8, y=401.9, w=272.9, h=15.1
  const SIG_COORD = {
    contractor: { x: 312, y: 428, w: 270, h: 30 },
    supervisor:  { x: 312, y: 401, w: 270, h: 30 },
  };

  // ── 8. Update appearances & flatten ──────────────────────────────────
  try {
    const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);
    form.updateFieldAppearances(helvetica);
    form.flatten();
  } catch (flattenErr) {
    console.warn('[OF297] Flatten failed — saving without flattening:', flattenErr);
  }

  // ── 9. Embed signatures as PNG images (AFTER flatten to be on top) ────
  if (ticket.contractorSignature) {
    try {
      const img = await pdfDoc.embedPng(dataUrlToUint8Array(ticket.contractorSignature));
      page.drawImage(img, {
        x: SIG_COORD.contractor.x,
        y: SIG_COORD.contractor.y,
        width: SIG_COORD.contractor.w,
        height: SIG_COORD.contractor.h,
      });
    } catch (e) { console.warn('[OF297] Contractor sig embed failed', e); }
  }

  if (ticket.supervisorSignature) {
    try {
      const img = await pdfDoc.embedPng(dataUrlToUint8Array(ticket.supervisorSignature));
      page.drawImage(img, {
        x: SIG_COORD.supervisor.x,
        y: SIG_COORD.supervisor.y,
        width: SIG_COORD.supervisor.w,
        height: SIG_COORD.supervisor.h,
      });
    } catch (e) { console.warn('[OF297] Supervisor sig embed failed', e); }
  }

  const pdfBytes = await pdfDoc.save();
  return new Blob([pdfBytes.buffer as unknown as ArrayBuffer], { type: 'application/pdf' });
}
