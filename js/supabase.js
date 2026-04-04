/*
 * supabase.js — robust client + compat layer pentru Calnic Online
 */
(function () {
  const SUPABASE_URL =
    (window.APP_CONFIG && window.APP_CONFIG.supabaseUrl) ||
    'YOUR_SUPABASE_URL';
  const SUPABASE_ANON_KEY =
    (window.APP_CONFIG && window.APP_CONFIG.supabaseAnonKey) ||
    'YOUR_SUPABASE_ANON_KEY';

  function finishReady() {
    document.dispatchEvent(new Event('supabase:ready'));
  }

  function exposeClient(client, lib) {
    if (!client) {
      finishReady();
      return;
    }

    // compat: unele pagini se bazeaza pe getUser() => { data: { session, user } }
    if (client.auth && typeof client.auth.getUser === 'function' && typeof client.auth.getSession === 'function') {
      const origGetUser = client.auth.getUser.bind(client.auth);
      const origGetSession = client.auth.getSession.bind(client.auth);
      client.auth.getUser = async function () {
        try {
          const [userRes, sessionRes] = await Promise.all([origGetUser(), origGetSession()]);
          return {
            data: {
              user: (userRes && userRes.data && userRes.data.user) || null,
              session: (sessionRes && sessionRes.data && sessionRes.data.session) || null
            },
            error: (userRes && userRes.error) || (sessionRes && sessionRes.error) || null
          };
        } catch (err) {
          return { data: { user: null, session: null }, error: err };
        }
      };
      client.auth.getSessionCompat = origGetSession;
    }

    // Pastram namespace-ul de la CDN, dar ii atasam metodele clientului.
    const compat = (window.supabase && typeof window.supabase === 'object') ? window.supabase : {};
    if (lib && typeof lib.createClient === 'function') {
      compat.createClient = lib.createClient.bind(lib);
    }

    ['from', 'rpc', 'channel', 'removeChannel', 'removeAllChannels', 'storage', 'functions', 'schema']
      .forEach(function (key) {
        if (client[key]) {
          compat[key] = typeof client[key] === 'function' ? client[key].bind(client) : client[key];
        }
      });
    compat.auth = client.auth;

    window.supabaseClient = client;
    window.appSupabase = client;
    window.sb = client;
    window.supabase = compat;
    try { globalThis.supabase = compat; } catch (e) {}

    console.log('[Supabase] Connected ✔');
    finishReady();
  }

  function initClient() {
    try {
      const lib = window.supabaseJs || window.supabase;
      if (!lib || typeof lib.createClient !== 'function') {
        console.error('[Supabase] Library unavailable');
        finishReady();
        return;
      }
      if (SUPABASE_URL === 'YOUR_SUPABASE_URL' || SUPABASE_ANON_KEY === 'YOUR_SUPABASE_ANON_KEY') {
        console.warn('[Supabase] Config placeholders detected');
      }
      const client = lib.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
      exposeClient(client, lib);
    } catch (err) {
      console.error('[Supabase] Init error:', err);
      finishReady();
    }
  }

  const hasLib = (window.supabaseJs && typeof window.supabaseJs.createClient === 'function') ||
                 (window.supabase && typeof window.supabase.createClient === 'function');
  if (hasLib) {
    initClient();
    return;
  }

  const script = document.createElement('script');
  script.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.min.js';
  script.onload = initClient;
  script.onerror = function () {
    console.error('[Supabase] CDN load failed');
    finishReady();
  };
  document.head.appendChild(script);
})();

window.isSupabaseConfigured = function () {
  return !!(window.APP_CONFIG && window.APP_CONFIG.supabaseUrl && window.APP_CONFIG.supabaseAnonKey &&
    window.APP_CONFIG.supabaseUrl !== 'YOUR_SUPABASE_URL' &&
    window.APP_CONFIG.supabaseAnonKey !== 'YOUR_SUPABASE_ANON_KEY');
};
