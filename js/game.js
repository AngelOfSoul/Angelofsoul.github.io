(function () {
  'use strict';

  const SAVE_KEY = 'kelling-save-v1';
  const LEADERBOARD_KEY = 'kelling-leaderboard-v1';
  const PREF_KEY = 'kelling-prefs-v1';
  const ACHIEVEMENTS_KEY = 'kelling-achievements-v1';
  const BUILDING_SHEET = 'assets/game/poze/gen-A-sprite-sheet-of-medieval-buildings-for-a-strateg.png';
  const ROBBER_SHEET = 'assets/game/poze/gen-A-sprite-sheet-for-a-medieval-robber-character-pie.png';
  const MAX_UNDO_STEPS = 12;
  const AI_TURN_TIMEOUT_MS = 12000;
  const TEST_CONFIG = parseTestConfig();

  const TERRAIN_INFO = {
    wood: { label: 'Lemn', key: 'wood', img: 'assets/game/poze/1775113117.png' },
    grain: { label: 'Grâu', key: 'grain', img: 'assets/game/poze/1775113121.png' },
    ore: { label: 'Minereu', key: 'ore', img: 'assets/game/poze/1775113126.png' },
    wool: { label: 'Lână', key: 'wool', img: 'assets/game/poze/1775113138.png' },
    brick: { label: 'Caramida', key: 'brick', img: 'assets/game/poze/1775113132-new.png' },
    desert: { label: 'Deșert', key: null, img: 'assets/game/poze/gen-a3d8ca4f-4f65-4a19-86b5-f88a463ba4e5.png' }
  };

  const CARD_DEFS = {
    abundance: { name: 'Anul Abundenței', img: 'assets/game/poze/1775113121.png', text: '+2 resurse random' },
    mason: { name: 'Vestérul Pietrar', img: 'assets/game/poze/1775112573.png', text: 'Așezare la cost redus (fără lemn)' },
    caravan: { name: 'Caravană', img: 'assets/game/poze/1775113138.png', text: '+1 Drum gratuit' },
    crystalburst: { name: 'Focar Mineral', img: 'assets/game/poze/1775113132-new.png', text: '+1 caramida și +1 minereu' },
    knight: { name: 'Cavaler', img: 'assets/game/poze/1775113126.png', text: 'Mută hoțul și avansează Largest Army' }
  };

  const AXIALS = [
    [0, -2], [1, -2], [2, -2],
    [-1, -1], [0, -1], [1, -1], [2, -1],
    [-2, 0], [-1, 0], [0, 0], [1, 0], [2, 0],
    [-2, 1], [-1, 1], [0, 1], [1, 1],
    [-2, 2], [-1, 2], [0, 2]
  ];

  const TERRAIN_POOL = ['wood', 'wood', 'wood', 'wood', 'brick', 'brick', 'brick', 'ore', 'ore', 'ore', 'grain', 'grain', 'grain', 'grain', 'wool', 'wool', 'wool', 'wool'];
  const TOKENS = [2, 3, 3, 4, 4, 5, 5, 6, 6, 8, 8, 9, 9, 10, 10, 11, 11, 12];
  const dirs = [[1, 0], [1, -1], [0, -1], [-1, 0], [-1, 1], [0, 1]];
  const AI_PROFILES = {
    easy: { buildAttempts: 1, settleChance: 0.42, cityChance: 0.3, roadChance: 0.34, robberBias: 0.55, tradeChance: 0.18, cardUseChance: 0.15, cardDrawEvery: 8, maxTradesPerTurn: 1, reserveMin: 2 },
    normal: { buildAttempts: 2, settleChance: 0.72, cityChance: 0.66, roadChance: 0.62, robberBias: 1, tradeChance: 0.4, cardUseChance: 0.42, cardDrawEvery: 5, maxTradesPerTurn: 2, reserveMin: 1 },
    hard: { buildAttempts: 3, settleChance: 0.86, cityChance: 0.84, roadChance: 0.8, robberBias: 1.3, tradeChance: 0.68, cardUseChance: 0.72, cardDrawEvery: 4, maxTradesPerTurn: 3, reserveMin: 0 }
  };
  const PLAYER_CARD_DRAW_EVERY = 4;

  const state = {
    board: [],
    vpTarget: 9,
    aiMode: 'normal',
    nickname: 'Jucător',
    turn: 1,
    current: 'player',
    aiThinking: false,
    aiRecoveryTimerId: null,
    gameOver: false,
    phase: 'setup',
    rolled: false,
    diceRolling: false,
    robberHexId: null,
    pendingAction: null,
    roadBuildStart: null,
    roadBuildFree: false,
    selectedHex: null,
    setupPicks: { player: 0, ai: 0 },
    startedAt: Date.now(),
    cardPlayedThisTurn: false,
    undoStack: [],
    players: {
      player: { vp: 0, roads: 0, hasLongestRoad: false, hasLargestArmy: false, knightsPlayed: 0, resources: baseResources(), cards: [] },
      ai: { vp: 0, roads: 0, hasLongestRoad: false, hasLargestArmy: false, knightsPlayed: 0, resources: baseResources(), cards: [] }
    },
    effects: {
      player: { masonDiscount: false },
      ai: { masonDiscount: false }
    },
    roads: {
      player: [],
      ai: []
    },
    roadsByEdge: {
      player: [],
      ai: []
    },
    vertexClaims: {},
    hexVertexMap: {},
    roadStats: { player: 0, ai: 0 },
    armyStats: { player: 0, ai: 0 },
    topology: null,
    ports: [],
    deck: [],
    discard: [],
    matchStats: defaultMatchStats()
  };

  const spriteState = {
    loading: false,
    ready: false,
    frames: []
  };
  const robberSpriteState = {
    loading: false,
    ready: false,
    frames: []
  };
  let robberFrame = 0;
  let audioEnabled = true;
  let audioCtx = null;
  let saveBadgeText = 'Autosave ON';
  let achievements = defaultAchievementState();
  let achievementUnlockedSeen = {};
  let liveOwners = { road: null, army: null };
  let achievementToastTimer = null;
  let currentTradeMode = 'bank';
  let tutorialRequested = false;
  let tutorialFlow = {
    active: false,
    step: 0,
    signals: {
      setupDone: false,
      rolled: false,
      built: false,
      traded: false,
      cardPlayed: false,
      robberMoved: false,
      endedTurn: false,
      aiCycleDone: false,
      openedAchievements: false
    }
  };

  const ui = {
    board: document.getElementById('boardSvg'),
    turnLabel: document.getElementById('turnLabel'),
    phaseLabel: document.getElementById('phaseLabel'),
    aiModeBadge: document.getElementById('aiModeBadge'),
    saveBadge: document.getElementById('saveBadge'),
    soundToggleBtn: document.getElementById('soundToggleBtn'),
    hint: document.getElementById('boardHint'),
    tutorialHint: document.getElementById('tutorialHint'),
    cardHint: document.getElementById('cardHint'),
    dice: document.getElementById('diceResult'),
    playerRes: document.getElementById('playerResources'),
    eventLog: document.getElementById('eventLog'),
    playerVp: document.getElementById('playerVp'),
    aiVp: document.getElementById('aiVp'),
    targetVp: document.getElementById('targetVp'),
    playerNickname: document.getElementById('playerNickname'),
    profileAiMode: document.getElementById('profileAiMode'),
    openAchievementsBtn: document.getElementById('openAchievementsBtn'),
    liveLongestRoad: document.getElementById('liveLongestRoad'),
    liveLongestRoadWrap: document.getElementById('liveLongestRoadWrap'),
    liveLargestArmy: document.getElementById('liveLargestArmy'),
    liveLargestArmyWrap: document.getElementById('liveLargestArmyWrap'),
    liveVpRace: document.getElementById('liveVpRace'),
    rollBtn: document.getElementById('rollBtn'),
    undoBtn: document.getElementById('undoBtn'),
    endBtn: document.getElementById('endTurnBtn'),
    cancelActionBtn: document.getElementById('cancelActionBtn'),
    surrenderBtn: document.getElementById('surrenderBtn'),
    buildSettlementBtn: document.getElementById('buildSettlementBtn'),
    buildCityBtn: document.getElementById('buildCityBtn'),
    buildRoadBtn: document.getElementById('buildRoadBtn'),
    tradeOverlay: document.getElementById('tradeOverlay'),
    tradeModeLabel: document.getElementById('tradeModeLabel'),
    tradeModalHint: document.getElementById('tradeModalHint'),
    confirmTradeBtn: document.getElementById('confirmTradeBtn'),
    cancelTradeBtn: document.getElementById('cancelTradeBtn'),
    tradeTabAi: document.getElementById('tradeTabAi'),
    tradeTabBank: document.getElementById('tradeTabBank'),
    tradeTabPort: document.getElementById('tradeTabPort'),
    tradeGive: document.getElementById('tradeGive'),
    tradeGet: document.getElementById('tradeGet'),
    tradeRateInfo: document.getElementById('tradeRateInfo'),
    tradeBtn: document.getElementById('tradeBtn'),
    cardHand: document.getElementById('cardHand'),
    effectsStatus: document.getElementById('effectsStatus'),
    startOverlay: document.getElementById('startOverlay'),
    exportSaveBtn: document.getElementById('exportSaveBtn'),
    importSaveBtn: document.getElementById('importSaveBtn'),
    importSaveInput: document.getElementById('importSaveInput'),
    resetAllBtn: document.getElementById('resetAllBtn'),
    setupOverlay: document.getElementById('setupOverlay'),
    endOverlay: document.getElementById('endOverlay'),
    endTitle: document.getElementById('endTitle'),
    endSub: document.getElementById('endSub'),
    endStats: document.getElementById('endStats'),
    leaderboardOverlay: document.getElementById('leaderboardOverlay'),
    leaderboardTable: document.getElementById('leaderboardTable'),
    seasonLabel: document.getElementById('seasonLabel'),
    helpOverlay: document.getElementById('helpOverlay'),
    achievementsOverlay: document.getElementById('achievementsOverlay'),
    achievementsSummary: document.getElementById('achievementsSummary'),
    achievementsTotals: document.getElementById('achievementsTotals'),
    achievementsBadges: document.getElementById('achievementsBadges'),
    achievementToast: document.getElementById('achievementToast'),
    coachHint: document.getElementById('coachHint'),
    tutorialFlow: document.getElementById('tutorialFlow'),
    tutorialFlowTitle: document.getElementById('tutorialFlowTitle'),
    tutorialFlowProgress: document.getElementById('tutorialFlowProgress'),
    tutorialFlowText: document.getElementById('tutorialFlowText'),
    tutorialFlowGoal: document.getElementById('tutorialFlowGoal'),
    tutorialPrevBtn: document.getElementById('tutorialPrevBtn'),
    tutorialSkipBtn: document.getElementById('tutorialSkipBtn'),
    tutorialNextBtn: document.getElementById('tutorialNextBtn'),
    tutorialCloseBtn: document.getElementById('tutorialCloseBtn')
  };

  const HEX_SIZE = 82;
  const CENTER_X = 595;
  const CENTER_Y = 360;

  wireUi();
  loadPreferences();
  loadAchievements();
  initAchievementUnlockState();
  ensureBuildingSprites();
  ensureRobberSprites();
  if (!loadSaveToState()) {
    createBoard();
    buildBoardTopology();
    initPorts();
    initDeck();
    drawCard('player');
    drawCard('player');
    drawCard('player');
    drawCard('ai');
  } else if (!Array.isArray(state.ports) || !state.ports.length) {
    initPorts();
  }
  renderBoard();
  refreshUi();
  updateContinueButton();

  function baseResources() {
    return { wood: 2, brick: 2, grain: 2, wool: 2, ore: 1 };
  }

  function defaultMatchStats() {
    return {
      cardsPlayed: 0,
      knightsPlayed: 0,
      robberMoves: 0,
      settlementsBuilt: 0,
      citiesBuilt: 0,
      roadsBuilt: 0,
      longestRoadPeak: 0,
      largestArmyPeak: 0
    };
  }

  function defaultAchievementState() {
    return {
      gamesPlayed: 0,
      gamesWon: 0,
      maxVpReached: 0,
      bestTurnWin: null,
      cardsPlayed: 0,
      knightsPlayed: 0,
      robberMoves: 0,
      settlementsBuilt: 0,
      citiesBuilt: 0,
      roadsBuilt: 0,
      longestRoadRecord: 0,
      largestArmyRecord: 0
    };
  }

  function getAchievementBadgeDefs() {
    return [
      { key: 'first_match', icon: 'M1', title: 'Primul Meci', desc: 'Joacă 1 partidă', val: achievements.gamesPlayed, need: 1 },
      { key: 'veteran', icon: 'V10', title: 'Veteran', desc: 'Joacă 10 partide', val: achievements.gamesPlayed, need: 10 },
      { key: 'winner_5', icon: 'W5', title: 'Învingător', desc: 'Câștigă 5 partide', val: achievements.gamesWon, need: 5 },
      { key: 'winner_25', icon: 'W25', title: 'Comandant', desc: 'Câștigă 25 partide', val: achievements.gamesWon, need: 25 },
      { key: 'longest_road', icon: 'LR', title: 'Maestru Drumuri', desc: 'Longest Road record 8+', val: achievements.longestRoadRecord, need: 8 },
      { key: 'largest_army', icon: 'LA', title: 'General', desc: 'Largest Army record 5+', val: achievements.largestArmyRecord, need: 5 },
      { key: 'road_builder', icon: 'RD', title: 'Constructor', desc: 'Construiește 25 drumuri', val: achievements.roadsBuilt, need: 25 },
      { key: 'city_builder', icon: 'CT', title: 'Arhitect', desc: 'Construiește 10 orașe', val: achievements.citiesBuilt, need: 10 },
      { key: 'card_master', icon: 'CD', title: 'Cartofil', desc: 'Joacă 20 cărți', val: achievements.cardsPlayed, need: 20 },
      { key: 'robber_shadow', icon: 'RB', title: 'Umbra Hoțului', desc: 'Mută hoțul de 15 ori', val: achievements.robberMoves, need: 15 }
    ];
  }

  function initAchievementUnlockState() {
    const defs = getAchievementBadgeDefs();
    achievementUnlockedSeen = {};
    defs.forEach(item => {
      const value = Math.max(0, Number(item.val || 0));
      const need = Math.max(1, Number(item.need || 1));
      achievementUnlockedSeen[item.key] = value >= need;
    });
  }

  function resetResources() {
    state.players.player.resources = baseResources();
    state.players.ai.resources = baseResources();
  }

  function applyDifficultyPreset() {
    resetResources();
    if (state.aiMode === 'easy') {
      state.players.ai.resources.wood = Math.max(0, state.players.ai.resources.wood - 1);
      state.players.ai.resources.brick = Math.max(0, state.players.ai.resources.brick - 1);
      state.players.ai.resources.grain = Math.max(0, state.players.ai.resources.grain - 1);
      logEvent('Preset dificultate: Easy (AI slăbit).');
    } else if (state.aiMode === 'hard') {
      state.players.ai.resources.wood += 1;
      state.players.ai.resources.grain += 1;
      state.players.ai.resources.ore += 1;
      logEvent('Preset dificultate: Hard (AI pornește cu economie avansată).');
    } else {
      logEvent('Preset dificultate: Normal (fără bonusuri).');
    }
  }

  function initDeck() {
    state.deck = shuffle(buildDeckForMode(state.aiMode));
    state.discard = [];
  }

  function buildDeckForMode(mode) {
    const base = ['abundance', 'mason', 'caravan', 'crystalburst', 'abundance', 'caravan', 'mason'];
    const knightCount = mode === 'hard' ? 3 : mode === 'easy' ? 1 : 2;
    for (let i = 0; i < knightCount; i++) base.push('knight');
    if (mode === 'hard') base.push('crystalburst');
    if (mode === 'easy') base.push('abundance');
    return base;
  }

  function drawCard(owner) {
    if (!state.deck.length) {
      if (!state.discard.length) return;
      state.deck = shuffle(state.discard.slice());
      state.discard = [];
    }
    const card = state.deck.pop();
    state.players[owner].cards.push(card);
  }

  function resetGameState() {
    clearAiTurnRecovery();
    state.board = [];
    state.turn = 1;
    state.current = 'player';
    state.aiThinking = false;
    state.aiRecoveryTimerId = null;
    state.gameOver = false;
    state.phase = 'setup';
    state.rolled = false;
    state.diceRolling = false;
    state.robberHexId = null;
    state.pendingAction = null;
    state.roadBuildStart = null;
    state.roadBuildFree = false;
    state.selectedHex = null;
    state.setupPicks = { player: 0, ai: 0 };
    state.startedAt = Date.now();
    state.cardPlayedThisTurn = false;
    state.undoStack = [];
    state.players.player = { vp: 0, roads: 0, hasLongestRoad: false, hasLargestArmy: false, knightsPlayed: 0, resources: baseResources(), cards: [] };
    state.players.ai = { vp: 0, roads: 0, hasLongestRoad: false, hasLargestArmy: false, knightsPlayed: 0, resources: baseResources(), cards: [] };
    state.effects.player = { masonDiscount: false };
    state.effects.ai = { masonDiscount: false };
    state.roads.player = [];
    state.roads.ai = [];
    state.roadsByEdge = { player: [], ai: [] };
    state.vertexClaims = {};
    state.hexVertexMap = {};
    state.roadStats = { player: 0, ai: 0 };
    state.armyStats = { player: 0, ai: 0 };
    state.topology = null;
    state.ports = [];
    state.deck = [];
    state.discard = [];
    state.matchStats = defaultMatchStats();
    liveOwners = { road: null, army: null };

    createBoard();
    buildBoardTopology();
    initPorts();
    initDeck();
    drawCard('player');
    drawCard('player');
    drawCard('player');
    drawCard('ai');
    recalcVp();
  }

  function wireUi() {
    document.getElementById('startBtn').addEventListener('click', () => {
      clearSave();
      ui.startOverlay.classList.remove('show');
      ui.setupOverlay.classList.add('show');
    });
    const startTutorialFromStartBtn = document.getElementById('startTutorialFromStartBtn');
    if (startTutorialFromStartBtn) {
      startTutorialFromStartBtn.addEventListener('click', () => {
        tutorialRequested = true;
        const startBtn = document.getElementById('startBtn');
        if (startBtn) startBtn.click();
      });
    }

    document.getElementById('continueBtn').addEventListener('click', () => {
      if (!loadSaveToState()) return;
      ui.startOverlay.classList.remove('show');
      renderBoard();
      refreshUi();
      setHint('Partida a fost restaurată.');
    });
    document.getElementById('leaderboardBtn').addEventListener('click', openLeaderboard);
    if (ui.exportSaveBtn) ui.exportSaveBtn.addEventListener('click', exportSaveToFile);
    if (ui.importSaveBtn && ui.importSaveInput) {
      ui.importSaveBtn.addEventListener('click', () => ui.importSaveInput.click());
      ui.importSaveInput.addEventListener('change', onImportSaveFile);
    }
    if (ui.resetAllBtn) ui.resetAllBtn.addEventListener('click', resetAllData);
    const helpBtn = document.getElementById('helpBtn');
    if (helpBtn) helpBtn.addEventListener('click', openHelp);
    const startTutorialBtn = document.getElementById('startTutorialBtn');
    if (startTutorialBtn) startTutorialBtn.addEventListener('click', onStartTutorialClick);
    const settingsToggleBtn = document.getElementById('settingsToggleBtn');
    const settingsMenu = document.getElementById('settingsMenu');
    if (settingsToggleBtn && settingsMenu) {
      settingsToggleBtn.addEventListener('click', (ev) => {
        ev.stopPropagation();
        settingsMenu.hidden = !settingsMenu.hidden;
      });
      document.addEventListener('click', (ev) => {
        if (settingsMenu.hidden) return;
        const target = ev.target;
        if (!(target instanceof Element)) return;
        if (target === settingsToggleBtn || settingsMenu.contains(target)) return;
        settingsMenu.hidden = true;
      });
    }
    if (ui.openAchievementsBtn) ui.openAchievementsBtn.addEventListener('click', openAchievements);
    const closeAchievementsBtn = document.getElementById('closeAchievementsBtn');
    if (closeAchievementsBtn) closeAchievementsBtn.addEventListener('click', closeAchievements);
    const launchTutorialFromHelpBtn = document.getElementById('launchTutorialFromHelpBtn');
    if (launchTutorialFromHelpBtn) launchTutorialFromHelpBtn.addEventListener('click', () => {
      closeHelp();
      beginInteractiveTutorial();
    });
    if (ui.tutorialPrevBtn) ui.tutorialPrevBtn.addEventListener('click', tutorialPrevStep);
    if (ui.tutorialSkipBtn) ui.tutorialSkipBtn.addEventListener('click', tutorialSkipStep);
    if (ui.tutorialNextBtn) ui.tutorialNextBtn.addEventListener('click', tutorialNextStep);
    if (ui.tutorialCloseBtn) ui.tutorialCloseBtn.addEventListener('click', endInteractiveTutorial);

    document.querySelectorAll('#vpChoices button').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('#vpChoices button').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        state.vpTarget = Number(btn.dataset.vp);
        savePreferences();
      });
    });

    document.querySelectorAll('#aiChoices button').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('#aiChoices button').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        state.aiMode = btn.dataset.ai;
        if (ui.aiModeBadge) ui.aiModeBadge.textContent = `AI: ${aiModeLabel(state.aiMode)}`;
        savePreferences();
      });
    });

    const nickInput = document.getElementById('nicknameInput');
    if (nickInput) {
      nickInput.addEventListener('input', () => {
        const raw = String(nickInput.value || '');
        const cleaned = sanitizeNickname(raw);
        if (raw.trim()) state.nickname = cleaned;
        savePreferences();
      });
      nickInput.addEventListener('blur', () => {
        nickInput.value = sanitizeNickname(String(nickInput.value || ''));
      });
    }

    document.getElementById('beginGameBtn').addEventListener('click', () => {
      const nick = sanitizeNickname(String(document.getElementById('nicknameInput').value || ''));
      state.nickname = nick;
      if (nickInput) nickInput.value = nick;
      savePreferences();
      resetGameState();
      applyDifficultyPreset();
      ui.setupOverlay.classList.remove('show');
      state.phase = 'setup';
      state.startedAt = Date.now();
      logEvent('Setup finalizat. Selectează 2 hexagoane pentru așezări.');
      refreshUi();
      saveState();
      if (tutorialRequested) beginInteractiveTutorial();
    });

    document.getElementById('restartBtn').addEventListener('click', () => {
      clearSave();
      window.location.reload();
    });
    document.getElementById('showLeaderboardFromEndBtn').addEventListener('click', openLeaderboard);
    document.getElementById('closeLeaderboardBtn').addEventListener('click', closeLeaderboard);
    document.getElementById('clearLeaderboardBtn').addEventListener('click', clearLeaderboard);
    const closeHelpBtn = document.getElementById('closeHelpBtn');
    if (closeHelpBtn) closeHelpBtn.addEventListener('click', closeHelp);
    if (ui.leaderboardOverlay) {
      ui.leaderboardOverlay.addEventListener('click', (event) => {
        if (event.target === ui.leaderboardOverlay) closeLeaderboard();
      });
    }
    if (ui.helpOverlay) {
      ui.helpOverlay.addEventListener('click', (event) => {
        if (event.target === ui.helpOverlay) closeHelp();
      });
    }
    if (ui.achievementsOverlay) {
      ui.achievementsOverlay.addEventListener('click', (event) => {
        if (event.target === ui.achievementsOverlay) closeAchievements();
      });
    }

    ui.rollBtn.addEventListener('click', onRoll);
    ui.undoBtn.addEventListener('click', undoLastAction);
    ui.endBtn.addEventListener('click', endTurn);
    ui.cancelActionBtn.addEventListener('click', () => cancelPendingAction('manual'));
    if (ui.surrenderBtn) ui.surrenderBtn.addEventListener('click', surrenderGame);
    ui.soundToggleBtn.addEventListener('click', toggleSound);

    ui.buildSettlementBtn.addEventListener('click', () => {
      if (!isPlayerMain()) return;
      if (!state.rolled) return setHint('Aruncă zarurile înainte să construiești.');
      state.pendingAction = 'settlement';
      setHint('Alege un hexagon liber adiacent pentru Așezare.');
      renderBoard();
    });

    ui.buildCityBtn.addEventListener('click', () => {
      if (!isPlayerMain()) return;
      if (!state.rolled) return setHint('Aruncă zarurile înainte să construiești.');
      if (state.selectedHex == null) {
        state.pendingAction = 'city';
        setHint('Selectează un vertex cu așezarea ta pentru upgrade la oraș.');
        renderBoard();
        return;
      }
      buildCityAt(state.selectedHex, 'player');
    });

    ui.buildRoadBtn.addEventListener('click', () => {
      if (!isPlayerMain()) return;
      if (!state.rolled) return setHint('Aruncă zarurile înainte să construiești.');
      if (!state.roadBuildFree && !canPay('player', { wood: 1, brick: 1 })) return setHint('Nu ai resurse pentru Drum.');
      state.pendingAction = 'road';
      state.roadBuildStart = null;
      setHint('Selectează startul drumului (hex deținut sau capăt de drum existent).');
      renderBoard();
    });

    ui.tradeBtn.addEventListener('click', openTradeModal);
    if (ui.confirmTradeBtn) ui.confirmTradeBtn.addEventListener('click', () => doTrade(currentTradeMode));
    if (ui.cancelTradeBtn) ui.cancelTradeBtn.addEventListener('click', closeTradeModal);
    if (ui.tradeGive) ui.tradeGive.addEventListener('change', updateTradeModalUi);
    if (ui.tradeGet) ui.tradeGet.addEventListener('change', updateTradeModalUi);
    if (ui.tradeTabAi) ui.tradeTabAi.addEventListener('click', () => setTradeMode('ai'));
    if (ui.tradeTabBank) ui.tradeTabBank.addEventListener('click', () => setTradeMode('bank'));
    if (ui.tradeTabPort) ui.tradeTabPort.addEventListener('click', () => setTradeMode('port'));
    if (ui.tradeOverlay) {
      ui.tradeOverlay.addEventListener('click', (event) => {
        if (event.target === ui.tradeOverlay) closeTradeModal();
      });
    }
    document.addEventListener('keydown', onHotkey);
    document.addEventListener('visibilitychange', onVisibilityAutosave);
    window.addEventListener('pagehide', onPageHideAutosave);
  }

  function onHotkey(event) {
    const tag = (event.target && event.target.tagName) ? event.target.tagName.toLowerCase() : '';
    if (tag === 'input' || tag === 'textarea' || tag === 'select' || event.metaKey || event.ctrlKey || event.altKey) return;
    const key = String(event.key || '').toLowerCase();
    if (key === 'escape') {
      event.preventDefault();
      if (isOverlayShown(ui.tradeOverlay)) return closeTradeModal();
      if (isOverlayShown(ui.helpOverlay)) return closeHelp();
      if (isOverlayShown(ui.leaderboardOverlay)) return closeLeaderboard();
      if (isOverlayShown(ui.achievementsOverlay)) return closeAchievements();
      return cancelPendingAction('manual');
    }
    if (isAnyOverlayOpen()) return;
    if (key === 'r') {
      event.preventDefault();
      onRoll();
    } else if (key === 'u') {
      event.preventDefault();
      undoLastAction();
    } else if (key === 'e') {
      event.preventDefault();
      endTurn();
    } else if (key === 'b') {
      event.preventDefault();
      ui.buildSettlementBtn.click();
    } else if (key === 'c') {
      event.preventDefault();
      ui.buildCityBtn.click();
    } else if (key === 'd') {
      event.preventDefault();
      ui.buildRoadBtn.click();
    } else if (key === 't') {
      event.preventDefault();
      openTradeModal();
    } else if (key === 'q') {
      event.preventDefault();
      surrenderGame();
    }
  }

  function onStartTutorialClick() {
    tutorialRequested = true;
    if (isOverlayShown(ui.startOverlay)) {
      const startBtn = document.getElementById('startBtn');
      if (startBtn) startBtn.click();
      return;
    }
    if (isOverlayShown(ui.setupOverlay)) return;
    beginInteractiveTutorial();
  }

  function onVisibilityAutosave() {
    if (document.visibilityState !== 'hidden') return;
    maybeAutosaveOnLifecycle();
  }

  function onPageHideAutosave() {
    maybeAutosaveOnLifecycle();
  }

  function maybeAutosaveOnLifecycle() {
    if (state.phase === 'setup') return;
    if (state.gameOver) return;
    saveState();
  }

  function createBoard() {
    const terrains = shuffle(TERRAIN_POOL.slice());
    const centerIndex = AXIALS.findIndex(qr => qr[0] === 0 && qr[1] === 0);
    let tIdx = 0;
    const board = AXIALS.map((qr, i) => {
      const isCenter = i === centerIndex;
      return {
        id: i,
        q: qr[0],
        r: qr[1],
        terrain: isCenter ? 'desert' : terrains[tIdx++],
        token: null,
        owner: null,
        level: 0,
        robber: false,
        buildingSprite: null
      };
    });

    for (let t = 0; t < 2000; t++) {
      const tokens = shuffle(TOKENS.slice());
      let k = 0;
      board.forEach(h => { h.token = h.terrain === 'desert' ? null : tokens[k++]; });
      if (validHot(board)) break;
    }

    const desert = board.find(h => h.terrain === 'desert');
    if (desert) {
      desert.robber = true;
      state.robberHexId = desert.id;
    }
    state.board = board;
  }

  function initPorts() {
    state.ports = [
      { id: 'p1', hexId: 0, type: 'grain', rate: 2 },
      { id: 'p2', hexId: 2, type: 'ore', rate: 2 },
      { id: 'p3', hexId: 7, type: 'generic', rate: 3 },
      { id: 'p4', hexId: 11, type: 'brick', rate: 2 },
      { id: 'p5', hexId: 16, type: 'wood', rate: 2 },
      { id: 'p6', hexId: 18, type: 'wool', rate: 2 }
    ];
  }

  function validHot(board) {
    return board.every(hex => {
      if (hex.token !== 6 && hex.token !== 8) return true;
      return neighborsFrom(board, hex.id).every(nb => nb.token !== 6 && nb.token !== 8);
    });
  }

  function buildBoardTopology() {
    if (!Array.isArray(state.board) || !state.board.length) {
      state.topology = { vertices: [], edges: [], hexVertexIds: {}, edgeByVertices: {} };
      return;
    }
    const vertexByPoint = new Map();
    const vertices = [];
    const edges = [];
    const edgeByVertices = {};
    const hexVertexIds = {};

    function pointKey(x, y) {
      return `${Math.round(x * 10) / 10}|${Math.round(y * 10) / 10}`;
    }

    function edgeKey(a, b) {
      const x = Math.min(a, b);
      const y = Math.max(a, b);
      return `${x}-${y}`;
    }

    state.board.forEach(hex => {
      const corners = hexCornerPoints(hex, HEX_SIZE);
      const ids = corners.map(pt => {
        const key = pointKey(pt.x, pt.y);
        let id = vertexByPoint.get(key);
        if (typeof id !== 'number') {
          id = vertices.length;
          vertexByPoint.set(key, id);
          vertices.push({ id, x: pt.x, y: pt.y, hexIds: [hex.id] });
        } else {
          const v = vertices[id];
          if (v.hexIds.indexOf(hex.id) === -1) v.hexIds.push(hex.id);
        }
        return id;
      });
      hexVertexIds[hex.id] = ids;
      for (let i = 0; i < ids.length; i++) {
        const a = ids[i];
        const b = ids[(i + 1) % ids.length];
        const key = edgeKey(a, b);
        if (typeof edgeByVertices[key] === 'number') {
          const e = edges[edgeByVertices[key]];
          if (e.hexIds.indexOf(hex.id) === -1) e.hexIds.push(hex.id);
        } else {
          const id = edges.length;
          edgeByVertices[key] = id;
          edges.push({ id, a, b, hexIds: [hex.id] });
        }
      }
    });

    state.topology = { vertices, edges, hexVertexIds, edgeByVertices };
    syncRoadEdgesFromLegacy();
    ensureVertexClaimsFromBoard();
  }

  function edgeTopologyIdFromHexPair(hexA, hexB) {
    const topo = state.topology;
    if (!topo || !topo.hexVertexIds || !topo.edgeByVertices) return null;
    const va = topo.hexVertexIds[hexA];
    const vb = topo.hexVertexIds[hexB];
    if (!Array.isArray(va) || !Array.isArray(vb)) return null;
    const shared = va.filter(id => vb.indexOf(id) !== -1);
    if (shared.length < 2) return null;
    const a = Math.min(shared[0], shared[1]);
    const b = Math.max(shared[0], shared[1]);
    const key = `${a}-${b}`;
    return (typeof topo.edgeByVertices[key] === 'number') ? topo.edgeByVertices[key] : null;
  }

  function syncRoadEdgesFromLegacy() {
    if (!state.topology || !state.topology.edges) return;
    if (!state.roadsByEdge || typeof state.roadsByEdge !== 'object') {
      state.roadsByEdge = { player: [], ai: [] };
    }
    ['player', 'ai'].forEach(owner => {
      const legacy = Array.isArray(state.roads[owner]) ? state.roads[owner] : [];
      const mapped = [];
      legacy.forEach(key => {
        const pair = parseRoadKey(key);
        if (!pair) return;
        const eid = edgeTopologyIdFromHexPair(pair[0], pair[1]);
        if (typeof eid !== 'number') return;
        if (mapped.indexOf(eid) === -1) mapped.push(eid);
      });
      const existing = Array.isArray(state.roadsByEdge[owner]) ? state.roadsByEdge[owner] : [];
      const merged = existing
        .map(Number)
        .filter(id => Number.isFinite(id) && state.topology.edges[id])
        .concat(mapped)
        .filter((id, idx, arr) => arr.indexOf(id) === idx);
      state.roadsByEdge[owner] = merged;
      if (!Array.isArray(state.roads[owner])) state.roads[owner] = [];
      merged.forEach(edgeId => {
        const e = state.topology.edges[edgeId];
        if (!e || !Array.isArray(e.hexIds) || e.hexIds.length < 2) return;
        const key = roadKey(e.hexIds[0], e.hexIds[1]);
        if (state.roads[owner].indexOf(key) === -1) state.roads[owner].push(key);
      });
    });
  }

  function roadEdgeIds(owner) {
    const topo = state.topology;
    if (!topo || !Array.isArray(topo.edges)) return [];
    const fromEdges = (state.roadsByEdge && Array.isArray(state.roadsByEdge[owner]) ? state.roadsByEdge[owner] : [])
      .map(Number)
      .filter(id => Number.isFinite(id) && topo.edges[id]);
    const fromLegacy = (state.roads && Array.isArray(state.roads[owner]) ? state.roads[owner] : [])
      .map(parseRoadKey)
      .filter(Boolean)
      .map(pair => edgeTopologyIdFromHexPair(pair[0], pair[1]))
      .filter(id => typeof id === 'number');
    return fromEdges.concat(fromLegacy).filter((id, idx, arr) => arr.indexOf(id) === idx);
  }

  function roadHexKeys(owner) {
    if (!state.roads || !Array.isArray(state.roads[owner])) return [];
    return state.roads[owner]
      .map(k => String(k))
      .filter(k => !!parseRoadKey(k))
      .filter((k, idx, arr) => arr.indexOf(k) === idx);
  }

  function addRoad(owner, a, b) {
    if (!state.roads || typeof state.roads !== 'object') state.roads = { player: [], ai: [] };
    if (!Array.isArray(state.roads[owner])) state.roads[owner] = [];
    if (!state.roadsByEdge || typeof state.roadsByEdge !== 'object') state.roadsByEdge = { player: [], ai: [] };
    if (!Array.isArray(state.roadsByEdge[owner])) state.roadsByEdge[owner] = [];
    const key = roadKey(a, b);
    if (state.roads[owner].indexOf(key) === -1) state.roads[owner].push(key);
    const edgeId = edgeTopologyIdFromHexPair(a, b);
    if (typeof edgeId === 'number' && state.roadsByEdge[owner].indexOf(edgeId) === -1) {
      state.roadsByEdge[owner].push(edgeId);
    }
  }

  function vertexClaim(vId) {
    return state.vertexClaims ? state.vertexClaims[String(vId)] : null;
  }

  function setVertexClaim(vId, owner, level, hexId) {
    if (!state.vertexClaims || typeof state.vertexClaims !== 'object') state.vertexClaims = {};
    if (!state.hexVertexMap || typeof state.hexVertexMap !== 'object') state.hexVertexMap = {};
    state.vertexClaims[String(vId)] = { owner, level, hexId };
    state.hexVertexMap[String(hexId)] = vId;
    reconcileLegacyBoardFromClaims();
  }

  function adjacentVertexIds(vId) {
    const topo = state.topology;
    if (!topo || !Array.isArray(topo.edges)) return [];
    const out = [];
    topo.edges.forEach(e => {
      if (!e) return;
      if (e.a === vId) out.push(e.b);
      else if (e.b === vId) out.push(e.a);
    });
    return out;
  }

  function canClaimVertex(vId) {
    if (vertexClaim(vId)) return false;
    const adj = adjacentVertexIds(vId);
    return adj.every(id => !vertexClaim(id));
  }

  function pickBestHexForVertex(vId, owner, requireOwned, requireFree) {
    const topo = state.topology;
    if (!topo || !topo.vertices || !topo.vertices[vId]) return null;
    const ids = topo.vertices[vId].hexIds || [];
    const candidates = ids
      .map(id => state.board[id])
      .filter(Boolean)
      .filter(hex => {
        if (!requireOwned) return true;
        if (hasAnyVertexClaims()) return ownerControlsHexViaClaims(owner, hex.id);
        return ownerControlsHexViaClaims(owner, hex.id) || hex.owner === owner;
      })
      .filter(hex => {
        if (!requireFree) return true;
        if (hasAnyVertexClaims()) return !claimsAroundHex(hex.id).length;
        return !claimsAroundHex(hex.id).length && !hex.owner;
      })
      .sort((a, b) => expectedYield(b) - expectedYield(a));
    return candidates[0] || null;
  }

  function ensureVertexClaimsFromBoard() {
    if (!state.topology || !state.topology.hexVertexIds) return;
    if (!state.vertexClaims || typeof state.vertexClaims !== 'object') state.vertexClaims = {};
    if (!state.hexVertexMap || typeof state.hexVertexMap !== 'object') state.hexVertexMap = {};
    state.board.forEach(hex => {
      if (!hex || !hex.owner || !hex.level) return;
      const key = String(hex.id);
      const mapped = state.hexVertexMap[key];
      if (typeof mapped === 'number' && vertexClaim(mapped)) return;
      const verts = state.topology.hexVertexIds[hex.id] || [];
      const free = verts.find(vId => !vertexClaim(vId));
      const chosen = (typeof free === 'number') ? free : verts[0];
      if (typeof chosen === 'number') {
        setVertexClaim(chosen, hex.owner, hex.level, hex.id);
      }
    });
  }

  function assignDefaultVertexForHex(hexId, owner, level) {
    const topo = state.topology;
    if (!topo || !topo.hexVertexIds) return;
    if (typeof state.hexVertexMap[String(hexId)] === 'number') return;
    const verts = topo.hexVertexIds[hexId] || [];
    const free = verts.find(vId => !vertexClaim(vId));
    const chosen = (typeof free === 'number') ? free : verts[0];
    if (typeof chosen === 'number') setVertexClaim(chosen, owner, level, hexId);
  }

  function ownedVertexClaims(owner) {
    if (!state.vertexClaims || typeof state.vertexClaims !== 'object') return [];
    return Object.keys(state.vertexClaims)
      .map(k => {
        const vId = Number(k);
        const claim = state.vertexClaims[k];
        return { vId, claim };
      })
      .filter(row => Number.isFinite(row.vId) && row.claim && row.claim.owner === owner && Number(row.claim.level || 0) > 0);
  }

  function hasAnyVertexClaims() {
    return !!(state.vertexClaims && Object.keys(state.vertexClaims).length);
  }

  function reconcileLegacyBoardFromClaims() {
    if (!Array.isArray(state.board) || !state.board.length) return;
    if (!hasAnyVertexClaims()) return;
    state.board.forEach(hex => {
      if (!hex) return;
      hex.owner = null;
      hex.level = 0;
    });
    Object.keys(state.vertexClaims || {}).forEach(k => {
      const claim = state.vertexClaims[k];
      if (!claim || !claim.owner) return;
      const hexId = Number(claim.hexId);
      if (!Number.isFinite(hexId) || !state.board[hexId]) return;
      const lvl = Math.max(0, Number(claim.level || 0));
      const hex = state.board[hexId];
      if (!hex.owner || lvl > Number(hex.level || 0)) {
        hex.owner = claim.owner;
        hex.level = lvl;
      }
    });
  }

  function claimsAroundHex(hexId) {
    const topo = state.topology;
    if (!topo || !Array.isArray(topo.vertices)) return [];
    const out = [];
    topo.vertices.forEach(v => {
      if (!v || !Array.isArray(v.hexIds)) return;
      if (v.hexIds.indexOf(hexId) === -1) return;
      const claim = vertexClaim(v.id);
      if (!claim || !claim.owner || Number(claim.level || 0) <= 0) return;
      out.push({ vId: v.id, claim });
    });
    return out;
  }

  function ownerControlsHexViaClaims(owner, hexId) {
    return claimsAroundHex(hexId).some(row => row.claim.owner === owner);
  }

  function ownerHasRoadAtVertex(owner, vId) {
    const topo = state.topology;
    if (!topo || !Array.isArray(topo.edges)) return false;
    const arr = roadEdgeIds(owner);
    for (let i = 0; i < arr.length; i++) {
      const e = topo.edges[arr[i]];
      if (!e) continue;
      if (e.a === vId || e.b === vId) return true;
    }
    return false;
  }

  function canOwnerExpandToVertex(owner, vId) {
    if (!canClaimVertex(vId)) return false;
    const topo = state.topology;
    const claims = ownedVertexClaims(owner);
    if (!claims.length) return true;
    const adjV = adjacentVertexIds(vId);
    if (adjV.some(id => {
      const c = vertexClaim(id);
      return !!c && c.owner === owner;
    })) return true;
    if (ownerHasRoadAtVertex(owner, vId)) return true;
    if (!topo || !Array.isArray(topo.vertices) || !topo.vertices[vId]) return false;
    const hexIds = topo.vertices[vId].hexIds || [];
    return hexIds.some(hexId => {
      const hex = state.board[hexId];
      if (!hex) return false;
      if (hasAnyVertexClaims()) return ownerControlsHexViaClaims(owner, hexId);
      return ownerControlsHexViaClaims(owner, hexId) || hex.owner === owner;
    });
  }

  function scoreVertex(vId, owner) {
    const topo = state.topology;
    if (!topo || !Array.isArray(topo.vertices) || !topo.vertices[vId]) return -9999;
    const hexIds = topo.vertices[vId].hexIds || [];
    let score = 0;
    hexIds.forEach(hexId => {
      const hex = state.board[hexId];
      if (!hex) return;
      score += expectedYield(hex);
      if (hex.terrain === 'ore' || hex.terrain === 'grain') score += 0.3;
      if (hasAnyVertexClaims() ? ownerControlsHexViaClaims(owner, hex.id) : (ownerControlsHexViaClaims(owner, hex.id) || hex.owner === owner)) {
        score += 0.2;
      }
    });
    if (ownerHasRoadAtVertex(owner, vId)) score += 0.8;
    return score;
  }

  function aiPickSettlementVertex(owner, requireConnection) {
    const topo = state.topology;
    if (!topo || !Array.isArray(topo.vertices)) return null;
    const candidates = topo.vertices
      .filter(v => !!v)
      .filter(v => canClaimVertex(v.id))
      .filter(v => !requireConnection || canOwnerExpandToVertex(owner, v.id))
      .map(v => ({ vId: v.id, score: scoreVertex(v.id, owner) }))
      .sort((a, b) => b.score - a.score);
    if (!candidates.length) return null;
    const vId = candidates[0].vId;
    const hex = pickBestHexForVertex(vId, owner, false, false);
    if (!hex) return null;
    return { vId, hexId: hex.id };
  }

  function neighbors(id) { return neighborsFrom(state.board, id); }
  function neighborsFrom(board, id) {
    const h = board[id];
    const arr = [];
    for (const d of dirs) {
      const n = board.find(x => x.q === h.q + d[0] && x.r === h.r + d[1]);
      if (n) arr.push(n);
    }
    return arr;
  }

  function renderBoard() {
    ui.board.innerHTML = '';
    const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
    Object.keys(TERRAIN_INFO).forEach(key => {
      const p = document.createElementNS('http://www.w3.org/2000/svg', 'pattern');
      p.setAttribute('id', `tex-${key}`);
      p.setAttribute('patternUnits', 'objectBoundingBox');
      p.setAttribute('width', '1');
      p.setAttribute('height', '1');
      const img = document.createElementNS('http://www.w3.org/2000/svg', 'image');
      img.setAttribute('href', TERRAIN_INFO[key].img);
      img.setAttribute('x', '0'); img.setAttribute('y', '0'); img.setAttribute('width', '320'); img.setAttribute('height', '320');
      img.setAttribute('preserveAspectRatio', 'xMidYMid slice');
      p.appendChild(img);
      defs.appendChild(p);
    });
    ui.board.appendChild(defs);

    state.board.forEach(hex => {
      const c = hexToPixel(hex.q, hex.r);
      const poly = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
      poly.setAttribute('points', hexPoints(c.x, c.y, HEX_SIZE));
      poly.setAttribute('class', `hex${state.selectedHex === hex.id ? ' selected' : ''}${hex.robber ? ' robber' : ''}`);
      poly.setAttribute('fill', `url(#tex-${hex.terrain})`);
      const title = document.createElementNS('http://www.w3.org/2000/svg', 'title');
      title.textContent = buildHexTooltip(hex);
      poly.appendChild(title);
      poly.addEventListener('click', () => onHexClick(hex.id));
      ui.board.appendChild(poly);

      if (hex.token != null) {
        const tokenRing = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        tokenRing.setAttribute('cx', c.x);
        tokenRing.setAttribute('cy', c.y + 2);
        tokenRing.setAttribute('r', '28');
        tokenRing.setAttribute('class', `token-ring${(hex.token === 6 || hex.token === 8) ? ' hot' : ''}`);
        ui.board.appendChild(tokenRing);

        const tokenInner = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        tokenInner.setAttribute('cx', c.x);
        tokenInner.setAttribute('cy', c.y + 2);
        tokenInner.setAttribute('r', '23');
        tokenInner.setAttribute('class', `token-inner${(hex.token === 6 || hex.token === 8) ? ' hot' : ''}`);
        ui.board.appendChild(tokenInner);

        const num = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        num.setAttribute('x', c.x); num.setAttribute('y', c.y + 4);
        num.setAttribute('class', `hex-num${(hex.token === 6 || hex.token === 8) ? ' hot' : ''}`);
        num.textContent = String(hex.token);
        ui.board.appendChild(num);
      }

      if (hex.robber) {
        const robberSprite = getRobberSprite();
        if (robberSprite) {
          const img = document.createElementNS('http://www.w3.org/2000/svg', 'image');
          const size = 104;
          img.setAttribute('href', robberSprite);
          img.setAttribute('x', c.x - size / 2);
          img.setAttribute('y', c.y - 86);
          img.setAttribute('width', size);
          img.setAttribute('height', size);
          img.setAttribute('preserveAspectRatio', 'xMidYMid meet');
          img.setAttribute('opacity', '0.95');
          img.setAttribute('class', 'robber-sprite');
          ui.board.appendChild(img);
        }
      }

    });

    renderClaimsLayer();
    renderRoadsLayer();

    state.ports.forEach(port => {
      const hex = state.board[port.hexId];
      if (!hex) return;
      const c = hexToPixel(hex.q, hex.r);
      const txt = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      txt.setAttribute('x', c.x);
      txt.setAttribute('y', c.y - 96);
      txt.setAttribute('text-anchor', 'middle');
      txt.setAttribute('class', 'port-label' + (playerHasPort(port) ? ' player' : ''));
      txt.textContent = port.type === 'generic' ? 'PORT 3:1' : `${resourceLabel(port.type)} 2:1`;
      const pTitle = document.createElementNS('http://www.w3.org/2000/svg', 'title');
      pTitle.textContent = port.type === 'generic'
        ? 'Port general: poți schimba orice resursă la 3:1.'
        : `Port special ${resourceLabel(port.type)}: schimb ${resourceLabel(port.type)} la 2:1.`;
      txt.appendChild(pTitle);
      ui.board.appendChild(txt);
    });

    renderTopologyInteractives();

    if (state.pendingAction === 'road' && state.roadBuildStart != null) {
      const startHex = state.board[state.roadBuildStart];
      if (startHex) {
        const c = hexToPixel(startHex.q, startHex.r);
        const ring = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        ring.setAttribute('cx', c.x);
        ring.setAttribute('cy', c.y);
        ring.setAttribute('r', '22');
        ring.setAttribute('class', 'road-start-ring');
        ui.board.appendChild(ring);
      }
    }
  }

  function renderRoadsLayer() {
    renderOwnerRoads('player');
    renderOwnerRoads('ai');
  }

  function renderTopologyInteractives() {
    const topo = state.topology;
    if (!topo || !Array.isArray(topo.vertices) || !Array.isArray(topo.edges)) return;
    const showVertices = (state.phase === 'setup' && state.current === 'player')
      || (state.pendingAction === 'settlement' && isPlayerActionPhase())
      || (state.pendingAction === 'city' && isPlayerActionPhase());
    const showEdges = (state.pendingAction === 'road' && isPlayerActionPhase());

    if (showEdges) {
      topo.edges.forEach(edge => {
        if (!edge || !Array.isArray(edge.hexIds) || edge.hexIds.length < 2) return;
        const a = state.board[edge.hexIds[0]];
        const b = state.board[edge.hexIds[1]];
        if (!a || !b) return;
        const connectedA = ownerControlsHexViaClaims('player', a.id) || (!hasAnyVertexClaims() && a.owner === 'player') || hasRoadAtNode('player', a.id);
        const connectedB = ownerControlsHexViaClaims('player', b.id) || (!hasAnyVertexClaims() && b.owner === 'player') || hasRoadAtNode('player', b.id);
        const legalEdge = !edgeTaken(a.id, b.id) && (connectedA || connectedB);
        if (!legalEdge) return;
        const shared = getSharedHexEdge(a, b);
        if (!shared) return;
        const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        line.setAttribute('x1', shared.x1);
        line.setAttribute('y1', shared.y1);
        line.setAttribute('x2', shared.x2);
        line.setAttribute('y2', shared.y2);
        line.setAttribute('class', 'edge-hotspot legal');
        line.setAttribute('stroke-width', '20');
        line.setAttribute('stroke-linecap', 'round');
        line.style.cursor = 'pointer';
        line.addEventListener('click', () => onEdgeClick(edge.id));
        ui.board.appendChild(line);
      });
    }

    if (showVertices) {
      topo.vertices.forEach(v => {
        if (!v) return;
        let legal = false;
        let mode = 'setup';
        if (state.phase === 'setup' && state.current === 'player') {
          legal = canClaimVertex(v.id);
          mode = 'setup';
        } else if (state.pendingAction === 'settlement' && isPlayerActionPhase()) {
          legal = canClaimVertex(v.id) && canOwnerExpandToVertex('player', v.id);
          mode = 'settlement';
        } else if (state.pendingAction === 'city' && isPlayerActionPhase()) {
          const claim = vertexClaim(v.id);
          legal = !!(claim && claim.owner === 'player' && Number(claim.level || 0) === 1);
          mode = 'city';
        }
        if (!legal) return;
        const c = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        c.setAttribute('cx', v.x.toFixed(2));
        c.setAttribute('cy', v.y.toFixed(2));
        c.setAttribute('r', mode === 'city' ? '16' : '14');
        c.setAttribute('class', `vertex-hotspot legal ${mode}`);
        c.style.cursor = 'pointer';
        c.addEventListener('click', () => onVertexClick(v.id));
        ui.board.appendChild(c);
      });
    }
  }

  function renderClaimsLayer() {
    const topo = state.topology;
    if (topo && Array.isArray(topo.vertices) && hasAnyVertexClaims()) {
      Object.keys(state.vertexClaims).forEach(key => {
        const vId = Number(key);
        const claim = state.vertexClaims[key];
        if (!Number.isFinite(vId) || !claim || !claim.owner || Number(claim.level || 0) <= 0) return;
        const v = topo.vertices[vId];
        if (!v) return;
        const hex = state.board[claim.hexId];
        const spriteHref = hex ? getBuildingSprite(hex) : null;
        const anchor = { x: v.x, y: v.y };
        if (spriteHref) {
          const img = document.createElementNS('http://www.w3.org/2000/svg', 'image');
          const size = Number(claim.level || 0) >= 2 ? 112 : 94;
          img.setAttribute('href', spriteHref);
          img.setAttribute('x', anchor.x - size / 2);
          img.setAttribute('y', anchor.y - (Number(claim.level || 0) >= 2 ? 72 : 62));
          img.setAttribute('width', size);
          img.setAttribute('height', size);
          img.setAttribute('preserveAspectRatio', 'xMidYMid meet');
          img.setAttribute('opacity', claim.owner === 'player' ? '1' : '0.94');
          ui.board.appendChild(img);
        }
        const owner = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        owner.setAttribute('x', anchor.x);
        owner.setAttribute('y', anchor.y + 28);
        owner.setAttribute('class', 'hex-owner');
        owner.setAttribute('fill', claim.owner === 'player' ? '#f8d58e' : '#c4d7ff');
        owner.textContent = Number(claim.level || 0) >= 2 ? (claim.owner === 'player' ? 'ORAȘ' : 'AI ORAȘ') : (claim.owner === 'player' ? 'AȘEZARE' : 'AI');
        ui.board.appendChild(owner);
        const ownerBadge = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        const ownerText = owner.textContent || '';
        const badgeW = Math.max(72, ownerText.length * 9);
        ownerBadge.setAttribute('x', (anchor.x - badgeW / 2).toFixed(2));
        ownerBadge.setAttribute('y', (anchor.y + 12).toFixed(2));
        ownerBadge.setAttribute('width', badgeW.toFixed(2));
        ownerBadge.setAttribute('height', '22');
        ownerBadge.setAttribute('rx', '6');
        ownerBadge.setAttribute('class', `owner-badge ${claim.owner === 'player' ? 'player' : 'ai'}`);
        ui.board.insertBefore(ownerBadge, owner);
      });
      return;
    }

    // Fallback legacy rendering when no vertex claims exist.
    state.board.forEach(hex => {
      if (!hex.owner) return;
      const spriteHref = getBuildingSprite(hex);
      const anchor = getSettlementAnchor(hex);
      if (spriteHref) {
        const img = document.createElementNS('http://www.w3.org/2000/svg', 'image');
        const size = hex.level === 2 ? 112 : 94;
        img.setAttribute('href', spriteHref);
        img.setAttribute('x', anchor.x - size / 2);
        img.setAttribute('y', anchor.y - (hex.level === 2 ? 72 : 62));
        img.setAttribute('width', size);
        img.setAttribute('height', size);
        img.setAttribute('preserveAspectRatio', 'xMidYMid meet');
        img.setAttribute('opacity', hex.owner === 'player' ? '1' : '0.94');
        ui.board.appendChild(img);
      }
      const owner = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      owner.setAttribute('x', anchor.x);
      owner.setAttribute('y', anchor.y + 28);
      owner.setAttribute('class', 'hex-owner');
      owner.setAttribute('fill', hex.owner === 'player' ? '#f8d58e' : '#c4d7ff');
      owner.textContent = hex.level === 2 ? (hex.owner === 'player' ? 'ORAȘ' : 'AI ORAȘ') : (hex.owner === 'player' ? 'AȘEZARE' : 'AI');
      ui.board.appendChild(owner);
      const ownerBadge = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      const ownerText = owner.textContent || '';
      const badgeW = Math.max(72, ownerText.length * 9);
      ownerBadge.setAttribute('x', (anchor.x - badgeW / 2).toFixed(2));
      ownerBadge.setAttribute('y', (anchor.y + 12).toFixed(2));
      ownerBadge.setAttribute('width', badgeW.toFixed(2));
      ownerBadge.setAttribute('height', '22');
      ownerBadge.setAttribute('rx', '6');
      ownerBadge.setAttribute('class', `owner-badge ${hex.owner === 'player' ? 'player' : 'ai'}`);
      ui.board.insertBefore(ownerBadge, owner);
    });
  }

  function renderOwnerRoads(owner) {
    const topo = state.topology;
    const edgeIds = roadEdgeIds(owner);
    if (topo && Array.isArray(topo.edges) && edgeIds.length) {
      edgeIds.forEach(id => {
        const e = topo.edges[id];
        if (!e || !Array.isArray(e.hexIds) || e.hexIds.length < 2) return;
        const a = state.board[e.hexIds[0]];
        const b = state.board[e.hexIds[1]];
        if (!a || !b) return;
        const shared = getSharedHexEdge(a, b);
        if (!shared) return;
        const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        const s = shortenSegment(shared.x1, shared.y1, shared.x2, shared.y2, 8);
        line.setAttribute('x1', s.x1);
        line.setAttribute('y1', s.y1);
        line.setAttribute('x2', s.x2);
        line.setAttribute('y2', s.y2);
        line.setAttribute('class', `road-line ${owner === 'player' ? 'player' : 'ai'}`);
        ui.board.appendChild(line);
      });
      return;
    }

    const roads = roadHexKeys(owner);
    roads.forEach(key => {
      const edge = parseRoadKey(key);
      if (!edge) return;
      const a = state.board[edge[0]];
      const b = state.board[edge[1]];
      if (!a || !b) return;
      const shared = getSharedHexEdge(a, b);
      if (!shared) return;
      const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      const s = shortenSegment(shared.x1, shared.y1, shared.x2, shared.y2, 8);
      line.setAttribute('x1', s.x1);
      line.setAttribute('y1', s.y1);
      line.setAttribute('x2', s.x2);
      line.setAttribute('y2', s.y2);
      line.setAttribute('class', `road-line ${owner === 'player' ? 'player' : 'ai'}`);
      ui.board.appendChild(line);
    });
  }

  function onHexClick(id) {
    state.selectedHex = id;

    if (state.phase === 'setup' && state.current === 'player') {
      if (state.topology && state.topology.hexVertexIds) {
        const verts = state.topology.hexVertexIds[id] || [];
        const candidate = verts
          .filter(vId => canClaimVertex(vId))
          .map(vId => ({ vId, score: scoreVertex(vId, 'player') }))
          .sort((a, b) => b.score - a.score)[0];
        if (!candidate) return setHint('Hex invalid pentru setup. Alege un hex liber, neadiacent altor așezări.');
        return onVertexClick(candidate.vId);
      }
      if (!canPlaceInitial(id)) return setHint('Hex invalid pentru setup. Alege un hex liber, neadiacent altor așezări.');
      occupyHex(id, 'player', 1);
      state.setupPicks.player += 1;
      logEvent(`${state.nickname} a plasat așezare inițială.`);
      if (state.setupPicks.player >= 2) {
        aiInitialPlacement();
        state.phase = 'main';
        state.current = 'player';
        markTutorialSignal('setupDone');
        logEvent(`--- Tura ${state.turn}: ${state.nickname} ---`);
        setHint('Partida a început. Pasul următor: aruncă zarurile (R).');
      }
      recalcVp();
      refreshUi();
      saveState();
      return;
    }

    if (state.phase === 'robber' && state.current === 'player') {
      if (id === state.robberHexId) return setHint('Alege un alt hexagon pentru hoț (nu cel curent).');
      captureUndo();
      moveRobberTo(id, 'player');
      state.phase = 'main';
      state.rolled = true;
      setHint('Hoțul a fost mutat.');
      refreshUi();
      saveState();
      return;
    }

    if (state.pendingAction === 'settlement' && isPlayerActionPhase()) {
      tryBuildSettlement(id, 'player');
      return;
    }

    if (state.pendingAction === 'city' && isPlayerActionPhase()) {
      buildCityAt(id, 'player');
      state.pendingAction = null;
      refreshUi();
      return;
    }

    if (state.pendingAction === 'road' && isPlayerActionPhase()) {
      if (state.roadBuildStart == null) {
        const canStart = ownerControlsHexViaClaims('player', id) || (!hasAnyVertexClaims() && state.board[id].owner === 'player') || hasRoadAtNode('player', id);
      if (!canStart) return setHint('Start invalid: alege un hex deținut de tine sau capătul unui drum al tău.');
        state.roadBuildStart = id;
      setHint('Bun. Acum alege un hex vecin pentru capătul drumului.');
        renderBoard();
        return;
      }
      if (id === state.roadBuildStart) {
        state.roadBuildStart = null;
        setHint('Start drum resetat. Selectează din nou hex-ul de start.');
        renderBoard();
        return;
      }
      tryBuildRoad(state.roadBuildStart, id, 'player', true);
      return;
    }

    renderBoard();
  }

  function onVertexClick(vId) {
    if (state.phase === 'setup' && state.current === 'player') {
      if (!canClaimVertex(vId)) return setHint('Vertex invalid pentru setup (ocupat sau prea aproape de altă așezare).');
      const targetHex = pickBestHexForVertex(vId, 'player', false, false);
      if (!targetHex) return setHint('Nu există hex liber pe acest vertex.');
      occupyHex(targetHex.id, 'player', 1, true);
      setVertexClaim(vId, 'player', 1, targetHex.id);
      state.setupPicks.player += 1;
      logEvent(`${state.nickname} a plasat așezare inițială.`);
      if (state.setupPicks.player >= 2) {
        aiInitialPlacement();
        state.phase = 'main';
        state.current = 'player';
        markTutorialSignal('setupDone');
        logEvent(`--- Tura ${state.turn}: ${state.nickname} ---`);
        setHint('Partida a început. Pasul următor: aruncă zarurile (R).');
      }
      recalcVp();
      refreshUi();
      saveState();
      return;
    }

    if (state.pendingAction === 'settlement' && isPlayerActionPhase()) {
      tryBuildSettlementAtVertex(vId, 'player');
      return;
    }

    if (state.pendingAction === 'city' && isPlayerActionPhase()) {
      const claim = vertexClaim(vId);
      if (!claim || claim.owner !== 'player') return setHint('Selectează un vertex cu propria așezare pentru upgrade.');
      buildCityAtVertex(vId, 'player');
      state.pendingAction = null;
      refreshUi();
      return;
    }
  }

  function onEdgeClick(edgeId) {
    if (!(state.pendingAction === 'road' && isPlayerActionPhase())) return;
    const topo = state.topology;
    if (!topo || !Array.isArray(topo.edges)) return;
    const edge = topo.edges[edgeId];
    if (!edge || !Array.isArray(edge.hexIds) || edge.hexIds.length < 2) return;
    const a = edge.hexIds[0];
    const b = edge.hexIds[1];
    tryBuildRoad(a, b, 'player', true);
  }

  function tryBuildSettlementAtVertex(vId, owner) {
    if (!canClaimVertex(vId)) {
      if (owner === 'player') setHint('Nu poți construi aici: vertex ocupat sau lipit de altă așezare.');
      return false;
    }
    if (!canOwnerExpandToVertex(owner, vId)) {
      if (owner === 'player') setHint('Așezarea trebuie conectată la rețeaua ta (claim sau drum).');
      return false;
    }
    const targetHex = pickBestHexForVertex(vId, owner, false, false);
    if (!targetHex) {
      if (owner === 'player') setHint('Nu există hex valid pe acest vertex.');
      return false;
    }
    const reduced = !!(state.effects && state.effects[owner] && state.effects[owner].masonDiscount);
    const cost = reduced ? { brick: 1, grain: 1, wool: 1 } : { wood: 1, brick: 1, grain: 1, wool: 1 };
    if (!canPay(owner, cost)) {
      if (owner === 'player') {
        state.pendingAction = null;
        setHint('Nu ai resurse suficiente pentru Așezare.');
      }
      return false;
    }
    if (owner === 'player') captureUndo();
    pay(owner, cost);
    occupyHex(targetHex.id, owner, 1, true);
    setVertexClaim(vId, owner, 1, targetHex.id);
    if (reduced) {
      state.effects[owner].masonDiscount = false;
      logEvent(owner === 'player' ? 'Efect consumat: Vestérul Pietrar.' : 'AI a consumat efectul Vestérul Pietrar.');
    }
    state.pendingAction = null;
    logEvent(owner === 'player' ? 'Ai construit o așezare.' : 'AI a construit o așezare.');
    if (owner === 'player') {
      state.matchStats.settlementsBuilt += 1;
      markTutorialSignal('built');
      pulseResourceCells(reduced ? ['brick', 'grain', 'wool'] : ['wood', 'brick', 'grain', 'wool']);
      flashBoard('build-flash');
    }
    recalcVp();
    if (owner === 'player') {
      refreshUi();
      saveState();
    }
    return true;
  }

  function buildCityAtVertex(vId, owner) {
    const claim = vertexClaim(vId);
    if (!claim || claim.owner !== owner || Number(claim.level || 0) !== 1) {
      if (owner === 'player') setHint('Poți upgrada doar o așezare proprie selectată.');
      return false;
    }
    if (!canPay(owner, { ore: 3, grain: 2 })) {
      if (owner === 'player') setHint('Nu ai resurse suficiente pentru Oraș.');
      return false;
    }
    if (owner === 'player') captureUndo();
    pay(owner, { ore: 3, grain: 2 });
    setVertexClaim(vId, owner, 2, claim.hexId);
    const hex = state.board[claim.hexId];
    if (hex) {
      hex.owner = owner;
      hex.level = 2;
    }
    logEvent(owner === 'player' ? 'Ai construit un oraș.' : 'AI a construit un oraș.');
    if (owner === 'player') {
      state.matchStats.citiesBuilt += 1;
      markTutorialSignal('built');
      pulseResourceCells(['ore', 'grain']);
      flashBoard('build-flash');
    }
    recalcVp();
    if (owner === 'player') {
      refreshUi();
      saveState();
    }
    return true;
  }

  function canPlaceInitial(id) {
    const h = state.board[id];
    if (hasAnyVertexClaims() || (state.topology && state.topology.hexVertexIds)) {
      const verts = state.topology && state.topology.hexVertexIds ? (state.topology.hexVertexIds[id] || []) : [];
      return verts.some(vId => canClaimVertex(vId));
    }
    if (h.owner) return false;
    return neighbors(id).every(nb => !nb.owner);
  }

  function aiInitialPlacement() {
    for (let i = 0; i < 2; i++) {
      const pickVertex = aiPickSettlementVertex('ai', false);
      if (!pickVertex) break;
      occupyHex(pickVertex.hexId, 'ai', 1, true);
      setVertexClaim(pickVertex.vId, 'ai', 1, pickVertex.hexId);
      state.setupPicks.ai += 1;
      logEvent('AI a plasat o așezare inițială.');
    }
  }

  function onRoll() {
    if (!isPlayerMain() || state.rolled || state.diceRolling) return;
    state.diceRolling = true;
    refreshUi();
    animateDiceRoll((d1, d2, total) => {
      ui.dice.textContent = `${d1}+${d2}=${total}`;
      logEvent(`Ai aruncat ${total}.`);
      playTone(320 + total * 18, 0.12, 'square');
      playTone(220 + total * 15, 0.08, 'triangle');

      if (total === 7) {
        state.undoStack = [];
        applySevenDiscard();
        state.phase = 'robber';
        markTutorialSignal('rolled');
        state.diceRolling = false;
        setHint('Ai dat 7. Mută hoțul pe un alt hexagon pentru a bloca producția.');
        refreshUi();
        renderBoard();
        return;
      }

      distributeResources(total);
      state.rolled = true;
      markTutorialSignal('rolled');
      state.diceRolling = false;
      maybeDrawTurnCard();
      refreshUi();
      saveState();
    });
  }

  function distributeResources(number) {
    const gained = {
      player: { wood: 0, brick: 0, grain: 0, wool: 0, ore: 0 },
      ai: { wood: 0, brick: 0, grain: 0, wool: 0, ore: 0 }
    };
    const useVertexModel = hasAnyVertexClaims() && state.topology && Array.isArray(state.topology.vertices);
    if (useVertexModel) {
      ['player', 'ai'].forEach(owner => {
        ownedVertexClaims(owner).forEach(({ vId, claim }) => {
          const v = state.topology.vertices[vId];
          if (!v || !Array.isArray(v.hexIds)) return;
          const prodLevel = Number(claim.level || 0);
          if (prodLevel <= 0) return;
          v.hexIds.forEach(hexId => {
            const hex = state.board[hexId];
            if (!hex || hex.robber || hex.token !== number) return;
            const key = TERRAIN_INFO[hex.terrain] ? TERRAIN_INFO[hex.terrain].key : null;
            if (!key) return;
            state.players[owner].resources[key] += prodLevel;
            gained[owner][key] += prodLevel;
          });
        });
      });
    } else {
      state.board.forEach(hex => {
        if (hex.robber || hex.token !== number || !hex.owner || !hex.level) return;
        const key = TERRAIN_INFO[hex.terrain].key;
        if (!key) return;
        state.players[hex.owner].resources[key] += hex.level;
        gained[hex.owner][key] += hex.level;
      });
    }
    logEvent(`Distribuție (${number}) - ${gainSummary('player', gained.player)}`);
    logEvent(`Distribuție (${number}) - ${gainSummary('ai', gained.ai)}`);
    const gainedPlayerKeys = Object.keys(gained.player).filter(k => (gained.player[k] || 0) > 0);
    if (gainedPlayerKeys.length) pulseResourceCells(gainedPlayerKeys);
  }

  function gainSummary(owner, map) {
    const parts = Object.keys(map).filter(k => map[k] > 0).map(k => `${map[k]} ${resourceLabel(k)}`);
    if (!parts.length) {
      return owner === 'player' ? `${state.nickname}: nimic` : 'AI: nimic';
    }
    return owner === 'player'
      ? `${state.nickname}: ${parts.join(', ')}`
      : `AI: ${parts.join(', ')}`;
  }

  function maybeDrawTurnCard() {
    if (state.turn % PLAYER_CARD_DRAW_EVERY === 0) {
      drawCard('player');
      logEvent('Ai tras o carte nouă.');
    }
  }

  function maybeDrawAiCard(profile) {
    const every = Math.max(3, Number(profile.cardDrawEvery || 5));
    if (state.turn % every === 0) {
      drawCard('ai');
      logEvent('AI a tras o carte.');
    }
  }

  function moveRobberTo(id, mover) {
    if (id === state.robberHexId) return;
    const old = state.board[state.robberHexId];
    if (old) old.robber = false;
    const next = state.board[id];
    next.robber = true;
    state.robberHexId = id;

    const enemy = mover === 'player' ? 'ai' : 'player';
    let robberVictim = null;
    const around = claimsAroundHex(id)
      .filter(row => row.claim.owner === enemy)
      .sort((a, b) => Number(b.claim.level || 0) - Number(a.claim.level || 0));
    if (around.length) robberVictim = enemy;
    if (!robberVictim && next.owner === enemy) robberVictim = enemy;
    if (robberVictim) {
      const stolen = stealRandomResource(robberVictim, mover);
      if (stolen) logEvent(`Hoțul a furat ${resourceLabel(stolen)}.`);
      if (mover === 'player' && stolen) pulseResourceCells([stolen]);
    }
    if (mover === 'player') state.matchStats.robberMoves += 1;
    if (mover === 'player') markTutorialSignal('robberMoved');
    flashBoard('robber-flash');
    renderBoard();
  }

  function totalResourceCards(owner) {
    const res = state.players[owner].resources || {};
    return Object.keys(res).reduce((acc, key) => acc + Math.max(0, Number(res[key] || 0)), 0);
  }

  function discardRandomResources(owner, count) {
    const removed = {};
    for (let i = 0; i < count; i++) {
      const keys = Object.keys(state.players[owner].resources).filter(k => (state.players[owner].resources[k] || 0) > 0);
      if (!keys.length) break;
      const pick = keys[Math.floor(Math.random() * keys.length)];
      state.players[owner].resources[pick] -= 1;
      removed[pick] = (removed[pick] || 0) + 1;
    }
    return removed;
  }

  function discardSummaryText(removed) {
    const parts = Object.keys(removed).map(k => `${removed[k]} ${resourceLabel(k)}`);
    return parts.length ? parts.join(', ') : 'nimic';
  }

  function applySevenDiscard() {
    ['player', 'ai'].forEach(owner => {
      const total = totalResourceCards(owner);
      if (total <= 7) return;
      const toDiscard = Math.floor(total / 2);
      const removed = discardRandomResources(owner, toDiscard);
      if (owner === 'player') {
        logEvent(`Ai aruncat ${toDiscard} resurse (7): ${discardSummaryText(removed)}.`);
      } else {
        logEvent(`AI a aruncat ${toDiscard} resurse (7): ${discardSummaryText(removed)}.`);
      }
    });
  }

  function stealRandomResource(from, to) {
    const keys = Object.keys(state.players[from].resources).filter(k => state.players[from].resources[k] > 0);
    if (!keys.length) return null;
    const key = keys[Math.floor(Math.random() * keys.length)];
    state.players[from].resources[key] -= 1;
    state.players[to].resources[key] += 1;
    return key;
  }

  function occupyHex(id, owner, level, skipVertexAssign) {
    state.board[id].owner = owner;
    state.board[id].level = level;
    if (state.board[id].buildingSprite == null) {
      state.board[id].buildingSprite = randomBuildingSpriteIndex();
    }
    if (!skipVertexAssign) assignDefaultVertexForHex(id, owner, level);
  }

  function tryBuildSettlement(id, owner) {
    if (hasAnyVertexClaims() && state.topology) {
      const verts = state.topology.hexVertexIds && state.topology.hexVertexIds[id] ? state.topology.hexVertexIds[id] : [];
      const candidate = verts
        .filter(vId => canClaimVertex(vId))
        .filter(vId => canOwnerExpandToVertex(owner, vId))
        .map(vId => ({ vId, score: scoreVertex(vId, owner) }))
        .sort((a, b) => b.score - a.score)[0];
      if (!candidate) {
        if (owner === 'player') setHint('Nu există un vertex legal pentru așezare pe hex-ul selectat.');
        return false;
      }
      return tryBuildSettlementAtVertex(candidate.vId, owner);
    }
    const hex = state.board[id];
    if (claimsAroundHex(id).length || hex.owner) return setHint('Hex ocupat. Alege un hex liber.');
    if (!neighbors(id).some(nb => nb.owner === owner || ownerControlsHexViaClaims(owner, nb.id))) {
      return setHint('Așezarea trebuie să fie adiacentă teritoriului tău.');
    }

    const reduced = !!(state.effects && state.effects[owner] && state.effects[owner].masonDiscount);
    const cost = reduced ? { brick: 1, grain: 1, wool: 1 } : { wood: 1, brick: 1, grain: 1, wool: 1 };
    if (!canPay(owner, cost)) {
      state.pendingAction = null;
      return setHint('Nu ai resurse suficiente pentru Așezare.');
    }

    if (owner === 'player') captureUndo();
    pay(owner, cost);
    occupyHex(id, owner, 1);
    if (reduced) {
      state.effects[owner].masonDiscount = false;
      logEvent(owner === 'player' ? 'Efect consumat: Vestérul Pietrar.' : 'AI a consumat efectul Vestérul Pietrar.');
    }
    state.pendingAction = null;
    logEvent(owner === 'player' ? 'Ai construit o așezare.' : 'AI a construit o așezare.');
    if (owner === 'player') state.matchStats.settlementsBuilt += 1;
    if (owner === 'player') markTutorialSignal('built');
    if (owner === 'player') {
      pulseResourceCells(reduced ? ['brick', 'grain', 'wool'] : ['wood', 'brick', 'grain', 'wool']);
      flashBoard('build-flash');
    }
    recalcVp();
    refreshUi();
    saveState();
    return true;
  }

  function buildCityAt(id, owner) {
    if (hasAnyVertexClaims() && state.topology) {
      const verts = state.topology.hexVertexIds && state.topology.hexVertexIds[id] ? state.topology.hexVertexIds[id] : [];
      const candidate = verts
        .map(vId => ({ vId, claim: vertexClaim(vId) }))
        .filter(row => row.claim && row.claim.owner === owner && Number(row.claim.level || 0) === 1)
        .sort((a, b) => scoreVertex(b.vId, owner) - scoreVertex(a.vId, owner))[0];
      if (!candidate) {
        if (owner === 'player') setHint('Poți upgrada doar o așezare proprie selectată.');
        return false;
      }
      return buildCityAtVertex(candidate.vId, owner);
    }
    const hex = state.board[id];
    if (!canUpgradeCityAt(id, owner)) return setHint('Poți upgrada doar o așezare proprie selectată.');
    if (!canPay(owner, { ore: 3, grain: 2 })) return setHint('Nu ai resurse suficiente pentru Oraș.');
    if (owner === 'player') captureUndo();
    pay(owner, { ore: 3, grain: 2 });
    hex.level = 2;
    hex.owner = owner;
    const mappedVertex = state.hexVertexMap ? state.hexVertexMap[String(id)] : null;
    if (typeof mappedVertex === 'number' && vertexClaim(mappedVertex)) {
      setVertexClaim(mappedVertex, owner, 2, id);
    }
    logEvent(owner === 'player' ? 'Ai construit un oraș.' : 'AI a construit un oraș.');
    if (owner === 'player') state.matchStats.citiesBuilt += 1;
    if (owner === 'player') markTutorialSignal('built');
    if (owner === 'player') {
      pulseResourceCells(['ore', 'grain']);
      flashBoard('build-flash');
    }
    recalcVp();
    refreshUi();
    saveState();
  }

  function endTurn() {
    if (!isPlayerMain() || !state.rolled || state.aiThinking) return;
    cancelPendingAction('endTurn');
    markTutorialSignal('endedTurn');
    state.current = 'ai';
    state.aiThinking = true;
    state.rolled = false;
    state.cardPlayedThisTurn = false;
    state.undoStack = [];
    refreshUi();
    runAiTurn();
  }

  function surrenderGame() {
    if (state.phase === 'setup') return setHint('Finalizează setup-ul înainte de capitulare.');
    if (isOverlayShown(ui.endOverlay)) return;
    const ok = window.confirm('Sigur vrei să capitulezi? Partida curentă va fi închisă.');
    if (!ok) return;
    endGame('Ai capitulat', 'Partida a fost încheiată la cererea jucătorului.');
  }

  function runAiTurn() {
    if (state.aiThinking !== true) state.aiThinking = true;
    scheduleAiTurnRecovery();
    setHint('AI gândește...');
    logEvent('--- Tura AI ---');
    const profile = getAiProfile();
    setTimeout(() => {
      if (!state.aiThinking || state.current !== 'ai') return;
      state.diceRolling = true;
      refreshUi();
      if (consumeAiHangOnce()) {
        logEvent('[TEST] Simulare blocaj AI activata.');
        return;
      }
      animateDiceRoll((d1, d2, sum) => {
        if (!state.aiThinking || state.current !== 'ai') return;
        ui.dice.textContent = `AI ${d1}+${d2}=${sum}`;
        logEvent(`AI a aruncat ${sum}.`);
        state.diceRolling = false;
        if (sum === 7) {
          applySevenDiscard();
          const target = state.board.filter(h => h.id !== state.robberHexId).sort((a, b) => scoreRobberTarget(b, 'ai', profile.robberBias) - scoreRobberTarget(a, 'ai', profile.robberBias))[0];
          moveRobberTo(target.id, 'ai');
        } else {
          distributeResources(sum);
        }
        aiBuild(profile);
        maybeDrawAiCard(profile);
        recalcVp();
        if (checkEnd()) {
          clearAiTurnRecovery();
          state.aiThinking = false;
          return;
        }

        state.current = 'player';
        state.aiThinking = false;
        clearAiTurnRecovery();
        state.turn += 1;
        markTutorialSignal('aiCycleDone');
        logEvent(`--- Tura ${state.turn}: ${state.nickname} ---`);
        setHint('Tura ta. Aruncă zarurile (R) pentru a începe.');
        refreshUi();
        saveState();
      });
    }, 700);
  }

  function scheduleAiTurnRecovery() {
    clearAiTurnRecovery();
    state.aiRecoveryTimerId = window.setTimeout(() => {
      recoverFromAiTimeout();
    }, AI_TURN_TIMEOUT_MS);
  }

  function clearAiTurnRecovery() {
    if (state.aiRecoveryTimerId != null) {
      clearTimeout(state.aiRecoveryTimerId);
      state.aiRecoveryTimerId = null;
    }
  }

  function recoverFromAiTimeout() {
    if (!state.aiThinking || state.current !== 'ai') return;
    state.diceRolling = false;
    state.aiThinking = false;
    state.current = 'player';
    state.rolled = false;
    state.phase = 'main';
    state.pendingAction = null;
    state.roadBuildStart = null;
    state.undoStack = [];
    state.cardPlayedThisTurn = false;
    clearAiTurnRecovery();
    state.turn += 1;
    markTutorialSignal('aiCycleDone');
    logEvent('AI timeout: tură recuperată automat, jocul continuă.');
    logEvent(`--- Tura ${state.turn}: ${state.nickname} ---`);
    setHint('Tura ta. Aruncă zarurile (R) pentru a începe.');
    refreshUi();
    saveState();
  }

  function consumeAiHangOnce() {
    if (!TEST_CONFIG || !TEST_CONFIG.aiHangOnce) return false;
    TEST_CONFIG.aiHangOnce = false;
    return true;
  }

  function aiBuild(profile) {
    aiUseCard(profile);
    let tradesUsed = 0;
    const attempts = profile.buildAttempts || 1;
    for (let i = 0; i < attempts; i++) {
      let acted = false;
      const aiVp = state.players.ai.vp || 0;
      const playerVp = state.players.player.vp || 0;
      const chaseMode = playerVp - aiVp >= 2;
      const closingMode = aiVp >= Math.max(0, state.vpTarget - 2);

      const cityClaim = ownedVertexClaims('ai')
        .filter(row => Number(row.claim.level || 0) === 1 && state.board[row.claim.hexId])
        .sort((a, b) => scoreVertex(b.vId, 'ai') - scoreVertex(a.vId, 'ai'))[0];
      const city = cityClaim ? state.board[cityClaim.claim.hexId] : state.board
        .filter(h => h.owner === 'ai' && h.level === 1)
        .sort((a, b) => expectedYield(b) - expectedYield(a))[0];
      const canCity = !!city && canPay('ai', { ore: 3, grain: 2 });
      const cityChance = Math.min(0.98, (profile.cityChance || 0.6) + (closingMode ? 0.08 : 0) + (chaseMode ? 0.05 : 0));
      if (canCity && Math.random() <= cityChance) {
        if (cityClaim) acted = buildCityAtVertex(cityClaim.vId, 'ai');
        else {
          buildCityAt(city.id, 'ai');
          acted = true;
        }
      }

      if (!acted) {
        const pickVertex = aiPickSettlementVertex('ai', true);
        const canSettle = !!pickVertex && canPay('ai', { wood: 1, brick: 1, grain: 1, wool: 1 });
        const settleChance = Math.min(0.98, (profile.settleChance || 0.65) + (state.turn <= 6 ? 0.08 : 0) + (chaseMode ? 0.05 : 0));
        if (canSettle && Math.random() <= settleChance) {
          acted = tryBuildSettlementAtVertex(pickVertex.vId, 'ai');
        }
      }

      if (!acted && tradesUsed < (profile.maxTradesPerTurn || 1) && Math.random() <= (profile.tradeChance || 0.4)) {
        if (aiTryTrade(profile)) {
          tradesUsed += 1;
        }
      }

      if (!acted && canPay('ai', { wood: 1, brick: 1 }) && Math.random() <= (profile.roadChance || 0.6)) {
        const edge = pickAiRoadEdge();
        if (edge) {
          tryBuildRoad(edge[0], edge[1], 'ai', true);
          acted = true;
        }
      }

      if (!acted && tradesUsed < (profile.maxTradesPerTurn || 1) && Math.random() <= ((profile.tradeChance || 0.4) * 0.55)) {
        if (aiTryTrade(profile)) {
          tradesUsed += 1;
        }
      }
    }
  }

  function pickAiRoadEdge() {
    const anchors = new Set();
    if (hasAnyVertexClaims()) {
      Object.keys(state.vertexClaims).forEach(k => {
        const claim = state.vertexClaims[k];
        if (!claim || claim.owner !== 'ai') return;
        const vId = Number(k);
        if (!Number.isFinite(vId)) return;
        const topo = state.topology;
        if (!topo || !Array.isArray(topo.vertices) || !topo.vertices[vId]) return;
        (topo.vertices[vId].hexIds || []).forEach(hid => anchors.add(hid));
      });
    } else {
      state.board.forEach(h => { if (h.owner === 'ai') anchors.add(h.id); });
    }
    roadEdgeIds('ai').forEach(id => {
      const e = state.topology && Array.isArray(state.topology.edges) ? state.topology.edges[id] : null;
      if (!e || !Array.isArray(e.hexIds)) return;
      e.hexIds.forEach(hid => anchors.add(hid));
    });
    if (!anchors.size) {
      roadHexKeys('ai').forEach(key => {
        const edge = parseRoadKey(key);
        if (!edge) return;
        anchors.add(edge[0]);
        anchors.add(edge[1]);
      });
    }
    const candidates = [];
    anchors.forEach(id => {
      neighbors(id).forEach(nb => {
        if (edgeTaken(id, nb.id)) return;
        candidates.push([id, nb.id]);
      });
    });
    if (!candidates.length) return null;
    candidates.sort((a, b) => {
      const aScore = expectedYield(state.board[a[1]]) + (state.board[a[1]].owner === 'ai' ? 0.5 : 0);
      const bScore = expectedYield(state.board[b[1]]) + (state.board[b[1]].owner === 'ai' ? 0.5 : 0);
      return bScore - aScore;
    });
    return candidates[0];
  }

  function aiUseCard(profile) {
    const cards = state.players.ai.cards || [];
    if (!cards.length) return false;
    if (Math.random() > (profile.cardUseChance || 0.4)) return false;
    let idx = Math.floor(Math.random() * cards.length);
    const knightIdx = cards.indexOf('knight');
    if (knightIdx !== -1 && state.aiMode === 'hard' && Math.random() < 0.65) idx = knightIdx;
    if (knightIdx !== -1 && state.aiMode === 'easy' && Math.random() < 0.45) return false;
    const cardId = cards[idx];
    if (!cardId) return false;
    if (cardId === 'abundance') {
      gainRandomResources('ai', 2);
    } else if (cardId === 'caravan') {
      const edge = pickAiRoadEdge();
      if (edge) tryBuildRoad(edge[0], edge[1], 'ai', false);
    } else if (cardId === 'crystalburst') {
      state.players.ai.resources.brick += 1;
      state.players.ai.resources.ore += 1;
    } else if (cardId === 'mason') {
      state.effects.ai.masonDiscount = true;
    } else if (cardId === 'knight') {
      playKnightCard('ai');
    }
    cards.splice(idx, 1);
    state.discard.push(cardId);
    logEvent('AI a jucat o carte tactică.');
    return true;
  }

  function roadKey(a, b) {
    const x = Math.min(a, b);
    const y = Math.max(a, b);
    return `${x}-${y}`;
  }

  function roadExists(owner, a, b) {
    const edgeId = edgeTopologyIdFromHexPair(a, b);
    if (typeof edgeId === 'number') return roadEdgeIds(owner).indexOf(edgeId) !== -1;
    const k = roadKey(a, b);
    return roadHexKeys(owner).indexOf(k) !== -1;
  }

  function edgeTaken(a, b) {
    return roadExists('player', a, b) || roadExists('ai', a, b);
  }

  function hasRoadAtNode(owner, nodeId) {
    const topo = state.topology;
    if (topo && Array.isArray(topo.edges)) {
      const edgeIds = roadEdgeIds(owner);
      for (let i = 0; i < edgeIds.length; i++) {
        const e = topo.edges[edgeIds[i]];
        if (!e || !Array.isArray(e.hexIds)) continue;
        if (e.hexIds.indexOf(nodeId) !== -1) return true;
      }
    }
    const roads = roadHexKeys(owner);
    for (let i = 0; i < roads.length; i++) {
      const edge = parseRoadKey(roads[i]);
      if (!edge) continue;
      if (edge[0] === nodeId || edge[1] === nodeId) return true;
    }
    return false;
  }

  function tryBuildRoad(a, b, owner, chargePlayer) {
    const isAdjacent = neighbors(a).some(nb => nb.id === b);
    if (!isAdjacent) {
      if (owner === 'player') setHint('Drumul trebuie construit între hex-uri vecine.');
      return false;
    }
    const connectedA = ownerControlsHexViaClaims(owner, a) || (!hasAnyVertexClaims() && state.board[a].owner === owner) || hasRoadAtNode(owner, a);
    const connectedB = ownerControlsHexViaClaims(owner, b) || (!hasAnyVertexClaims() && state.board[b].owner === owner) || hasRoadAtNode(owner, b);
    if (!connectedA && !connectedB) {
      if (owner === 'player') setHint('Drumul trebuie conectat la teritoriul sau la rețeaua ta existentă.');
      return false;
    }
    if (edgeTaken(a, b)) {
      if (owner === 'player') setHint('Muchia este deja ocupată de un drum.');
      return false;
    }
    if (chargePlayer) {
      if (owner === 'player') captureUndo();
      if (owner === 'player' && state.roadBuildFree) {
        state.roadBuildFree = false;
      } else if (!canPay(owner, { wood: 1, brick: 1 })) {
        if (owner === 'player') setHint('Nu ai resurse pentru Drum.');
        return false;
      } else {
        pay(owner, { wood: 1, brick: 1 });
      }
    }
    addRoad(owner, a, b);
    state.players[owner].roads = roadEdgeIds(owner).length || roadHexKeys(owner).length;
    if (owner === 'player') state.matchStats.roadsBuilt += 1;
    if (owner === 'player') markTutorialSignal('built');
    state.pendingAction = null;
    state.roadBuildStart = null;
    recalcLongestRoad();
    if (owner === 'player') {
      logEvent('Ai construit un drum comercial.');
      playTone(420, 0.09, 'triangle');
      pulseResourceCells(['wood', 'brick']);
      flashBoard('build-flash');
      refreshUi();
      saveState();
    } else {
      logEvent('AI a construit un drum comercial.');
    }
    return true;
  }

  function scoreRobberTarget(hex, mover, bias) {
    let score = 0;
    const enemy = mover === 'player' ? 'ai' : 'player';
    const around = claimsAroundHex(hex.id);
    const enemyAround = around.filter(row => row.claim.owner === enemy);
    const ownAround = around.filter(row => row.claim.owner === mover);
    if (enemyAround.length) {
      const enemyPresence = enemyAround.reduce((acc, row) => acc + (Number(row.claim.level || 0) >= 2 ? 2 : 1), 0);
      score += 4 + enemyPresence * 1.8;
      score += expectedYield(hex) * 1.2;
      const enemyRoadLen = (state.roadStats && state.roadStats[enemy]) || 0;
      if (enemyRoadLen >= 4) score += 1.5;
    } else if (ownAround.length || ownerControlsHexViaClaims(mover, hex.id) || hex.owner === mover) {
      score -= 3;
    }
    if (hex.token === 6 || hex.token === 8) score += 2.5;
    if (hex.terrain === 'ore' || hex.terrain === 'grain') score += 0.6;
    return score * (bias || 1);
  }

  function getAiProfile() {
    return AI_PROFILES[state.aiMode] || AI_PROFILES.normal;
  }

  function aiTryTrade(profile) {
    const res = state.players.ai.resources;
    const pool = ['ore', 'grain', 'wood', 'brick', 'wool'];
    const reserveMin = Math.max(0, Number((profile && profile.reserveMin) || 0));
    const lacking = pool.slice().sort((a, b) => (res[a] || 0) - (res[b] || 0))[0];
    if (!lacking) return false;

    const gives = pool
      .filter(k => k !== lacking)
      .map(k => ({ key: k, rate: getTradeRate('ai', k), value: Number(res[k] || 0) }))
      .filter(item => item.value >= item.rate && (item.value - item.rate) >= reserveMin)
      .sort((a, b) => (b.value - b.rate) - (a.value - a.rate));
    if (!gives.length) return false;

    const give = gives[0];
    res[give.key] -= give.rate;
    res[lacking] += 1;
    logEvent(`AI a făcut schimb ${give.rate}:1 (${resourceLabel(give.key)} -> ${resourceLabel(lacking)}).`);
    return true;
  }

  function expectedYield(hex) {
    if (!hex.token) return 0;
    return ({ 2: 1, 3: 2, 4: 3, 5: 4, 6: 5, 8: 5, 9: 4, 10: 3, 11: 2, 12: 1 })[hex.token] || 0;
  }

  function useCard(idx) {
    if (!isPlayerActionPhase() || state.cardPlayedThisTurn) return;
    const cards = state.players.player.cards;
    const cardId = cards[idx];
    if (!cardId) return;
    captureUndo();

    if (cardId === 'abundance') {
      gainRandomResources('player', 2);
      logEvent('Carte jucată: Anul Abundenței.');
    } else if (cardId === 'mason') {
      state.effects.player.masonDiscount = true;
      logEvent('Carte activă: Vestérul Pietrar (următoarea așezare fără lemn).');
    } else if (cardId === 'caravan') {
      state.pendingAction = 'road';
      state.roadBuildStart = null;
      state.roadBuildFree = true;
      setHint('Carte Caravană activă: selectează startul pentru drumul gratuit.');
      logEvent('Carte jucată: Caravană (drum gratuit în acest tur).');
    } else if (cardId === 'crystalburst') {
      state.players.player.resources.brick += 1;
      state.players.player.resources.ore += 1;
      logEvent('Carte jucată: Focar Mineral.');
    } else if (cardId === 'knight') {
      playKnightCard('player');
      logEvent('Carte jucată: Cavaler (hoț mutat).');
    }

    cards.splice(idx, 1);
    state.discard.push(cardId);
    state.cardPlayedThisTurn = true;
    if (state.current === 'player') state.matchStats.cardsPlayed += 1;
    if (state.current === 'player') markTutorialSignal('cardPlayed');
    recalcVp();
    refreshUi();
    saveState();
  }

  function playKnightCard(owner) {
    state.players[owner].knightsPlayed = Number(state.players[owner].knightsPlayed || 0) + 1;
    if (!state.armyStats || typeof state.armyStats !== 'object') state.armyStats = { player: 0, ai: 0 };
    state.armyStats[owner] = state.players[owner].knightsPlayed;
    recalcLargestArmy();
    if (owner === 'player') {
      state.matchStats.knightsPlayed += 1;
      const target = state.board
        .filter(h => h.id !== state.robberHexId)
        .sort((a, b) => scoreRobberTarget(b, 'player', 1) - scoreRobberTarget(a, 'player', 1))[0];
      if (target) moveRobberTo(target.id, 'player');
      setHint('Cavaler activ: hoțul a fost mutat.');
    } else {
      const profile = getAiProfile();
      const target = state.board
        .filter(h => h.id !== state.robberHexId)
        .sort((a, b) => scoreRobberTarget(b, 'ai', profile.robberBias) - scoreRobberTarget(a, 'ai', profile.robberBias))[0];
      if (target) moveRobberTo(target.id, 'ai');
    }
  }

  function gainRandomResources(owner, count) {
    const keys = ['wood', 'brick', 'grain', 'wool', 'ore'];
    for (let i = 0; i < count; i++) {
      const k = keys[Math.floor(Math.random() * keys.length)];
      state.players[owner].resources[k] += 1;
    }
  }

  function recalcLongestRoad() {
    const p = state.players.player;
    const a = state.players.ai;
    const pLen = longestRoadLength('player');
    const aLen = longestRoadLength('ai');
    state.roadStats.player = pLen;
    state.roadStats.ai = aLen;
    p.roads = roadEdgeIds('player').length || roadHexKeys('player').length;
    a.roads = roadEdgeIds('ai').length || roadHexKeys('ai').length;
    p.hasLongestRoad = pLen >= 5 && pLen > aLen;
    a.hasLongestRoad = aLen >= 5 && aLen > pLen;
    if (state.current === 'player') {
      state.matchStats.longestRoadPeak = Math.max(Number(state.matchStats.longestRoadPeak || 0), pLen);
    }
  }

  function recalcLargestArmy() {
    const p = state.players.player;
    const a = state.players.ai;
    const pCount = Number(p.knightsPlayed || 0);
    const aCount = Number(a.knightsPlayed || 0);
    state.armyStats.player = pCount;
    state.armyStats.ai = aCount;
    p.hasLargestArmy = pCount >= 3 && pCount > aCount;
    a.hasLargestArmy = aCount >= 3 && aCount > pCount;
    if (state.current === 'player') {
      state.matchStats.largestArmyPeak = Math.max(Number(state.matchStats.largestArmyPeak || 0), pCount);
    }
  }

  function longestRoadLength(owner) {
    const graph = {};
    let edgeCount = 0;
    const topo = state.topology;
    const edgeIds = state.roadsByEdge && Array.isArray(state.roadsByEdge[owner]) ? state.roadsByEdge[owner] : [];
    if (topo && Array.isArray(topo.edges) && edgeIds.length) {
      edgeIds.forEach(id => {
        const e = topo.edges[id];
        if (!e) return;
        const key = `e${id}`;
        const a = e.a;
        const b = e.b;
        if (!graph[a]) graph[a] = [];
        if (!graph[b]) graph[b] = [];
        graph[a].push({ to: b, edge: key });
        graph[b].push({ to: a, edge: key });
        edgeCount += 1;
      });
    } else {
      const legacyEdges = state.roads[owner] || [];
      legacyEdges.forEach(k => {
        const parts = k.split('-');
        const a = Number(parts[0]);
        const b = Number(parts[1]);
        if (!graph[a]) graph[a] = [];
        if (!graph[b]) graph[b] = [];
        graph[a].push({ to: b, edge: k });
        graph[b].push({ to: a, edge: k });
        edgeCount += 1;
      });
    }
    if (!edgeCount) return 0;
    let best = 0;
    Object.keys(graph).forEach(node => {
      best = Math.max(best, dfsRoadLen(Number(node), new Set(), graph));
    });
    return best;
  }

  function dfsRoadLen(node, usedEdges, graph) {
    const links = graph[node] || [];
    let best = 0;
    links.forEach(link => {
      if (usedEdges.has(link.edge)) return;
      const nextUsed = new Set(usedEdges);
      nextUsed.add(link.edge);
      best = Math.max(best, 1 + dfsRoadLen(link.to, nextUsed, graph));
    });
    return best;
  }

  function recalcVp() {
    recalcLongestRoad();
    recalcLargestArmy();
    const useVertexModel = hasAnyVertexClaims();
    ['player', 'ai'].forEach(owner => {
      let vp = 0;
      if (useVertexModel) {
        ownedVertexClaims(owner).forEach(({ claim }) => {
          vp += (Number(claim.level || 0) >= 2) ? 2 : 1;
        });
      } else {
        state.board.forEach(h => { if (h.owner === owner) vp += (h.level === 2 ? 2 : 1); });
      }
      if (state.players[owner].hasLongestRoad) vp += 2;
      if (state.players[owner].hasLargestArmy) vp += 2;
      state.players[owner].vp = vp;
    });
    checkEnd();
  }

  function checkEnd() {
    if (state.players.player.vp >= state.vpTarget) {
      endGame(`${state.nickname} a câștigat!`, `Ai atins ${state.players.player.vp} VP.`);
      return true;
    }
    if (state.players.ai.vp >= state.vpTarget) {
      endGame('AI a câștigat', `AI a atins ${state.players.ai.vp} VP.`);
      return true;
    }
    return false;
  }

  function endGame(title, sub) {
    if (state.gameOver) return;
    state.gameOver = true;
    clearAiTurnRecovery();
    state.aiThinking = false;
    state.current = 'player';
    state.diceRolling = false;
    const result = buildMatchResult(title);
    ui.endTitle.textContent = title;
    ui.endSub.textContent = sub;
    if (ui.endStats) {
      ui.endStats.innerHTML =
        `<div><strong>Jucător:</strong> ${state.nickname}</div>` +
        `<div><strong>Ture jucate:</strong> ${state.turn}</div>` +
        `<div><strong>Scor final:</strong> Tu ${state.players.player.vp} VP • AI ${state.players.ai.vp} VP</div>` +
        `<div><strong>Durată:</strong> ${formatDuration(result.durationSec)}</div>` +
        `<div><strong>Puncte sezon:</strong> ${result.seasonPoints}</div>`;
    }
    registerMatchAchievements(/a câștigat!/i.test(title));
    renderAchievementsBadges();
    renderAchievementsTotals();
    pushLeaderboardResult(result);
    ui.endOverlay.classList.add('show');
    clearSave();
  }

  function canPay(owner, cost) {
    const res = state.players[owner].resources;
    return Object.keys(cost).every(k => (res[k] || 0) >= cost[k]);
  }

  function pay(owner, cost) {
    const res = state.players[owner].resources;
    Object.keys(cost).forEach(k => { res[k] -= cost[k]; });
  }

  function refreshUi() {
    ui.turnLabel.textContent = `Tura ${state.turn}`;
    if (state.phase === 'setup') {
      ui.phaseLabel.textContent = 'Setup';
    } else if (state.phase === 'robber') {
      ui.phaseLabel.textContent = 'Mută hoțul';
    } else if (state.current === 'ai' || state.aiThinking) {
      ui.phaseLabel.textContent = 'AI';
    } else {
      ui.phaseLabel.textContent = state.rolled ? 'Acțiuni' : 'Aruncă zarurile';
    }
    ui.saveBadge.textContent = saveBadgeText;
    ui.playerVp.textContent = String(state.players.player.vp);
    ui.aiVp.textContent = String(state.players.ai.vp);
    ui.targetVp.textContent = String(state.vpTarget);
    if (ui.playerNickname) ui.playerNickname.textContent = state.nickname;
    if (ui.profileAiMode) ui.profileAiMode.textContent = aiModeLabel(state.aiMode);

    const pRes = state.players.player.resources;
    ui.playerRes.innerHTML = Object.keys(pRes).map(k => (
      `<div class="res-item res-${k}" data-res-key="${k}">` +
      `<span class="res-name"><span class="res-icon" aria-hidden="true"></span>${resourceLabel(k)}</span>` +
      `<strong>${pRes[k]}</strong>` +
      '</div>'
    )).join('');

    ui.rollBtn.disabled = !(isPlayerMain() && !state.rolled);
    if (state.diceRolling) ui.rollBtn.disabled = true;
    ui.undoBtn.disabled = !(isPlayerActionPhase() && Array.isArray(state.undoStack) && state.undoStack.length > 0);
    ui.endBtn.disabled = !(isPlayerMain() && state.rolled);
    ui.cancelActionBtn.disabled = !state.pendingAction;
    if (ui.surrenderBtn) ui.surrenderBtn.disabled = (state.phase === 'setup');
    ui.buildSettlementBtn.disabled = !(isPlayerActionPhase() && canPay('player', { wood: 1, brick: 1, grain: 1, wool: 1 }) && hasLegalSettlementMove('player'));
    ui.buildCityBtn.disabled = !(isPlayerActionPhase() && canPay('player', { ore: 3, grain: 2 }) && hasLegalCityMove('player'));
    ui.buildRoadBtn.disabled = !(isPlayerActionPhase() && hasLegalRoadMove('player') && (state.roadBuildFree || canPay('player', { wood: 1, brick: 1 })));
    ui.tradeBtn.disabled = !isPlayerActionPhase();
    if (!isPlayerActionPhase() && isOverlayShown(ui.tradeOverlay)) closeTradeModal();
    updateTradeModalUi();

    renderHand();
    renderEffectsStatus();
    renderLiveStatus();
    renderAchievementsSummary();
    renderAchievementsTotals();
    renderAchievementsBadges();
    renderTutorialFlowPanel();
    renderTutorialHint();
    renderCoachHint();
    updateDynamicControlHints();
    renderBoard();
  }

  function renderLiveStatus() {
    const playerLen = (state.roadStats && state.roadStats.player) || 0;
    const aiLen = (state.roadStats && state.roadStats.ai) || 0;
    const roadOwner = state.players.player.hasLongestRoad ? 'player' : state.players.ai.hasLongestRoad ? 'ai' : 'none';
    if (ui.liveLongestRoad) {
      let text = `Nedisputat (Tu ${playerLen} • AI ${aiLen})`;
      if (state.players.player.hasLongestRoad) text = `${state.nickname} (${playerLen})`;
      else if (state.players.ai.hasLongestRoad) text = `AI (${aiLen})`;
      else if (playerLen >= 5 && playerLen === aiLen) text = `Egal (${playerLen})`;
      ui.liveLongestRoad.textContent = text;
    }
    if (roadOwner !== liveOwners.road) {
      pulseLiveTile(ui.liveLongestRoadWrap);
      liveOwners.road = roadOwner;
    }
    if (ui.liveLargestArmy) {
      const pArmy = Number((state.armyStats && state.armyStats.player) || 0);
      const aArmy = Number((state.armyStats && state.armyStats.ai) || 0);
      const armyOwner = state.players.player.hasLargestArmy ? 'player' : state.players.ai.hasLargestArmy ? 'ai' : 'none';
      let text = `Nedisputat (Tu ${pArmy} • AI ${aArmy})`;
      if (state.players.player.hasLargestArmy) text = `${state.nickname} (${pArmy})`;
      else if (state.players.ai.hasLargestArmy) text = `AI (${aArmy})`;
      else if (pArmy >= 3 && pArmy === aArmy) text = `Egal (${pArmy})`;
      ui.liveLargestArmy.textContent = text;
      if (armyOwner !== liveOwners.army) {
        pulseLiveTile(ui.liveLargestArmyWrap);
        liveOwners.army = armyOwner;
      }
    }
    if (ui.liveVpRace) ui.liveVpRace.textContent = `${state.players.player.vp} / ${state.vpTarget} / ${state.players.ai.vp}`;
  }

  function pulseLiveTile(el) {
    if (!el || !el.classList) return;
    el.classList.remove('live-flash');
    void el.offsetWidth;
    el.classList.add('live-flash');
  }

  function renderAchievementsSummary() {
    if (!ui.achievementsSummary) return;
    const longestOwner = state.players.player.hasLongestRoad
      ? `${escapeHtml(state.nickname)} (+2 VP)`
      : state.players.ai.hasLongestRoad
        ? 'AI (+2 VP)'
        : 'Nimeni';
    const armyOwner = state.players.player.hasLargestArmy
      ? `${escapeHtml(state.nickname)} (+2 VP)`
      : state.players.ai.hasLargestArmy
        ? 'AI (+2 VP)'
        : 'Nimeni';
    const playerVp = Number(state.players.player.vp || 0);
    const aiVp = Number(state.players.ai.vp || 0);
    const gap = playerVp - aiVp;
    const gapLabel = gap === 0 ? 'Egalitate' : gap > 0 ? `${escapeHtml(state.nickname)} conduce cu ${gap}` : `AI conduce cu ${Math.abs(gap)}`;
    ui.achievementsSummary.innerHTML =
      `<div><strong>Longest Road:</strong> ${longestOwner}</div>` +
      `<div><strong>Largest Army:</strong> ${armyOwner} (Tu ${state.armyStats.player || 0} • AI ${state.armyStats.ai || 0})</div>` +
      `<div><strong>VP Race:</strong> ${playerVp} (tu) • ${aiVp} (AI) • țintă ${state.vpTarget}</div>` +
      `<div><strong>Status cursă:</strong> ${gapLabel}</div>`;
  }

  function renderAchievementsTotals() {
    if (!ui.achievementsTotals) return;
    const bestTurn = achievements.bestTurnWin == null ? '-' : String(achievements.bestTurnWin);
    ui.achievementsTotals.innerHTML =
      `<div><strong>Jocuri jucate:</strong> ${achievements.gamesPlayed} • <strong>Victorii:</strong> ${achievements.gamesWon}</div>` +
      `<div><strong>Max VP atins:</strong> ${achievements.maxVpReached} • <strong>Cel mai rapid win:</strong> tura ${bestTurn}</div>` +
      `<div><strong>Record Longest Road:</strong> ${achievements.longestRoadRecord} • <strong>Record Largest Army:</strong> ${achievements.largestArmyRecord}</div>` +
      `<div><strong>Acțiuni totale:</strong> cărți ${achievements.cardsPlayed}, cavaleri ${achievements.knightsPlayed}, hoț mutat ${achievements.robberMoves}, drumuri ${achievements.roadsBuilt}, orașe ${achievements.citiesBuilt}</div>`;
  }

  function renderAchievementsBadges() {
    if (!ui.achievementsBadges) return;
    const defs = getAchievementBadgeDefs();
    const newlyUnlocked = [];
    ui.achievementsBadges.innerHTML = defs.map(item => {
      const value = Math.max(0, Number(item.val || 0));
      const need = Math.max(1, Number(item.need || 1));
      const ok = value >= need;
      const progress = `${Math.min(value, need)}/${need}`;
      const icon = achievementIconSvg(item.icon);
      const wasUnlocked = !!achievementUnlockedSeen[item.key];
      const isNewUnlock = ok && !wasUnlocked;
      if (isNewUnlock) {
        achievementUnlockedSeen[item.key] = true;
        newlyUnlocked.push(item.title);
      }
      return `<article class="ach-badge${ok ? ' unlocked' : ''}">` +
        `<span class="ach-icon">${icon}</span>` +
        `<div class="ach-body"><strong>${item.title}</strong><span>${item.desc}</span><div class="ach-progress">${progress}</div></div>` +
        '</article>';
    }).join('');
    if (newlyUnlocked.length) {
      ui.achievementsBadges.querySelectorAll('.ach-badge.unlocked').forEach((el) => {
        el.classList.remove('ach-pop');
      });
      newlyUnlocked.forEach((title) => {
        const node = Array.from(ui.achievementsBadges.querySelectorAll('.ach-badge.unlocked strong'))
          .find((n) => n.textContent === title);
        if (node && node.parentElement && node.parentElement.parentElement) {
          node.parentElement.parentElement.classList.add('ach-pop');
        }
      });
      logEvent(`Achievement deblocat: ${newlyUnlocked.join(', ')}.`);
      showAchievementToast(newlyUnlocked);
      playTone(660, 0.11, 'triangle');
      playTone(820, 0.08, 'triangle');
    }
  }

  function showAchievementToast(titles) {
    if (!ui.achievementToast || !Array.isArray(titles) || !titles.length) return;
    const label = titles.length === 1
      ? `Achievement unlocked: ${titles[0]}`
      : `Achievements unlocked: ${titles.join(', ')}`;
    ui.achievementToast.textContent = label;
    ui.achievementToast.classList.add('show');
    if (achievementToastTimer != null) clearTimeout(achievementToastTimer);
    achievementToastTimer = window.setTimeout(() => {
      ui.achievementToast.classList.remove('show');
      achievementToastTimer = null;
    }, 2800);
  }

  function achievementIconSvg(code) {
    const map = {
      M1: '<svg viewBox="0 0 24 24" aria-hidden="true"><path class="ico-stroke" d="M4 18h16M7 18V7l5 3 5-3v11"/></svg>',
      V10: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle class="ico-stroke" cx="12" cy="12" r="8"/><path class="ico-stroke" d="M12 8v4l3 2"/></svg>',
      W5: '<svg viewBox="0 0 24 24" aria-hidden="true"><path class="ico-stroke" d="M4 7l3 9 5-6 5 6 3-9"/></svg>',
      W25: '<svg viewBox="0 0 24 24" aria-hidden="true"><path class="ico-stroke" d="M4 7l3 9 5-6 5 6 3-9"/><path class="ico-stroke" d="M8 18h8"/></svg>',
      LR: '<svg viewBox="0 0 24 24" aria-hidden="true"><path class="ico-stroke" d="M3 16l4-4 4 3 4-5 6 2"/><circle class="ico-fill" cx="3" cy="16" r="1.4"/><circle class="ico-fill" cx="21" cy="12" r="1.4"/></svg>',
      LA: '<svg viewBox="0 0 24 24" aria-hidden="true"><path class="ico-stroke" d="M12 4l2.5 5 5.5.8-4 3.9.9 5.3-4.9-2.6-4.9 2.6.9-5.3-4-3.9 5.5-.8z"/></svg>',
      RD: '<svg viewBox="0 0 24 24" aria-hidden="true"><path class="ico-stroke" d="M3 16h18M6 13h12M9 10h6"/></svg>',
      CT: '<svg viewBox="0 0 24 24" aria-hidden="true"><path class="ico-stroke" d="M4 18h16V9l-4-3-4 3-4-3-4 3z"/></svg>',
      CD: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect class="ico-stroke" x="4" y="5" width="16" height="14" rx="2"/><path class="ico-stroke" d="M8 9h8M8 13h5"/></svg>',
      RB: '<svg viewBox="0 0 24 24" aria-hidden="true"><path class="ico-stroke" d="M12 4c3 0 6 2.3 6 6 0 5-6 10-6 10S6 15 6 10c0-3.7 3-6 6-6z"/><circle class="ico-fill" cx="12" cy="10" r="1.7"/></svg>'
    };
    return map[code] || '<svg viewBox="0 0 24 24" aria-hidden="true"><circle class="ico-stroke" cx="12" cy="12" r="8"/></svg>';
  }

  function renderHand() {
    const cards = state.players.player.cards;
    ui.cardHand.innerHTML = cards.length ? cards.map((id, idx) => {
      const c = CARD_DEFS[id];
      const disabled = (!isPlayerActionPhase() || state.cardPlayedThisTurn) ? 'disabled' : '';
      return `<article class="ui-card"><span class="card-badge">Carte</span><img src="${c.img}" alt="${c.name}"><div class="ui-card-title">${c.name}</div><div class="card-meta">${c.text}</div><button data-card-idx="${idx}" title="${c.text}" ${disabled}>Joacă</button></article>`;
    }).join('') : '<div class="cost">Nu ai cărți momentan.</div>';

    ui.cardHint.textContent = state.cardPlayedThisTurn ? 'Ai jucat deja o carte în tura aceasta.' : 'Poți juca o carte pe tură.';
    if (state.effects.player.masonDiscount) {
      ui.cardHint.textContent += ' Efect activ: următoarea Așezare fără lemn.';
    }
    if (state.roadBuildFree) {
      ui.cardHint.textContent += ' Efect activ: un Drum gratuit disponibil.';
    }
    ui.cardHand.querySelectorAll('button[data-card-idx]').forEach(btn => {
      btn.addEventListener('click', () => useCard(Number(btn.dataset.cardIdx)));
    });
  }

  function renderEffectsStatus() {
    if (!ui.effectsStatus) return;
    const pills = [];
    if (state.effects && state.effects.player && state.effects.player.masonDiscount) {
      pills.push('<span class="effect-pill">Vestérul Pietrar activ</span>');
    }
    if (state.roadBuildFree) {
      pills.push('<span class="effect-pill">Caravană: 1 drum gratuit</span>');
    }
    if (state.players.player.hasLongestRoad) {
      pills.push('<span class="effect-pill strong">Longest Road (+2 VP)</span>');
    }
    if (state.players.player.hasLargestArmy) {
      pills.push('<span class="effect-pill strong">Largest Army (+2 VP)</span>');
    }
    const undoCount = Array.isArray(state.undoStack) ? state.undoStack.length : 0;
    if (undoCount > 0 && isPlayerActionPhase()) {
      pills.push(`<span class="effect-pill">Undo disponibile: ${undoCount}</span>`);
    }
    pills.push(`<span class="effect-pill">Drum maxim: ${state.roadStats.player || 0}</span>`);
    pills.push(`<span class="effect-pill">AI drum maxim: ${state.roadStats.ai || 0}</span>`);
    pills.push(`<span class="effect-pill">Cavaleri: ${state.armyStats.player || 0}</span>`);
    pills.push(`<span class="effect-pill">AI cavaleri: ${state.armyStats.ai || 0}</span>`);
    ui.effectsStatus.innerHTML = pills.join('');
  }

  function doTrade(mode) {
    if (!isPlayerActionPhase()) return;
    const give = ui.tradeGive ? ui.tradeGive.value : '';
    const get = ui.tradeGet ? ui.tradeGet.value : '';
    const tradeMode = ['ai', 'bank', 'port'].includes(mode) ? mode : currentTradeMode;
    const context = getTradeContext(tradeMode, give, get);
    if (!give || !get || give === get) return setHint('Alege două resurse diferite pentru schimb.');
    if (!context.allowed) return setHint(context.reason || 'Schimb indisponibil.');
    const res = state.players.player.resources;
    if ((res[give] || 0) < context.rate) return setHint(`Nu ai ${context.rate} ${resourceLabel(give)} pentru schimb.`);
    if (tradeMode === 'ai') {
      const aiRes = state.players.ai.resources;
      if ((aiRes[get] || 0) < 1) return setHint(`AI nu are ${resourceLabel(get)} disponibil pentru schimb.`);
      captureUndo();
      res[give] -= 1;
      res[get] += 1;
      aiRes[give] += 1;
      aiRes[get] -= 1;
      logEvent(`Schimb AI: 1 ${resourceLabel(give)} -> 1 ${resourceLabel(get)}.`);
      playTone(520, 0.08, 'triangle');
      pulseResourceCells([give, get]);
      markTutorialSignal('traded');
      refreshUi();
      closeTradeModal();
      saveState();
      return;
    }
    captureUndo();
    res[give] -= context.rate;
    res[get] += 1;
    logEvent(`Schimb executat (${tradeMode === 'port' ? 'Port' : 'Bancă'}): ${context.rate} ${resourceLabel(give)} -> 1 ${resourceLabel(get)}.`);
    playTone(520, 0.08, 'triangle');
    pulseResourceCells([give, get]);
    markTutorialSignal('traded');
    refreshUi();
    closeTradeModal();
    saveState();
  }

  function playerHasPort(port) {
    const hex = state.board[port.hexId];
    if (!hex) return false;
    if (hasAnyVertexClaims()) return ownerControlsHexViaClaims('player', port.hexId);
    return ownerControlsHexViaClaims('player', port.hexId) || hex.owner === 'player';
  }

  function getTradeRate(owner, giveResource) {
    let best = 4;
    state.ports.forEach(port => {
      const hex = state.board[port.hexId];
      if (!hex) return;
      const controls = hasAnyVertexClaims()
        ? ownerControlsHexViaClaims(owner, port.hexId)
        : (ownerControlsHexViaClaims(owner, port.hexId) || hex.owner === owner);
      if (!controls) return;
      if (port.type === 'generic') best = Math.min(best, 3);
      if (port.type === giveResource) best = Math.min(best, 2);
    });
    return best;
  }

  function getPortTradeRate(owner, giveResource) {
    let best = null;
    state.ports.forEach(port => {
      const hex = state.board[port.hexId];
      if (!hex) return;
      const controls = hasAnyVertexClaims()
        ? ownerControlsHexViaClaims(owner, port.hexId)
        : (ownerControlsHexViaClaims(owner, port.hexId) || hex.owner === owner);
      if (!controls) return;
      if (port.type === 'generic') best = best == null ? 3 : Math.min(best, 3);
      if (port.type === giveResource) best = best == null ? 2 : Math.min(best, 2);
    });
    return best;
  }

  function getTradeContext(mode, give, get) {
    if (!give || !get || give === get) {
      return { allowed: false, rate: 0, label: '-', hint: 'Selectează două resurse diferite.', reason: 'Selectează două resurse diferite.' };
    }
    if (mode === 'ai') {
      return {
        allowed: true,
        rate: 1,
        label: '1:1 (AI)',
        hint: 'Schimb direct 1:1 cu AI (dacă AI are resursa cerută).',
        reason: ''
      };
    }
    if (mode === 'bank') {
      return {
        allowed: true,
        rate: 4,
        label: '4:1 (bancă)',
        hint: 'Bancă standard: dai 4 dintr-o resursă și primești 1.',
        reason: ''
      };
    }
    const portRate = getPortTradeRate('player', give);
    if (portRate == null) {
      return {
        allowed: false,
        rate: 0,
        label: '-',
        hint: 'Nu controlezi încă un port activ pentru schimb.',
        reason: 'Nu controlezi încă un port activ.'
      };
    }
    return {
      allowed: true,
      rate: portRate,
      label: `${portRate}:1 (${portRate === 2 ? 'port special' : 'port general'})`,
      hint: portRate === 2 ? 'Port special activ: schimb 2:1 pentru resursa selectată.' : 'Port general activ: schimb 3:1.',
      reason: ''
    };
  }

  function setTradeMode(mode) {
    if (!['ai', 'bank', 'port'].includes(mode)) return;
    currentTradeMode = mode;
    updateTradeModalUi();
  }

  function openTradeModal() {
    if (!isPlayerActionPhase()) return;
    if (!ui.tradeOverlay) return;
    ui.tradeOverlay.classList.add('show');
    setTradeMode(currentTradeMode || 'bank');
  }

  function closeTradeModal() {
    if (ui.tradeOverlay) ui.tradeOverlay.classList.remove('show');
  }

  function updateTradeModalUi() {
    const give = ui.tradeGive ? ui.tradeGive.value : '';
    const get = ui.tradeGet ? ui.tradeGet.value : '';
    const context = getTradeContext(currentTradeMode, give, get);
    if (ui.tradeTabAi) {
      ui.tradeTabAi.classList.toggle('active', currentTradeMode === 'ai');
      ui.tradeTabAi.setAttribute('aria-selected', currentTradeMode === 'ai' ? 'true' : 'false');
    }
    if (ui.tradeTabBank) {
      ui.tradeTabBank.classList.toggle('active', currentTradeMode === 'bank');
      ui.tradeTabBank.setAttribute('aria-selected', currentTradeMode === 'bank' ? 'true' : 'false');
    }
    if (ui.tradeTabPort) {
      ui.tradeTabPort.classList.toggle('active', currentTradeMode === 'port');
      ui.tradeTabPort.setAttribute('aria-selected', currentTradeMode === 'port' ? 'true' : 'false');
    }
    if (ui.tradeModeLabel) {
      ui.tradeModeLabel.textContent = currentTradeMode === 'ai'
        ? 'AI - schimb 1:1'
        : currentTradeMode === 'bank'
          ? 'Bancă - schimb 4:1'
          : 'Port - schimb cu rată de port';
    }
    if (ui.tradeRateInfo) ui.tradeRateInfo.textContent = context.label;
    if (ui.tradeModalHint) ui.tradeModalHint.textContent = context.hint;
    if (ui.confirmTradeBtn) ui.confirmTradeBtn.disabled = !isPlayerActionPhase() || !context.allowed;
  }

  function setHint(text) { ui.hint.textContent = text; }

  function getTutorialSteps() {
    return [
      {
        title: 'Setup inițial',
        text: 'Plasează 2 așezări inițiale. Alege hex-uri libere și neadiacente.',
        goal: 'Obiectiv: finalizează setup-ul inițial.',
        focus: '#boardSvg',
        check: () => state.phase !== 'setup'
      },
      {
        title: 'Aruncarea zarurilor',
        text: 'În fiecare tură, primul pas este aruncarea zarurilor pentru distribuția de resurse.',
        goal: 'Obiectiv: apasă `Aruncă zarurile`.',
        focus: '#rollBtn',
        check: () => !!tutorialFlow.signals.rolled
      },
      {
        title: 'Construiește',
        text: 'După zaruri poți construi așezare, drum sau oraș, dacă ai resurse.',
        goal: 'Obiectiv: construiește cel puțin o dată (așezare/drum/oraș).',
        focus: '#buildSettlementBtn',
        check: () => !!tutorialFlow.signals.built
      },
      {
        title: 'Schimbă resurse',
        text: 'Folosește schimbul 4:1, 3:1 sau 2:1 ca să obții resursa cheie.',
        goal: 'Obiectiv: execută un schimb valid.',
        focus: '#tradeBtn',
        check: () => !!tutorialFlow.signals.traded
      },
      {
        title: 'Joacă o carte',
        text: 'Cărțile oferă tactici rapide: bonusuri de resurse, drum gratuit, Cavaler.',
        goal: 'Obiectiv: joacă o carte.',
        focus: '#cardHand',
        check: () => !!tutorialFlow.signals.cardPlayed
      },
      {
        title: 'Faza Hoțului',
        text: 'Când apare 7, muți hoțul pe un hex inamic și poți fura o resursă.',
        goal: 'Obiectiv: dacă intri în faza Hoțului, mută-l. Dacă nu apare 7, poți da `Sari`.',
        focus: '#boardSvg',
        check: () => !!tutorialFlow.signals.robberMoved
      },
      {
        title: 'Încheie tura',
        text: 'După acțiuni, închei tura. AI-ul joacă după tine.',
        goal: 'Obiectiv: apasă `Încheie tura`.',
        focus: '#endTurnBtn',
        check: () => !!tutorialFlow.signals.endedTurn
      },
      {
        title: 'Observă tura AI',
        text: 'Privește ce face AI-ul: zaruri, construcții, schimburi, cărți.',
        goal: 'Obiectiv: lasă AI-ul să termine o tură și să revină rândul la tine.',
        focus: '#phaseLabel',
        check: () => !!tutorialFlow.signals.aiCycleDone
      },
      {
        title: 'Obiective live',
        text: 'Verifică live `Longest Road`, `Largest Army` și progresul VP.',
        goal: 'Obiectiv: deschide `Achievements` din profil.',
        focus: '#openAchievementsBtn',
        check: () => !!tutorialFlow.signals.openedAchievements
      },
      {
        title: 'Tutorial complet',
        text: 'Ești gata de joc: știi fluxul de tură, construcții, schimburi, cărți, hoț și obiective.',
        goal: 'Obiectiv final: joacă normal până la ținta VP și urmărește controlul pe Longest Road/Largest Army.',
        focus: '#liveVpRace',
        check: () => true
      }
    ];
  }

  function clearTutorialFocus() {
    document.querySelectorAll('.tutorial-focus').forEach(el => el.classList.remove('tutorial-focus'));
  }

  function applyTutorialFocus(target) {
    clearTutorialFocus();
    if (!target) return;
    const el = document.querySelector(target);
    if (el && el.classList) el.classList.add('tutorial-focus');
  }

  function beginInteractiveTutorial() {
    tutorialRequested = false;
    tutorialFlow.active = true;
    tutorialFlow.step = 0;
    tutorialFlow.signals = {
      setupDone: state.phase !== 'setup',
      rolled: false,
      built: false,
      traded: false,
      cardPlayed: false,
      robberMoved: false,
      endedTurn: false,
      aiCycleDone: false,
      openedAchievements: false
    };
    setHint('Tutorial interactiv pornit. Urmează pașii din panoul de ghid.');
    renderTutorialFlowPanel();
    refreshUi();
  }

  function endInteractiveTutorial() {
    tutorialFlow.active = false;
    tutorialFlow.step = 0;
    if (ui.tutorialFlow) ui.tutorialFlow.hidden = true;
    clearTutorialFocus();
    refreshUi();
  }

  function tutorialCurrentStep() {
    const steps = getTutorialSteps();
    const idx = Math.max(0, Math.min(tutorialFlow.step, steps.length - 1));
    return { steps, idx, step: steps[idx] };
  }

  function tutorialStepDone(step) {
    if (!step || typeof step.check !== 'function') return false;
    try { return !!step.check(); } catch (_e) { return false; }
  }

  function tutorialNextStep() {
    if (!tutorialFlow.active) return;
    const { steps, idx, step } = tutorialCurrentStep();
    const done = tutorialStepDone(step);
    if (!done && idx < steps.length - 1) {
      setHint('Finalizează obiectivul pasului curent sau folosește `Sari`.');
      return;
    }
    tutorialFlow.step = Math.min(idx + 1, steps.length - 1);
    renderTutorialFlowPanel();
  }

  function tutorialPrevStep() {
    if (!tutorialFlow.active) return;
    tutorialFlow.step = Math.max(0, tutorialFlow.step - 1);
    renderTutorialFlowPanel();
  }

  function tutorialSkipStep() {
    if (!tutorialFlow.active) return;
    const { steps, idx } = tutorialCurrentStep();
    tutorialFlow.step = Math.min(idx + 1, steps.length - 1);
    renderTutorialFlowPanel();
  }

  function markTutorialSignal(key) {
    if (!tutorialFlow || !tutorialFlow.signals) return;
    if (!Object.prototype.hasOwnProperty.call(tutorialFlow.signals, key)) return;
    tutorialFlow.signals[key] = true;
    renderTutorialFlowPanel();
  }

  function renderTutorialFlowPanel() {
    if (!ui.tutorialFlow) return;
    if (!tutorialFlow.active) {
      ui.tutorialFlow.hidden = true;
      clearTutorialFocus();
      return;
    }
    const { steps, idx, step } = tutorialCurrentStep();
    const done = tutorialStepDone(step);
    ui.tutorialFlow.hidden = false;
    if (ui.tutorialFlowTitle) ui.tutorialFlowTitle.textContent = step.title;
    if (ui.tutorialFlowProgress) ui.tutorialFlowProgress.textContent = `Pas ${idx + 1}/${steps.length}`;
    if (ui.tutorialFlowText) ui.tutorialFlowText.textContent = step.text;
    if (ui.tutorialFlowGoal) ui.tutorialFlowGoal.textContent = `${step.goal}${done ? ' ✓' : ''}`;
    if (ui.tutorialPrevBtn) ui.tutorialPrevBtn.disabled = (idx === 0);
    if (ui.tutorialNextBtn) ui.tutorialNextBtn.disabled = (!done && idx < steps.length - 1);
    applyTutorialFocus(step.focus);
  }

  function renderCoachHint() {
    if (!ui.coachHint) return;
    let text = 'Action Coach: aruncă zarurile, apoi decide între construcție, schimb sau carte.';
    if (state.phase === 'setup') {
      const left = Math.max(0, 2 - Number((state.setupPicks && state.setupPicks.player) || 0));
      text = left > 0
        ? `Action Coach: mai ai ${left} plasare${left > 1 ? 'i' : ''} de setup. Alege hex-uri libere și neadiacente.`
        : 'Action Coach: așteaptă plasările AI, apoi începe tura ta.';
    } else if (state.phase === 'robber') {
      text = 'Action Coach: mută hoțul pe un hex inamic pentru blocare + șansă de furt.';
    } else if (state.current === 'ai' || state.aiThinking) {
      text = 'Action Coach: observă decizia AI. După tura AI, planifică următoarea construcție.';
    } else if (!state.rolled) {
      text = 'Action Coach: primul pas obligatoriu este `Aruncă zarurile`.';
    } else if (state.pendingAction === 'road' && state.roadBuildStart == null) {
      text = 'Action Coach: selectează startul drumului pe teritoriu propriu sau capăt de drum existent.';
    } else if (state.pendingAction === 'road' && state.roadBuildStart != null) {
      text = 'Action Coach: selectează hex-ul vecin pentru capătul drumului.';
    } else if (state.players.player.vp >= state.vpTarget - 2) {
      text = 'Action Coach: ești aproape de victorie. Prioritizează VP direct (oraș/așezare).';
    }
    ui.coachHint.textContent = text;
  }

  function renderTutorialHint() {
    const box = ui.tutorialHint;
    if (!box) return;
    if (tutorialFlow.active) {
      box.hidden = true;
      box.textContent = '';
      return;
    }
    let text = '';
    if (!state.gameOver && state.phase === 'setup') {
      const left = Math.max(0, 2 - Number((state.setupPicks && state.setupPicks.player) || 0));
      text = left > 0
        ? `Tutorial: plasează încă ${left} așezare${left > 1 ? 'i' : ''} pe hex-uri libere (nu lipite de alte așezări).`
        : 'Tutorial: AI își plasează așezările, apoi începe tura ta.';
    } else if (!state.gameOver && state.current === 'player' && state.turn <= 3) {
      if (state.phase === 'robber') {
        text = 'Tutorial: ai dat 7. Mută hoțul pe un hex inamic pentru a bloca producția.';
      } else if (!state.rolled) {
        text = 'Tutorial: Pas 1 - aruncă zarurile (R), apoi primești resurse automat.';
      } else if (state.pendingAction === 'road' && state.roadBuildStart == null) {
        text = 'Tutorial: selectează întâi hex-ul de start pentru drum.';
      } else if (state.pendingAction === 'road' && state.roadBuildStart != null) {
        text = 'Tutorial: alege acum hex-ul vecin pentru capătul drumului.';
      } else {
        text = 'Tutorial: Pas 2 - construiește, schimbă sau joacă o carte, apoi încheie tura (E).';
      }
    }
    if (!text) {
      box.hidden = true;
      box.textContent = '';
      return;
    }
    box.hidden = false;
    box.textContent = text;
  }

  function updateDynamicControlHints() {
    if (!ui) return;
    if (ui.rollBtn) {
      ui.rollBtn.title = ui.rollBtn.disabled
        ? (state.diceRolling ? 'Zarurile sunt în animație.' : (state.rolled ? 'Ai aruncat deja în tura aceasta.' : 'Poți arunca doar în tura ta.'))
        : 'R - aruncă zarurile pentru tura curentă';
    }
    if (ui.endBtn) {
      ui.endBtn.title = ui.endBtn.disabled
        ? (state.rolled ? 'Poți încheia doar în tura ta.' : 'Aruncă zarurile înainte să închei tura.')
        : 'E - finalizează tura și începe tura AI';
    }
    if (ui.buildSettlementBtn) {
      let t = 'B - construiește o așezare (+1 VP)';
      if (ui.buildSettlementBtn.disabled) {
        if (!isPlayerActionPhase()) t = 'Așezarea este disponibilă după aruncarea zarurilor, în tura ta.';
        else if (!canPay('player', { wood: 1, brick: 1, grain: 1, wool: 1 })) t = 'Nu ai costul complet pentru Așezare (lemn, caramida, grâu, lână).';
        else t = 'Nu există în acest moment un hex legal pentru așezare.';
      }
      ui.buildSettlementBtn.title = t;
    }
    if (ui.buildCityBtn) {
      let t = 'C - upgrade la oraș (+2 VP total pe hex)';
      if (ui.buildCityBtn.disabled) {
        if (!isPlayerActionPhase()) t = 'Orașul este disponibil după aruncarea zarurilor, în tura ta.';
        else if (!canPay('player', { ore: 3, grain: 2 })) t = 'Nu ai costul complet pentru Oraș (3 minereu, 2 grâu).';
        else if (state.selectedHex == null) t = 'Selectează întâi o așezare proprie pentru upgrade.';
        else t = 'Hex-ul selectat nu poate fi upgradat la oraș.';
      }
      ui.buildCityBtn.title = t;
    }
    if (ui.buildRoadBtn) {
      let t = 'D - construiește drum între două hex-uri vecine';
      if (ui.buildRoadBtn.disabled) {
        if (!isPlayerActionPhase()) t = 'Drumul este disponibil după aruncarea zarurilor, în tura ta.';
        else if (!(state.roadBuildFree || canPay('player', { wood: 1, brick: 1 }))) t = 'Nu ai costul pentru Drum (lemn + caramida).';
        else t = 'Nu există momentan o muchie legală pentru drum.';
      }
      ui.buildRoadBtn.title = t;
    }
    if (ui.tradeBtn) {
      ui.tradeBtn.title = ui.tradeBtn.disabled
        ? 'Schimbul este disponibil după aruncarea zarurilor, în tura ta.'
        : 'T - schimbă resurse în funcție de rata activă';
    }
  }

  function hasLegalSettlementMove(owner) {
    if (hasAnyVertexClaims() && state.topology && Array.isArray(state.topology.vertices)) {
      return state.topology.vertices.some(v => v && canOwnerExpandToVertex(owner, v.id));
    }
    return state.board.some(hex =>
      !hex.owner &&
      !claimsAroundHex(hex.id).length &&
      neighbors(hex.id).some(nb => nb.owner === owner || ownerControlsHexViaClaims(owner, nb.id))
    );
  }

  function hasLegalCityMove(owner) {
    if (hasAnyVertexClaims()) {
      return ownedVertexClaims(owner).some(({ claim }) => Number(claim.level || 0) === 1);
    }
    return state.board.some(hex => hex.owner === owner && hex.level === 1);
  }

  function canUpgradeCityAt(id, owner) {
    if (typeof id !== 'number') return false;
    if (hasAnyVertexClaims() && state.topology && state.topology.hexVertexIds) {
      const verts = state.topology.hexVertexIds[id] || [];
      return verts.some(vId => {
        const claim = vertexClaim(vId);
        return !!(claim && claim.owner === owner && Number(claim.level || 0) === 1);
      });
    }
    const hex = state.board[id];
    return !!hex && hex.owner === owner && hex.level === 1;
  }

  function hasLegalRoadMove(owner) {
    const anchors = new Set();
    if (hasAnyVertexClaims()) {
      Object.keys(state.vertexClaims).forEach(k => {
        const claim = state.vertexClaims[k];
        if (!claim || claim.owner !== owner) return;
        const vId = Number(k);
        if (!Number.isFinite(vId) || !state.topology || !Array.isArray(state.topology.vertices) || !state.topology.vertices[vId]) return;
        (state.topology.vertices[vId].hexIds || []).forEach(hid => anchors.add(hid));
      });
    } else {
      state.board.forEach(h => { if (h.owner === owner) anchors.add(h.id); });
    }
    roadEdgeIds(owner).forEach(id => {
      const e = state.topology && Array.isArray(state.topology.edges) ? state.topology.edges[id] : null;
      if (!e || !Array.isArray(e.hexIds)) return;
      e.hexIds.forEach(hid => anchors.add(hid));
    });
    if (!anchors.size) {
      roadHexKeys(owner).forEach(key => {
        const edge = parseRoadKey(key);
        if (!edge) return;
        anchors.add(edge[0]);
        anchors.add(edge[1]);
      });
    }
    for (const id of anchors) {
      const nbs = neighbors(id);
      for (let i = 0; i < nbs.length; i++) {
        if (!edgeTaken(id, nbs[i].id)) return true;
      }
    }
    return false;
  }

  function cancelPendingAction(reason) {
    if (!state.pendingAction) return false;
    const hadFreeRoad = state.pendingAction === 'road' && state.roadBuildFree;
    state.pendingAction = null;
    state.roadBuildStart = null;
    if (hadFreeRoad) {
      state.roadBuildFree = false;
      logEvent('Efectul Caravană a expirat (drumul gratuit nu a fost folosit).');
    } else if (reason === 'endTurn') {
      logEvent('Acțiunea neterminată a fost anulată la final de tură.');
    } else {
      setHint('Acțiunea curentă a fost anulată.');
    }
    refreshUi();
    if (reason !== 'endTurn') saveState();
    return true;
  }

  function captureUndo() {
    if (!isPlayerMain()) return;
    try {
      const snapshot = JSON.parse(JSON.stringify(state));
      snapshot.undoStack = [];
      if (!Array.isArray(state.undoStack)) state.undoStack = [];
      state.undoStack.push(snapshot);
      if (state.undoStack.length > MAX_UNDO_STEPS) {
        state.undoStack.shift();
      }
    } catch (_e) {
      state.undoStack = [];
    }
  }

  function undoLastAction() {
    if (!isPlayerActionPhase() || !Array.isArray(state.undoStack) || !state.undoStack.length) return;
    try {
      const snap = state.undoStack.pop();
      const remaining = state.undoStack.slice();
      Object.assign(state, snap);
      state.undoStack = remaining;
      reconcileLegacyBoardFromClaims();
      setHint('Ultima acțiune a fost anulată.');
      logEvent('Undo: ultima acțiune a fost restaurată la starea anterioară.');
      refreshUi();
      saveState();
    } catch (_e) {
      state.undoStack = [];
    }
  }

  function logEvent(text) {
    const row = document.createElement('div');
    row.textContent = text;
    ui.eventLog.prepend(row);
    while (ui.eventLog.children.length > 40) ui.eventLog.removeChild(ui.eventLog.lastChild);
  }

  function isPlayerMain() { return state.current === 'player' && state.phase === 'main'; }
  function isPlayerActionPhase() { return isPlayerMain() && state.rolled; }

  function resourceLabel(key) {
    return ({ wood: 'Lemn', brick: 'Caramida', grain: 'Grâu', wool: 'Lână', ore: 'Minereu' })[key] || key;
  }

  function buildHexTooltip(hex) {
    const terrain = TERRAIN_INFO[hex.terrain] ? TERRAIN_INFO[hex.terrain].label : hex.terrain;
    const token = hex.token == null ? '-' : String(hex.token);
    const around = claimsAroundHex(hex.id);
    const own = around.filter(row => row.claim.owner === 'player').length;
    const ai = around.filter(row => row.claim.owner === 'ai').length;
    const useClaims = hasAnyVertexClaims();
    const owner = around.length
      ? `${state.nickname}:${own} / AI:${ai}`
      : (useClaims ? 'Liber' : (hex.owner ? (hex.owner === 'player' ? state.nickname : 'AI') : 'Liber'));
    const level = around.length
      ? `${around.length} claim-uri vertex`
      : (useClaims ? '-' : (hex.level === 2 ? 'Oraș' : (hex.level === 1 ? 'Așezare' : '-')));
    const robber = hex.robber ? 'Da' : 'Nu';
    return `Hex #${hex.id} | Teren: ${terrain} | Token: ${token} | Owner: ${owner} | Clădire: ${level} | Hoț: ${robber}`;
  }

  function hexToPixel(q, r) {
    return {
      x: HEX_SIZE * (Math.sqrt(3) * q + Math.sqrt(3) / 2 * r) + CENTER_X,
      y: HEX_SIZE * (1.5 * r) + CENTER_Y
    };
  }

  function hexPoints(cx, cy, size) {
    const pts = [];
    for (let i = 0; i < 6; i++) {
      const a = (Math.PI / 180) * (60 * i - 30);
      pts.push(`${(cx + size * Math.cos(a)).toFixed(2)},${(cy + size * Math.sin(a)).toFixed(2)}`);
    }
    return pts.join(' ');
  }

  function hexCornerPoints(hex, size) {
    const c = hexToPixel(hex.q, hex.r);
    const s = Number(size || HEX_SIZE);
    const pts = [];
    for (let i = 0; i < 6; i++) {
      const a = Math.PI / 180 * (60 * i - 30);
      pts.push({
        x: c.x + s * Math.cos(a),
        y: c.y + s * Math.sin(a)
      });
    }
    return pts;
  }

  function getSettlementAnchor(hex) {
    const pts = hexCornerPoints(hex, HEX_SIZE - 6);
    const seed = (hex.q * 7) + (hex.r * 11) + (Number(hex.id || 0) % 5);
    const idx = ((seed % 6) + 6) % 6;
    return pts[idx];
  }

  function getSharedHexEdge(hexA, hexB) {
    const pa = hexCornerPoints(hexA, HEX_SIZE);
    const pb = hexCornerPoints(hexB, HEX_SIZE);
    const eps = 0.9;
    const shared = [];
    for (let i = 0; i < pa.length; i++) {
      for (let j = 0; j < pb.length; j++) {
        if (Math.abs(pa[i].x - pb[j].x) <= eps && Math.abs(pa[i].y - pb[j].y) <= eps) {
          shared.push({ x: pa[i].x, y: pa[i].y });
          break;
        }
      }
    }
    if (shared.length < 2) return null;
    return {
      x1: shared[0].x,
      y1: shared[0].y,
      x2: shared[1].x,
      y2: shared[1].y
    };
  }

  function parseRoadKey(key) {
    const parts = String(key || '').split('-');
    if (parts.length !== 2) return null;
    const a = Number(parts[0]);
    const b = Number(parts[1]);
    if (Number.isNaN(a) || Number.isNaN(b)) return null;
    return [a, b];
  }

  function shortenSegment(x1, y1, x2, y2, cut) {
    const dx = x2 - x1;
    const dy = y2 - y1;
    const len = Math.sqrt(dx * dx + dy * dy) || 1;
    const ux = dx / len;
    const uy = dy / len;
    return {
      x1: (x1 + ux * cut).toFixed(2),
      y1: (y1 + uy * cut).toFixed(2),
      x2: (x2 - ux * cut).toFixed(2),
      y2: (y2 - uy * cut).toFixed(2)
    };
  }

  function saveState() {
    try {
      const payload = Object.assign({}, state, { undoStack: [], aiRecoveryTimerId: null });
      localStorage.setItem(SAVE_KEY, JSON.stringify(payload));
      saveBadgeText = `Autosave ${formatClock(new Date())}`;
      ui.saveBadge.textContent = saveBadgeText;
    } catch (_e) {
      saveBadgeText = 'Autosave OFF';
      ui.saveBadge.textContent = saveBadgeText;
    }
    updateContinueButton();
  }

  function exportSaveToFile() {
    try {
      const payload = Object.assign({}, state, { undoStack: [], aiRecoveryTimerId: null });
      const content = JSON.stringify(payload, null, 2);
      const blob = new Blob([content], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      const stamp = new Date().toISOString().replace(/[:.]/g, '-');
      a.href = url;
      a.download = `kelling-save-${stamp}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      logEvent('Save exportat local.');
    } catch (_e) {
      setHint('Exportul save-ului a eșuat.');
    }
  }

  function onImportSaveFile(event) {
    const input = event.target;
    const file = input && input.files && input.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function () {
      try {
        const parsed = JSON.parse(String(reader.result || ''));
        if (!parsed || !Array.isArray(parsed.board)) {
          setHint('Fișier de save invalid.');
          return;
        }
        const previousRaw = localStorage.getItem(SAVE_KEY);
        localStorage.setItem(SAVE_KEY, JSON.stringify(parsed));
        if (!loadSaveToState()) {
          if (previousRaw) localStorage.setItem(SAVE_KEY, previousRaw);
          else localStorage.removeItem(SAVE_KEY);
          setHint('Import eșuat: save invalid.');
          return;
        }
        ui.startOverlay.classList.remove('show');
        renderBoard();
        refreshUi();
        setHint('Save importat cu succes.');
        logEvent('Save importat din fișier.');
        saveState();
      } catch (_e) {
        setHint('Import eșuat: fișierul nu este JSON valid.');
      } finally {
        if (input) input.value = '';
      }
    };
    reader.readAsText(file);
  }

  function loadSaveToState() {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (!raw) return false;
      const saved = JSON.parse(raw);
      if (!saved || !Array.isArray(saved.board)) return false;
      Object.assign(state, saved);
      state.undoStack = [];
      state.board.forEach(h => {
        if (typeof h.buildingSprite === 'undefined') h.buildingSprite = null;
      });
      if (!Array.isArray(state.board) || !state.board.length) return false;
      if (typeof state.turn !== 'number' || state.turn < 1) state.turn = 1;
      if (state.current !== 'player' && state.current !== 'ai') state.current = 'player';
      if (typeof state.aiThinking !== 'boolean') state.aiThinking = false;
      state.aiRecoveryTimerId = null;
      if (typeof state.gameOver !== 'boolean') state.gameOver = false;
      if (!['setup', 'main', 'robber'].includes(state.phase)) state.phase = 'main';
      if (typeof state.rolled !== 'boolean') state.rolled = false;
      if (typeof state.diceRolling !== 'boolean') state.diceRolling = false;
      if (!['settlement', 'road', 'city', null].includes(state.pendingAction)) state.pendingAction = null;
      if (typeof state.roadBuildStart !== 'number' || !state.board[state.roadBuildStart]) state.roadBuildStart = null;
      if (typeof state.selectedHex !== 'number' || !state.board[state.selectedHex]) state.selectedHex = null;
      if (!state.setupPicks || typeof state.setupPicks !== 'object') state.setupPicks = { player: 0, ai: 0 };
      if (typeof state.setupPicks.player !== 'number') state.setupPicks.player = 0;
      if (typeof state.setupPicks.ai !== 'number') state.setupPicks.ai = 0;
      if (!state.players || typeof state.players !== 'object') return false;
      if (!state.players.player || !state.players.ai) return false;
      ['player', 'ai'].forEach(owner => {
        const p = state.players[owner];
        if (!p || typeof p !== 'object') return;
        if (typeof p.vp !== 'number') p.vp = 0;
        if (typeof p.roads !== 'number') p.roads = 0;
        if (typeof p.hasLongestRoad !== 'boolean') p.hasLongestRoad = false;
        if (typeof p.hasLargestArmy !== 'boolean') p.hasLargestArmy = false;
        if (typeof p.knightsPlayed !== 'number' || p.knightsPlayed < 0) p.knightsPlayed = 0;
        if (!Array.isArray(p.cards)) p.cards = [];
        if (!p.resources || typeof p.resources !== 'object') p.resources = baseResources();
        const defaults = baseResources();
        Object.keys(defaults).forEach(key => {
          if (typeof p.resources[key] !== 'number' || p.resources[key] < 0) p.resources[key] = defaults[key];
        });
        Object.keys(p.resources).forEach(key => {
          if (!Object.prototype.hasOwnProperty.call(defaults, key)) delete p.resources[key];
        });
      });
      if (!state.effects) {
        state.effects = { player: { masonDiscount: false }, ai: { masonDiscount: false } };
      } else {
        if (!state.effects.player) state.effects.player = { masonDiscount: false };
        if (!state.effects.ai) state.effects.ai = { masonDiscount: false };
        if (typeof state.effects.player.masonDiscount !== 'boolean') state.effects.player.masonDiscount = false;
        if (typeof state.effects.ai.masonDiscount !== 'boolean') state.effects.ai.masonDiscount = false;
      }
      if (typeof state.roadBuildFree !== 'boolean') state.roadBuildFree = false;
      if (state.roadBuildStart == null) state.roadBuildStart = null;
      if (!state.roads || typeof state.roads !== 'object') {
        state.roads = { player: [], ai: [] };
      } else {
        if (!Array.isArray(state.roads.player)) state.roads.player = [];
        if (!Array.isArray(state.roads.ai)) state.roads.ai = [];
      }
      if (!state.roadsByEdge || typeof state.roadsByEdge !== 'object') {
        state.roadsByEdge = { player: [], ai: [] };
      } else {
        if (!Array.isArray(state.roadsByEdge.player)) state.roadsByEdge.player = [];
        if (!Array.isArray(state.roadsByEdge.ai)) state.roadsByEdge.ai = [];
      }
      if (!state.vertexClaims || typeof state.vertexClaims !== 'object') state.vertexClaims = {};
      if (!state.hexVertexMap || typeof state.hexVertexMap !== 'object') state.hexVertexMap = {};
      if (!state.roadStats || typeof state.roadStats !== 'object') {
        state.roadStats = { player: 0, ai: 0 };
      } else {
        if (typeof state.roadStats.player !== 'number') state.roadStats.player = 0;
        if (typeof state.roadStats.ai !== 'number') state.roadStats.ai = 0;
      }
      if (!state.armyStats || typeof state.armyStats !== 'object') {
        state.armyStats = { player: 0, ai: 0 };
      } else {
        if (typeof state.armyStats.player !== 'number') state.armyStats.player = 0;
        if (typeof state.armyStats.ai !== 'number') state.armyStats.ai = 0;
      }
      if (!state.matchStats || typeof state.matchStats !== 'object') {
        state.matchStats = defaultMatchStats();
      } else {
        state.matchStats = Object.assign(defaultMatchStats(), state.matchStats);
      }
      if (!state.startedAt) state.startedAt = Date.now();
      if (!Array.isArray(state.deck)) state.deck = [];
      if (!Array.isArray(state.discard)) state.discard = [];
      if (!Array.isArray(state.ports)) state.ports = [];
      normalizeTransientTurnStateAfterLoad();
      const robber = state.board.find(h => h && h.robber);
      if (!robber) {
        if (typeof state.robberHexId !== 'number' || !state.board[state.robberHexId]) {
          const desert = state.board.find(h => h && h.terrain === 'desert') || state.board[0];
          if (desert) {
            desert.robber = true;
            state.robberHexId = desert.id;
          }
        } else {
          state.board[state.robberHexId].robber = true;
        }
      } else {
        state.robberHexId = robber.id;
      }
      buildBoardTopology();
      reconcileLegacyBoardFromClaims();
      recalcVp();
      saveBadgeText = 'Autosave ON (loaded)';
      return true;
    } catch (_e) {
      return false;
    }
  }

  function clearSave() {
    try { localStorage.removeItem(SAVE_KEY); } catch (_e) {}
    updateContinueButton();
  }

  function normalizeTransientTurnStateAfterLoad() {
    clearAiTurnRecovery();
    state.gameOver = false;
    // Save-urile capturate exact in timpul turei AI pot lasa jocul intr-o stare
    // neexecutabila la restore (fara timer activ). Revenim sigur la tură player.
    if (state.current === 'ai' || state.aiThinking) {
      state.current = 'player';
      state.aiThinking = false;
      state.rolled = false;
      state.phase = 'main';
      state.pendingAction = null;
      state.roadBuildStart = null;
      state.diceRolling = false;
      state.undoStack = [];
      state.cardPlayedThisTurn = false;
      state.aiRecoveryTimerId = null;
    }
  }

  function clearPreferences() {
    try { localStorage.removeItem(PREF_KEY); } catch (_e) {}
  }

  function saveAchievements() {
    try {
      localStorage.setItem(ACHIEVEMENTS_KEY, JSON.stringify(achievements));
    } catch (_e) {}
  }

  function loadAchievements() {
    try {
      const raw = localStorage.getItem(ACHIEVEMENTS_KEY);
      if (!raw) {
        achievements = defaultAchievementState();
        return;
      }
      const parsed = JSON.parse(raw);
      achievements = Object.assign(defaultAchievementState(), parsed || {});
      Object.keys(defaultAchievementState()).forEach(key => {
        if (typeof achievements[key] !== 'number' && achievements[key] !== null) {
          achievements[key] = defaultAchievementState()[key];
        }
      });
    } catch (_e) {
      achievements = defaultAchievementState();
    }
  }

  function registerMatchAchievements(win) {
    achievements.gamesPlayed += 1;
    if (win) {
      achievements.gamesWon += 1;
      if (achievements.bestTurnWin == null || state.turn < achievements.bestTurnWin) {
        achievements.bestTurnWin = state.turn;
      }
    }
    achievements.maxVpReached = Math.max(achievements.maxVpReached, Number(state.players.player.vp || 0));
    achievements.cardsPlayed += Number(state.matchStats.cardsPlayed || 0);
    achievements.knightsPlayed += Number(state.matchStats.knightsPlayed || 0);
    achievements.robberMoves += Number(state.matchStats.robberMoves || 0);
    achievements.settlementsBuilt += Number(state.matchStats.settlementsBuilt || 0);
    achievements.citiesBuilt += Number(state.matchStats.citiesBuilt || 0);
    achievements.roadsBuilt += Number(state.matchStats.roadsBuilt || 0);
    achievements.longestRoadRecord = Math.max(achievements.longestRoadRecord, Number(state.matchStats.longestRoadPeak || 0));
    achievements.largestArmyRecord = Math.max(achievements.largestArmyRecord, Number(state.matchStats.largestArmyPeak || 0));
    saveAchievements();
  }

  function resetAllData() {
    const ok = window.confirm('Sigur vrei reset complet? Se vor șterge save-ul, preferințele, clasamentul local și achievements.');
    if (!ok) return;
    clearSave();
    clearPreferences();
    try { localStorage.removeItem(LEADERBOARD_KEY); } catch (_e) {}
    try { localStorage.removeItem(ACHIEVEMENTS_KEY); } catch (_e) {}
    setHint('Datele jocului au fost resetate complet.');
    window.location.reload();
  }

  function updateContinueButton() {
    const btn = document.getElementById('continueBtn');
    if (!btn) return;
    btn.style.display = localStorage.getItem(SAVE_KEY) ? '' : 'none';
  }

  function savePreferences() {
    try {
      const prefs = {
        vpTarget: state.vpTarget,
        aiMode: state.aiMode,
        nickname: state.nickname,
        audioEnabled: !!audioEnabled
      };
      localStorage.setItem(PREF_KEY, JSON.stringify(prefs));
    } catch (_e) {}
  }

  function loadPreferences() {
    try {
      const raw = localStorage.getItem(PREF_KEY);
      if (!raw) {
        ui.soundToggleBtn.textContent = audioEnabled ? 'Sunet: ON' : 'Sunet: OFF';
        return;
      }
      const prefs = JSON.parse(raw);
      if (prefs && typeof prefs === 'object') {
        if (typeof prefs.vpTarget === 'number' && [8, 9, 10].includes(prefs.vpTarget)) state.vpTarget = prefs.vpTarget;
        if (typeof prefs.aiMode === 'string' && AI_PROFILES[prefs.aiMode]) state.aiMode = prefs.aiMode;
        if (typeof prefs.nickname === 'string' && prefs.nickname.trim()) state.nickname = sanitizeNickname(prefs.nickname);
        if (typeof prefs.audioEnabled === 'boolean') audioEnabled = prefs.audioEnabled;
      }
    } catch (_e) {}

    const nickInput = document.getElementById('nicknameInput');
    if (nickInput && (!nickInput.value || !nickInput.value.trim())) nickInput.value = state.nickname;
    document.querySelectorAll('#vpChoices button').forEach(btn => {
      btn.classList.toggle('active', Number(btn.dataset.vp) === state.vpTarget);
    });
    document.querySelectorAll('#aiChoices button').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.ai === state.aiMode);
    });
    if (ui.aiModeBadge) ui.aiModeBadge.textContent = `AI: ${aiModeLabel(state.aiMode)}`;
    ui.soundToggleBtn.textContent = audioEnabled ? 'Sunet: ON' : 'Sunet: OFF';
  }

  function animateDiceRoll(done) {
    ui.dice.classList.add('rolling');
    let t = 0;
    const iv = setInterval(() => {
      const a = 1 + Math.floor(Math.random() * 6);
      const b = 1 + Math.floor(Math.random() * 6);
      ui.dice.textContent = `${a}+${b}`;
      t += 1;
      if (t >= 8) {
        clearInterval(iv);
        ui.dice.classList.remove('rolling');
        ui.dice.classList.remove('result-flash');
        void ui.dice.offsetWidth;
        ui.dice.classList.add('result-flash');
        const forced = consumeForcedDicePair();
        const d1 = forced ? forced[0] : (1 + Math.floor(Math.random() * 6));
        const d2 = forced ? forced[1] : (1 + Math.floor(Math.random() * 6));
        done(d1, d2, d1 + d2);
      }
    }, 70);
  }

  function parseTestConfig() {
    try {
      const qs = new URLSearchParams(window.location.search || '');
      const totalsRaw = (qs.get('testDiceTotals') || '').trim();
      const aiHangOnce = qs.get('testAiHangOnce') === '1';
      if (!totalsRaw) return { forcedDiceQueue: [], aiHangOnce };
      const totals = totalsRaw
        .split(',')
        .map(x => Number(String(x).trim()))
        .filter(n => Number.isFinite(n) && n >= 2 && n <= 12);
      return { forcedDiceQueue: totals, aiHangOnce };
    } catch (_e) {
      return { forcedDiceQueue: [], aiHangOnce: false };
    }
  }

  function consumeForcedDicePair() {
    const q = TEST_CONFIG && TEST_CONFIG.forcedDiceQueue;
    if (!Array.isArray(q) || !q.length) return null;
    const total = Number(q.shift());
    if (!Number.isFinite(total)) return null;
    const map = {
      2: [1, 1],
      3: [1, 2],
      4: [2, 2],
      5: [2, 3],
      6: [3, 3],
      7: [3, 4],
      8: [4, 4],
      9: [4, 5],
      10: [5, 5],
      11: [5, 6],
      12: [6, 6]
    };
    return map[total] || null;
  }

  function toggleSound() {
    audioEnabled = !audioEnabled;
    ui.soundToggleBtn.textContent = audioEnabled ? 'Sunet: ON' : 'Sunet: OFF';
    savePreferences();
    if (audioEnabled) playTone(460, 0.05, 'sine');
  }

  function playTone(freq, duration, type) {
    if (!audioEnabled) return;
    try {
      if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = type || 'sine';
      osc.frequency.value = freq;
      gain.gain.value = 0.0001;
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      const now = audioCtx.currentTime;
      gain.gain.exponentialRampToValueAtTime(0.06, now + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
      osc.start(now);
      osc.stop(now + duration + 0.02);
    } catch (_e) {}
  }

  function ensureBuildingSprites() {
    if (spriteState.loading || spriteState.ready) return;
    spriteState.loading = true;
    const img = new Image();
    img.onload = function () {
      const cols = 6;
      const rows = 6;
      const frameW = Math.floor(img.width / cols);
      const frameH = Math.floor(img.height / rows);
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      canvas.width = 128;
      canvas.height = 128;
      const selected = [];
      let exportBlocked = false;
      for (let r = 0; r < 5; r++) {
        for (let c = 0; c < 5; c++) {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(img, c * frameW, r * frameH, frameW, frameH, 0, 0, canvas.width, canvas.height);
          try {
            selected.push(canvas.toDataURL('image/png'));
          } catch (_e) {
            exportBlocked = true;
            break;
          }
        }
        if (exportBlocked) break;
      }
      spriteState.frames = exportBlocked ? [] : selected;
      spriteState.ready = !exportBlocked && selected.length > 0;
      spriteState.loading = false;
      if (exportBlocked) {
        logEvent('Sprite slicing indisponibil în modul local file://. Folosim fallback fără sprite-uri clădiri.');
      }
      renderBoard();
    };
    img.onerror = function () {
      spriteState.loading = false;
    };
    img.src = BUILDING_SHEET;
  }

  function ensureRobberSprites() {
    if (robberSpriteState.loading || robberSpriteState.ready) return;
    robberSpriteState.loading = true;
    const img = new Image();
    img.onload = function () {
      const cols = 6;
      const rows = 4;
      const frameW = Math.floor(img.width / cols);
      const frameH = Math.floor(img.height / rows);
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      canvas.width = 112;
      canvas.height = 112;
      const frames = [];
      let exportBlocked = false;
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(img, c * frameW, r * frameH, frameW, frameH, 0, 0, canvas.width, canvas.height);
          try {
            frames.push(canvas.toDataURL('image/png'));
          } catch (_e) {
            exportBlocked = true;
            break;
          }
        }
        if (exportBlocked) break;
      }
      robberSpriteState.frames = exportBlocked ? [] : frames;
      robberSpriteState.ready = !exportBlocked && frames.length > 0;
      robberSpriteState.loading = false;
      renderBoard();
    };
    img.onerror = function () {
      robberSpriteState.loading = false;
    };
    img.src = ROBBER_SHEET;
  }

  function getBuildingSprite(hex) {
    if (!spriteState.ready || !spriteState.frames.length) return null;
    const idx = (typeof hex.buildingSprite === 'number' ? hex.buildingSprite : 0) % spriteState.frames.length;
    return spriteState.frames[idx];
  }

  function randomBuildingSpriteIndex() {
    if (!spriteState.frames.length) return Math.floor(Math.random() * 10);
    return Math.floor(Math.random() * spriteState.frames.length);
  }

  function getRobberSprite() {
    if (!robberSpriteState.ready || !robberSpriteState.frames.length) return null;
    if (!Number.isFinite(robberFrame) || robberFrame < 0) robberFrame = 0;
    const idx = robberFrame % robberSpriteState.frames.length;
    robberFrame = (robberFrame + 1) % robberSpriteState.frames.length;
    return robberSpriteState.frames[idx];
  }

  function pulseResourceCells(keys) {
    if (!Array.isArray(keys) || !keys.length || !ui.playerRes) return;
    keys.forEach(k => {
      const el = ui.playerRes.querySelector(`.res-item[data-res-key="${k}"]`);
      if (!el) return;
      el.classList.remove('res-pulse');
      void el.offsetWidth;
      el.classList.add('res-pulse');
      window.setTimeout(() => el.classList.remove('res-pulse'), 560);
    });
  }

  function flashBoard(cls) {
    if (!ui.board || !cls) return;
    ui.board.classList.remove(cls);
    void ui.board.offsetWidth;
    ui.board.classList.add(cls);
    window.setTimeout(() => ui.board.classList.remove(cls), 520);
  }

  function currentSeasonKey() {
    const d = new Date();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    return `${d.getFullYear()}-${m}`;
  }

  function computeSeasonPoints(win) {
    if (!win) return 0;
    const base = state.vpTarget === 8 ? 2 : state.vpTarget === 10 ? 4 : 3;
    const diff = state.aiMode === 'hard' ? 2 : state.aiMode === 'normal' ? 1 : 0;
    return base + diff;
  }

  function buildMatchResult(title) {
    const win = /câștigat!/i.test(title);
    const durationSec = Math.max(1, Math.floor((Date.now() - (state.startedAt || Date.now())) / 1000));
    return {
      ts: Date.now(),
      season: currentSeasonKey(),
      nickname: state.nickname || 'Jucător',
      aiMode: state.aiMode,
      vpTarget: state.vpTarget,
      playerVp: state.players.player.vp,
      aiVp: state.players.ai.vp,
      turns: state.turn,
      durationSec,
      result: win ? 'victory' : 'defeat',
      seasonPoints: computeSeasonPoints(win)
    };
  }

  function loadLeaderboard() {
    try {
      const raw = localStorage.getItem(LEADERBOARD_KEY);
      if (!raw) return [];
      const arr = JSON.parse(raw);
      return Array.isArray(arr) ? arr : [];
    } catch (_e) {
      return [];
    }
  }

  function saveLeaderboard(rows) {
    try {
      localStorage.setItem(LEADERBOARD_KEY, JSON.stringify(rows.slice(0, 150)));
    } catch (_e) {}
  }

  function pushLeaderboardResult(entry) {
    const rows = loadLeaderboard();
    rows.push(entry);
    saveLeaderboard(rows);
  }

  function openLeaderboard() {
    if (!ui.leaderboardOverlay || !ui.leaderboardTable) return;
    const season = currentSeasonKey();
    const rows = loadLeaderboard()
      .filter(r => r.season === season)
      .sort((a, b) => (b.seasonPoints - a.seasonPoints) || (a.durationSec - b.durationSec) || (b.playerVp - a.playerVp));
    ui.seasonLabel.textContent = `Sezon ${season} • rezultate locale`;
    if (!rows.length) {
      ui.leaderboardTable.innerHTML = '<div class=\"lb-empty\">Nu există rezultate pentru sezonul curent.</div>';
      ui.leaderboardOverlay.classList.add('show');
      return;
    }
    ui.leaderboardTable.innerHTML =
      '<div class=\"lb-row head\"><div>#</div><div>Jucător</div><div>Rezultat</div><div>Puncte</div><div>Dificultate</div><div>Durată</div></div>' +
      rows.slice(0, 30).map((r, i) =>
        `<div class=\"lb-row\"><div class=\"pos\">${i + 1}</div><div>${escapeHtml(r.nickname)}</div><div>${r.result === 'victory' ? 'Victorie' : 'Înfrângere'}</div><div>${r.seasonPoints}</div><div>${aiModeLabel(r.aiMode)}</div><div>${formatDuration(r.durationSec)}</div></div>`
      ).join('');
    ui.leaderboardOverlay.classList.add('show');
  }

  function closeLeaderboard() {
    if (ui.leaderboardOverlay) ui.leaderboardOverlay.classList.remove('show');
  }

  function openHelp() {
    if (ui.helpOverlay) ui.helpOverlay.classList.add('show');
  }

  function closeHelp() {
    if (ui.helpOverlay) ui.helpOverlay.classList.remove('show');
  }

  function openAchievements() {
    renderAchievementsSummary();
    renderAchievementsTotals();
    renderAchievementsBadges();
    markTutorialSignal('openedAchievements');
    if (ui.achievementsOverlay) ui.achievementsOverlay.classList.add('show');
  }

  function closeAchievements() {
    if (ui.achievementsOverlay) ui.achievementsOverlay.classList.remove('show');
  }

  function clearLeaderboard() {
    try { localStorage.removeItem(LEADERBOARD_KEY); } catch (_e) {}
    openLeaderboard();
  }

  function isOverlayShown(el) {
    return !!(el && el.classList && el.classList.contains('show'));
  }

  function isAnyOverlayOpen() {
    return isOverlayShown(ui.startOverlay)
      || isOverlayShown(ui.setupOverlay)
      || isOverlayShown(ui.endOverlay)
      || isOverlayShown(ui.leaderboardOverlay)
      || isOverlayShown(ui.helpOverlay)
      || isOverlayShown(ui.tradeOverlay)
      || isOverlayShown(ui.achievementsOverlay);
  }

  function sanitizeNickname(raw) {
    const compact = String(raw == null ? '' : raw).replace(/\s+/g, ' ').trim();
    if (!compact) return 'Jucător';
    return compact.slice(0, 20);
  }

  function aiModeLabel(mode) {
    return mode === 'hard' ? 'Strateg' : mode === 'easy' ? 'Prietenos' : 'Echilibrat';
  }

  function formatDuration(sec) {
    const s = Math.max(0, Number(sec) || 0);
    const m = Math.floor(s / 60);
    const r = s % 60;
    return `${m}m ${String(r).padStart(2, '0')}s`;
  }

  function formatClock(date) {
    const h = String(date.getHours()).padStart(2, '0');
    const m = String(date.getMinutes()).padStart(2, '0');
    const s = String(date.getSeconds()).padStart(2, '0');
    return `${h}:${m}:${s}`;
  }

  function escapeHtml(v) {
    return String(v == null ? '' : v)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/\"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function shuffle(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }
})();
