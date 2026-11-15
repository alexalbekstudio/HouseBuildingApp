import fs from 'fs';
import path from 'path';
import PDFDocument from 'pdfkit';
import ExcelJS from 'exceljs';
import prisma from '../config/db.js';

// Pomoćna funkcija za učitavanje podešavanja firme (za naziv i valutu na PDF/Excel izveštajima)
async function getCompanyBranding() {
  const defaults = { company_name: 'HouseBuilding', currency_base: 'RSD' };
  try {
    const jsonPath = path.join(process.cwd(), 'settings_local.json');
    if (fs.existsSync(jsonPath)) {
      Object.assign(defaults, JSON.parse(fs.readFileSync(jsonPath, 'utf-8')));
    } else if (prisma.systemSetting) {
      const rows = await prisma.systemSetting.findMany();
      rows.forEach(r => { defaults[r.key] = r.value; });
    }
  } catch (e) {}
  return defaults;
}

export const createExpense = async (req, res) => {
  try {
    const projectId = parseInt(req.body.projectId || '1');
    const {
      title,
      amount,
      category,
      paymentMethod,
      status,
      date,
      documentNo,
      note,
      phaseId,
      companyId
    } = req.body;

    const invoiceUrl = req.file ? `/uploads/${req.file.filename}` : null;

    const expense = await prisma.expense.create({
      data: {
        title,
        amount: parseFloat(amount),
        category: category || 'MATERIJAL',
        paymentMethod: paymentMethod || 'GOTOVINA',
        status: status || 'PLACENO',
        date: date ? new Date(date) : new Date(),
        documentNo,
        note,
        invoiceUrl,
        projectId,
        phaseId: phaseId && phaseId !== '' ? parseInt(phaseId) : null,
        companyId: companyId && companyId !== '' ? parseInt(companyId) : null
      }
    });

    res.status(201).json(expense);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

export const getExpenses = async (req, res) => {
  try {
    const projectId = parseInt(req.query.projectId || '1');
    const { phaseId, status } = req.query;

    const where = { projectId };
    if (phaseId && phaseId !== 'all') where.phaseId = parseInt(phaseId);
    if (status && status !== 'all') where.status = status;

    const expenses = await prisma.expense.findMany({
      where,
      include: {
        phase: true,
        company: true
      },
      orderBy: { date: 'desc' }
    });

    res.json(expenses);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const deleteExpense = async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.expense.delete({ where: { id: parseInt(id) } });
    res.status(204).send();
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

export const exportExpensesCSV = async (req, res) => {
  try {
    const projectId = parseInt(req.query.projectId || '1');
    const branding = await getCompanyBranding();
    const cur = branding.currency_base || 'RSD';

    const expenses = await prisma.expense.findMany({
      where: { projectId },
      include: { phase: true, company: true },
      orderBy: { date: 'desc' }
    });

    let csv = `ID,Datum,Faza,Opis,Iznos (${cur}),Kategorija,Način Plaćanja,Status,Firma,Broj Dokumenta\n`;

    expenses.forEach((e) => {
      const d = e.date.toISOString().split('T')[0];
      const phase = `"${(e.phase?.title || 'Bez faze').replace(/"/g, '""')}"`;
      const title = `"${(e.title || '').replace(/"/g, '""')}"`;
      const comp = `"${(e.company?.name || 'N/A').replace(/"/g, '""')}"`;
      const doc = `"${(e.documentNo || '').replace(/"/g, '""')}"`;

      csv += `${e.id},${d},${phase},${title},${e.amount},${e.category},${e.paymentMethod},${e.status},${comp},${doc}\n`;
    });

    res.header('Content-Type', 'text/csv; charset=utf-8');
    res.attachment(`finansijski-izvestaj-${new Date().toISOString().split('T')[0]}.csv`);
    return res.send('\uFEFF' + csv);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const exportExpensesExcel = async (req, res) => {
  try {
    const projectId = parseInt(req.query.projectId || '1');
    const branding = await getCompanyBranding();
    const cur = branding.currency_base || 'RSD';

    const expenses = await prisma.expense.findMany({
      where: { projectId },
      include: { phase: true, company: true },
      orderBy: { date: 'desc' }
    });

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Troškovi gradnje');

    sheet.columns = [
      { header: 'Datum', key: 'date', width: 14 },
      { header: 'Opis stavke', key: 'title', width: 32 },
      { header: 'Faza', key: 'phase', width: 28 },
      { header: 'Izvođač / Firma', key: 'company', width: 24 },
      { header: 'Način plaćanja', key: 'paymentMethod', width: 16 },
      { header: `Iznos (${cur})`, key: 'amount', width: 16 }
    ];

    sheet.getRow(1).font = { bold: true };

    expenses.forEach(e => {
      sheet.addRow({
        date: e.date.toISOString().split('T')[0],
        title: e.title,
        phase: e.phase?.title || '-',
        company: e.company?.name || '-',
        paymentMethod: e.paymentMethod,
        amount: Number(e.amount) || 0
      });
    });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="finansijski-izvestaj-${new Date().toISOString().split('T')[0]}.xlsx"`);
    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const exportExpensesPDF = async (req, res) => {
  try {
    const projectId = parseInt(req.query.projectId || '1');
    const branding = await getCompanyBranding();
    const compName = branding.company_name || 'HouseBuilding';
    const cur = branding.currency_base || 'RSD';

    const [project, expenses] = await Promise.all([
      prisma.project.findUnique({ where: { id: projectId } }),
      prisma.expense.findMany({
        where: { projectId },
        include: { phase: true, company: true },
        orderBy: { date: 'desc' }
      })
    ]);

    const doc = new PDFDocument({ margin: 40, size: 'A4' });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="finansijski-izvestaj-${new Date().toISOString().split('T')[0]}.pdf"`);
    doc.pipe(res);

    // Učitavanje Unicode fonta za č, ć, ž, š, đ (Windows i Linux/Docker)
    const fontRegularCandidates = [
      'C:/Windows/Fonts/arial.ttf',
      'C:/Windows/Fonts/segoeui.ttf',
      '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',
      '/usr/share/fonts/TTF/DejaVuSans.ttf'
    ];
    const fontBoldCandidates = [
      'C:/Windows/Fonts/arialbd.ttf',
      'C:/Windows/Fonts/segoeuib.ttf',
      '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf',
      '/usr/share/fonts/TTF/DejaVuSans-Bold.ttf'
    ];

    const regFont = fontRegularCandidates.find(f => fs.existsSync(f));
    const boldFont = fontBoldCandidates.find(f => fs.existsSync(f)) || regFont;

    if (regFont) {
      doc.registerFont('SansRegular', regFont);
      doc.registerFont('SansBold', boldFont);
      doc.font('SansRegular');
    }

    // Ako kupac ima svoj logo, prikaži ga u vrhu PDF izveštaja
    const logoPath = path.join(process.cwd(), 'company-logo.png');
    if (fs.existsSync(logoPath)) {
      try {
        doc.image(logoPath, 40, 35, { height: 36 });
      } catch (e) {}
    }

    // Zaglavlje izveštaja
    if (regFont) doc.font('SansBold');
    doc.fontSize(18).fillColor('#0f172a').text(`${compName} — Finansijski Izveštaj`, { align: 'center' });
    if (regFont) doc.font('SansRegular');
    doc.moveDown(0.3);
    doc.fontSize(10).fillColor('#475569').text(
      `Objekat: ${project ? `${project.name} (${project.location || ''})` : `Projekat #${projectId}`}`,
      { align: 'center' }
    );
    doc.text(`Datum generisanja: ${new Date().toLocaleDateString('sr-RS')}`, { align: 'center' });
    doc.moveDown(1.5);

    // Naslov tabele
    if (regFont) doc.font('SansBold');
    doc.fontSize(12).fillColor('#0f172a').text('Dnevnik troškova i isplata');
    doc.moveDown(0.5);

    const startX = 40;
    let y = doc.y;

    // Zaglavlje kolona
    doc.rect(startX, y, 515, 20).fill('#f1f5f9');
    doc.fillColor('#0f172a').fontSize(9);
    doc.text('Datum', startX + 6, y + 5, { width: 65 });
    doc.text('Opis', startX + 75, y + 5, { width: 130 });
    doc.text('Faza', startX + 210, y + 5, { width: 115 });
    doc.text('Izvođač', startX + 330, y + 5, { width: 80 });
    doc.text('Plaćanje', startX + 415, y + 5, { width: 45 });
    doc.text('Iznos', startX + 465, y + 5, { width: 45, align: 'right' });

    y += 24;
    if (regFont) doc.font('SansRegular');

    let totalSpent = 0;
    expenses.forEach((e) => {
      if (y > 760) {
        doc.addPage();
        y = 40;
      }
      const amt = Number(e.amount) || 0;
      totalSpent += amt;

      doc.fillColor('#1e293b').fontSize(8.5);
      doc.text(e.date.toISOString().split('T')[0], startX + 6, y, { width: 65 });
      doc.text(e.title || '-', startX + 75, y, { width: 130 });
      doc.text(e.phase?.title || '-', startX + 210, y, { width: 115 });
      doc.text(e.company?.name || '-', startX + 330, y, { width: 80 });
      doc.text(e.paymentMethod || '-', startX + 415, y, { width: 45 });
      doc.text(`${amt.toLocaleString('sr-RS')} ${cur}`, startX + 455, y, { width: 55, align: 'right' });

      y += 18;
      doc.moveTo(startX, y - 3).lineTo(startX + 515, y - 3).strokeColor('#e2e8f0').lineWidth(0.5).stroke();
    });

    doc.moveDown(1);
    if (regFont) doc.font('SansBold');
    doc.fontSize(11).fillColor('#0f172a').text(
      `UKUPNO POTROŠENO: ${totalSpent.toLocaleString('sr-RS')} ${cur}`,
      startX,
      y + 10,
      { width: 515, align: 'right' }
    );

    doc.end();
  } catch (error) {
    console.error('PDF export error:', error);
    res.status(500).json({ error: error.message });
  }
};