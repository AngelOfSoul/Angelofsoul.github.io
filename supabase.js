/*
supabase.js — Shared Supabase client for Calnic Online
*/
const SUPABASE_URL     = 'https://qjgvhirmnxpqqcllzukp.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFqZ3ZoaXJtbnhwcXFjbGx6dWtwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQyNzQ2NTgsImV4cCI6MjA4OTg1MDY1OH0.j3SgLKfwYUaY5elT6JIshvohYvr2UigvPHub7Nzm82M';

(function () {
  var script = document.createElement('script');
  script.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.min.js';
  script.onload = function () {
    try {
      var lib = window.supabase || window.supabaseJs;
      window.supabase = lib.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    } catch (e) {
      console.warn('[Calnic] Supabase client init failed.', e);
    }
    document.dispatchEvent(new Event('supabase:ready'));
  };
  script.onerror = function () {
    console.warn('[Calnic] Supabase CDN unavailable.');
    document.dispatchEvent(new Event('supabase:ready'));
  };
  document.head.appendChild(script);
})();

window.isSupabaseConfigured = function () {
  return SUPABASE_URL !== 'YOUR_SUPABASE_URL' && SUPABASE_ANON_KEY !== 'YOUR_SUPABASE_ANON_KEY';
};
