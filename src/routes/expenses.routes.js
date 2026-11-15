import { Router } from 'express';
import prisma from '../config/db.js';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import ExcelJS from 'exceljs';
import PDFDocument from 'pdfkit-table';
import {
  createExpense,
  getExpenses,
  deleteExpense,
  exportExpensesCSV
} from '../controllers/expenses.controller.js';

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(process.cwd(), 'public/uploads');
    if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
    cb(null, uniqueName);
  }
});

const upload = multer({ storage });
const router = Router();

// Pomoćna funkcija za čitanje brendiranja firme i valute iz podešavanja
async function getCompanyBranding() {
  const defaults = { company_name: 'HouseBuilding', currency_base: 'RSD' };
  try {
    const jsonPath = path.join(process.cwd(), 'settings_local.json');
    if (fs.existsSync(jsonPath)) {
      Object.assign(defaults, JSON.parse(fs.readFileSync(jsonPath, 'utf-8')));
    } else if (prisma.systemSetting) {
      const rows = await prisma.systemSetting.findMany();
      rows.forEach((r) => {
        defaults[r.key] = r.value;
      });
    }
  } catch (e) {}
  return defaults;
}

router.get('/export/csv', exportExpensesCSV);
router.get('/', getExpenses);

// 1. IZVOZ U EXCEL (.xlsx)
router.get('/export/excel', async (req, res) => {
  try {
    const projectId = req.query.projectId ? parseInt(req.query.projectId) : 1;
    const branding = await getCompanyBranding();
    const cur = branding.currency_base || 'RSD';
    const compName = branding.company_name || 'HouseBuilding';

    const expenses = await prisma.expense.findMany({
      where: { projectId },
      include: { phase: true, company: true },
      orderBy: { date: 'desc' }
    });

    const workbook = new ExcelJS.Workbook();
    workbook.creator = compName;
    const worksheet = workbook.addWorksheet('Troškovi gradnje');

    worksheet.columns = [
      { header: 'ID', key: 'id', width: 8 },
      { header: 'Datum', key: 'date', width: 14 },
      { header: 'Opis troška', key: 'title', width: 32 },
      { header: 'Faza gradnje', key: 'phase', width: 30 },
      { header: 'Firma / Izvođač', key: 'company', width: 25 },
      { header: 'Način plaćanja', key: 'method', width: 16 },
      { header: `Iznos (${cur})`, key: 'amount', width: 18 }
    ];

    worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF1E293B' }
    };

    let totalSum = 0;
    expenses.forEach((exp) => {
      totalSum += Number(exp.amount);
      const rawDate = exp.date || exp.createdAt || new Date();
      worksheet.addRow({
        id: exp.id,
        date: new Date(rawDate).toLocaleDateString('sr-RS'),
        title: exp.title,
        phase: exp.phase?.title || 'Opšti trošak',
        company: exp.company?.name || 'Direktna nabavka',
        method: exp.paymentMethod || 'Gotovina',
        amount: Number(exp.amount)
      });
    });

    worksheet.getColumn('amount').numFmt = `#,##0.00 "${cur}"`;

    const totalRow = worksheet.addRow({
      title: 'UKUPNO POTROŠENO:',
      amount: totalSum
    });
    totalRow.font = { bold: true };

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=Troskovi_Gradiliste_${projectId}.xlsx`
    );

    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 2. IZVOZ U PDF (.pdf) SA PUNOM PODRŠKOM ZA Č, Ć, Ž, Š, Đ I LOGO FIRME
router.get('/export/pdf', async (req, res) => {
  try {
    const projectId = req.query.projectId ? parseInt(req.query.projectId) : 1;
    const branding = await getCompanyBranding();
    const compName = branding.company_name || 'HouseBuilding';
    const cur = branding.currency_base || 'RSD';

    const project = await prisma.project.findUnique({ where: { id: projectId } });
    const expenses = await prisma.expense.findMany({
      where: { projectId },
      include: { phase: true, company: true },
      orderBy: { date: 'desc' }
    });

    const doc = new PDFDocument({ margin: 30, size: 'A4' });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=Finansijski_Izvestaj_${projectId}.pdf`
    );

    doc.pipe(res);

    // Pronalaženje Unicode fonta za srpsku latinicu/ćirilicu (Windows & Linux/Docker)
    const regCandidates = [
      'C:/Windows/Fonts/arial.ttf',
      'C:/Windows/Fonts/segoeui.ttf',
      'C:/Windows/Fonts/tahoma.ttf',
      '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',
      '/usr/share/fonts/TTF/DejaVuSans.ttf'
    ];
    const boldCandidates = [
      'C:/Windows/Fonts/arialbd.ttf',
      'C:/Windows/Fonts/segoeuib.ttf',
      'C:/Windows/Fonts/tahomabd.ttf',
      '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf',
      '/usr/share/fonts/TTF/DejaVuSans-Bold.ttf'
    ];

    const regFontPath = regCandidates.find((f) => fs.existsSync(f));
    const boldFontPath = boldCandidates.find((f) => fs.existsSync(f)) || regFontPath;

    const fontRegular = regFontPath ? 'CustomRegular' : 'Helvetica';
    const fontBold = boldFontPath ? 'CustomBold' : 'Helvetica-Bold';

    if (regFontPath) doc.registerFont('CustomRegular', regFontPath);
    if (boldFontPath) doc.registerFont('CustomBold', boldFontPath);

    // Prikaz logotipa kupca u gornjem levom uglu ako postoji
    const logoPath = path.join(process.cwd(), 'company-logo.png');
    if (fs.existsSync(logoPath)) {
      try {
        doc.image(logoPath, 30, 25, { height: 36 });
      } catch (e) {}
    }

    // Naslov i zaglavlje dokumenta sa Unicode fontom
    doc.font(fontBold).fontSize(18).fillColor('#0f172a').text(`${compName} — Finansijski Izveštaj`, { align: 'center' });
    doc.moveDown(0.4);
    doc.font(fontRegular).fontSize(10).fillColor('#64748b').text(
      `Objekat: ${project?.name || 'Gradilište'} (${project?.location || 'Srbija'})`,
      { align: 'center' }
    );
    doc.text(`Datum generisanja: ${new Date().toLocaleDateString('sr-RS')}`, { align: 'center' });
    doc.moveDown(1.5);

    let totalSum = 0;
    const rows = expenses.map((exp) => {
      totalSum += Number(exp.amount);
      const rawDate = exp.date || exp.createdAt || new Date();
      return [
        new Date(rawDate).toLocaleDateString('sr-RS'),
        exp.title || '-',
        exp.phase?.title ? exp.phase.title.substring(0, 28) : '-',
        exp.company?.name || '-',
        exp.paymentMethod || 'Gotovina',
        `${Number(exp.amount).toLocaleString('sr-RS')} ${cur}`
      ];
    });

    const table = {
      title: { label: 'Dnevnik troškova i isplata', fontSize: 12, fontFamily: fontBold, color: '#0f172a' },
      headers: ['Datum', 'Opis', 'Faza', 'Izvođač', 'Plaćanje', 'Iznos'],
      rows: rows
    };

    await doc.table(table, {
      prepareHeader: () => doc.font(fontBold).fontSize(9).fillColor('#0f172a'),
      prepareRow: () => doc.font(fontRegular).fontSize(8.5).fillColor('#334155')
    });

    doc.moveDown(1);
    doc.fontSize(11).font(fontBold).fillColor('#0f172a').text(
      `UKUPNO POTROŠENO: ${totalSum.toLocaleString('sr-RS')} ${cur}`,
      { align: 'right' }
    );

    doc.end();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/', upload.single('invoice'), createExpense);
router.delete('/:id', deleteExpense);

export default router;