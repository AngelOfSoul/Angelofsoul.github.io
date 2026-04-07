# Release Notes

Acest document sumarizeaza livrarile importante ale proiectului Calnic Online.

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
