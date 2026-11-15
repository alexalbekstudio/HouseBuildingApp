import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import prisma from '../config/db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const LOGO_PATH = path.join(__dirname, '../../company-logo.png');

// Tajni ključ za verifikaciju licenci (promeni ili drži u .env)
const LICENSE_SALT = process.env.LICENSE_SALT || 'HB-2026-SECRET-SALT';

export function verifyLicenseKey(keyStr) {
    if (!keyStr || typeof keyStr !== 'string') return 'core';
    const clean = keyStr.trim().toUpperCase();
    // Format ključa: HB-PRO-XXXX-YYYY ili HB-ULTIMATE-XXXX-YYYY
    const parts = clean.split('-');
    if (parts.length !== 4 || parts[0] !== 'HB') return 'core';
    const tier = parts[1].toLowerCase();
    if (!['core', 'pro', 'ultimate'].includes(tier)) return 'core';

    const payload = `${parts[0]}-${parts[1]}-${parts[2]}`;
    const expectedSig = crypto
        .createHmac('sha256', LICENSE_SALT)
        .update(payload)
        .digest('hex')
        .substring(0, 4)
        .toUpperCase();

    // Dozvoli i tvoj master developerski ključ za testiranje:
    if (clean === 'HB-ULTIMATE-2026-MASTER') return 'ultimate';
    if (clean === 'HB-PRO-2026-MASTER') return 'pro';

    return parts[3] === expectedSig ? tier : 'core';
}

const DEFAULT_SETTINGS = {
    company_name: 'HouseBuilding',
    company_pib: '',
    company_address: '',
    company_bank_acc: '',
    currency_base: 'EUR',
    default_lang: 'sr',
    license_key: '',
    license_tier: 'core',
    smtp_host: 'smtp.gmail.com',
    smtp_port: '587',
    smtp_user: '',
    smtp_pass: ''
};

export const getSettings = async (req, res) => {
    try {
        const dbClient = req.prisma || prisma;
        const rows = await dbClient.systemSetting.findMany();
        const settingsMap = { ...DEFAULT_SETTINGS };
        for (const r of rows) {
            settingsMap[r.key] = r.value;
        }
        // Uvek izračunaj paket isključivo iz ključa
        settingsMap.license_tier = verifyLicenseKey(settingsMap.license_key);

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
        const verifiedTier = verifyLicenseKey(body.license_key || '');

        if (body.remove_logo === 'true' && fs.existsSync(LOGO_PATH)) {
            fs.unlinkSync(LOGO_PATH);
        }

        // Samo Ultimate paket (ili Ultimate) može menjati custom logo
        if (req.file && verifiedTier === 'ultimate') {
            fs.copyFileSync(req.file.path, LOGO_PATH);
            try { fs.unlinkSync(req.file.path); } catch (err) {}
        }

        for (const [key, value] of Object.entries(body)) {
            if (key === 'company_logo' || key === 'remove_logo' || key === 'license_tier') continue;
            await dbClient.systemSetting.upsert({
                where: { key },
                update: { value: value != null ? value.toString() : '' },
                create: { key, value: value != null ? value.toString() : '' }
            });
        }

        await dbClient.systemSetting.upsert({
            where: { key: 'license_tier' },
            update: { value: verifiedTier },
            create: { key: 'license_tier', value: verifiedTier }
        });

        res.json({
            success: true,
            license_tier: verifiedTier,
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