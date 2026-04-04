/*
 * supabase.js — client + compat layer pentru Calnic Online
 */

const SUPABASE_URL =
  (window.APP_CONFIG && window.APP_CONFIG.supabaseUrl) ||
  "YOUR_SUPABASE_URL";

const SUPABASE_ANON_KEY =
  (window.APP_CONFIG && window.APP_CONFIG.supabaseAnonKey) ||
  "YOUR_SUPABASE_ANON_KEY";

(function () {
  function finishReady() {
    document.dispatchEvent(new Event("supabase:ready"));
  }

  function initClient() {
    try {
      const lib = window.supabase || window.supabaseJs;
      if (!lib || typeof lib.createClient !== "function") {
        console.error("[Supabase] Library unavailable");
        finishReady();
        return;
      }

      const client = lib.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

      // Compat: codul existent asteapta uneori getUser() => { data: { session } }
      const auth = client.auth;
      const _origGetUser = auth.getUser.bind(auth);
      const _origGetSession = auth.getSession.bind(auth);

      auth.getUser = async function () {
        try {
          const [userRes, sessionRes] = await Promise.all([
            _origGetUser(),
            _origGetSession()
          ]);

          return {
            data: {
              user: (userRes && userRes.data && userRes.data.user) || null,
              session: (sessionRes && sessionRes.data && sessionRes.data.session) || null
            },
            error:
              (userRes && userRes.error) ||
              (sessionRes && sessionRes.error) ||
              null
          };
        } catch (e) {
          return { data: { user: null, session: null }, error: e };
        }
      };

      auth.getSessionCompat = _origGetSession;

      window.supabase = client;
      console.log("[Supabase] Connected ✔");
    } catch (e) {
      console.error("[Supabase] Init error:", e);
    }

    finishReady();
  }

  const existing =
    window.supabaseJs ||
    (window.supabase && typeof window.supabase.createClient === "function");

  if (existing) {
    initClient();
    return;
  }

  const script = document.createElement("script");
  script.src =
    "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.min.js";
  script.onload = initClient;
  script.onerror = function () {
    console.error("[Supabase] CDN load failed");
    finishReady();
  };
  document.head.appendChild(script);
})();

window.isSupabaseConfigured = function () {
  return (
    SUPABASE_URL !== "YOUR_SUPABASE_URL" &&
    SUPABASE_ANON_KEY !== "YOUR_SUPABASE_ANON_KEY"
  );
};
