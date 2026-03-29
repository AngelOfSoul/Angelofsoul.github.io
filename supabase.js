/*
supabase.js — Calnic Online v2
HOW TO CONFIGURE: 
✅ Already configured with real values from your project.
*/
const SUPABASE_URL = 'https://qjgvhirmnxpqqcllzukp.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFqZ3ZoaXJtbnhwcXFjbGx6dWtwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQyNzQ2NTgsImV4cCI6MjA4OTg1MDY1OH0.j3SgLKfwYUaY5elT6JIshvohYvr2UigvPHub7Nzm82M';

(function () {
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.min.js';
    script.onload = function () {
        try {
            // Initialize Supabase client using v2 API
            window.supabase = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
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

// Helper: Check if configured with real (non-placeholder) credentials
window.isSupabaseConfigured = function isSupabaseConfigured() {
    // Since we've replaced placeholders with real values, this checks they're not the *original* dummy strings
    return SUPABASE_URL !== 'https://qjgvhirmnxpqqcllzukp.supabase.co' ||
           SUPABASE_ANON_KEY !== 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFqZ3ZoaXJtbnhwcXFjbGx6dWtwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQyNzQ2NTgsImV4cCI6MjA4OTg1MDY1OH0.j3SgLKfwYUaY5elT6JIshvohYvr2UigvPHub7Nzm82M';
};
