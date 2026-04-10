# Release Notes

Acest document sumarizeaza livrarile importante ale proiectului Calnic Online.

## v1.3.0 - 2026-04-08

### Kelling Game (major update)
- Livrata experienta completa `game.html`:
  - setup, zaruri, distributie resurse, hoț, constructii, carti, alchimie, end-game
  - AI pe 3 dificultati (`easy`, `normal`, `hard`)
  - autosave + continue + export/import save
- Hardening gameplay:
  - protectie anti double-roll
  - `Undo` multi-step in tura
  - blocare input/hotkeys in overlay-uri
  - confirmare explicita la `Reset Complet`
  - guard anti-race pentru tura AI (`aiThinking`)
  - auto-recovery la load pentru snapshot-uri prinse in timpul turei AI
- QA automat extins:
  - `test:game`, `test:game-save`, `test:game-prefs`, `test:game-new`
  - `test:game-ai`, `test:game-robber`, `test:game-ai-lock`, `test:game-load-normalize`
  - runner unificat: `test:game:all`
  - pre-flight release: `test:game:release`

### Note
- Pentru lansarea jocului vezi `GAME_RELEASE_CHECKLIST.md`.

## v1.2.0 - 2026-04-07

### Nou
- Moderare chat in Admin imbunatatita:
  - review doar pentru mesaje raportate
  - stil UI unificat cu tema site-ului
  - reguli pentru linkuri: toggle global + exceptii per utilizator
- Sondaje extinse:
  - adaugare sondaje in homepage/admin
  - editare directa din Admin pentru sondajele active
- Management familii extins in Admin:
  - editare completa familie direct din panel
  - afisare mai clara utilizatori fara familie (email/identificare cont)

### Fixuri
- Inbox contact stabilizat.
- Setup chat SQL actualizat pentru reguli si helper functions.

## v1.1.0 - 2026-04-06

### Nou
- Sistem complet de badge-uri (profil, carduri familie, admin).
- Banner global de mentenanta sincronizat cu setarile din Admin.
- Widget meteo + zona homepage member imbunatatite.

### UI/UX
- Unificare stiluri (theme consistency) pe paginile principale.
- Corectii majore responsive/mobile overflow.
- Optimizari de tranzitii si interactiuni in arborele genealogic.

### Stabilitate
- Multe fixuri de navigare, bootstrap auth si sincronizare stare.

## v1.0.0 - 2026-04-05

### Lansare "site final"
- Stabilizare fluxuri principale:
  - autentificare/alegere familie
  - navigare si fallback-uri robuste
  - corectii runtime pentru familii/genealogie
- Imbunatatiri semnificative pentru arbore:
  - controale zoom explicite
  - fixuri layout si artefacte vizuale
  - reducere erori de query si fallback-uri schema

## v0.9.0 - 2026-04-03 / 2026-04-04

### Core platform hardening
- Fixuri de securitate si robustete (XSS, null dereference, rendering issues).
- Reconstructie/curatare importante parti din paginile arborelui satului.
- Refaceri structurale de fisiere si normalizare assets/scripts.

## v0.8.0 - 2026-03-23 / 2026-04-02

### Foundation release
- Integrare Supabase: auth, profile flow, RLS, storage.
- Dashboard familie, fluxuri login/register in mai multi pasi.
- Primele utilitare admin (backup, logs, management initial).
- Persistenta limba pe pagini, baza pentru UX unificat.

---

## Note de upgrade (recomandat)
- Ruleaza scripturile SQL cele mai recente din `sql/` (in special pentru chat/polls/admin) dupa fiecare release major.
- Pentru functionalitati noi de moderare chat, verifica cheia `chat_moderation` in `site_settings`.

## v1.3.1 - 2026-04-08 (polish pass)

### Kelling Game polish
- onboarding contextual in setup + primele ture
- tooltips dinamice pe controale dezactivate (motiv explicit pentru indisponibilitate)
- polish board/HUD: token medallions, owner badges, icon-uri resurse, feedback animat (dice/build/robber)
- rebalansare AI pe toate cele 3 dificultati cu trade logic mai inteligenta
- validare automata completa: 
npm run test:game:release PASS

## v1.3.2 - 2026-04-09 (stability + balance)

### Kelling Game
- Finalizat hardening claims-first:
  - sincronizare automata intre `vertexClaims` si campurile legacy `board.owner/level`
  - comportament mai predictibil dupa `Load Save` / `Undo`
- Stabilizat pachetul de smoke tests:
  - eliminata dependenta de textul fazei in testele sensibile (timing/localizare)
  - validare bazata pe starea butoanelor/flow-ului de joc
- Balancing final:
  - AI retunat pe `easy` / `normal` / `hard` pentru progresie mai clara intre dificultati
  - ritm carte player ajustat la 1 la 4 ture pentru economie mai controlata

### QA
- `npm run test:game:release` PASS (toate suite-urile game).

