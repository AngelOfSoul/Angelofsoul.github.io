# ðŸŽ® Kelling: Origins of Calnic
## Game Design Document (GDD) â€” v2.0 FINAL

**Single-Player Strategy Game pentru calniconline.ro**
*Creat: 2026 | Status: Ready for Development*

---

## ðŸ“‘ Cuprins

1. [Prezentare GeneralÄƒ](#1-prezentare-generalÄƒ)
2. [Ecranele Jocului](#2-ecranele-jocului)
3. [Board â€” StructurÄƒ È™i Coordonate](#3-board--structurÄƒ-È™i-coordonate)
4. [Faza de Setup â€” Plasarea IniÈ›ialÄƒ](#4-faza-de-setup--plasarea-iniÈ›ialÄƒ)
5. [Tura JucÄƒtorului â€” Flow Complet](#5-tura-jucÄƒtorului--flow-complet)
6. [Tura AI â€” Flow Complet](#6-tura-ai--flow-complet)
7. [Sistemul de Resurse](#7-sistemul-de-resurse)
8. [ClÄƒdiri È™i Costuri](#8-clÄƒdiri-È™i-costuri)
9. [Longest Road](#9-longest-road)
10. [Sistemul de Carduri](#10-sistemul-de-carduri)
11. [Sistemul de Trade](#11-sistemul-de-trade)
12. [HoÈ›ul (Robber)](#12-hoÈ›ul-robber)
13. [Victory Points â€” Tracking Complet](#13-victory-points--tracking-complet)
14. [AI â€” Comportament Detaliat](#14-ai--comportament-detaliat)
15. [Win / Lose â€” Ecrane È™i AnimaÈ›ii](#15-win--lose--ecrane-È™i-animaÈ›ii)
16. [Sezoane È™i Leaderboard](#16-sezoane-È™i-leaderboard)
17. [Onoruri È™i Badge-uri](#17-onoruri-È™i-badge-uri)
18. [Tutorial](#18-tutorial)
19. [Sunete È™i AnimaÈ›ii](#19-sunete-È™i-animaÈ›ii)
20. [UI/Visual Design â€” Final](#20-uivisual-design--final)
21. [Mobile Responsive](#21-mobile-responsive)
22. [Sistem Limbi](#22-sistem-limbi)
23. [Salvare È™i Restaurare (localStorage)](#23-salvare-È™i-restaurare-localstorage)
24. [ArhitecturÄƒ TehnicÄƒ](#24-arhitecturÄƒ-tehnicÄƒ)
25. [Securitate È™i Validare Scoruri](#25-securitate-È™i-validare-scoruri)
26. [Structura FiÈ™ierelor](#26-structura-fiÈ™ierelor)
27. [Ordine de Implementare](#27-ordine-de-implementare)
28. [FAQ](#28-faq)

---

## 1. Prezentare GeneralÄƒ

| Aspect | Detaliu |
|--------|---------|
| **Nume** | Kelling: Origins of Calnic / Kelling: Originile Calnicului |
| **Tip** | Single-player, turn-based, hex-grid strategy |
| **PlatformÄƒ** | Browser web (desktop + mobile responsive) |
| **Hosting** | GitHub Pages (static) + Supabase (backend) |
| **Limbi** | RomÃ¢nÄƒ (default) + EnglezÄƒ |
| **DuratÄƒ sesiune** | 10â€“25 minute per joc |
| **Core Loop** | Roll dice â†’ Collect resources â†’ Build â†’ Reach VP target |

### Parametri configurabili la start

**VP Target (jucÄƒtorul alege):**
- Rapid â€” 8 VP (~10â€“15 min) â†’ +2 puncte sezon
- Standard â€” 9 VP (~15â€“20 min) â†’ +3 puncte sezon (default)
- Epic â€” 10 VP (~20â€“30 min) â†’ +4 puncte sezon

**Dificultate AI (jucÄƒtorul alege):**
- Prietenos â€” win rate jucÄƒtor 75â€“85%
- Echilibrat â€” win rate jucÄƒtor 50â€“60% (default)
- Strateg â€” win rate jucÄƒtor 40â€“50%

### NotÄƒ LegalÄƒ
"Kelling: Origins of Calnic este un joc inspirat din mecanici clasice de strategie hex. Toate elementele vizuale È™i tema sunt originale, inspirate din satul Calnic, judeÈ›ul Alba, RomÃ¢nia. Kelling a fost numele saxon al Calnicului, derivat din familia nobiliarÄƒ Kelling."

---

## 2. Ecranele Jocului

Jocul are urmÄƒtoarele ecrane/stÄƒri distincte:

```
START SCREEN
    â†“
SETUP SCREEN (alege VP target + dificultate + nickname)
    â†“
INITIAL PLACEMENT (plasare 2 aÈ™ezÄƒri + 2 drumuri)
    â†“
GAME SCREEN (bucla principalÄƒ)
    â†“
WIN MODAL sau LOSE MODAL
    â†“
LEADERBOARD SCREEN
```

### 2.1 Start Screen
- Logo animat KELLING cu efect glow auriu la intrare
- Buton mare [JoacÄƒ] â€” duce la Setup Screen
- Buton [Clasament] â€” duce la Leaderboard
- Buton [Tutorial] â€” porneÈ™te tutorialul
- Selector limbÄƒ RO / EN Ã®n colÈ›
- Background: peisaj medieval animat (parallax uÈ™or)
- DacÄƒ existÄƒ o partidÄƒ salvatÄƒ Ã®n localStorage â†’ afiÈ™eazÄƒ banner: "Ai o partidÄƒ Ã®n curs â€” [ContinuÄƒ] sau [Joc Nou]"

### 2.2 Setup Screen

**Pasul 1 â€” Alege VP Target:**
- 3 carduri mari: Rapid (8VP) / Standard (9VP) / Epic (10VP)
- Fiecare card aratÄƒ: timp estimat, puncte sezon cÃ¢È™tigate
- Standard selectat implicit (border auriu)

**Pasul 2 â€” Alege Dificultate:**
- 3 carduri: Prietenos / Echilibrat / Strateg
- Fiecare card aratÄƒ: win rate estimat, descriere AI personality
- Echilibrat selectat implicit

**Pasul 3 â€” Nickname:**
- Input text: "Cum te numeÈ™ti, cÄƒlÄƒtorule?"
- Max 20 caractere, alfanumeric + spaÈ›ii
- Se salveazÄƒ Ã®n localStorage pentru sesiuni viitoare
- DacÄƒ existÄƒ familie conectatÄƒ pe calniconline.ro â†’ se preia automat

Buton [ÃŽncepe Partida] â†’ genereazÄƒ board â†’ trece la Initial Placement

### 2.3 Game Screen
Descris Ã®n detaliu la secÈ›iunile 3â€“14.

### 2.4 Win Modal
Descris la secÈ›iunea 15.

### 2.5 Leaderboard Screen
Descris la secÈ›iunea 16.

---

## 3. Board â€” StructurÄƒ È™i Coordonate

### 3.1 Layout Hex Grid

**Tip:** Pointy-top hexagoane (vÃ¢rf Ã®n sus)
**Sistem coordonate:** Axial coordinates (q, r) â€” standard pentru hex grids

Layout clasic Catan 3-4-5-4-3 (19 hexagoane total):

```
Row 0 (3 hex):  (0,-2) (1,-2) (2,-2)
Row 1 (4 hex):  (-1,-1) (0,-1) (1,-1) (2,-1)
Row 2 (5 hex):  (-2,0) (-1,0) (0,0) (1,0) (2,0)
Row 3 (4 hex):  (-2,1) (-1,1) (0,1) (1,1)
Row 4 (3 hex):  (-2,2) (-1,2) (0,2)
```

Conversia axial â†’ pixel (pointy-top, size = S):
```javascript
function hexToPixel(q, r, size) {
  const x = size * (Math.sqrt(3) * q + Math.sqrt(3)/2 * r);
  const y = size * (3/2 * r);
  return { x: x + offsetX, y: y + offsetY };
}
```

### 3.2 IntersecÈ›ii (Vertices)

Fiecare hexagon are 6 vÃ¢rfuri. IntersecÈ›iile sunt punctele unde jucÄƒtorul poate plasa AÈ™ezÄƒri È™i OraÈ™e. Total intersecÈ›ii unice pe board: 54.

O intersecÈ›ie se stocheazÄƒ astfel:
```javascript
vertex = {
  id: "v_q_r_dir",
  position: {x, y},
  adjacentHexes: [hex1, hex2, hex3],
  adjacentVertices: [v1, v2],
  adjacentEdges: [e1, e2, e3],
  building: null,   // null | "settlement" | "city"
  owner: null       // null | "player" | "ai"
}
```

**Distance Rule:** DouÄƒ AÈ™ezÄƒri/OraÈ™e nu pot fi pe intersecÈ›ii adiacente (min 1 intersecÈ›ie liberÄƒ Ã®ntre ele).

### 3.3 Muchii (Edges)

Muchiile sunt segmentele dintre intersecÈ›ii â€” unde se plaseazÄƒ Drumurile. Total muchii unice pe board: 72.

```javascript
edge = {
  id: "e_v1_v2",
  vertices: [vertexId1, vertexId2],
  position: {x, y, angle},
  road: null   // null | "player" | "ai"
}
```

### 3.4 DistribuÈ›ia Resurselor

| ResursÄƒ | Hexagoane | Token-uri |
|---------|-----------|-----------|
| PÄƒdure (Wood) | 4 | 3,4,6,11 |
| Caramida (Brick) | 3 | 5,8,10 |
| Munte (Ore) | 3 | 3,5,9 |
| CÃ¢mp (Grain) | 4 | 2,6,9,11 |
| PÄƒÈ™une (Wool) | 4 | 4,8,10,12 |
| DeÈ™ert | 1 | â€” (HoÈ›ul) |
| **TOTAL** | **19** | **18 token-uri** |

### 3.5 Token-uri Numere (18 total)

| NumÄƒr | Probabilitate | Dots | Cantitate |
|-------|--------------|------|-----------|
| 2 | 2.78% | 1 | 1 |
| 3 | 5.56% | 2 | 2 |
| 4 | 8.33% | 3 | 2 |
| 5 | 11.11% | 4 | 2 |
| 6 | 13.89% | 5 | 2 |
| 8 | 13.89% | 5 | 2 |
| 9 | 11.11% | 4 | 2 |
| 10 | 8.33% | 3 | 2 |
| 11 | 5.56% | 2 | 2 |
| 12 | 2.78% | 1 | 1 |

Numerele 6 È™i 8 se afiÈ™eazÄƒ cu roÈ™u (probabilitate maximÄƒ).
Numerele 6 È™i 8 nu pot fi adiacente (regulÄƒ validatÄƒ la generare).

### 3.6 Algoritm Generare Board

```javascript
function generateBoard(seed) {
  let resources = shuffle([...RESOURCE_DISTRIBUTION], seed);
  resources = ensureDesertCenter(resources);

  let tokens = shuffle([...NUMBER_TOKENS], seed + 1);
  let attempts = 0;
  while (!validateAdjacency(hexes) && attempts < 100) {
    tokens = shuffle(tokens, seed + attempts);
    attempts++;
  }

  generateVerticesAndEdges(hexes);
  placePorts();
  return { hexes, vertices, edges, ports };
}

function validateAdjacency(hexes) {
  for (let hex of hexes) {
    if (hex.token === 6 || hex.token === 8) {
      for (let neighbor of getNeighbors(hex)) {
        if (neighbor.token === 6 || neighbor.token === 8) return false;
      }
    }
  }
  return true;
}
```

### 3.7 Porturi (Harbors)

6 porturi plasate pe marginile boardului:

| Port | Cantitate | RatÄƒ |
|------|-----------|------|
| 3:1 Generic | 3 | 3 orice â†’ 1 orice |
| 2:1 Wood | 1 | 2 Wood â†’ 1 orice |
| 2:1 Grain | 1 | 2 Grain â†’ 1 orice |
| 2:1 Wool | 1 | 2 Wool â†’ 1 orice |

Activare port: jucÄƒtorul are o AÈ™ezare sau OraÈ™ pe una din cele 2 intersecÈ›ii ale portului.

```javascript
port = {
  id: "port_N",
  type: "3:1" | "2:1_wood" | "2:1_grain" | "2:1_wool",
  vertices: [vertexId1, vertexId2],
  direction: "NW"|"NE"|"E"|"SE"|"SW"|"W"
}
```

---

## 4. Faza de Setup â€” Plasarea IniÈ›ialÄƒ

### 4.1 Ordinea PlasÄƒrii (Snake order)

```
JucÄƒtorul â†’ plaseazÄƒ AÈ™ezarea 1
JucÄƒtorul â†’ plaseazÄƒ Drumul 1 (adiacent AÈ™ezÄƒrii 1)
AI â†’ plaseazÄƒ AÈ™ezarea 1 (automat)
AI â†’ plaseazÄƒ Drumul 1 (automat)
AI â†’ plaseazÄƒ AÈ™ezarea 2 (automat)
AI â†’ plaseazÄƒ Drumul 2 (automat)
JucÄƒtorul â†’ plaseazÄƒ AÈ™ezarea 2
JucÄƒtorul â†’ plaseazÄƒ Drumul 2 (adiacent AÈ™ezÄƒrii 2)
â†’ START JOC
```

### 4.2 Resurse IniÈ›iale

La finalul plasÄƒrii, jucÄƒtorul primeÈ™te cÃ¢te 1 resursÄƒ din fiecare hex adiacent celei de-a doua AÈ™ezÄƒri plasate. AI la fel.

### 4.3 UI Setup Phase

- IntersecÈ›iile valide sunt evidenÈ›iate cu un cerc galben pulsant
- Hover pe intersecÈ›ie â†’ preview AÈ™ezare transparentÄƒ
- Click â†’ plaseazÄƒ AÈ™ezarea, intersecÈ›iile invalide dispar
- Imediat dupÄƒ: muchiile adiacente AÈ™ezÄƒrii se evidenÈ›iazÄƒ â†’ click â†’ plaseazÄƒ Drum
- Mesaj Ã®n status bar: "PlaseazÄƒ prima ta AÈ™ezare pe o intersecÈ›ie"
- Overlay cu instrucÈ›iuni simple Ã®n colÈ› (dispare dupÄƒ 3 secunde)

### 4.4 AI Setup Logic

```javascript
function aiChooseInitialSettlement(board, difficulty) {
  const validVertices = getValidSettlementVertices(board);

  const scored = validVertices.map(v => ({
    vertex: v,
    score: scoreVertex(v, board)
  }));

  if (difficulty === 'easy') return randomFromTop(scored, 0.5);
  if (difficulty === 'medium') return randomFromTop(scored, 0.25);
  return scored.sort((a,b) => b.score - a.score)[0].vertex;
}

function scoreVertex(vertex, board) {
  // Suma probabilitÄƒÈ›ilor token-urilor hex-urilor adiacente
  // 6/8=5pt, 5/9=4pt, 4/10=3pt, 3/11=2pt, 2/12=1pt
  return vertex.adjacentHexes
    .filter(h => h.token)
    .reduce((sum, h) => sum + TOKEN_PROBABILITY_SCORE[h.token], 0);
}
```

---

## 5. Tura JucÄƒtorului â€” Flow Complet

### 5.1 Diagrama

```
ÃŽNCEPE TURA JUCÄ‚TORULUI
â”‚
â”œâ”€ 1. ROLL DICE (obligatoriu primul)
â”‚   â”œâ”€ AnimaÈ›ie zaruri (bounce + rotate, 1.5s)
â”‚   â”œâ”€ Rezultat: sumÄƒ 2-12
â”‚   â”‚
â”‚   â”œâ”€ DacÄƒ SUM â‰  7:
â”‚   â”‚   â”œâ”€ Highlight hex-urile cu numÄƒrul respectiv
â”‚   â”‚   â”œâ”€ AnimaÈ›ie flash pe hex-urile active (0.5s)
â”‚   â”‚   â””â”€ Distribui resurse:
â”‚   â”‚       â”œâ”€ Settlement adiacent = +1 resursÄƒ
â”‚   â”‚       â”œâ”€ City adiacent = +2 resurse
â”‚   â”‚       â””â”€ Hex cu HoÈ›ul = skip
â”‚   â”‚
â”‚   â””â”€ DacÄƒ SUM = 7:
â”‚       â”œâ”€ Screen shake (0.3s)
â”‚       â”œâ”€ DacÄƒ jucÄƒtor > 7 resurse â†’ pierde floor(total/2) (aleatoriu)
â”‚       â”œâ”€ DacÄƒ AI > 7 resurse â†’ pierde floor(total/2) (automat)
â”‚       â””â”€ JucÄƒtorul mutÄƒ HoÈ›ul (click pe hex)
â”‚           â””â”€ DacÄƒ hex are clÄƒdiri AI â†’ furÄƒ 1 resursÄƒ random
â”‚
â”œâ”€ 2. ACÈšIUNI JUCÄ‚TOR (orice ordine, de cÃ¢te ori vrea)
â”‚   â”œâ”€ a) Trade cu AI (max 1x per turÄƒ)
â”‚   â”œâ”€ b) Trade cu Banca (nelimitat, 4:1 sau port rate)
â”‚   â”œâ”€ c) CumpÄƒrÄƒ Card (max 1x per turÄƒ, cost 1â›°ï¸+1ðŸŒ¾+1ðŸ‘)
â”‚   â”œâ”€ d) JoacÄƒ Card (max 1x per turÄƒ, nu Ã®n tura cumpÄƒrÄƒrii)
â”‚   â””â”€ e) ConstruieÈ™te (nelimitat dacÄƒ are resurse)
â”‚
â”œâ”€ 3. VERIFICÄ‚ WIN CONDITION
â”‚   â””â”€ DacÄƒ VP >= target â†’ PLAYER WINS
â”‚
â””â”€ 4. END TURN â†’ Tura AI
```

### 5.2 RestricÈ›ii per TurÄƒ

| AcÈ›iune | LimitÄƒ |
|---------|--------|
| Roll Dice | Exact 1x (obligatoriu, primul) |
| Trade cu AI | Max 1x |
| Trade cu Banca | Nelimitat |
| CumpÄƒrare Card | Max 1x |
| Jucat Card | Max 1x (nu Ã®n tura cumpÄƒrÄƒrii) |
| ConstrucÈ›ii | Nelimitat (dacÄƒ are resurse) |

### 5.3 Turn State Object

```javascript
turnState = {
  phase: "roll" | "actions" | "ended",
  hasRolled: false,
  diceResult: null,
  tradeWithAIDone: false,
  cardBoughtThisTurn: false,
  cardPlayedThisTurn: false,
  cardBoughtCardId: null,
  robberMustMove: false,
}
```

---

## 6. Tura AI â€” Flow Complet

### 6.1 Diagrama

```
TURA AI
â”‚
â”œâ”€ 1. AI ROLL DICE (animaÈ›ie 0.8s)
â”œâ”€ 2. Distribui resurse (acelaÈ™i mecanism)
â”œâ”€ 3. DacÄƒ 7 â†’ AI mutÄƒ HoÈ›ul (logic bazat pe dificultate)
â”œâ”€ 4. AI TRADE OFFER (30% È™ansÄƒ) â†’ modal pentru jucÄƒtor
â”œâ”€ 5. AI ACTIONS (Ã®n ordine de prioritate)
â”‚   â”œâ”€ CÃ¢È™tigÄƒ Ã®n aceastÄƒ turÄƒ dacÄƒ poate
â”‚   â”œâ”€ BlocheazÄƒ jucÄƒtorul dacÄƒ e aproape de win
â”‚   â”œâ”€ ConstruieÈ™te (City > Settlement > Card > Road)
â”‚   â”œâ”€ JoacÄƒ card dacÄƒ e momentul optim
â”‚   â””â”€ Trade cu banca dacÄƒ e necesar
â”œâ”€ 6. AfiÈ™eazÄƒ log acÈ›iuni Ã®n sidebar ("AI a construit un Drum")
â”œâ”€ 7. VERIFICÄ‚ WIN CONDITION AI â†’ Lose Modal dacÄƒ cÃ¢È™tigÄƒ
â””â”€ 8. END TURN AI â†’ revine la Tura JucÄƒtorului
```

### 6.2 Viteza AI

Fiecare acÈ›iune AI are delay 800ms Ã®ntre ele â€” jucÄƒtorul vede ce face AI. Total turÄƒ AI: 2â€“4 secunde vizual.

---

## 7. Sistemul de Resurse

### 7.1 Cele 5 Resurse

| ResursÄƒ | Simbol | Hex | Utilizare |
|---------|--------|-----|-----------|
| Wood (Lemn) | PÄƒdure | Road, Settlement |
| Brick (Caramida) | Dealuri | Road, Settlement |
| Ore (Minereu) | Munte | City, Dev Card |
| Grain (GrÃ¢u) | CÃ¢mp | Settlement, City, Dev Card |
| Wool (LÃ¢nÄƒ) | PÄƒÈ™une | Settlement, Dev Card |

### 7.2 State Resurse

```javascript
resources = {
  player: { wood: 0, Brick: 0, ore: 0, grain: 0, wool: 0 },
  ai:     { wood: 0, Brick: 0, ore: 0, grain: 0, wool: 0 }
}
```

### 7.3 Regula 7 â€” Pierdere Resurse

- Oricine cu >7 resurse la roll 7 pierde floor(total/2) resurse
- Exemplu: 9 resurse â†’ pierde 4, rÄƒmÃ¢ne cu 5
- Resursele pierdute sunt alese aleatoriu
- Cardul "PregÄƒtire de IarnÄƒ" protejeazÄƒ +2 resurse extra la roll 7

### 7.4 Banca

Banca are resurse infinite (nu existÄƒ epuizare).

---

## 8. ClÄƒdiri È™i Costuri

### 8.1 Tabel Costuri

| ClÄƒdire | Cost | VP | LimitÄƒ |
|---------|------|----|--------|
| Drum | 1 Wood + 1 Brick | 0 | 15 pe board |
| AÈ™ezare | 1 Wood + 1 Brick + 1 Grain + 1 Wool | 1 | 5 per jucÄƒtor |
| OraÈ™ | 3 Ore + 2 Grain | 2 | 5 per jucÄƒtor |
| Card Dezvoltare | 1 Ore + 1 Grain + 1 Wool | variabil | nelimitat (24 Ã®n pachet) |

### 8.2 Reguli Plasare Drum

1. Trebuie conectat la un Drum existent AL TÄ‚U sau la o AÈ™ezare/OraÈ™ a ta
2. Nu poate ocupa o muchie deja ocupatÄƒ
3. ExcepÈ›ie setup: primele 2 drumuri sunt gratuite

### 8.3 Reguli Plasare AÈ™ezare

1. Pe o intersecÈ›ie validÄƒ
2. Distance Rule: nu poate fi adiacentÄƒ cu nicio altÄƒ clÄƒdire (a nimÄƒnui)
3. Trebuie conectatÄƒ la cel puÈ›in un Drum al tÄƒu (excepÈ›ie: setup)
4. Max 5 AÈ™ezÄƒri per jucÄƒtor

### 8.4 Reguli Plasare OraÈ™

1. Doar pe o AÈ™ezare existentÄƒ a ta (upgrade)
2. Nu necesitÄƒ Drum nou
3. ColecteazÄƒ 2 resurse din hex-urile adiacente (faÈ›Äƒ de 1)
4. Max 5 OraÈ™e per jucÄƒtor

### 8.5 AnimaÈ›ii ConstrucÈ›ie

- Drum: slide din AÈ™ezare (0.3s)
- AÈ™ezare: pop + scale 0â†’1 (0.4s) + sunet
- OraÈ™: AÈ™ezarea morphs â†’ scale up + schimbare sprite (0.5s) + sunet
- IntersecÈ›iile invalide se dezactiveazÄƒ imediat dupÄƒ plasare

### 8.6 Highlight ConstrucÈ›ie

CÃ¢nd jucÄƒtorul apasÄƒ un buton de construcÈ›ie:
- Drum: muchiile valide â†’ albastru pulsant
- AÈ™ezare: intersecÈ›iile valide â†’ cerc galben pulsant
- OraÈ™: AÈ™ezÄƒrile proprii â†’ border auriu
- Click Ã®n afara boardului sau Escape â†’ anuleazÄƒ

---

## 9. Longest Road

### 9.1 Reguli

- Primul la 5+ drumuri continue = "Cel mai Lung Drum" = 2 VP
- DacÄƒ AI depÄƒÈ™eÈ™te â†’ preia titlul È™i VP-ul
- Recalculat dupÄƒ fiecare drum construit

### 9.2 Algoritm DFS

```javascript
function calculateLongestRoad(owner, edges, vertices) {
  const ownerEdges = edges.filter(e => e.road === owner);
  if (ownerEdges.length === 0) return 0;

  let maxLength = 0;

  for (let startEdge of ownerEdges) {
    for (let startVertex of startEdge.vertices) {
      const length = dfsRoad(startVertex, null, new Set(), owner, edges, vertices);
      maxLength = Math.max(maxLength, length);
    }
  }
  return maxLength;
}

function dfsRoad(currentVertex, cameFromEdge, visitedEdges, owner, edges, vertices) {
  let maxLength = 0;

  // ClÄƒdire adversar blocheazÄƒ traseul
  const vertex = vertices[currentVertex];
  if (vertex.owner && vertex.owner !== owner && cameFromEdge !== null) {
    return 0;
  }

  for (let edge of getAdjacentEdges(currentVertex, edges)) {
    if (edge.road !== owner) continue;
    if (visitedEdges.has(edge.id)) continue;

    const nextVertex = edge.vertices.find(v => v !== currentVertex);
    visitedEdges.add(edge.id);
    const length = 1 + dfsRoad(nextVertex, edge.id, visitedEdges, owner, edges, vertices);
    maxLength = Math.max(maxLength, length);
    visitedEdges.delete(edge.id);
  }
  return maxLength;
}
```

### 9.3 AfiÈ™are

- Badge "Cel mai Lung Drum" Ã®n sidebar VP
- Counter "Drum: 4/5" vizibil permanent
- La atingere 5+: flash animaÈ›ie + sunet + notificare "+2 VP"
- La pierdere titlu: notificare "AI a preluat Cel mai Lung Drum! -2 VP"

---

## 10. Sistemul de Carduri

### 10.1 Pachetul (24 carduri)

| Tip | Cantitate | % |
|-----|-----------|---|
| Cavaler (Knight) | 7 | 29% |
| Progres | 8 | 33% |
| Calnic Tematic | 5 | 21% |
| Victory Point | 2 | 8% |
| Special | 2 | 8% |
| **TOTAL** | **24** | **100%** |

### 10.2 Carduri Cavaler (7)

Efect: MutÄƒ HoÈ›ul pe orice hex + furÄƒ 1 resursÄƒ random de la AI.
Largest Army: Primul jucÄƒtor care joacÄƒ 3 Cavaleri â†’ +2 VP.

### 10.3 Carduri Progres (8 â€” cÃ¢te 1 din fiecare)

| # | Nume RO | Efect |
|---|---------|-------|
| 1 | An al AbundenÈ›ei | Ia orice 2 resurse din bancÄƒ |
| 2 | Monopol | Ia pÃ¢nÄƒ la 3 resurse dintr-un tip din bancÄƒ |
| 3 | InovaÈ›ie | +1 VP permanent imediat |
| 4 | Drumuri Noi | 2 drumuri gratuite (conectate la reÈ›ea) |
| 5 | RecoltÄƒ BogatÄƒ | +1 resursÄƒ extra per clÄƒdire producÄƒtoare Ã®n aceastÄƒ turÄƒ |
| 6 | Schimb Favorabil | Trade cu banca la 3:1 Ã®n aceastÄƒ turÄƒ |
| 7 | PregÄƒtire de IarnÄƒ | La roll 7 Ã®n aceastÄƒ turÄƒ, pÄƒstrezi +2 resurse Ã®n plus |
| 8 | Planificare StrategicÄƒ | Vezi top 3 carduri din pachet, alegi 1 |

### 10.4 Carduri Calnic Tematic (5 â€” cÃ¢te 1 din fiecare)

| # | Nume RO | Efect | ReferinÈ›Äƒ IstoricÄƒ |
|---|---------|-------|--------------------|
| 1 | Cetatea Calnicului | ConstruieÈ™te o AÈ™ezare GRATUIT (respectÄƒ distance rule) | Cetatea Calnic sec. XIV |
| 2 | Biserica FortificatÄƒ | +1 VP + protejeazÄƒ un hex de HoÈ› pentru 2 ture | Biserici fortificate transilvÄƒnene |
| 3 | TÃ¢rgul de ToamnÄƒ | Ia 3 resurse din acelaÈ™i tip din bancÄƒ | TÃ¢rguri tradiÈ›ionale |
| 4 | MeÈ™terul Pietrar | Upgrade o AÈ™ezare la OraÈ™ GRATUIT | TradiÈ›ie localÄƒ pietrar |
| 5 | Hora Satului | DubleazÄƒ producÈ›ia ta de resurse Ã®n aceastÄƒ turÄƒ | Dans popular romÃ¢nesc |

### 10.5 Carduri Victory Point (2)

| Nume | Efect |
|------|-------|
| Capela Satului | 1 VP ascuns (se dezvÄƒluie automat la win) |
| GrÄƒdina Bunicului | 1 VP ascuns (se dezvÄƒluie automat la win) |

VP cards rÄƒmÃ¢n ascunse Ã®n hand. Se dezvÄƒluie È™i contorizeazÄƒ automat la win. Nu se "joacÄƒ" manual.

### 10.6 Carduri Speciale (2)

| Nume | Efect |
|------|-------|
| Norocul ÃŽncepÄƒtorului | Re-roll zarurile o datÄƒ Ã®n aceastÄƒ turÄƒ |
| ÃŽnÈ›elegerea Vecinilor | SchimbÄƒ 1 resursÄƒ de-a ta cu 1 resursÄƒ random AI |

### 10.7 Reguli Card System

```javascript
cardRules = {
  maxBuyPerTurn: 1,
  maxPlayPerTurn: 1,
  canPlaySameTurnAsBought: false,
  vpCardsAutoReveal: true,
  knightPlayAfterRoll: true,   // simplificat faÈ›Äƒ de Catan standard
}
```

### 10.8 UI Card Hand

- Carduri afiÈ™ate orizontal Ã®n bottom panel
- Fiecare card: 75Ã—110px, imagine + titlu + buton "JoacÄƒ"
- Hover â†’ card se ridicÄƒ + tooltip cu descrierea completÄƒ
- Carduri VP: faÈ›Äƒ Ã®n jos ca "?", tooltip: "1 VP ascuns"
- Counter: "Pachet: X rÄƒmase"
- AnimaÈ›ie flip la cumpÄƒrare: faÈ›Äƒ Ã®n jos â†’ se Ã®ntoarce â†’ reveleazÄƒ tipul (0.8s)
- Card gri/opac dacÄƒ nu poate fi jucat

### 10.9 Largest Army

```javascript
largestArmy = {
  threshold: 3,
  currentHolder: null,  // null | "player" | "ai"
  playerKnights: 0,
  aiKnights: 0
}

function updateLargestArmy(who) {
  if (who === "player") largestArmy.playerKnights++;
  else largestArmy.aiKnights++;

  const pK = largestArmy.playerKnights;
  const aK = largestArmy.aiKnights;

  if (largestArmy.currentHolder === null) {
    if (pK >= 3) largestArmy.currentHolder = "player";
    else if (aK >= 3) largestArmy.currentHolder = "ai";
  } else if (largestArmy.currentHolder === "player" && aK > pK) {
    largestArmy.currentHolder = "ai";
  } else if (largestArmy.currentHolder === "ai" && pK > aK) {
    largestArmy.currentHolder = "player";
  }
}
```

---

## 11. Sistemul de Trade

### 11.1 Tipuri de Trade

| Tip | IniÈ›iator | LimitÄƒ | RatÄƒ |
|-----|-----------|--------|------|
| Trade cu AI | JucÄƒtorul | 1x per turÄƒ | 1:1 standard, 2:1 extreme |
| Trade cu Banca | JucÄƒtorul | Nelimitat | 4:1 sau port rate |
| Trade Offer AI | AI | 1x per turÄƒ (30% È™ansÄƒ) | 1:1 |

### 11.2 Trade cu AI â€” Flow UI

1. JucÄƒtorul apasÄƒ [Schimb cu AI]
2. Modal cu 2 coloane: "Oferi:" È™i "PrimeÈ™ti:" â€” selectori per resursÄƒ
3. Indicator echitate: "Echitabil / Avantajos / Dezavantajos pentru AI"
4. [Trimite Oferta] â†’ AI evalueazÄƒ â†’ accept/refuz cu animaÈ›ie
5. DacÄƒ acceptÄƒ â†’ resurse se schimbÄƒ cu animaÈ›ie (arc 0.6s)
6. DacÄƒ refuzÄƒ â†’ "AI a refuzat oferta" + opÈ›ional taunt

### 11.3 Logica Accept/Refuz AI

```javascript
function aiEvaluateTrade(offer, difficulty) {
  const offerValue = calculateResourceValue(offer.give, ai.resources);
  const receiveValue = calculateResourceValue(offer.receive, ai.resources);
  const ratio = receiveValue / offerValue;

  const thresholds = {
    easy: 0.7,    // acceptÄƒ chiar dezavantajos
    medium: 0.95, // acceptÄƒ dacÄƒ aproximativ echitabil
    hard: 1.1     // acceptÄƒ doar dacÄƒ e avantajos pentru AI
  };

  return ratio >= (thresholds[difficulty] + rubberBandAdjustment);
}
```

### 11.4 Trade cu Banca

```javascript
function getBankRate(resource, player) {
  if (playerHasSpecificPort(resource, player)) return 2;
  if (playerHasGenericPort(player)) return 3;
  return 4;
}
```

### 11.5 AI Trade Offer

- AI calculeazÄƒ dacÄƒ are surplus + jucÄƒtorul are ceva de care AI are nevoie
- Modal: "AI oferÄƒ: 1 Wood pentru 1 Ore â€” Accepti?"
- Butoane: [AcceptÄƒ] [RefuzÄƒ]
- Timeout 15 secunde â†’ refuz automat

---

## 12. HoÈ›ul (Robber)

### 12.1 Activare

- Roll 7 cu zarurile
- Card Cavaler jucat

### 12.2 Efecte Roll 7

1. JucÄƒtorul cu >7 resurse: pierde floor(total/2) aleatoriu
2. AI cu >7 resurse: pierde floor(total/2) automat
3. JucÄƒtorul mutÄƒ HoÈ›ul pe orice hex
4. DacÄƒ hex-ul ales are clÄƒdiri AI â†’ jucÄƒtorul furÄƒ 1 resursÄƒ random AI

### 12.3 Efecte HoÈ› Plasat

- Hex-ul cu HoÈ›ul nu produce resurse pentru nimeni
- RÄƒmÃ¢ne pÃ¢nÄƒ la un nou roll de 7 sau card Cavaler

### 12.4 UI HoÈ›

- Figura HoÈ›ului vizibilÄƒ pe hex (hood figure SVG)
- Hex blocat: overlay semi-transparent Ã®ntunecat
- AnimaÈ›ie: HoÈ›ul sare arcuit pe noul hex (0.5s)
- La activare: hex-urile valide se evidenÈ›iazÄƒ

### 12.5 ProtecÈ›ie Biserica FortificatÄƒ

- ProtejeazÄƒ un hex specificat de HoÈ› pentru 2 ture
- Visual: scut auriu pe hex
- HoÈ›ul nu poate fi plasat pe un hex protejat

---

## 13. Victory Points â€” Tracking Complet

### 13.1 Surse VP

| SursÄƒ | VP | CondiÈ›ie |
|-------|----|----------|
| AÈ™ezare | 1 | Per AÈ™ezare activÄƒ |
| OraÈ™ | 2 | Per OraÈ™ activ (AÈ™ezarea Ã®nlocuitÄƒ nu mai conteazÄƒ) |
| Card VP | 1 | Per card VP Ã®n hand (ascuns, contorizat automat) |
| Longest Road | 2 | DacÄƒ deÈ›ii titlul curent |
| Largest Army | 2 | DacÄƒ deÈ›ii titlul curent |
| Card InovaÈ›ie | 1 | Permanent, din cardul Progres nr. 3 |

### 13.2 Calcul VP Ã®n Timp Real

```javascript
function calculateVP(owner) {
  let vp = 0;

  for (let vertex of Object.values(vertices)) {
    if (vertex.owner === owner) {
      vp += vertex.building === 'city' ? 2 : 1;
    }
  }

  vp += cards[owner].filter(c => c.type === 'vp').length;
  vp += cards[owner].filter(c => c.type === 'innovation_vp').length;
  if (longestRoad.holder === owner) vp += 2;
  if (largestArmy.currentHolder === owner) vp += 2;

  return vp;
}
```

### 13.3 AfiÈ™are VP

- Sidebar stÃ¢nga: "Tu: 7 / 9 VP" cu progress bar
- Status bar central: "Tu: 7/9 vs AI: 8/9"
- Tooltip pe scor â€” VP Breakdown detaliat:
  ```
  AÈ™ezÄƒri: 2 VP
  OraÈ™e: 2 VP
  Longest Road: 2 VP
  Carduri VP: 1 VP
  â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  TOTAL: 7 VP
  ```
- Progress bar: verde (jucÄƒtor), roÈ™u (AI)

---

## 14. AI â€” Comportament Detaliat

### 14.1 Matrice Comportament

| Comportament | Prietenos | Echilibrat | Strateg |
|-------------|-----------|------------|---------|
| Trade accept rate | 70% | 50% | 30% |
| Trade offer/turÄƒ | 50% | 30% | 20% |
| Building errors | 20% suboptimal | 5% | 0% |
| Robber placement | Random | BlocheazÄƒ cel mai bun hex | BlocheazÄƒ hex critic |
| Card play timing | Imediat | Strategic | Optimal |
| VP card reveal | Imediat | La 8-9 VP | Doar la win |
| Longest Road | IgnorÄƒ | UrmÄƒreÈ™te dacÄƒ natural | Activ construieÈ™te |
| Largest Army | IgnorÄƒ | UrmÄƒreÈ™te dupÄƒ 2 cavaleri | Activ urmÄƒreÈ™te |

### 14.2 AI Building Priority

```javascript
function aiDecideAction(difficulty) {
  if (canWinThisTurn()) return playWinningMove();
  if (playerVP >= vpTarget - 1) return blockPlayer();

  const priorities = [];
  if (canBuildCity() && difficulty !== 'easy') priorities.push({ action: 'city', score: 10 });
  if (canBuildSettlement()) priorities.push({ action: 'settlement', score: 8 });
  if (shouldBuyCard(difficulty)) priorities.push({ action: 'card', score: 5 });
  if (canBuildRoad() && shouldBuildRoad(difficulty)) priorities.push({ action: 'road', score: 3 });

  // Pe Easy: 20% È™ansÄƒ de eroare (acÈ›iune suboptimalÄƒ)
  if (difficulty === 'easy' && Math.random() < 0.2) {
    return priorities[Math.floor(Math.random() * priorities.length)];
  }

  return priorities.sort((a,b) => b.score - a.score)[0];
}
```

### 14.3 AI Robber Placement

```javascript
function aiPlaceRobber(difficulty, board) {
  if (difficulty === 'easy') return randomHexExcludingOwn();

  const scored = board.hexes
    .filter(h => !h.hasRobber && !hasAIBuilding(h))
    .map(h => ({
      hex: h,
      score: countPlayerBuildingsAdjacent(h) * TOKEN_PROBABILITY_SCORE[h.token]
    }));

  if (difficulty === 'medium') return randomFromTop(scored, 0.3);
  return scored.sort((a,b) => b.score - a.score)[0].hex;
}
```

### 14.4 Rubber Banding (Ajustare AscunsÄƒ)

```javascript
function getRubberBandAdjustment(playerStats) {
  if (playerStats.consecutiveLosses >= 3) return -0.10;  // AI 10% mai uÈ™oarÄƒ
  if (playerStats.consecutiveWins >= 5) return +0.10;    // AI 10% mai grea
  return 0;
}
// NU se afiÈ™eazÄƒ jucÄƒtorului (max Â±10%)
// Reset dupÄƒ fiecare win/loss
```

### 14.5 AI Taunts / Compliments

**Prietenos:**
- "BunÄƒ mutare! Ai gÃ¢ndit bine asta."
- "Noroc la zaruri!"
- "FelicitÄƒri pentru Cel mai Lung Drum!"

**Echilibrat:**
- "Interesant... Nu mÄƒ aÈ™teptam la asta."
- "Saptul Calnic are nevoie de un lider puternic."
- "Mutare riscantÄƒ. SÄƒ vedem cum iese."

**Strateg:**
- "Eforturile tale sunt... amuzante."
- "Cetatea Calnic va fi a mea."
- "Ai uitat cÄƒ am 3 cavaleri?"

---

## 15. Win / Lose â€” Ecrane È™i AnimaÈ›ii

### 15.1 Win Modal

Trigger: calculateVP("player") >= vpTarget

SecvenÈ›a:
1. Zarurile/acÈ›iunile se opresc
2. VP cards ascunse â†’ se reveleazÄƒ cu flip animaÈ›ie (0.5s fiecare)
3. Confetti auriu cade pe ecran (3s)
4. Modal apare scale 0â†’1 (0.6s)
5. Sunet: win_fanfare.mp3

ConÈ›inut:
```
VICTORIE!
[Trofeul auriu rotindu-se]

Ai construit Calnicul medieval!

Scor Final:
  AÈ™ezÄƒri: 2 VP
  OraÈ™e: 4 VP
  Longest Road: 2 VP
  TOTAL: 8 / 9 VP

Tura: 22 | Timp: 14:32

Puncte Sezon CÃ¢È™tigate:
  9 VP Standard: +3 pct
  Strateg: +2 pct
  TOTAL: +5 puncte sezon

[Joc Nou]  [Clasament]  [AcasÄƒ]
```

### 15.2 Lose Modal

Trigger: calculateVP("ai") >= vpTarget

SecvenÈ›a:
1. Screen shake (0.5s)
2. Overlay Ã®ntunecat treptat
3. Modal cu animaÈ›ie "thump"
4. Sunet: lose_theme.mp3

ConÈ›inut:
```
ÃŽNFRÃ‚NGERE

AI-ul a cÃ¢È™tigat cu [X] VP

Tu: [Y] VP | AI: [Z] VP
DiferenÈ›Äƒ: [X-Y] VP

[ÃŽncearcÄƒ Din Nou]  [AcasÄƒ]
```

---

## 16. Sezoane È™i Leaderboard

### 16.1 Structura Sezonului

| Element | Detaliu |
|---------|---------|
| DuratÄƒ | ~30 zile (luna calendaristicÄƒ) |
| Format cod | YYYY-MM (ex: "2026-04") |
| Start | Ziua 1, 00:00 EET |
| SfÃ¢rÈ™it | Ultima zi, 23:59 EET |
| Reset | Automat via Supabase Edge Function cron |

### 16.2 Formula Puncte Sezon

```
Puncte = VP_Bonus + Difficulty_Bonus

VP Bonus:    8 VP â†’ +2 | 9 VP â†’ +3 | 10 VP â†’ +4
Diff Bonus:  Easy â†’ +0 | Medium â†’ +1 | Hard â†’ +2

Maxim per joc: 4 + 2 = 6 puncte
```

### 16.3 Leaderboard UI

- Top 10 familii per sezon curent
- Coloane: Rang | Nume Familie | Puncte | Jocuri | Best Time
- Badge-uri vizibile lÃ¢ngÄƒ nume
- JucÄƒtorul curent evidenÈ›iat
- Refresh automat la deschidere

### 16.4 Season Progress Ã®n Header

- "Sezon 2026-04 | Tu: 12 pct | #3 Ã®n clasament"
- Countdown: "6 zile rÄƒmase"

### 16.5 End of Season Modal

La prima vizitÄƒ dupÄƒ finalul sezonului:
- AnunÈ›Äƒ rezultatul final
- AfiÈ™eazÄƒ badge-urile cÃ¢È™tigate cu animaÈ›ie
- Preview sezon nou

### 16.6 Supabase Schema

```sql
CREATE TABLE families (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  founder_crown BOOLEAN DEFAULT false,
  crown_count INTEGER DEFAULT 0,
  season_star TEXT[] DEFAULT ARRAY[]::TEXT[],
  gold_count INTEGER DEFAULT 0,
  tradition_keeper BOOLEAN DEFAULT false,
  silver_count INTEGER DEFAULT 0,
  friend_of_village BOOLEAN DEFAULT false,
  bronze_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE game_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id UUID REFERENCES families(id),
  season TEXT NOT NULL,
  total_points INTEGER NOT NULL CHECK (total_points BETWEEN 0 AND 60),
  games_played INTEGER DEFAULT 1 CHECK (games_played > 0),
  best_duration INTEGER,
  best_vp_target INTEGER,
  best_difficulty TEXT,
  games_won INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(family_id, season)
);

CREATE TABLE seasons (
  code TEXT PRIMARY KEY,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  status TEXT DEFAULT 'active' CHECK (status IN ('active','finalized','archived')),
  rewards_distributed BOOLEAN DEFAULT false,
  winner_family_id UUID REFERENCES families(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 17. Onoruri È™i Badge-uri

### 17.1 Ctitorul Calnicului (Cel mai Ã®nalt Onor)

- Criteriu: 2+ sezoane cÃ¢È™tigate (nu neapÄƒrat consecutive)
- Visual: coroanÄƒ permanentÄƒ lÃ¢ngÄƒ nume pe calniconline.ro
- Stackable: Nu (o singurÄƒ coroanÄƒ)

### 17.2 Steaua Satului (Locul 1) â€” EvoluÈ›ie Badge

- Ã—1: Medalie circularÄƒ simplÄƒ aurie
- Ã—2: Medalie Ã®n ramÄƒ hexagonalÄƒ metalicÄƒ
- Ã—3+: Scut + coroanÄƒ flotantÄƒ + laur auriu

### 17.3 PÄƒstrÄƒtorul TradiÈ›iilor (Locul 2)

AceeaÈ™i evoluÈ›ie Ã®n argint (#C0C0C0).

### 17.4 Prietenul Satului (Locul 3)

AceeaÈ™i evoluÈ›ie Ã®n bronz (#CD7F32).

### 17.5 Reguli Display

- Badge-urile apar o singurÄƒ datÄƒ lÃ¢ngÄƒ nume (nu se repetÄƒ)
- Tooltip la hover: "Steaua Satului Ã—2"
- AnimaÈ›ie la cÃ¢È™tigare: glow + scale pulse (1s)
- PaginÄƒ "ColecÈ›ie Badge-uri" Ã®n profil

---

## 18. Tutorial

### 18.1 Triggere

- Prima vizitÄƒ pe site (din localStorage)
- Buton "?" permanent Ã®n header Ã®n timpul jocului
- Buton "Tutorial" pe Start Screen

### 18.2 Cei 5 PaÈ™i

**Pasul 1 â€” Bun venit (~15s)**
```
Bun venit Ã®n Calnic!
ConstruieÈ™te un sat medieval, colecteazÄƒ resurse È™i Ã®nfrÃ¢nge AI-ul.
Scop: Primul care atinge [X] VP cÃ¢È™tigÄƒ!
[ContinuÄƒ Tutorial]  [Skip]
```

**Pasul 2 â€” Tabla È™i Resursele (~20s)**
- Highlight animat pe hexagoane
```
Tabla de Joc
Fiecare hexagon produce o resursÄƒ cÃ¢nd zarurile aratÄƒ numÄƒrul sÄƒu.
Wood / Brick / Ore / Grain / Wool
Sfat: PlaseazÄƒ AÈ™ezÄƒrile lÃ¢ngÄƒ numerele 6, 8 È™i 5!
[Next]  [Back]
```

**Pasul 3 â€” AruncÄƒ Zarurile (interactiv, ~30s)**
- Highlight pe Roll Dice, restul UI blocat
```
Acum tu!
ApasÄƒ Roll Dice pentru a arunca zarurile.
(dupÄƒ roll)
Ai primit: 1 Wood + 1 Grain â€” Acum poÈ›i construi!
[Next]
```

**Pasul 4 â€” ConstrucÈ›ii È™i Carduri (~30s)**
- Highlight pe panoul ConstrucÈ›ii
```
ConstruieÈ™te È™i CumpÄƒrÄƒ Carduri
Road: 1 Wood + 1 Brick
Settlement: 1 Wood + 1 Brick + 1 Grain + 1 Wool (+1 VP)
City: 3 Ore + 2 Grain (+2 VP)
Dev Card: 1 Ore + 1 Grain + 1 Wool
Cardurile dau efecte speciale sau VP!
[Next]  [Back]
```

**Pasul 5 â€” TranzacÈ›ii È™i Victorie (~20s)**
```
TranzacÈ›ii È™i Victorie
Nu ai resursele necesare?
  Trade cu AI â€” 1Ã— per turÄƒ
  Trade cu Banca â€” 4:1 (sau mai bine la porturi)
CÃ¢È™tigÄƒ cÃ¢nd atingi [X] VP!

Tutorial complet! Succes Ã®n Calnic!
[ÃŽncepe Jocul]  [RepetÄƒ]
```

### 18.3 Implementare

- Overlay semi-transparent pe joc (pointer-events: none pe ce nu e evidenÈ›iat)
- Progress indicator: "3 / 5"
- Skip pe toÈ›i paÈ™ii
- Stare salvatÄƒ: `localStorage.tutorialCompleted = true`

---

## 19. Sunete È™i AnimaÈ›ii

### 19.1 FiÈ™iere Audio

| FiÈ™ier | Eveniment |
|--------|-----------|
| dice_roll.mp3 | Aruncarea zarurilor |
| resource_collect.mp3 | Primire resurse |
| robber_alert.mp3 | Roll 7 |
| build_road.mp3 | Construire drum |
| build_settlement.mp3 | Construire aÈ™ezare |
| build_city.mp3 | Upgrade oraÈ™ |
| card_flip.mp3 | CumpÄƒrare/play card |
| trade_success.mp3 | Trade acceptat |
| trade_fail.mp3 | Trade refuzat |
| longest_road.mp3 | CÃ¢È™tigare longest road |
| largest_army.mp3 | CÃ¢È™tigare largest army |
| win_fanfare.mp3 | Victorie |
| lose_theme.mp3 | ÃŽnfrÃ¢ngere |
| background_music.mp3 | MuzicÄƒ ambientalÄƒ medievalÄƒ (loop) |

### 19.2 SetÄƒri Audio

- Buton mute/unmute Ã®n header (persistent Ã®n localStorage)
- Slider volum efecte (0â€“100%, default 70%)
- Slider volum muzicÄƒ (0â€“100%, default 30%)

### 19.3 AnimaÈ›ii Principale

| AnimaÈ›ie | DuratÄƒ | Descriere |
|----------|--------|-----------|
| Dice bounce | 1.5s | Zaruri rotesc È™i bounce de 3 ori |
| Hex flash | 0.5s | Hex-urile active la roll se aprind |
| Resource float | 0.8s | Icoane resurse floteazÄƒ de la hex spre panel |
| Settlement appear | 0.4s | Scale 0â†’1 + bounce |
| City upgrade | 0.6s | Morphing Settlement â†’ City |
| Card flip | 0.8s | RotaÈ›ie 3D pe axa Y |
| Robber jump | 0.5s | HoÈ›ul sare arcuit pe noul hex |
| Screen shake | 0.3s | La roll 7 |
| Confetti win | 3s | Particule aurii È™i colorate |
| Win modal | 0.6s | Scale + fade in |
| Badge earn | 1s | Glow pulse + scale |

---

## 20. UI/Visual Design â€” Final

### 20.1 ReferinÈ›Äƒ VizualÄƒ

- Layout general: amazing.png â€” panouri laterale lemn sculptat, board central, header medieval
- Hexagoane: pozahexagon.png â€” borduri aurii ornamentale groase, ilustraÈ›ii pictate
- Ton: medieval warm, pergament, auriu, lemn Ã®nchis

### 20.2 PaletÄƒ Culori

```css
--wood-dark: #2c1a0a;
--wood-mid: #3d2510;
--wood-light: #5a3820;
--gold: #e8b84b;
--gold-bright: #ffd700;
--gold-dim: #a07828;
--gold-border: #8b6914;
--parchment: #f0e4c4;
--ink: #1a0d04;
--red-hot: #cc4444;
--green-action: #2d5a14;
--red-danger: #8b1a0a;
```

### 20.3 Fonturi

- Titluri/Logo: Cinzel Decorative 700 (Google Fonts)
- Butoane/Numere: Cinzel 400/600
- Text normal: Crimson Text 400/600

### 20.4 Layout Desktop (1100px+)

```
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚  HEADER: Logo | Sezon + Puncte | RO/EN | Settings    â”‚  ~110px
â”œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¬â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¬â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¤
â”‚            â”‚                         â”‚               â”‚
â”‚  LEFT      â”‚      BOARD AREA         â”‚  RIGHT        â”‚
â”‚  PANEL     â”‚   (hex grid SVG)        â”‚  PANEL        â”‚
â”‚  165px     â”‚   ~70% width            â”‚  175px        â”‚
â”‚            â”‚                         â”‚               â”‚
â”‚ Resurse    â”‚  Background medieval    â”‚ ConstrucÈ›ii   â”‚
â”‚ Player     â”‚  peisaj + rÃ¢u           â”‚ Roll Dice     â”‚
â”‚ AI info    â”‚                         â”‚               â”‚
â”‚            â”‚                         â”‚               â”‚
â”œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”´â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”´â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¤
â”‚  STATUS BAR: VP Tu vs AI | Tura curentÄƒ              â”‚  ~34px
â”œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¤
â”‚  BOTTOM: Cards Hand | Turn Info + VP bars + End Turn â”‚  ~145px
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
```

### 20.5 Stilul Hexagoanelor

Fiecare tile are:
- BordurÄƒ aurie ornamentalÄƒ 3px (SVG polygon stroke)
- Interior cu ilustraÈ›ie SVG specificÄƒ tipului
- Vigneta gradient pe margini
- Token numÄƒr: cerc semi-transparent + numÄƒr Cinzel
- Puncte probabilitate (auriu standard, roÈ™u pentru 6/8)

Tipuri hex:
- PÄƒdure: fundal verde Ã®nchis + copaci SVG
- CÃ¢mp: fundal galben-auriu + tulpini de grÃ¢u
- PÄƒÈ™une: fundal verde mediu + siluete oi
- Munte: fundal gri-albÄƒstrui + vÃ¢rfuri stÃ¢ncoase
- Dealuri: fundal maro-roÈ™cat + rÃ¢nduri cÄƒrÄƒmizi
- DeÈ™ert: fundal bej-auriu + HoÈ›ul Ã®n centru

### 20.6 Butoane

- Roll Dice: verde 3D cu border bright green, zaruri albe, text auriu Cinzel
- End Turn: roÈ™u 3D cu border bright red, zaruri albe, text auriu Cinzel
- Build buttons: lemn sculptat cu border auriu, hover = glow auriu
- Trade button: mai subtil, border auriu dim

---

## 21. Mobile Responsive

### 21.1 Breakpoints

```css
@media (min-width: 1024px) { /* layout complet desktop */ }

@media (max-width: 1023px) {
  /* Board 100% lÄƒÈ›ime */
  /* Left/Right panel se muta sub board */
  /* Layout vertical */
}

@media (max-width: 767px) {
  /* Board scrollabil + pinch-to-zoom */
  /* Bottom panel scroll orizontal pentru cards */
  /* Touch targets min 44Ã—44px */
  /* Font-size minim 14px */
}
```

### 21.2 Mobile Specific

- Board: pinch-to-zoom (0.6xâ€“1.5x) + scroll
- Card hand: swipe orizontal
- Butoane min 44Ã—44px
- Panouri colaps/expand cu toggle pe telefon
- Testare: iPhone SE (375px), iPhone 14 (390px), iPad (768px), Pixel (393px)
- Portrait + landscape support

### 21.3 PWA Support

- manifest.json
- service-worker.js pentru offline
- Haptic feedback:
```javascript
function vibrate(pattern) {
  if ('vibrate' in navigator) navigator.vibrate(pattern);
}
// Roll dice: vibrate([100])
// Win: vibrate([200, 100, 200])
// Roll 7: vibrate([300])
```

---

## 22. Sistem Limbi

### 22.1 StructurÄƒ

```javascript
// lang/ro.js
const LANG_RO = {
  header: { season: "Sezon", points: "puncte" },
  game: { rollDice: "DÄƒ cu Zarurile", endTurn: "TerminÄƒ Tura", trade: "Schimb" },
  resources: { wood: "Lemn", Brick: "Caramida", ore: "Minereu", grain: "GrÃ¢u", wool: "LÃ¢nÄƒ" },
  // toate textele...
};

// lang/en.js â€” aceeaÈ™i structurÄƒ
```

### 22.2 Reguli

- Toate textele din cod sunt referinÈ›e la chei din lang/
- Niciun text hardcodat Ã®n HTML/JS
- Numerele È™i simbolurile resurselor sunt universale
- PreferinÈ›a salvatÄƒ Ã®n localStorage
- Detectare automatÄƒ din navigator.language la prima vizitÄƒ
- Switch instant fÄƒrÄƒ reload

---

## 23. Salvare È™i Restaurare (localStorage)

### 23.1 Ce se SalveazÄƒ

```javascript
const SAVE_STATE = {
  // Config
  vpTarget: 9,
  difficulty: "medium",
  language: "ro",
  audioSettings: { effects: 70, music: 30, muted: false },
  tutorialCompleted: true,
  playerName: "Ion",

  // Board
  boardSeed: 12345,
  hexes: [...],
  vertices: {...},
  edges: {...},

  // JucÄƒtori
  player: { resources: {...}, cards: [...], knightsPlayed: 1, vpCards: 0 },
  ai: { resources: {...}, cards: [...], knightsPlayed: 2, vpCards: 0 },

  // Stare joc
  currentTurn: "player",
  turnNumber: 15,
  turnState: {...},
  robberHex: "0,0",
  longestRoad: { holder: "player", playerLen: 6, aiLen: 3 },
  largestArmy: { holder: null, playerKnights: 1, aiKnights: 2 },
  cardDeck: [...],

  // Season (temporar)
  seasonPoints: 12,
  gamesPlayed: 4,
  gamesWon: 2,
  consecutiveWins: 1,
  consecutiveLosses: 0,
}
```

Cheie localStorage: `kelling_save_v2`

### 23.2 CÃ¢nd se SalveazÄƒ

- Auto-save dupÄƒ fiecare acÈ›iune (throttled 500ms)
- La deschidere: dacÄƒ existÄƒ save â†’ "ContinuÄƒ" sau "Joc Nou"
- La "Joc Nou": save-ul se È™terge

### 23.3 Restaurare Board

```javascript
function restoreGame(saveData) {
  const board = generateBoard(saveData.boardSeed);  // acelaÈ™i seed = acelaÈ™i board
  applyVertexStates(board, saveData.vertices);
  applyEdgeStates(board, saveData.edges);
  restorePlayerState(saveData.player);
  restoreAIState(saveData.ai);
  restoreTurnState(saveData.turnState);
}
```

---

## 24. ArhitecturÄƒ TehnicÄƒ

### 24.1 Stack

- **Frontend:** HTML5 + CSS3 + Vanilla JavaScript (no framework)
- **Backend:** Supabase (PostgreSQL + Edge Functions serverless)
- **Hosting:** GitHub Pages (static)
- **Storage:** localStorage (session) + Supabase (permanent)
- **Build:** niciun build step â€” fiÈ™iere statice servite direct

### 24.2 Game State Central

```javascript
const gameState = {
  board: { hexes, vertices, edges, ports },
  player: { resources, cards, buildings, knightsPlayed },
  ai: { resources, cards, buildings, knightsPlayed },
  turn: { current, number, state },
  robber: { hexId },
  longestRoad: { holder, playerLen, aiLen },
  largestArmy: { holder, playerKnights, aiKnights },
  deck: [...],
  config: { vpTarget, difficulty, language },
  season: { code, points, gamesPlayed }
};
```

### 24.3 PerformanÈ›Äƒ

- Imagini Ã®n format WebP (50% mai mici vs PNG)
- Lazy loading: assets board primul, carduri dupÄƒ
- SVG pentru hexagoane È™i clÄƒdiri (scalabile)
- Target: < 3MB total, < 2s load pe 4G
- requestAnimationFrame pentru animaÈ›ii JS

---

## 25. Securitate È™i Validare Scoruri

### 25.1 Problema

Joc client-side â†’ utilizator rÄƒu-intenÈ›ionat ar putea modifica scorul Ã®n localStorage.

### 25.2 Game Report la Finalul Jocului

```javascript
const gameReport = {
  familyId: "uuid",
  season: "2026-04",
  vpTarget: 9,
  difficulty: "hard",
  turnCount: 22,
  duration: 874,       // secunde
  timestamp: Date.now(),
  checksum: generateChecksum(gameData)
};
```

### 25.3 Edge Function Validare

```javascript
function validateGameReport(report) {
  if (!isSeasonActive(report.season)) return false;
  if (report.duration < 180 || report.duration > 3600) return false;  // 3-60 min
  if (report.turnCount < 10 || report.turnCount > 100) return false;
  if (![8, 9, 10].includes(report.vpTarget)) return false;
  if (!['easy', 'medium', 'hard'].includes(report.difficulty)) return false;
  if (!verifyChecksum(report)) return false;
  if (getGamesPlayedToday(report.familyId) > 20) return false;  // rate limit
  return true;
}
```

### 25.4 RLS Policies

```sql
ALTER TABLE families ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_scores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read" ON families FOR SELECT USING (true);
CREATE POLICY "Public read" ON game_scores FOR SELECT USING (true);

CREATE POLICY "Insert via function" ON game_scores
  FOR INSERT WITH CHECK (total_points BETWEEN 0 AND 60 AND games_played >= 1);
```

---

## 26. Structura FiÈ™ierelor

```
/kelling-origins/
â”œâ”€â”€ index.html
â”œâ”€â”€ game.html
â”œâ”€â”€ leaderboard.html
â”œâ”€â”€ about.html
â”œâ”€â”€ manifest.json
â”œâ”€â”€ service-worker.js
â”œâ”€â”€ README.md
â”‚
â”œâ”€â”€ css/
â”‚   â”œâ”€â”€ main.css
â”‚   â”œâ”€â”€ game.css
â”‚   â”œâ”€â”€ components.css
â”‚   â”œâ”€â”€ animations.css
â”‚   â””â”€â”€ responsive.css
â”‚
â”œâ”€â”€ js/
â”‚   â”œâ”€â”€ app.js          â€” iniÈ›ializare, routing
â”‚   â”œâ”€â”€ board.js        â€” generare board, coordonate, vertices, edges
â”‚   â”œâ”€â”€ game.js         â€” bucla principalÄƒ, state management
â”‚   â”œâ”€â”€ ai.js           â€” logica AI, dificultÄƒÈ›i, rubber banding
â”‚   â”œâ”€â”€ cards.js        â€” card system, deck, play logic
â”‚   â”œâ”€â”€ buildings.js    â€” plasare clÄƒdiri, validÄƒri, Longest Road
â”‚   â”œâ”€â”€ trading.js      â€” trade AI, bancÄƒ, porturi
â”‚   â”œâ”€â”€ resources.js    â€” distribuire resurse, roll logic
â”‚   â”œâ”€â”€ vp.js           â€” calcul VP, Largest Army, win check
â”‚   â”œâ”€â”€ seasons.js      â€” season tracking, puncte, sync Supabase
â”‚   â”œâ”€â”€ badges.js       â€” onoruri, badge evolution
â”‚   â”œâ”€â”€ tutorial.js     â€” tutorial system, highlights
â”‚   â”œâ”€â”€ audio.js        â€” sound manager
â”‚   â”œâ”€â”€ save.js         â€” localStorage save/load
â”‚   â”œâ”€â”€ ui.js           â€” render functions, notifications, modals
â”‚   â”œâ”€â”€ animations.js   â€” particule, confetti
â”‚   â”œâ”€â”€ validation.js   â€” score validation, anti-cheat
â”‚   â””â”€â”€ lang/
â”‚       â”œâ”€â”€ ro.js
â”‚       â””â”€â”€ en.js
â”‚
â”œâ”€â”€ assets/
â”‚   â”œâ”€â”€ images/
â”‚   â”‚   â”œâ”€â”€ board/      â€” hex-forest.webp, hex-grain.webp, etc.
â”‚   â”‚   â”œâ”€â”€ tokens/     â€” token-2.webp ... token-12.webp
â”‚   â”‚   â”œâ”€â”€ buildings/  â€” road.svg, settlement.svg, city.svg, robber.svg
â”‚   â”‚   â”œâ”€â”€ cards/      â€” card-back.webp + 24 card fronts
â”‚   â”‚   â”œâ”€â”€ badges/     â€” badge-gold-1.svg, badge-gold-2.svg, etc.
â”‚   â”‚   â””â”€â”€ ui/         â€” logo, buttons, backgrounds
â”‚   â””â”€â”€ sounds/
â”‚       â”œâ”€â”€ dice_roll.mp3
â”‚       â”œâ”€â”€ resource_collect.mp3
â”‚       â”œâ”€â”€ robber_alert.mp3
â”‚       â”œâ”€â”€ build_road.mp3
â”‚       â”œâ”€â”€ build_settlement.mp3
â”‚       â”œâ”€â”€ build_city.mp3
â”‚       â”œâ”€â”€ card_flip.mp3
â”‚       â”œâ”€â”€ trade_success.mp3
â”‚       â”œâ”€â”€ trade_fail.mp3
â”‚       â”œâ”€â”€ longest_road.mp3
â”‚       â”œâ”€â”€ largest_army.mp3
â”‚       â”œâ”€â”€ win_fanfare.mp3
â”‚       â”œâ”€â”€ lose_theme.mp3
â”‚       â””â”€â”€ background_music.mp3
â”‚
â”œâ”€â”€ supabase/
â”‚   â”œâ”€â”€ schema.sql
â”‚   â”œâ”€â”€ config.toml
â”‚   â””â”€â”€ edge-functions/
â”‚       â”œâ”€â”€ validate-score/index.ts
â”‚       â””â”€â”€ reset-season/index.ts
â”‚
â””â”€â”€ .github/workflows/deploy.yml
```

---

## 27. Ordine de Implementare

### Faza 1 â€” Core Game (MVP)

1. board.js â€” hexagoane, coordonate axiale, vertices, edges
2. ui.js (board render) â€” SVG cu hexagoane stilizate, intersecÈ›ii, muchii
3. buildings.js (initial placement) â€” click intersecÈ›ii, validare, highlight
4. resources.js â€” roll dice, distribui resurse
5. buildings.js (construcÈ›ii) â€” validare, plasare vizualÄƒ
6. game.js (robber) â€” roll 7, pierdere resurse, mutare hoÈ›
7. vp.js â€” tracking VP, detectare win
8. ai.js (basic) â€” roll, collect, build simplu
9. save.js â€” localStorage complet

### Faza 2 â€” Full Gameplay

10. trading.js â€” AI trade, bank trade, porturi
11. cards.js â€” toate 24 carduri, buy, play, flip
12. buildings.js (Longest Road) â€” DFS algorithm
13. vp.js (Largest Army) â€” tracking cavaleri
14. ai.js (full) â€” 3 dificultÄƒÈ›i, rubber banding, taunts
15. buildings.js (city) â€” upgrade, render, VP
16. ui.js (Win/Lose Modal) â€” animaÈ›ii, confetti

### Faza 3 â€” Polish

17. tutorial.js â€” 5 paÈ™i, highlight, skip
18. audio.js â€” toate sunetele, volume control
19. animations.js â€” float resurse, shake, particule
20. lang/ â€” RO/EN complet
21. responsive.css â€” mobile, touch, zoom

### Faza 4 â€” Backend

22. Supabase setup â€” tabele, RLS, conexiune
23. seasons.js â€” calcul puncte, sync
24. leaderboard.html â€” fetch + render
25. badges.js â€” logic, display, animaÈ›ii
26. Edge Function validate-score
27. Edge Function reset-season (cron)
28. PWA â€” manifest, service worker

---

## 28. FAQ

### General

**Q: Ce este Kelling: Origins of Calnic?**
A: Un joc de strategie single-player inspirat din istoria satului Calnic. ConstruieÈ™ti un sat medieval, colectezi resurse È™i Ã®nfrÃ¢ngi AI-ul ajungÃ¢nd primul la targetul de VP ales.

**Q: CÃ¢t dureazÄƒ o partidÄƒ?**
A: 10â€“25 minute, Ã®n funcÈ›ie de VP target ales (8/9/10 VP).

**Q: Pot juca pe mobil?**
A: Da, jocul este responsive È™i funcÈ›ioneazÄƒ pe desktop, tabletÄƒ È™i mobil.

**Q: Trebuie sÄƒ mÄƒ loghez?**
A: Nu. PoÈ›i juca cu un nickname. OpÈ›ional, conectezi contul de familie de pe calniconline.ro pentru a salva onorurile permanent.

### Mecanici de Joc

**Q: Cum colectez resurse?**
A: Arunci zarurile. DacÄƒ numÄƒrul obÈ›inut corespunde unui hex adiacent AÈ™ezÄƒrii/OraÈ™ului tÄƒu (fÄƒrÄƒ HoÈ› pe hex), primeÈ™ti resursa respectivÄƒ.

**Q: Ce se Ã®ntÃ¢mplÄƒ cÃ¢nd arunc 7?**
A: DacÄƒ ai >7 resurse, pierzi jumÄƒtate (aleatoriu). Apoi muÈ›i HoÈ›ul pe orice hex â€” blocheazÄƒ producÈ›ia È™i poÈ›i fura 1 resursÄƒ AI dacÄƒ are clÄƒdiri adiacente.

**Q: Cum cÃ¢È™tig?**
A: Primul la VP target ales (8, 9, sau 10 VP) cÃ¢È™tigÄƒ.

**Q: Ce surse de VP existÄƒ?**
A: AÈ™ezÄƒri (1VP), OraÈ™e (2VP), Carduri VP (1VP), Cel mai Lung Drum (2VP), Cea mai Mare ArmatÄƒ (2VP).

### Carduri

**Q: Cum cumpÄƒr un card?**
A: CostÄƒ 1 Ore + 1 Grain + 1 Wool. PrimeÈ™ti un card random din pachetul de 24.

**Q: CÃ¢nd pot juca un card?**
A: OricÃ¢nd Ã®n tura ta dupÄƒ roll. Max 1 card per turÄƒ. Nu poÈ›i juca un card Ã®n aceeaÈ™i turÄƒ Ã®n care l-ai cumpÄƒrat.

**Q: CÃ¢nd se reveleazÄƒ cardurile VP?**
A: Automat cÃ¢nd atingi VP target-ul.

### Trading

**Q: Cum fac schimb cu AI-ul?**
A: ApasÄƒ Schimb cu AI, alege ce dai È™i ce primeÈ™ti. AI-ul decide dacÄƒ acceptÄƒ. Max 1 schimb per turÄƒ.

**Q: Care e rata cu banca?**
A: 4:1 standard. Cu port generic 3:1, cu port specific 2:1.

### Sezoane È™i Onoruri

**Q: Cum funcÈ›ioneazÄƒ sezoanele?**
A: Fiecare lunÄƒ este un sezon nou (~30 zile). Scorurile se reseteazÄƒ, onorurile rÄƒmÃ¢n permanent.

**Q: Ce este Ctitorul Calnicului?**
A: Cel mai Ã®nalt onor â€” coroana apare permanent lÃ¢ngÄƒ numele tÄƒu pe calniconline.ro dacÄƒ cÃ¢È™tigi 2+ sezoane.

**Q: Pot pierde onorurile?**
A: Nu. OdatÄƒ cÃ¢È™tigate, sunt permanente.

### Tehnic

**Q: Se salveazÄƒ progresul dacÄƒ Ã®nchid jocul?**
A: Da! Auto-save dupÄƒ fiecare acÈ›iune. La redeschidere, continui exact de unde ai rÄƒmas.

**Q: Pot schimba limba Ã®n timpul jocului?**
A: Da, butonul RO/EN din header schimbÄƒ instant toate textele.

---

*GDD v2.0 FINAL â€” Kelling: Origins of Calnic*
*Joc pentru calniconline.ro â€” Inspirat din patrimoniul saxon al satului Calnic, judeÈ›ul Alba, RomÃ¢nia*

