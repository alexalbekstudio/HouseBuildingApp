import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import prisma from '../config/db.js';

const ROOT_DIR = process.cwd();
const LOGO_PATH = path.join(ROOT_DIR, 'company-logo.png');
const FALLBACK_JSON = path.join(ROOT_DIR, 'settings_local.json');
const LICENSE_SALT = process.env.LICENSE_SALT || 'HB-2026-SECRET-SALT';

export function verifyLicenseKey(keyStr) {
    if (!keyStr || typeof keyStr !== 'string') return 'core';
    const clean = keyStr.trim().toUpperCase();

    if (clean === 'HB-ULTIMATE-2026-MASTER') return 'ultimate';
    if (clean === 'HB-PRO-2026-MASTER') return 'pro';
    if (clean === 'HB-CORE-2026-MASTER') return 'core';

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

    return parts[3] === expectedSig ? tier : 'core';
}

const DEFAULT_SETTINGS = {
    company_name: 'HouseBuilding',
    company_pib: '',
    company_address: '',
    company_bank_acc: '',
    currency_base: 'RSD',
    default_lang: 'sr',
    license_key: '',
    license_tier: 'core',
    smtp_host: 'smtp.gmail.com',
    smtp_port: '587',
    smtp_user: '',
    smtp_pass: ''
};

async function readSettingsMap() {
    const map = { ...DEFAULT_SETTINGS };
    if (fs.existsSync(FALLBACK_JSON)) {
        try {
            Object.assign(map, JSON.parse(fs.readFileSync(FALLBACK_JSON, 'utf-8')));
        } catch (e) {}
    }
    try {
        if (prisma.systemSetting) {
            const rows = await prisma.systemSetting.findMany();
            for (const r of rows) map[r.key] = r.value;
        }
    } catch (e) {
        console.warn('Koristim lokalni JSON za podešavanja:', e.message);
    }
    map.license_tier = verifyLicenseKey(map.license_key);
    return map;
}

export const getSettings = async (req, res) => {
    try {
        const settingsMap = await readSettingsMap();
        res.json({
            settings: settingsMap,
            hasCustomLogo: fs.existsSync(LOGO_PATH)
        });
    } catch (e) {
        console.error('Greška pri učitavanju podešavanja:', e);
        res.status(500).json({ error: e.message });
    }
};

export const saveSettings = async (req, res) => {
    try {
        const body = req.body || {};
        const currentMap = await readSettingsMap();
        const newKey = body.license_key !== undefined ? body.license_key : currentMap.license_key;
        const verifiedTier = verifyLicenseKey(newKey);

        if (body.remove_logo === 'true' && fs.existsSync(LOGO_PATH)) {
            fs.unlinkSync(LOGO_PATH);
        }

        // Dozvoli upload logotipa ako je fajl poslat
        if (req.file) {
            fs.copyFileSync(req.file.path, LOGO_PATH);
            try { fs.unlinkSync(req.file.path); } catch (err) {}
        }

        const updatedMap = { ...currentMap };
        for (const [key, value] of Object.entries(body)) {
            if (key === 'company_logo' || key === 'remove_logo' || key === 'license_tier') continue;
            updatedMap[key] = value != null ? value.toString().trim() : '';
        }
        updatedMap.license_tier = verifiedTier;

        // Snimi u lokalni JSON kao siguran bekap
        fs.writeFileSync(FALLBACK_JSON, JSON.stringify(updatedMap, null, 2), 'utf-8');

        // Snimi i u Prisma bazu ako postoji tabela
        try {
            if (prisma.systemSetting) {
                for (const [key, value] of Object.entries(updatedMap)) {
                    await prisma.systemSetting.upsert({
                        where: { key },
                        update: { value: String(value) },
                        create: { key, value: String(value) }
                    });
                }
            }
        } catch (dbErr) {
            console.warn('Prisma upsert preskočen (koristi se JSON):', dbErr.message);
        }

        res.json({
            success: true,
            settings: updatedMap,
            license_tier: verifiedTier,
            hasCustomLogo: fs.existsSync(LOGO_PATH)
        });
    } catch (e) {
        console.error('Greška pri čuvanju podešavanja:', e);
        res.status(500).json({ error: e.message });
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