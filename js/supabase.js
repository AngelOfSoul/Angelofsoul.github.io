/*
 * supabase.js — Shared Supabase client for Calnic Online
 *
 * Credentialele sunt citite din js/config.js (generat din .env).
 * Rulati: node scripts/generate-config.js
 */

const SUPABASE_URL      = (window.APP_CONFIG && window.APP_CONFIG.supabaseUrl)      || 'YOUR_SUPABASE_URL';
const SUPABASE_ANON_KEY = (window.APP_CONFIG && window.APP_CONFIG.supabaseAnonKey)  || 'YOUR_SUPABASE_ANON_KEY';

(function () {
  var script = document.createElement('script');
  script.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.min.js';
  script.onload = function () {
    try {
      var lib = window.supabase || window.supabaseJs;
      window.supabase = lib.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    } catch (e) {
      console.warn('[Calnic] Supabase client init failed — demo mode active.', e);
    }
    document.dispatchEvent(new Event('supabase:ready'));
  };
  script.onerror = function () {
    console.warn('[Calnic] Supabase CDN unavailable — demo mode active.');
    document.dispatchEvent(new Event('supabase:ready'));
  };
  document.head.appendChild(script);
})();

window.isSupabaseConfigured = function isSupabaseConfigured() {
  return SUPABASE_URL !== 'YOUR_SUPABASE_URL' &&
         SUPABASE_ANON_KEY !== 'YOUR_SUPABASE_ANON_KEY';
};
