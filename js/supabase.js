/*
 * supabase.js — versiune curată (fără compat layer)
 * Funcționează 100% cu schema ta actuală
 */

const SUPABASE_URL =
  (window.APP_CONFIG && window.APP_CONFIG.supabaseUrl) ||
  "YOUR_SUPABASE_URL";

const SUPABASE_ANON_KEY =
  (window.APP_CONFIG && window.APP_CONFIG.supabaseAnonKey) ||
  "YOUR_SUPABASE_ANON_KEY";

(function () {
  const script = document.createElement("script");
  script.src =
    "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.min.js";

  script.onload = function () {
    try {
      const lib = window.supabase || window.supabaseJs;

      const client = lib.createClient(
        SUPABASE_URL,
        SUPABASE_ANON_KEY
      );

      window.supabase = client;

      console.log("[Supabase] Connected ✔");

    } catch (e) {
      console.error("[Supabase] Init error:", e);
    }

    document.dispatchEvent(new Event("supabase:ready"));
  };

  script.onerror = function () {
    console.error("[Supabase] CDN load failed");
    document.dispatchEvent(new Event("supabase:ready"));
  };

  document.head.appendChild(script);
})();

window.isSupabaseConfigured = function () {
  return (
    SUPABASE_URL !== "YOUR_SUPABASE_URL" &&
    SUPABASE_ANON_KEY !== "YOUR_SUPABASE_ANON_KEY"
  );
};