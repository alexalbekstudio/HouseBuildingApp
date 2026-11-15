// Pokreni sa: node generate_key.js pro  (ili core / ultimate)
import crypto from 'crypto';
const tier = (process.argv[2] || 'ultimate').toUpperCase();
const rand = crypto.randomBytes(2).toString('hex').toUpperCase();
const salt = process.env.LICENSE_SALT || 'HB-2026-SECRET-SALT';
const payload = `HB-${tier}-${rand}`;
const sig = crypto.createHmac('sha256', salt).update(payload).digest('hex').substring(0, 4).toUpperCase();
console.log(`Ključ za ${tier} paket:  ${payload}-${sig}`);