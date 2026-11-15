import prisma from '../config/db.js';

export async function getDynamicSmtpConfig() {
  try {
    const rows = await prisma.systemSetting.findMany({
      where: { key: { in: ['smtp_host', 'smtp_port', 'smtp_user', 'smtp_pass', 'company_name'] } }
    });
    const map = Object.fromEntries(rows.map(r => [r.key, r.value]));
    return {
      host: map.smtp_host || process.env.SMTP_HOST || 'smtp.gmail.com',
      port: Number(map.smtp_port || process.env.SMTP_PORT || 587),
      user: map.smtp_user || process.env.SMTP_USER || '',
      pass: map.smtp_pass || process.env.SMTP_PASS || '',
      companyName: map.company_name || 'HouseBuilding'
    };
  } catch (e) {
    return {
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: Number(process.env.SMTP_PORT || 587),
      user: process.env.SMTP_USER || '',
      pass: process.env.SMTP_PASS || '',
      companyName: 'HouseBuilding'
    };
  }
}

import nodemailer from 'nodemailer';

// Konfiguracija SMTP transportera iz .env promenljivih
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_SECURE === 'true', // true za port 465, false za 587
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS // Ako je Gmail, koristi se 16-cifrena App Password
  }
});

/**
 * Pomoćna funkcija za slanje email obaveštenja
 * @param {Object} options - { to, subject, text, html }
 */
export async function sendMail({ to, subject, text, html }) {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    throw new Error('SMTP kredencijali nisu postavljeni u .env fajlu (SMTP_USER / SMTP_PASS).');
  }

  const mailOptions = {
    from: `"HouseBuilding Obaveštenja" <${process.env.SMTP_USER}>`,
    to,
    subject,
    text,
    html
  };

  return await transporter.sendMail(mailOptions);
}

export default { sendMail };