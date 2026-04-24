import { PDFDocument } from 'pdf-lib';
import fs from 'fs';

async function inspect() {
  const bytes = fs.readFileSync('src/assets/pdf/OF297-24.pdf');
  const pdfDoc = await PDFDocument.load(bytes);
  const page = pdfDoc.getPage(0);
  console.log('Page size:', page.getSize());
  const form = pdfDoc.getForm();
  const fields = form.getFields();

  fields.forEach(field => {
    const name = field.getName();
    if (name.includes('31') || name.includes('32') || name.includes('33') || name.includes('34')) {
      const widgets = field.acroField.getWidgets();
      widgets.forEach((w, i) => {
        const rect = w.getRectangle();
        console.log(`Field: ${name}, Widget: ${i}, Rect:`, rect);
      });
    }
  });
}

inspect();
