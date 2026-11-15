import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import prisma from '../config/db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const LOGO_PATH = path.join(__dirname, '../../company-logo.png');

const DEFAULT_SETTINGS = {
    company_name: 'Gradnja Pro',
    company_pib: '',
    company_mb: '',
    company_address: '',
    company_bank_acc: '',
    currency_base: 'EUR',
    default_lang: 'sr',
    license_tier: 'ultimate', // 'core' | 'pro' | 'ultimate'
    license_key: '',
    smtp_host: 'smtp.gmail.com',
    smtp_port: '587',
    smtp_user: '',
    smtp_pass: '',
    admin_email: ''
};

export const getSettings = async (req, res) => {
    try {
        const dbClient = req.prisma || prisma;
        const rows = await dbClient.systemSetting.findMany();
        const settingsMap = { ...DEFAULT_SETTINGS };
        for (const r of rows) {
            settingsMap[r.key] = r.value;
        }
        res.json({
            settings: settingsMap,
            hasCustomLogo: fs.existsSync(LOGO_PATH)
        });
    } catch (e) {
        console.error('Greška pri učitavanju podešavanja:', e);
        res.status(500).json({ error: 'Greška pri učitavanju podešavanja.' });
    }
};

export const saveSettings = async (req, res) => {
    try {
        const dbClient = req.prisma || prisma;
        const body = req.body || {};

        if (req.body?.remove_logo === 'true' && fs.existsSync(LOGO_PATH)) {
            fs.unlinkSync(LOGO_PATH);
        }

        if (req.file) {
            fs.copyFileSync(req.file.path, LOGO_PATH);
            try { fs.unlinkSync(req.file.path); } catch (err) {}
        }

        for (const [key, value] of Object.entries(body)) {
            if (key === 'company_logo' || key === 'remove_logo') continue;
            await dbClient.systemSetting.upsert({
                where: { key },
                update: { value: value != null ? value.toString() : '' },
                create: { key, value: value != null ? value.toString() : '' }
            });
        }

        res.json({
            success: true,
            hasCustomLogo: fs.existsSync(LOGO_PATH)
        });
    } catch (e) {
        console.error('Greška pri čuvanju podešavanja:', e);
        res.status(500).json({ error: 'Greška pri čuvanju podešavanja.' });
    }
};

export const serveLogo = (req, res) => {
    if (fs.existsSync(LOGO_PATH)) {
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
        res.sendFile(LOGO_PATH);
    } else {
        res.status(404).end();
    }
};

export const serveFavicon = (req, res) => {
    if (fs.existsSync(LOGO_PATH)) {
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
        res.sendFile(LOGO_PATH);
    } else {
        const emptyPng = Buffer.from(
            'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=',
            'base64'
        );
        res.setHeader('Content-Type', 'image/png');
        res.send(emptyPng);
    }
};