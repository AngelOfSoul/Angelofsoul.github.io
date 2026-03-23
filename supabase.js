/*
 * supabase.js — Shared Supabase client for Calnic Online
 *
 * HOW TO CONFIGURE:
 * 1. Go to https://supabase.com and open your project
 * 2. Navigate to Project Settings → API
 * 3. Replace the two placeholder values below:
 *    - SUPABASE_URL  → your "Project URL"  (e.g. https://xxxxxxxxxxxx.supabase.co)
 *    - SUPABASE_ANON_KEY → your "anon / public" key (the long JWT string)
 *
 * Until real values are provided, all data pages fall back to built-in demo data.
 */

const SUPABASE_URL     = 'https://qjgvhirmnxpqqcllzukp.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFqZ3ZoaXJtbnhwcXFjbGx6dWtwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQyNzQ2NTgsImV4cCI6MjA4OTg1MDY1OH0.j3SgLKfwYUaY5elT6JIshvohYvr2UigvPHub7Nzm82M';

/* ── Load the Supabase JS v2 UMD bundle from CDN, then create the client ── */
(function () {
  var script = document.createElement('script');
  script.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.min.js';
  script.onload = function () {
    try {
      window.supabase = window.supabase
        ? window.supabase
        : window.supabaseJs.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
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

/*
 * isSupabaseConfigured()
 * Returns true only when the placeholders have been replaced with real values.
 * Can be used by any page to conditionally show/hide Supabase-dependent UI:
 *   if (isSupabaseConfigured()) { ... }
 */
window.isSupabaseConfigured = function isSupabaseConfigured() {
  return SUPABASE_URL !== 'YOUR_SUPABASE_URL' &&
         SUPABASE_ANON_KEY !== 'YOUR_SUPABASE_ANON_KEY';
};
