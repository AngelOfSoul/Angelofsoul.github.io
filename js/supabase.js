/*
 * supabase.js — Shared Supabase client for Calnic Online
 *
 * Credentialele sunt citite din js/config.js (generat din .env).
 * Rulati: node scripts/generate-config.js
 *
 * PLUS: strat de compatibilitate pentru schema families noua/veche.
 */

const SUPABASE_URL      = (window.APP_CONFIG && window.APP_CONFIG.supabaseUrl)      || 'YOUR_SUPABASE_URL';
const SUPABASE_ANON_KEY = (window.APP_CONFIG && window.APP_CONFIG.supabaseAnonKey)  || 'YOUR_SUPABASE_ANON_KEY';

(function () {
  function slugify(text) {
    return String(text || '')
      .toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') || null;
  }

  function normalizeFamilyRecord(row) {
    if (!row || typeof row !== 'object') return row;

    var name = row.name || row.display_name || '';
    var village = row.village || row.village_name || 'Calnic';
    var notes = row.notes || row.summary || row.desc_ro || row.desc_en || '';
    var visibility = row.visibility || (row.is_public === false ? 'private' : 'public');
    var isPublic = typeof row.is_public === 'boolean' ? row.is_public : visibility === 'public';

    var out = Object.assign({}, row, {
      name: name,
      display_name: row.display_name || name,
      village: village,
      village_name: row.village_name || village,
      visibility: visibility,
      is_public: isPublic,
      slug: row.slug || slugify(name),
      since: row.since || '',
      notes: row.notes || notes,
      summary: row.summary || notes,
      desc_ro: row.desc_ro || notes,
      desc_en: row.desc_en || row.desc_ro || notes,
      origin: row.origin || '',
      crest: row.crest || '',
      motto_ro: row.motto_ro || '',
      motto_en: row.motto_en || '',
      occupation_ro: row.occupation_ro || '',
      occupation_en: row.occupation_en || '',
      image_url: row.image_url || '',
      cover_url: row.cover_url || '',
      emblem_url: row.emblem_url || '',
      members_count: Number(row.members_count || 0),
      generations_count: Number(row.generations_count || 0),
      photos_count: Number(row.photos_count || 0),
      relations_count: Number(row.relations_count || 0),
      branch_count: Number(row.branch_count || 0),
      documents_count: Number(row.documents_count || 0),
      stories_count: Number(row.stories_count || 0),
      show_members: row.show_members !== false,
      show_generations: row.show_generations !== false,
      show_photos: row.show_photos !== false,
      show_since: row.show_since !== false,
      has_public_photos: row.has_public_photos === true ? true : Number(row.photos_count || 0) > 0,
      has_private_photos: row.has_private_photos === true,
      connected_to_village: !!row.connected_to_village,
      village_branch: row.village_branch || '',
      featured: !!row.featured,
      sort_order: Number(row.sort_order || 0),
      showMembers: row.show_members !== false,
      showGenerations: row.show_generations !== false,
      showPhotos: row.show_photos !== false,
      showSince: row.show_since !== false
    });

    return out;
  }

  function mapFamiliesResponse(res) {
    if (!res || res.error || res.data == null) return res;
    if (Array.isArray(res.data)) {
      res.data = res.data.map(normalizeFamilyRecord);
    } else {
      res.data = normalizeFamilyRecord(res.data);
    }
    return res;
  }

  function translateFamilyField(field, op, value) {
    if (field === 'name') return 'display_name';
    if (field === 'village') return 'village_name';
    if (field === 'is_public') return 'visibility';
    return field;
  }

  function translateFilterValue(field, value) {
    if (field === 'is_public') return value ? 'public' : 'private';
    return value;
  }

  function translateFamilyWrite(values) {
    if (Array.isArray(values)) return values.map(translateFamilyWrite);
    if (!values || typeof values !== 'object') return values;

    var out = Object.assign({}, values);

    if (out.name != null && out.display_name == null) out.display_name = out.name;
    if (out.village != null && out.village_name == null) out.village_name = out.village;
    if (out.is_public != null && out.visibility == null) out.visibility = out.is_public ? 'public' : 'private';

    // campuri legacy pe care schema noua nu le garanteaza; le ignoram la scriere
    [
      'name','village','is_public',
      'show_members','show_generations','show_photos','show_since',
      'has_public_photos','has_private_photos',
      'summary','origin','crest','motto_ro','motto_en',
      'occupation_ro','occupation_en','image_url','cover_url','emblem_url',
      'relations_count','branch_count','documents_count','stories_count',
      'featured','sort_order','village_branch','locality'
    ].forEach(function (k) { delete out[k]; });

    return out;
  }

  function wrapFamiliesBuilder(builder) {
    return new Proxy(builder, {
      get: function (target, prop, receiver) {
        if (prop === 'select') {
          return function (_columns, options) {
            var safeColumns = (options && options.head) ? 'id' : '*';
            return wrapFamiliesBuilder(target.select(safeColumns, options));
          };
        }

        if (prop === 'insert' || prop === 'upsert' || prop === 'update') {
          return function (values) {
            var translated = translateFamilyWrite(values);
            var next = target[prop](translated);
            return wrapFamiliesBuilder(next);
          };
        }

        if (prop === 'order') {
          return function (field, options) {
            return wrapFamiliesBuilder(target.order(translateFamilyField(field), options));
          };
        }

        if (prop === 'eq' || prop === 'neq' || prop === 'gt' || prop === 'gte' || prop === 'lt' || prop === 'lte' || prop === 'like' || prop === 'ilike') {
          return function (field, value) {
            var origField = field;
            var mappedField = translateFamilyField(field);
            var mappedValue = translateFilterValue(origField, value);
            return wrapFamiliesBuilder(target[prop](mappedField, mappedValue));
          };
        }

        if (prop === 'is') {
          return function (field, value) {
            if (field === 'is_public') return wrapFamiliesBuilder(target.eq('visibility', value ? 'public' : 'private'));
            return wrapFamiliesBuilder(target.is(translateFamilyField(field), value));
          };
        }

        if (prop === 'not') {
          return function (field, operator, value) {
            return wrapFamiliesBuilder(target.not(translateFamilyField(field), operator, translateFilterValue(field, value)));
          };
        }

        if (prop === 'single' || prop === 'maybeSingle' || prop === 'limit' || prop === 'range' || prop === 'match') {
          return function () {
            var next = target[prop].apply(target, arguments);
            return wrapFamiliesBuilder(next);
          };
        }

        if (prop === 'then') {
          return function (onFulfilled, onRejected) {
            return target.then(function (res) {
              return onFulfilled ? onFulfilled(mapFamiliesResponse(res)) : mapFamiliesResponse(res);
            }, onRejected);
          };
        }

        if (prop === 'catch') {
          return function (onRejected) { return target.catch(onRejected); };
        }

        if (prop === 'finally') {
          return function (onFinally) { return target.finally(onFinally); };
        }

        var value = Reflect.get(target, prop, receiver);
        if (typeof value === 'function') {
          return function () {
            var result = value.apply(target, arguments);
            if (result && typeof result === 'object') return wrapFamiliesBuilder(result);
            return result;
          };
        }
        return value;
      }
    });
  }

  function createCompatClient(raw) {
    if (!raw || typeof raw.from !== 'function') return raw;
    return {
      from: function (table) {
        var builder = raw.from(table);
        return table === 'families' ? wrapFamiliesBuilder(builder) : builder;
      },
      auth: raw.auth,
      storage: raw.storage,
      rpc: raw.rpc.bind(raw),
      channel: raw.channel.bind(raw),
      removeChannel: raw.removeChannel ? raw.removeChannel.bind(raw) : undefined,
      removeAllChannels: raw.removeAllChannels ? raw.removeAllChannels.bind(raw) : undefined,
      rest: raw.rest,
      realtime: raw.realtime
    };
  }

  var script = document.createElement('script');
  script.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.min.js';
  script.onload = function () {
    try {
      var lib = window.supabase || window.supabaseJs;
      var raw = lib.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
      window.rawSupabase = raw;
      window.supabase = createCompatClient(raw);
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
