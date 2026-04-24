// Run with: node scripts/inspectPdf.mjs
import { readFileSync } from 'fs';
import { PDFDocument } from 'pdf-lib';

const bytes = readFileSync('./src/assets/pdf/OF297-24.pdf');
const pdfDoc = await PDFDocument.load(bytes);
const form = pdfDoc.getForm();
const fields = form.getFields();

console.log('\n--- OF297-24.pdf Form Fields ---\n');
fields.forEach(f => {
  const type = f.constructor.name;
  const name = f.getName();
  console.log(`[${type}] "${name}"`);
});
console.log(`\nTotal fields: ${fields.length}`);
