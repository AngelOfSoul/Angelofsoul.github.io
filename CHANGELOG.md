# Changelog

Istoric generat din Git, de la inceputul proiectului pana in prezent.

## Cronologie

### 2026-04-07 (Game / Kelling)
- Adaugat pagina de joc `game.html` cu layout complet, overlay-uri de setup/final/leaderboard/help.
- Implementat motor gameplay pe harta hex: setup, zaruri, distributie resurse, hoț, constructii, tura AI.
- Implementat sistem de drumuri real pe muchii + calcul `Longest Road` pe graf.
- Adaugat porturi 2:1 / 3:1 si schimb din panoul din dreapta.
- Implementat sistem de carti (Abundenta, Mason, Caravana, Brickburst) cu efecte active.
- Adaugata mecanica `Alchimie` (2 Caramida -> 1 resursa), pentru player si AI.
- Adaugat balans pe 3 dificultati AI (`easy` / `normal` / `hard`) inclusiv preset economic la start.
- Adaugat autosave, continue, export/import save JSON, si preferinte persistente (nume, VP, dificultate, sunet).
- Adaugat quality-of-life: hotkeys, anuleaza actiune (`Esc` + buton), `Undo` in tura (`U` + buton), log de tura.
- Adaugat status vizual pentru efecte active, badge dificultate AI, tooltip pe hex-uri, log detaliat distributie resurse.

### 2026-04-08 (Game / Kelling)
- Stabilizat runtime pentru rulare locala `file://` (fara erori JS la load).
- Adaugat validare extinsa la `loadSaveToState()` pentru compatibilitate cu save-uri mai vechi.
- Adaugat `Export Save` / `Import Save` JSON in ecranul de start.
- Adaugat persistenta preferinte joc (`nume`, `VP`, `dificultate AI`, `sunet`) intre sesiuni.
- Adaugat `Reset Complet` (save + preferinte + clasament).
- Reparat reguli de plasare a asezarilor (distanta minima fata de orice asezare/oras, inclusiv pentru AI).
- Adaugat `Undo` in tura (buton + hotkey `U`), plus fallback sigur la autosave.
- Adaugat smoke test automat `npm run test:game` pentru fluxul principal al jocului.
- Upgrade `Undo` la multi-step (stack) cu indicator vizual al pasilor disponibili.
- Fix gameplay critic: construire asezare functionala in faza principala (nu mai blocheaza progresia).
- Extins smoke test-ul `test:game` ca sa valideze si actiunea de construire asezare.
- Extins smoke test-ul `test:game` pentru validare `Undo` pe stare reala (VP restore).
- Hardening import save: rollback automat la save anterior daca fisierul importat este invalid.
- Fix autosave badge: afisaj corect dupa load/refresh + persistenta starii in UI.
- Hardening UX: anulare actiune (`Esc`/buton) salveaza imediat starea curenta.
- Stabilizat smoke test-ul de `Undo` cu scenariu determinist (build + card + undo stack).
- Adaugat test automat `npm run test:game-save` pentru import valid si rollback la import invalid.
- Hardening tură: blocare `double-roll` / spam click pe zaruri prin `diceRolling` guard.
- UX build actions: butoanele Asezare/Drum verifica acum si existenta unei mutari legale pe harta.
- Smoke test actualizat pentru validare anti-spam la `Roll` (triple-click controlat).
- Adaugat test automat `npm run test:game-prefs` pentru preferinte persistente + `Reset Complet`.
- Adaugat `npm run test:game:all` (runner unificat pentru toate testele de joc).
- Fix critic `Joc nou`: reset complet de state/board la pornirea unei partide noi dupa un save existent.
- Adaugat test automat `npm run test:game-new` pentru fluxul `Joc nou` peste save existent.
- UX polish `Oraș (upgrade)`: buton activ doar cand este selectata o asezare proprie valida pentru upgrade.
- Extins `test:game` cu verificari explicite pentru starea butonului `Undo` (disabled initial, enabled dupa actiuni, disabled cand stack-ul devine gol).
- Adaugat test automat `npm run test:game-ai` pentru validarea tuturor dificultatilor AI (`easy`, `normal`, `hard`) si includerea lui in `test:game:all`.
- Adaugat suport `testDiceTotals` in `game.html` (query param pentru teste deterministe de zaruri, fara impact pe joc normal).
- Adaugat test automat `npm run test:game-robber` pentru fluxul complet de `7` (faza hoț, mutare, revenire la actiuni) si integrare in `test:game:all`.
- UX hardening: hotkeys sunt acum blocate cand overlay-urile sunt deschise; `Esc` inchide contextual `Reguli`/`Clasament`.
- UX safety: `Reset Complet` cere confirmare explicita inainte de stergerea datelor locale.
- Input polish: nickname-ul este curatat/sanitizat consistent (spatii compacte + fallback `Jucător`).
- UI polish: focus vizibil pentru navigare tastatura + suport `prefers-reduced-motion` in `game.css`.
- Stabilizat testele automate: `test:game` nu mai confunda logul de discard la `7` cu un al doilea roll al jucatorului.
- Hardening tura AI: introdus guard explicit `aiThinking` pentru a preveni reentrant/race conditions.
- Adaugat test automat `npm run test:game-ai-lock` pentru validarea anti-duplicate AI turn la spam de input.
- Hardening restore: save-urile prinse in timpul turei AI sunt auto-normalizate la tură validă de player la `Continue`.
- Adaugat test automat `npm run test:game-load-normalize` pentru validarea recovery dupa load din snapshot AI incomplet.
- Release packaging: adaugat `GAME_RELEASE_CHECKLIST.md`, comanda `npm run test:game:release` si update `RELEASE_NOTES.md` pentru `v1.3.0`.
- Adaugat test automat `npm run test:game-long` pentru stabilitate pe sesiune extinsa (mai multe ture consecutive in acelasi meci).
- Hardening AI: adaugat watchdog timeout + recovery automat daca tura AI se blocheaza.
- Adaugat test automat `npm run test:game-ai-watchdog` pentru validarea mecanismului de auto-recovery AI.
- UX gameplay: adaugata actiune `Capitulează` (buton + hotkey `Q`) pentru incheiere controlata a partidei.
- Adaugat test automat `npm run test:game-surrender` pentru fluxul complet de capitulare (confirmare, end state, clear save).
- Adaugat test automat `npm run test:game-surrender-lb` pentru validarea scorului de clasament dupa capitulare (`defeat`, `0` puncte).
- Adaugat test automat `npm run test:game-overlay-hotkeys` pentru validarea blocarii hotkeys in overlay-uri si inchidere `Esc`.
- Hardening end-state: `endGame` este acum idempotent (previne inregistrari duplicate la click repetat).
- Adaugat test automat `npm run test:game-endgame-idempotent` pentru validarea anti-duplicate in leaderboard.
- Adaugat test automat `npm run test:game-data-integrity` pentru validarea consistentei save-ului dupa sesiuni extinse.
- CI automation: adaugat workflow GitHub Actions `.github/workflows/game-tests.yml` pentru rulare automata `test:game:release` pe push/PR.
- UI consistency: actualizat overlay-ul de reguli cu hotkey-ul `Q` (capitulare) si clarificare `Esc` pentru overlay-uri.
- Hardening persistenta: autosave declansat si pe `visibilitychange/pagehide` pentru protectie suplimentara la inchidere/minimizare tab.
- Adaugat test automat `npm run test:game-lifecycle-autosave` pentru validarea autosave pe lifecycle si excluderea setup phase.
- Adaugat test automat `npm run test:game-surrender-hotkey` pentru validarea capitularii prin hotkey `Q`.
- Graphics polish pass: imbunatatit vizual topbar/panouri/butoane/modal-uri (profunzime, glow, animatie usoara de intrare).
- Graphics polish pass 2: bar vizual pentru board controls, butoane header imbunatatite, scrollbar theming si comportament mai bun pe mobil.

### 2026-03-22
- Delete translation_test.html (`9ee53fc`)

### 2026-03-23
- Delete contact.html (`c33d2c9`)
- Delete familii.html (`02810c3`)
- Phase 2: Add Supabase backend, family auth & PIN system (`c170822`)
- Address code review: add null checks, security notes, export isSupabaseConfigured (`762f4ef`)
- Add README.md with current status and next steps guide (`c205c76`)
- Merge pull request #2 from AngelOfSoul/copilot/add-supabase-authentication-system (`d238c6b`)
- Update Supabase URL and anon key (`b3a0198`)
- Create CALNIC_PROJECT_BRIEFING_V7.txt (`94e4db7`)
- Updated CALNIC_PROJECT_BRIEFING_V7.txt with current content. (`5515f08`)
- Restructure login/register into 2-step flow with family profile (`f8a2e19`)
- Address code review: extract showStep2Panel, use maybeSingle, validate pendingUserId, clear on success (`9c3d76d`)
- Add dashboard.html — private family dashboard for Calnic Online (`c8ac243`)
- Changes before error encountered (`57ce035`)
- Delete CALNIC_PROJECT_BRIEFING_V6.txt (`43796e7`)
- Delete README.md (`3722d01`)
- Add language persistence (localStorage) to all modified pages (`fdc06d2`)
- Add CALNIC_PROJECT_BRIEFING_V8.txt with full project status (`8b2360c`)
- Merge pull request #3 from AngelOfSoul/copilot/implement-high-priority-phase-2-items (`7992d98`)
- Delete CALNIC_PROJECT_BRIEFING_V7.txt (`8773481`)
- Wire Supabase + fix language persistence on genealogie, galerie, harta pages (`ea101eb`)
- Fix language persistence on galerie, harta, istorie, genealogie pages (`a3f8e3e`)
- Fix istorie.html language persistence + create CALNIC_PROJECT_BRIEFING_V9 (`809d3ba`)
- Wire galerie.html to Supabase Storage + create setup-photos-storage.sql + V10 briefing (`2a428fe`)
- Merge pull request #6 from AngelOfSoul/copilot/import-repository-and-assess-next-steps (`5ae3f5e`)
- Delete CALNIC_PROJECT_BRIEFING_V9.txt (`923b3ff`)
- Delete CALNIC_PROJECT_BRIEFING_V8.txt (`9a32918`)
- Apply language persistence and Supabase wiring to all 11 pages (`45bd59c`)
- Merge main into PR #5: resolve conflicts by accepting main's Supabase + language-persistence changes (`c601ce6`)

### 2026-03-24
- Merge pull request #8 from AngelOfSoul/copilot/status-check-placeholder (`000653e`)
- Merge pull request #7 from AngelOfSoul/copilot/apply-language-persistence-pattern (`a02d1ad`)
- Merge pull request #5 from AngelOfSoul/copilot/improve-user-experience (`2db9b5a`)
- Full to-do list compiled for going live (`873aaff`)
- Add og-image SEO meta tags, My Photos dashboard section, and V11 briefing (`9eaea6b`)
- Merge pull request #10 from AngelOfSoul/copilot/report-html-pages-and-codebase (`040b190`)
- Remove CNAME entry for calniconline.ro (`ef75474`)
- Update CNAME (`5f20e46`)
- fix(genealogie-familie): render real members from Supabase, fix title selector, add XSS escaping (`fceb927`)
- Merge pull request #20 from AngelOfSoul/copilot/report-supabase-fetch-logic (`02805bc`)
- Fix broken Stamen map tile URL in harta.html (migrate to Stadia Maps) (`6169867`)
- Merge pull request #22 from AngelOfSoul/copilot/fix-stamen-map-tile-urls (`fb5d142`)
- fix: make setup-photos-storage.sql idempotent with DROP POLICY IF EXISTS guards (`9069df2`)
- fix: replace DROP POLICY guards with DO/EXCEPTION blocks to avoid destructive-op warning (`2cb5284`)
- docs: make README Step-4 SQL idempotent and clarify re-run safety (`e55a094`)
- Merge pull request #23 from AngelOfSoul/copilot/add-photos-storage-sql (`79fdca7`)
- fix: update Stadia Maps tile URL to stamen_toner (resolve harta.html conflict) (`36cf0d8`)
- Merge pull request #29 from AngelOfSoul/copilot/resolve-harta-html-merge-conflict (`f1d3d81`)
- Fix register button to open login page register tab instead of families list (`15546c9`)
- Fix Supabase signUp error and add show/hide password toggles to all password inputs (`a5ba564`)
- Merge pull request #30 from AngelOfSoul/copilot/fix-families-tab-navigation (`e01e74a`)
- Add Supabase Keep Alive GitHub Actions workflow with correct auth headers (`520a82e`)
- Fix Supabase Keep Alive: add auth headers, generic endpoint, and restrict permissions (`745e7e3`)
- docs: add Keep Alive section to README explaining 401 fix and one-time setup steps (`3aa99b7`)
- Merge pull request #31 from AngelOfSoul/copilot/error-debugging-issue (`4f870c9`)
- fix: accept HTTP 401 as valid keep-alive response from Supabase (`a178d66`)
- Merge pull request #32 from AngelOfSoul/copilot/fix-invalid-image-rendering (`348208d`)

### 2026-03-25
- Fix RLS violation: use live session UID in doFamilyProfile() (`2d05c7c`)
- Merge pull request #33 from AngelOfSoul/copilot/fix-row-level-security-insertion (`3a527fb`)
- Feature: delay family profile step until after email confirmation + login (`5f26dad`)
- Merge pull request #34 from AngelOfSoul/copilot/update-email-confirmation-flow (`c48a030`)
- feat: add forgot password modal and update spam notice in email confirmation panel (`8a6f705`)
- Fix post-email-confirmation flow and PIN autocomplete (`3aad171`)
- Address code review: unsubscribe auth listener and log query errors (`4bd1436`)
- Merge pull request #36 from AngelOfSoul/copilot/fix-forgot-password-popup (`622518f`)
- Merge pull request #37 from AngelOfSoul/copilot/fix-login-flow-bugs (`baae39a`)
- Fix 3 bugs in genealogie-familie.html: in-page toast, no backdrop-close, save to tree (`cfcd854`)
- Merge pull request #38 from AngelOfSoul/copilot/fix-add-person-modal-bugs (`932e0e6`)
- Implement real tree export to PNG using html2canvas (`67e5829`)
- Merge pull request #39 from AngelOfSoul/copilot/implement-tree-export-to-png (`94072e4`)
- Fix overlapping person cards in genealogy tree (genealogie-familie.html) (`4d1baea`)
- Merge pull request #40 from AngelOfSoul/copilot/remove-testsite-placeholder (`ffc98ac`)
- Delete CALNIC_PROJECT_BRIEFING_V12.txt (`4fdcd22`)
- Delete CALNIC_PROJECT_BRIEFING_V11.txt (`9678fc7`)
- Delete CALNIC_PROJECT_BRIEFING_V10.txt (`095790a`)
- Fix 6 bugs: hide static demo tree, Supabase persistence, empty state messages, card overlap, connect to village button (`2171582`)
- Merge pull request #41 from AngelOfSoul/copilot/fix-static-demo-tree-issue (`214c38d`)
- Step 1-2: Delete harta.html, remove all references, fix demo data flash (`f5ef28c`)
- Fix broken link, duplicate ID, and finalize cleanup (`26148b8`)
- Fix demo data flash, add empty-members prompt, live stats, console.warn (`89cff09`)
- Merge pull request #42 from AngelOfSoul/copilot/remove-harta-html-references (`af14cac`)
- Delete harta.html (`6ca4cc1`)
- Delete harta.html (`f682ff8`)
- Delete delete-demo-data.sql (`26a9c54`)
- Fix admin: back-to-site nav, backup download, refresh spinner race condition (`0b4df6f`)
- Fix supabase:ready race condition on all pages + CSV download fix (`8ea9b74`)
- Refresh: trigger GitHub merge re-evaluation (`b985bfc`)
- Merge pull request #43 from AngelOfSoul/copilot/fix-admin-page-navigation-issues (`de8eaa6`)
- Fix: use correct 'members' table name in genealogie-familie.html (was 'family_members') (`17fb0a3`)
- Merge pull request #44 from AngelOfSoul/copilot/fix-family-members-table-error (`adb1b22`)

### 2026-03-26
- Fix bugs in genealogie.html, genealogie-familie.html, dashboard.html; add migration-v2.sql (`edb9e3e`)
- Merge pull request #45 from AngelOfSoul/copilot/fix-editor-files-and-favicon (`98d1244`)
- Merge pull request #46 from AngelOfSoul/game-preview (`5949cd6`)
- Delete scripts directory (`2fea446`)
- Delete styles directory (`64a57d7`)
- Delete game.html (`92be250`)
- Add favicon.svg and update all HTML files to use SVG favicon with ICO fallback (`080ad12`)
- Merge pull request #49 from AngelOfSoul/copilot/add-favicon-svg (`cbf2f48`)
- Updated favicon.svg on 2026-03-26 16:50:04 (`0cb2a2c`)
- Update favicon.svg with new SVG content (`fce3649`)
- Update favicon.svg with new content (`0f8e00c`)
- Fix zoom deltaMode, gen-label tracking, and v-badge restyle in genealogie-familie.html (`0d1e8b4`)
- Merge pull request #50 from AngelOfSoul/copilot/fix-zoom-issue-and-labels (`ef8f9b4`)
- Fix familiile-familie.html: remove all hardcoded demo/placeholder content (`af03314`)
- Fix renderConnections: pass empty array instead of null for clarity (`a9beea1`)
- Merge pull request #51 from AngelOfSoul/copilot/fix-hardcoded-data-familiile-familie (`4063ffa`)
- Fix zoom control bar, gen labels tracking, and ghost button position in genealogie-familie.html (`40df435`)
- Merge pull request #52 from AngelOfSoul/copilot/add-zoom-control-bar-to-tree-stage (`4897c49`)
- Fix gen-labels overlap, ghost button positioning, and label visibility tracking (`ef49805`)
- Merge pull request #53 from AngelOfSoul/copilot/fix-gen-labels-overlap (`6a31eac`)

### 2026-03-27
- Fix family tree bugs: din null, blank tree, member IDs, members count sync (`94474bc`)
- Merge pull request #54 from AngelOfSoul/copilot/fix-family-tree-issues (`5db7837`)
- Fix blank family tree (panX offset bug) and implement admin edit family modal (`2974d73`)
- Merge pull request #55 from AngelOfSoul/copilot/full-site-audit-and-fix-errors (`7239258`)
- Add localStorage fallback for familyId in genealogie-familie.html (`73f6894`)
- Merge pull request #56 from AngelOfSoul/copilot/add-localstorage-fallback-for-familyid (`b23d5ac`)
- fix: safe roleToGen, NaN guard in computeLayout, empty-state in afterLoad (`877f15f`)
- Merge pull request #57 from AngelOfSoul/copilot/fix-blank-tree-canvas (`d95ecfa`)
- Update comments for consistency across pages (`1f60ea9`)
- Update print statement from 'Hello' to 'Goodbye' (`434be38`)
- Update print statement from 'Hello' to 'Goodbye' (`136be5d`)
- Enhance genealogie-familie.html with sidebar and styles (`3a381e0`)
- Fix missing newline at end of genealogie-familie.html (`d1a785e`)
- Change greeting from 'Hello World' to 'Goodbye World' (`93b4457`)
- Update print statement from 'Hello' to 'Goodbye' (`58e8f94`)
- Update admin-nav.js (`0209599`)
- Modify robots.txt for updated URL permissions (`c4a1644`)
- Refactor Supabase client initialization and comments (`230651c`)
- Update print statement from 'Hello' to 'Goodbye' (`2165a9a`)
- Update contact.html (`8d80e8f`)
- Update admin.html (`a24341b`)
- Update index.html (`717834f`)
- Fix formatting of robots.txt (`9e500bc`)
- Fix Supabase configuration check function (`ac7f422`)
- Add HTML structure and styles for Calnic Online (`25d819f`)
- Refactor admin-nav.js for better structure and clarity (`d97d352`)
- Update Supabase client initialization comments and key (`78ccb09`)
- Refactor index.html structure and content (`ccba645`)
- Refactor login.html for improved structure and style (`dd8b538`)
- Enhance contact.html with updated form and script (`363d531`)
- Fix missing newline at end of contact.html (`92cdb2b`)
- Update admin.html (`d414907`)
- Fix formatting of robots.txt (`b45daa9`)
- Refactor HTML structure and styles for navigation (`1d0c05d`)
- Refactor HTML and CSS for improved readability (`51d697a`)
- Add content sections about public vs private and site features (`fe942da`)
- Refactor index.html and remove unnecessary sections (`28149d2`)
- Remove comments from admin-nav.js (`36e4a36`)
- Refactor admin-nav.js for better structure and styles (`f349231`)

### 2026-03-29
- Update admin-nav.js with style fixes and logic adjustments (`dd9e920`)
- Delete README-SUPABASE.md (`8c36b98`)
- Delete CALNIC_PROJECT_BRIEFING_V12.txt (`ca3d62a`)
- Delete FIX_REPORT.md (`35b752d`)
- Update supabase.js (`b2c5995`)
- Update admin-nav.js (`6327fef`)
- Update admin-nav.js (`e22b064`)
- Update admin-nav.js (`2879cb0`)
- Update supabase.js (`2bea124`)
- Refactor Supabase configuration checks and comments (`857483b`)
- Update admin-nav.js (`dde1fb3`)
- Update admin-nav.js (`1f57d8d`)
- Update admin-nav.js (`6087a96`)

### 2026-03-31
- Delete .github/workflows directory (`0ec15a1`)
- Delete 404.html (`34a3b16`)
- Delete supabase.js (`4d52d9b`)
- Delete admin-nav.js (`f5a2870`)
- Delete admin.html (`f7e3ce0`)
- Delete contact.html (`dcbcee2`)
- Delete dashboard.html (`c693023`)
- Delete familiile-familie.html (`ee67c66`)
- Delete familiile.html (`e10b491`)
- Delete galerie.html (`8b0bebd`)
- Delete og-image.png (`3abe752`)
- Delete style.css (`47828ea`)
- Delete migration-v2.sql (`0014bb7`)
- Delete seed-demo-data.sql (`1e0c8ed`)
- Delete index.html (`c1d2407`)
- Delete setup-photos-storage.sql (`336e612`)
- Delete login.html (`c56610e`)
- Delete istorie.html (`422bbcc`)
- Delete intrebari.html (`e038e3e`)
- Delete genealogy-engine.js (`aab5d0d`)
- Delete genealogie.html (`3752ded`)
- Delete genealogie-familie.html (`bfd674e`)

### 2026-04-01
- Delete style.css (`fe6c279`)
- Delete admin-nav.js (`262784d`)
- Fix genealogy tree: SQL constraints, RLS, layout bugs, error handling (`766ab8b`)
- Merge pull request #58 from AngelOfSoul/copilot/debug-arbore-genealogic (`46fad4e`)

### 2026-04-02
- Fix XSS vulnerabilities, broken SVG rendering, null dereferences, robots.txt errors, empty header ornaments, and scroll button accessibility (`3d26b6e`)

### 2026-04-03
- Merge pull request #63 from AngelOfSoul/copilot/research-arborele-satului-bugs (`011f615`)
- Fix banner, tree rendering, and member visibility on arborele-satului.html (`cecc23a`)
- Merge pull request #64 from AngelOfSoul/copilot/full-debug-audit-repo-fix (`c095dbe`)
- fix: close inline script tag, fix popup CSS specificity, add closePopup/showPopup, implement script-arbore.js (`6cafeea`)
- Merge pull request #65 from AngelOfSoul/copilot/debug-arborele-satului-html (`68bece6`)
- Fix arborele-satului: Supabase families, hide arbore-wrapper in map view, bezier connections, no overlap (`df66809`)
- Merge pull request #66 from AngelOfSoul/copilot/fix-arborele-satului-bug-uri (`7fe0e98`)

### 2026-04-04
- Delete js/script-arbore.js (`74b3468`)
- Delete arborele-satului.html (`ddd6823`)
- Delete data.json (`051eb1c`)
- Rename jssupabase-client.js to supabase-client.js (`8c917a8`)
- Delete BRIEFING.md (`c2b1e69`)

### 2026-04-05
- site final (`2c295aa`)
- fix runtime errors families/genealogy export and schema fallbacks (`2784844`)
- fix families 400 noise and genealogy export null name (`3a9c354`)
- fix familiile UI syntax regression (`e408810`)
- fix scroll up/down buttons binding on family pages (`32043eb`)
- make family selection deterministic across login/index/dashboard (`9f2da10`)
- remove owner_id dependency in frontend (`b3012b8`)
- fix login route crash and robust family create payloads (`00d374a`)
- fix nav motif/profile label stability and active view detection (`8497c1e`)
- cleanup nav fallback conflicts on family pages (`07c4025`)
- fix index nav flash and reinit admin nav on member view switch (`549dbc3`)
- fix logged-in header motif to match guest view (`4c7bdcc`)
- restore admin nav visibility and family creation modal flow (`2a3f998`)
- safe cleanup remove unused auth vars (`b169bec`)
- safe cleanup remove unused session vars in family nav checks (`6bce2e1`)
- safe cleanup remove unused session vars in nav checks (`885cbe0`)
- disable wheel zoom on family and village trees (`459b8be`)
- add explicit +/- zoom controls for family and village trees (`7d1a46b`)
- fix genealogy 400 noise, center tree node, redirect to families after create, prioritize user family first (`21e4262`)
- fix admin nav label override on families and contact pages (`0ee6132`)
- hide generation labels in family tree UI (`b237fa7`)
- replace browser alert with site modal + connect village fallback (`3e0954a`)
- shrink village tree family popup and add close button (`bd6b201`)
- fix member edit history query to use audit_log (`6f2252c`)
- remove semicircle artifacts on genealogy node edges (`bdecc08`)
- fix avatar badge clipping that looked like semicircles (`7fe7c24`)

### 2026-04-06
- Fix admin nav label and resolve style conflicts with new theme (`64f6442`)
- Unify gold-m accent across remaining pages for visual consistency (`ddfdc50`)
- Unify site styling into single style.css and remove medieval stylesheet links (`899f008`)
- Fix mobile horizontal overflow in shared header and section titles (`55ed874`)
- Fix mobile overflow on genealogie-familie and replace broken history image sources (`5e37a4d`)
- Fix mobile overflow in genealogie family detail panel (`63dae62`)
- Scope extracted responsive rules to mobile media query (`b9e1813`)
- Restore families page desktop grid and filter layout (`23c2f35`)
- Restore per-page desktop layout dimensions across key pages (`c36846c`)
- Shorten page transition fade timing (`d2616a3`)
- Fix admin auth bootstrap when supabase global is overwritten (`47a9515`)
- Fix family page spacing and remove legacy nav icons on village tree (`ae12a5b`)
- Hide generation labels and decorative deceased rings in family tree UI (`8d24d7a`)
- Remove deceased ring rendering and mask top-edge semicircle artifacts (`ee8a1ca`)
- Handle missing connected_to_village column without blocking connect action (`6bf4237`)
- Increase top stage mask to fully hide clipped node arcs (`aa57cfa`)
- Clamp tree vertical pan to prevent top-edge node arc artifacts (`a27e92b`)
- Improve load performance by deferring external scripts across pages (`96fea3a`)
- Minimize page transition blackout duration (`af4e104`)
- Clamp tree top pan and add subtle top mask to remove semicircle artifacts (`760c71a`)
- Fix relation modal dropdown contrast so all family members remain readable (`763e597`)
- Replace relation target native select with themed custom dropdown (`384f107`)
- Refine themed relation dropdown rows to remove boxed button styling (`ccac299`)
- Normalize relation dropdown option font size and spacing (`1258cd3`)
- Infer parent suggestions from grandparent links independent of surname (`613b948`)
- Fix grandparent inference child lookup and auto-center tree after new relation (`b673136`)
- Include spouse-side children in grandparent inference for different surnames (`97cb44a`)
- Fix grandparent inference direction for bunica/bunic relation types (`b4ac085`)
- Suggest co-grandparent spouse when adding grandparent relation (`876f711`)
- Remove hardcoded demo photos and featured demo block from gallery (`9f2e923`)
- Default FAQ to All tab and restore profile dropdown hover behavior (`0ff6469`)
- Restore homepage guest desktop grid layout and improve navbar inactive contrast (`973800e`)
- Use modern nav-login style for guest profile link in header (`5ddb53c`)
- Redirect sign-in flow to homepage instead of dashboard (`1b13e13`)
- Replace logged-in home widgets with dark emblem and village weather card (`3e5dfc7`)
- Center village emblem and compact weather widget with blended background (`9b0c45c`)
- Add global maintenance banner and sync admin maintenance state (`e8fde0c`)
- Move active announcements section above emblem and weather on home (`986bc00`)
- Center top announcements section on logged-in home (`beb3a4a`)
- Add styled chat preview panel triggered from new Mesaje hero pill (`ff86f82`)
- Remove homepage chat preview UI and related script hooks (`038ef5c`)
- Implement modular badges system across profile, family cards, and admin panel (`3a8dbe7`)
- Fix admin badges dropdown option contrast in dark theme (`4025985`)
- Polish badges UI with single themed tooltip and uniform badge sizing (`f0e16e4`)
- Clarify admin badge user labels for accounts without family (`87aeffd`)
- Normalize profile badge sizing and split profile vs compact variants (`38d33b0`)
- Refine profile badge visuals with ornate premium frame (`8a4e373`)
- Implement dedicated medalion SVG icons for all badges (`75b9658`)
- Shrink profile and card badge dimensions (`9e6aefe`)
- Use provided centered SVG assets for badge medalion icons (`cf9e244`)
- Render full provided SVG badge artwork instead of synthetic style (`e5fcfba`)

### 2026-04-07
- Fix SVG badge border, sizing and alignment in profile and cards (`65b9fde`)
- Harden homepage weather widget with timeout and provider fallback (`b6e02ca`)
- Fix back-navigation fade lock and restrict tree pages to authenticated users (`c0cb9b8`)
- Remove history page photo banners from content sections (`bb8a355`)
- Restrict gallery to authenticated users and stabilize language state (`35b7304`)
- Fix contact inbox delivery and add robust chat moderation UX (`cc3a54c`)
- Add polls on homepage/admin and harden chat moderation flows (`bf50eec`)
- Update pages and chat setup; ignore temp/testing folders (`e780359`)
- Refine admin chat moderation: reported-only review, themed UI, and per-user link permissions (`78318f3`)
- Allow editing active polls directly from admin panel (`efff39e`)

### 2026-04-08
- Polish game HUD and cards to match medieval site style (ornate topbar frame, upgraded badges, styled selects, refined hint panel, responsive card grid).
- Add robber sprite rendering from provided sprite sheet with graceful fallback in file:// mode.
- Stabilize smoke flow where settlement build is conditional; keep deterministic undo validation when build is unavailable.

- Refine board visuals (token medallions, owner badges, stronger selection highlight) and ensure decorative SVG layers do not block hex clicks.
- Add visual polish pass for game HUD: resource icons, pulse feedback on gains/spends, dice result flash, board flash for build/robber actions, and extra mobile compact tuning.
- Add contextual onboarding hint (setup + first turns) and improve action tooltips (controls, cards, ports) for clearer UX without changing game balance.
- Rebalance AI profiles for all 3 difficulties (build pacing, trade pressure, reserves, late-game closing behavior) and improve AI trade selection to avoid sacrificing critical resources.
- Improve microcopy/hints and add dynamic tooltips on disabled controls so players see exactly why actions are unavailable.

### 2026-04-09 (Game / Kelling)
- Claims-first hardening final: sincronizare automata `board.owner/level` din `vertexClaims` dupa `setVertexClaim`, `load`, `undo`.
- Curatare suplimentara runtime pentru a reduce dependenta de modelul legacy in deciziile de ownership/tooltip.
- Stabilizat smoke tests (eliminata dependenta de text localizat `phaseLabel`; validare pe starea controalelor).
- Balancing final pass:
  - AI `easy` mai permisiv (build/trade/card usage reduse, rezerva mai mare)
  - AI `normal` usor temperat pentru meciuri mai consistente
  - AI `hard` mai putin spike-y, dar in continuare agresiv
  - ritm carte jucator ajustat la 1 carte / 4 ture pentru economie mai stabila.

