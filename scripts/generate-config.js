#!/usr/bin/env node
/**
 * Citeste .env si genereaza js/config.js
 * Rulare: node scripts/generate-config.js
 */

const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '..', '.env');
const outPath = path.join(__dirname, '..', 'js', 'config.js');

if (!fs.existsSync(envPath)) {
  console.error('Eroare: fisierul .env nu exista. Copiaza .env.example in .env si completeaza valorile.');
  process.exit(1);
}

const env = {};
fs.readFileSync(envPath, 'utf8')
  .split('\n')
  .forEach(line => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) return;
    const idx = trimmed.indexOf('=');
    if (idx === -1) return;
    const key = trimmed.slice(0, idx).trim();
    const val = trimmed.slice(idx + 1).trim();
    env[key] = val;
  });

if (!env.SUPABASE_URL || !env.SUPABASE_ANON_KEY) {
  console.error('Eroare: SUPABASE_URL sau SUPABASE_ANON_KEY lipsesc din .env');
  process.exit(1);
}

const content = `/* Fisier generat automat din .env — NU edita manual */
/* Rulati: node scripts/generate-config.js */
window.APP_CONFIG = {
  supabaseUrl: '${env.SUPABASE_URL}',
  supabaseAnonKey: '${env.SUPABASE_ANON_KEY}'
};
`;

fs.writeFileSync(outPath, content, 'utf8');
console.log('✓ js/config.js generat cu succes.');
