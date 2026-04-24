/**
 * PDF Field Inspector
 * ------------------
 * Run this from the browser console to discover all form field names
 * embedded in the OF297-24.pdf template. Once you have the list,
 * update the FIELD_MAP in generateOF297.ts accordingly.
 *
 * Usage (in browser console):
 *   import('/src/pdf/inspectPdfFields.ts').then(m => m.logPdfFields())
 */
import { PDFDocument } from 'pdf-lib';
import pdfTemplateUrl from '../assets/pdf/OF297-24.pdf';

export async function logPdfFields(): Promise<string[]> {
  const res = await fetch(pdfTemplateUrl as string);
  const bytes = await res.arrayBuffer();
  const pdfDoc = await PDFDocument.load(bytes);
  const form = pdfDoc.getForm();
  const fields = form.getFields();

  console.group('--- OF297-24.pdf Form Field Names ---');
  const names = fields.map(f => {
    const type = f.constructor.name;
    const name = f.getName();
    console.log(`[${type}] ${name}`);
    return name;
  });
  console.groupEnd();

  return names;
}
