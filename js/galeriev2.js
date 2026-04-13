(function () {
  'use strict';

  var st = {
    tab: 'family', filter: 'all', q: '',
    user: null, isAdmin: false, ownFam: [], fam: [], photos: [],
    selFam: null, selAlbum: 'all', pinByFam: {}, pinPending: null,
    media: [], mediaIdx: 0, formCtx: null
  };

  var el = {};
  function $(id) { return document.getElementById(id); }
  function sb() { return window.supabaseClient || window.appSupabase || window.supabase; }
  function okSb() { var c = sb(); return !!(c && c.from && c.storage && (!window.isSupabaseConfigured || window.isSupabaseConfigured())); }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (m) { return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[m]; }); }
  function status(msg, bad) { if (!el.status) return; el.status.textContent = msg || ''; el.status.style.color = bad ? '#d39a9a' : '#b9a175'; }
  function famName(f) { return (f && (f.display_name || f.name)) || 'Familie'; }
  function famPrivate(f) { return !!(f && (f.is_private === true || f.visibility === 'private' || f.show_members === false || f.show_photos === false)); }
  function ownFam(familyId) { return st.ownFam.indexOf(String(familyId)) >= 0; }
  function canManageFam(id) { return st.isAdmin || ownFam(id); }
  function canManagePhoto(p) { return !!(st.user && p && p.uploader_id && String(p.uploader_id) === String(st.user.id)); }
  function canViewPhoto(p) { return !p.is_private || canManagePhoto(p) || (p.family_id && st.pinByFam[String(p.family_id)]); }
  function mediaType(p) { var c = String(p.category || '').toLowerCase(); if (c.indexOf('document') >= 0) return 'document'; if (c.indexOf('video') >= 0 || p.video_url) return 'video'; return 'photo'; }
  function imgUrl(path) { if (!path || !okSb()) return ''; try { var u = sb().storage.from('photos').getPublicUrl(path); return (u && u.data && u.data.publicUrl) || ''; } catch (e) { return ''; } }

  function parseVideo(p) { var c = String(p.caption_ro || p.caption_en || ''); var m = c.match(/\[VIDEO_EXTERN\]\s+(\S+)/); return m ? m[1] : ''; }
  function famPhotos(id) { return st.photos.filter(function (p) { return String(p.family_id || '') === String(id); }); }
  function visFamPhotos(id) { return famPhotos(id).filter(canViewPhoto); }
  function archPhotos() { return st.photos.filter(function (p) { return !p.family_id; }).filter(canViewPhoto); }

  function switchTab(tab) {
    st.tab = tab === 'archive' ? 'archive' : 'family';
    el.tabFamily.classList.toggle('active', st.tab === 'family');
    el.tabArchive.classList.toggle('active', st.tab === 'archive');
    el.familyPanel.classList.toggle('active', st.tab === 'family');
    el.archivePanel.classList.toggle('active', st.tab === 'archive');
  }

  function drawFamilyCards() {
    var q = st.q.trim().toLowerCase();
    var rows = st.fam.filter(function (f) { var n = (famName(f) + ' ' + (f.village || '')).toLowerCase(); return !q || n.indexOf(q) >= 0; });
    if (!rows.length) { el.familyGrid.innerHTML = '<div class="gal2-status">Nu exista familii pentru acest filtru.</div>'; return; }
    el.familyGrid.innerHTML = rows.map(function (f) {
      var all = famPhotos(f.id), pub = all.filter(function (p) { return !p.is_private; }).length;
      return '<article class="gal2-family-card" data-id="' + esc(f.id) + '"><div class="gal2-family-cover">' + esc(famName(f).charAt(0).toUpperCase()) +
        '</div><h3 class="gal2-family-name">' + esc(famName(f)) + '</h3><p class="gal2-family-desc">' + esc((f.description_short_ro || f.description_ro || f.description || 'Profil de familie Calnic.')) +
        '</p><div class="gal2-family-stats"><span class="gal2-chip">Total: ' + all.length + '</span><span class="gal2-chip">Publice: ' + pub + '</span><span class="gal2-chip">Private: ' + (all.length - pub) + '</span><span class="gal2-chip">' + (famPrivate(f) ? 'Privata (PIN)' : 'Publica') + '</span></div></article>';
    }).join('');
    Array.prototype.forEach.call(el.familyGrid.querySelectorAll('.gal2-family-card'), function (c) { c.addEventListener('click', function () { openFamily(c.getAttribute('data-id')); }); });
  }

  function drawMediaGrid(container, rows) {
    if (!rows.length) { container.innerHTML = '<div class="gal2-status">Nu exista materiale in aceasta selectie.</div>'; return; }
    container.innerHTML = rows.map(function (p) {
      var img = imgUrl(p.path) || 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="600" height="360"><rect width="600" height="360" fill="%23130f0b"/><text x="50%" y="50%" fill="%23c8a65d" dominant-baseline="middle" text-anchor="middle" font-size="22">Calnic Online</text></svg>';
      return '<article class="gal2-media-card" data-id="' + esc(p.id) + '"><div class="gal2-media-img-wrap"><img src="' + esc(img) + '" alt=""></div><div class="gal2-media-body"><h4 class="gal2-media-title">' + esc(p.title_ro || p.title_en || 'Material') + '</h4><div class="gal2-media-meta">' + esc(mediaType(p)) + ' • ' + esc(p.year || '-') + '</div></div></article>';
    }).join('');
    Array.prototype.forEach.call(container.querySelectorAll('.gal2-media-card'), function (c) { c.addEventListener('click', function () { openMedia(c.getAttribute('data-id'), rows); }); });
  }

  function drawFamilyDetail() {
    var f = st.fam.find(function (x) { return String(x.id) === String(st.selFam); });
    if (!f) { el.familyDetail.classList.add('hidden'); return; }
    el.familyDetail.classList.remove('hidden');
    el.detailName.textContent = famName(f);
    el.detailDesc.textContent = f.description_short_ro || f.description_ro || f.description || '';
    var can = canManageFam(f.id), all = famPhotos(f.id), vis = visFamPhotos(f.id);
    var canBulk = can && all.length > 0 && all.every(canManagePhoto);
    var pub = all.filter(function (p) { return !p.is_private; }).length;
    if (el.detailBadges) {
      el.detailBadges.innerHTML =
        '<span class="gal2-chip">Total: ' + all.length + '</span>' +
        '<span class="gal2-chip">Publice: ' + pub + '</span>' +
        '<span class="gal2-chip">Private: ' + (all.length - pub) + '</span>' +
        '<span class="gal2-chip">' + (famPrivate(f) ? 'Familie privata' : 'Familie publica') + '</span>';
    }
    if (famPrivate(f) && !can && !st.pinByFam[String(f.id)]) vis = [];
    el.addFamilyBtn.classList.toggle('hidden', !can);
    el.setAllPublicBtn.classList.toggle('hidden', !canBulk);
    el.setAllPrivateBtn.classList.toggle('hidden', !canBulk);

    var map = { all: { k: 'all', l: 'Toate', c: vis.length } };
    vis.forEach(function (p) { var k = String((p.category || 'fara-categorie')).toLowerCase(); if (!map[k]) map[k] = { k: k, l: p.category || 'Fara categorie', c: 0 }; map[k].c += 1; });
    if (!map[st.selAlbum]) st.selAlbum = 'all';
    el.albumBar.innerHTML = Object.keys(map).map(function (k) { var a = map[k]; return '<button class="gal2-album-btn ' + (st.selAlbum === a.k ? 'active' : '') + '" data-a="' + esc(a.k) + '">' + esc(a.l) + ' (' + a.c + ')</button>'; }).join('');
    Array.prototype.forEach.call(el.albumBar.querySelectorAll('.gal2-album-btn'), function (b) { b.addEventListener('click', function () { st.selAlbum = b.getAttribute('data-a') || 'all'; drawFamilyDetail(); }); });
    drawMediaGrid(el.familyMediaGrid, st.selAlbum === 'all' ? vis : vis.filter(function (p) { return String((p.category || 'fara-categorie')).toLowerCase() === st.selAlbum; }));
  }

  function drawArchive() {
    var rows = archPhotos();
    if (st.filter === 'gallery') rows = rows.filter(function (p) { var t = mediaType(p); return t === 'photo' || t === 'video'; });
    if (st.filter === 'documents') rows = rows.filter(function (p) { return mediaType(p) === 'document'; });
    drawMediaGrid(el.archiveGrid, rows);
    Array.prototype.forEach.call(el.archiveFilters.querySelectorAll('[data-archive-filter]'), function (b) { b.classList.toggle('active', b.getAttribute('data-archive-filter') === st.filter); });
  }

  function openMedia(id, src) {
    st.media = src.slice();
    st.mediaIdx = st.media.findIndex(function (p) { return String(p.id) === String(id); });
    if (st.mediaIdx < 0) return;
    drawMediaModal();
    el.mediaOverlay.classList.add('open');
    document.body.style.overflow = 'hidden';
  }

  function drawMediaModal() {
    var p = st.media[st.mediaIdx]; if (!p) return;
    var type = mediaType(p), f = p.family_id ? st.fam.find(function (x) { return String(x.id) === String(p.family_id); }) : null;
    el.mediaImage.src = imgUrl(p.path) || '';
    el.mediaTitle.textContent = p.title_ro || p.title_en || 'Material';
    el.mediaDesc.textContent = p.caption_ro || p.caption_en || p.dedicatie_ro || p.dedicatie_en || '';
    el.mediaBadges.innerHTML = '<span class="gal2-chip">' + esc(type) + '</span><span class="gal2-chip">' + (p.is_private ? 'Privat' : 'Public') + '</span>';
    el.mediaMeta.innerHTML = '<div class="gal2-meta-item"><span class="gal2-meta-label">An</span><span class="gal2-meta-value">' + esc(p.year || '-') + '</span></div><div class="gal2-meta-item"><span class="gal2-meta-label">Categorie</span><span class="gal2-meta-value">' + esc(p.category || '-') + '</span></div><div class="gal2-meta-item"><span class="gal2-meta-label">Familie</span><span class="gal2-meta-value">' + esc(f ? famName(f) : '-') + '</span></div>';
    if (type === 'video' && p.video_url) { el.mediaVideoLink.href = p.video_url; el.mediaVideoLink.classList.remove('hidden'); } else { el.mediaVideoLink.classList.add('hidden'); }
    el.mediaEditVisibility.classList.toggle('hidden', !canManagePhoto(p));
    el.mediaEditVisibility.textContent = p.is_private ? 'Fa publica' : 'Fa privata';
  }

  function closeMedia() { el.mediaOverlay.classList.remove('open'); document.body.style.overflow = ''; }
  function nextMedia() { if (!st.media.length) return; st.mediaIdx = (st.mediaIdx + 1) % st.media.length; drawMediaModal(); }
  function prevMedia() { if (!st.media.length) return; st.mediaIdx = (st.mediaIdx - 1 + st.media.length) % st.media.length; drawMediaModal(); }

  async function toggleMediaVis() {
    var p = st.media[st.mediaIdx]; if (!p || !okSb() || !canManagePhoto(p)) return;
    status('Actualizez vizibilitatea...'); var v = !p.is_private;
    var r = await sb().from('photos').update({ is_private: v }).eq('id', p.id); if (r.error) { status('Eroare: ' + r.error.message, true); return; }
    p.is_private = v; st.photos = st.photos.map(function (x) { if (x.id === p.id) x.is_private = v; return x; });
    drawMediaModal(); drawFamilyCards(); drawFamilyDetail(); drawArchive(); status('Vizibilitatea a fost actualizata.');
  }

  function openForm(ctx) { st.formCtx = ctx; el.formOverlay.classList.add('open'); document.body.style.overflow = 'hidden'; el.formTitle.textContent = ctx.scope === 'family' ? 'Adauga media in familia curenta' : 'Adauga media in Arhiva satului'; el.formMsg.textContent = ''; el.formType.value = 'photo'; formTypeUi(); }
  function closeForm() { el.formOverlay.classList.remove('open'); document.body.style.overflow = ''; }
  function formTypeUi() { el.formUrlWrap.classList.toggle('hidden', el.formType.value !== 'video'); }
  function yr(v) { var n = parseInt(String(v || '').trim(), 10); var y = new Date().getFullYear(); return (n >= 1000 && n <= y) ? n : null; }
  function toBlob(file) { return new Promise(function (res, rej) { var r = new FileReader(); r.onerror = rej; r.onload = function (e) { var i = new Image(); i.onerror = rej; i.onload = function () { var c = document.createElement('canvas'); var w = i.width, h = i.height, m = 1500; if (w > m || h > m) { if (w >= h) { h = Math.round(h * m / w); w = m; } else { w = Math.round(w * m / h); h = m; } } c.width = w; c.height = h; c.getContext('2d').drawImage(i, 0, 0, w, h); c.toBlob(function (b) { if (!b) rej(new Error('Compresie esuata')); else res(b); }, 'image/jpeg', 0.84); }; i.src = e.target.result; }; r.readAsDataURL(file); }); }

  async function saveForm() {
    if (!okSb()) { el.formMsg.textContent = 'Supabase nu este configurat.'; return; }
    if (!st.user) { el.formMsg.textContent = 'Trebuie sa fii autentificat.'; return; }
    var t = String(el.formTitleInput.value || '').trim(), f = el.formFile.files && el.formFile.files[0], type = el.formType.value, url = String(el.formUrlInput.value || '').trim();
    if (!t) { el.formMsg.textContent = 'Titlul este obligatoriu.'; return; }
    if (!f) { el.formMsg.textContent = 'Imaginea este obligatorie.'; return; }
    if (type === 'video' && !url) { el.formMsg.textContent = 'Pentru video extern trebuie link.'; return; }
    if (st.formCtx.scope === 'archive' && !st.isAdmin) { el.formMsg.textContent = 'Doar admin poate adauga in arhiva.'; return; }
    if (st.formCtx.scope === 'family' && !canManageFam(st.formCtx.familyId)) { el.formMsg.textContent = 'Nu ai drepturi pentru aceasta familie.'; return; }
    el.formSave.disabled = true; el.formMsg.textContent = 'Se incarca...';
    try {
      var b = await toBlob(f), pref = st.formCtx.scope === 'archive' ? 'archive' : String(st.formCtx.familyId), path = String(st.user.id) + '/' + pref + '/' + Date.now() + '.jpg';
      var up = await sb().storage.from('photos').upload(path, b, { contentType: 'image/jpeg', upsert: false }); if (up.error) throw up.error;
      var cap = String(el.formDescInput.value || '').trim(); if (type === 'video') cap = '[VIDEO_EXTERN] ' + url + '\\n' + cap;
      var ins = await sb().from('photos').insert({ family_id: st.formCtx.scope === 'family' ? st.formCtx.familyId : null, uploader_id: st.user.id, path: path, title_ro: t, title_en: t, caption_ro: cap, caption_en: cap, dedicatie_ro: '', dedicatie_en: '', year: yr(el.formYearInput.value), category: String(el.formCategoryInput.value || '').trim() || (type === 'document' ? 'Documente' : (type === 'video' ? 'Video extern' : 'Galerie')), is_private: el.formVisibility.value === 'private' });
      if (ins.error) throw ins.error;
      await loadPhotos(); drawFamilyCards(); drawFamilyDetail(); drawArchive(); closeForm(); status('Material adaugat cu succes.');
    } catch (e) { el.formMsg.textContent = 'Nu am putut salva: ' + ((e && e.message) || 'eroare'); } finally { el.formSave.disabled = false; }
  }

  async function setAllVis(v) {
    var f = st.fam.find(function (x) { return String(x.id) === String(st.selFam); }); if (!f || !okSb() || !canManageFam(f.id)) return;
    var ids = famPhotos(f.id).filter(canManagePhoto).map(function (p) { return p.id; }); if (!ids.length) { status('Nu ai drepturi de modificare pentru materialele acestei familii.', true); return; }
    var r = await sb().from('photos').update({ is_private: !!v }).in('id', ids); if (r.error) { status('Eroare: ' + r.error.message, true); return; }
    await loadPhotos(); drawFamilyCards(); drawFamilyDetail(); drawArchive(); status(v ? 'Toate materialele au fost trecute pe privat.' : 'Toate materialele au fost trecute pe public.');
  }

  function openPin(famId) { st.pinPending = famId; el.pinInput.value = ''; el.pinMsg.textContent = ''; el.pinOverlay.classList.add('open'); document.body.style.overflow = 'hidden'; setTimeout(function () { el.pinInput.focus(); }, 20); }
  function closePin() { st.pinPending = null; el.pinOverlay.classList.remove('open'); document.body.style.overflow = ''; }
  async function submitPin() {
    if (!okSb()) { el.pinMsg.textContent = 'PIN indisponibil.'; return; }
    var id = st.pinPending, pin = String(el.pinInput.value || '').trim(); if (!id || !pin) { el.pinMsg.textContent = 'Introdu PIN-ul.'; return; }
    el.pinMsg.textContent = 'Verific PIN...';
    try {
      var r = await sb().rpc('check_family_pin', { p_family_id: id, p_pin: pin }); if (r.error) throw r.error;
      if (!r.data) { el.pinMsg.textContent = 'PIN invalid.'; return; }
      st.pinByFam[String(id)] = true; closePin(); openFamily(id); status('Acces privat acordat pentru aceasta familie.');
    } catch (e) { el.pinMsg.textContent = 'PIN invalid sau functie SQL lipsa.'; }
  }

  function openFamily(id) {
    var f = st.fam.find(function (x) { return String(x.id) === String(id); }); if (!f) { status('Familia selectata nu exista.', true); return; }
    if (famPrivate(f) && !canManageFam(f.id) && !st.pinByFam[String(f.id)]) { openPin(f.id); return; }
    st.selFam = String(f.id); st.selAlbum = 'all'; drawFamilyDetail(); status('');
  }
  function closeFamily() { st.selFam = null; st.selAlbum = 'all'; el.familyDetail.classList.add('hidden'); }

  async function loadAuth() {
    st.user = null; st.isAdmin = false; st.ownFam = [];
    if (!okSb()) return;
    try { var ur = await sb().auth.getUser(); st.user = ur && ur.data && ur.data.user ? ur.data.user : null; } catch (e) {}
    if (!st.user) return;
    try { var ar = await sb().from('profiles').select('is_admin').eq('id', st.user.id).maybeSingle(); st.isAdmin = !!(ar && !ar.error && ar.data && ar.data.is_admin); } catch (e) {}
    try { var fr = await sb().from('families').select('id').or('created_by.eq.' + st.user.id + ',owner_id.eq.' + st.user.id); if (!fr.error && Array.isArray(fr.data)) st.ownFam = fr.data.map(function (x) { return String(x.id); }); } catch (e) {}
  }

  async function loadFamilies() { if (!okSb()) { st.fam = []; return; } var r = await sb().from('families').select('*').order('name'); if (r.error) throw r.error; st.fam = r.data || []; }
  async function loadPhotos() { if (!okSb()) { st.photos = []; return; } var r = await sb().from('photos').select('*').order('uploaded_at', { ascending: false }); if (r.error) throw r.error; st.photos = (r.data || []).map(function (p) { p.video_url = parseVideo(p); return p; }); }

  function bind() {
    el.tabFamily.addEventListener('click', function () { switchTab('family'); });
    el.tabArchive.addEventListener('click', function () { switchTab('archive'); });
    el.familySearch.addEventListener('input', function () { st.q = el.familySearch.value || ''; drawFamilyCards(); });
    el.backFamilies.addEventListener('click', closeFamily);
    el.archiveFilters.addEventListener('click', function (e) { var b = e.target.closest('[data-archive-filter]'); if (!b) return; st.filter = b.getAttribute('data-archive-filter') || 'all'; drawArchive(); });
    el.mediaClose.addEventListener('click', closeMedia); el.mediaOverlay.addEventListener('click', function (e) { if (e.target === el.mediaOverlay) closeMedia(); }); el.mediaNext.addEventListener('click', nextMedia); el.mediaPrev.addEventListener('click', prevMedia); el.mediaEditVisibility.addEventListener('click', toggleMediaVis);
    el.mediaDownload.addEventListener('click', function () { var p = st.media[st.mediaIdx]; if (!p) return; var u = imgUrl(p.path); if (!u) return; var a = document.createElement('a'); a.href = u; a.target = '_blank'; a.rel = 'noopener'; a.download = (p.title_ro || p.title_en || 'material') + '.jpg'; document.body.appendChild(a); a.click(); a.remove(); });
    el.formClose.addEventListener('click', closeForm); el.formCancel.addEventListener('click', closeForm); el.formOverlay.addEventListener('click', function (e) { if (e.target === el.formOverlay) closeForm(); }); el.formType.addEventListener('change', formTypeUi); el.formSave.addEventListener('click', saveForm);
    el.addArchiveBtn.addEventListener('click', function () { openForm({ scope: 'archive' }); }); el.addFamilyBtn.addEventListener('click', function () { if (st.selFam) openForm({ scope: 'family', familyId: st.selFam }); }); el.setAllPublicBtn.addEventListener('click', function () { setAllVis(false); }); el.setAllPrivateBtn.addEventListener('click', function () { setAllVis(true); });
    el.pinSubmit.addEventListener('click', submitPin); el.pinCancel.addEventListener('click', closePin); el.pinOverlay.addEventListener('click', function (e) { if (e.target === el.pinOverlay) closePin(); }); el.pinInput.addEventListener('keydown', function (e) { if (e.key === 'Enter') submitPin(); }); el.pinToggle.addEventListener('click', function () { el.pinInput.type = el.pinInput.type === 'password' ? 'text' : 'password'; });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') { if (el.mediaOverlay.classList.contains('open')) closeMedia(); if (el.formOverlay.classList.contains('open')) closeForm(); if (el.pinOverlay.classList.contains('open')) closePin(); } if (el.mediaOverlay.classList.contains('open')) { if (e.key === 'ArrowRight') nextMedia(); if (e.key === 'ArrowLeft') prevMedia(); } });
  }

  function cache() {
    el.tabFamily = $('gal2-tab-family'); el.tabArchive = $('gal2-tab-archive'); el.familyPanel = $('gal2-family-panel'); el.archivePanel = $('gal2-archive-panel');
    el.status = $('gal2-status'); el.familySearch = $('gal2-family-search'); el.familyGrid = $('gal2-family-grid'); el.familyDetail = $('gal2-family-detail'); el.backFamilies = $('gal2-back-families'); el.detailName = $('gal2-detail-name'); el.detailDesc = $('gal2-detail-desc'); el.detailBadges = $('gal2-detail-badges'); el.albumBar = $('gal2-album-bar'); el.familyMediaGrid = $('gal2-family-media-grid'); el.archiveFilters = $('gal2-archive-filters'); el.archiveGrid = $('gal2-archive-grid');
    el.addArchiveBtn = $('gal2-add-archive-btn'); el.addFamilyBtn = $('gal2-add-family-btn'); el.setAllPublicBtn = $('gal2-set-all-public'); el.setAllPrivateBtn = $('gal2-set-all-private');
    el.mediaOverlay = $('gal2-media-overlay'); el.mediaClose = $('gal2-media-close'); el.mediaPrev = $('gal2-media-prev'); el.mediaNext = $('gal2-media-next'); el.mediaImage = $('gal2-media-image'); el.mediaTitle = $('gal2-media-title'); el.mediaBadges = $('gal2-media-badges'); el.mediaDesc = $('gal2-media-desc'); el.mediaMeta = $('gal2-media-meta'); el.mediaVideoLink = $('gal2-media-video-link'); el.mediaDownload = $('gal2-media-download'); el.mediaEditVisibility = $('gal2-media-edit-visibility');
    el.formOverlay = $('gal2-form-overlay'); el.formClose = $('gal2-form-close'); el.formCancel = $('gal2-form-cancel'); el.formSave = $('gal2-form-save'); el.formTitle = $('gal2-form-title'); el.formMsg = $('gal2-form-msg'); el.formType = $('gal2-form-type'); el.formTitleInput = $('gal2-form-title-input'); el.formYearInput = $('gal2-form-year-input'); el.formUrlWrap = $('gal2-form-url-wrap'); el.formUrlInput = $('gal2-form-url-input'); el.formCategoryInput = $('gal2-form-category-input'); el.formFile = $('gal2-form-file-input'); el.formDescInput = $('gal2-form-desc-input'); el.formVisibility = $('gal2-form-visibility');
    el.pinOverlay = $('gal2-pin-overlay'); el.pinInput = $('gal2-pin-input'); el.pinToggle = $('gal2-pin-toggle'); el.pinSubmit = $('gal2-pin-submit'); el.pinCancel = $('gal2-pin-cancel'); el.pinMsg = $('gal2-pin-msg');
  }

  async function boot() {
    cache(); bind(); $('yr').textContent = String(new Date().getFullYear()); switchTab('family');
    if (!okSb()) { status('Supabase nu este configurat. Pagina ruleaza in mod UI.'); return; }
    status('Incarc datele...');
    try { await loadAuth(); await loadFamilies(); await loadPhotos(); drawFamilyCards(); drawFamilyDetail(); drawArchive(); el.addArchiveBtn.classList.toggle('hidden', !st.isAdmin); status(''); }
    catch (e) { status('Nu am putut incarca datele: ' + ((e && e.message) || 'eroare necunoscuta'), true); }

    try {
      var qp = new URLSearchParams(window.location.search || '');
      var qFamily = qp.get('family');
      if (qFamily) {
        openFamily(qFamily);
        switchTab('family');
      }
    } catch (err) {}
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
