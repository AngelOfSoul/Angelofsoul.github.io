# Kelling Game Release Checklist (status 2026-04-09)

## Pre-release (obligatoriu)
- [x] Ruleaza `npm run test:game:release` si confirma ca toate testele trec.
- [x] Verifica cele 3 dificultati AI (`easy`, `normal`, `hard`) prin smoke (`test:game-ai`).
- [x] Verifica flux `7` (hot) + mutare hot (acoperit in smoke tests).
- [x] Verifica `Undo` multi-step (acoperit in smoke tests).
- [x] Verifica `Largest Army` + `Achievements` UI/toast/persistenta (`test:game-achievements`).
- [ ] Verifica manual fluxurile de baza in buildul final:
  - [ ] `Joc nou` (fara save)
  - [ ] `Continua` (cu save existent)
  - [ ] `Export Save` + `Import Save`
  - [ ] `Reset Complet` (cu confirmare)
- [ ] Verifica UI pe desktop + mobile (layout, scroll, butoane principale).

## Pre-release (recomandat)
- [ ] Ruleaza 2 partide complete manual: una pe `normal`, una pe `hard`.
- [ ] Verifica persistenta preferintelor: nume, VP, AI, sunet.
- [ ] Verifica accesibilitate de baza:
  - [ ] focus vizibil cu tastatura
  - [ ] `Esc` inchide `Reguli` / `Clasament`
  - [ ] fara blocaje cand overlay-urile sunt deschise

## Release artifacts
- [x] `CHANGELOG.md` actualizat cu toate iteratiile recente.
- [x] `RELEASE_NOTES.md` actualizat pentru release-ul curent.
- [ ] Seteaza versiunea finala de release/tag (de exemplu `v1.3.0-game`).

## Stabilitate (2026-04-09)
- [x] Claims-first reconciliation activ (`vertexClaims` -> `board.owner/level`) dupa load/undo/build.
- [x] Smoke tests hardenite pentru a evita flaky waits bazate pe text localizat.
- [x] Balancing final pass aplicat pe AI profiles + ritm draw carte player.

## Post-release smoke (cand decizi push/deploy)
- [ ] Deschide `game.html` din buildul final publicat.
- [ ] Joaca 1 tura completa + AI turn.
- [ ] Reincarca pagina (`refresh`) si confirma `Continua`.
- [ ] Verifica rapid ca nu exista erori in consola browser.
