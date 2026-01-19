// ========================================
// GLOBAL VARIABLES
// ========================================
let scene, camera, renderer, composer;
let qualitySettings = null;  // Quality preset settings (initialized in scene.js)
let cameraShake = null;      // Camera shake system (initialized in renderer.js)
let player, playerCore, playerGlow, playerRing;
let discoBallGroup, discoBallCore, discoBallTiles = [], discoBallSparkles;
let discoBallInnerGlow, discoBallOuterGlow, discoBallBeams;
let discoBallColorIndex = 0, discoBallColorTransition = 0;
let fireBallGroup, fireBallCore, fireBallFlames, fireBallEmbers;
let fireBallInnerGlow, fireBallOuterGlow;
let obstacles = [];
let collectibles = [];
let magnetPickups = [];
let shieldPickups = [];
let speedPickups = [];
let floorTilesNormal = [];    // Original dark neon track
let floorTilesRainbow = [];   // Rainbow bonus track
let floorTiles = [];          // Backward compatibility reference
let sidePillars = [];
let particleSystem;
let animationFrameId;
let lastTime = 0;
let audioContext, gainNode;
let bgMusic;
let magnetAura;
let magnetTimeoutId;
let shieldAura;
let shieldBreakTimeoutId;

// DOM Elements
const canvas = document.getElementById('game-canvas');
const hud = document.getElementById('hud');
const startScreen = document.getElementById('start-screen');
const gameoverScreen = document.getElementById('gameover-screen');
const beatIndicator = document.getElementById('beat-indicator');
const screenFlash = document.getElementById('screen-flash');
const mobileControls = document.getElementById('mobile-controls');
const pauseBtn = document.getElementById('pause-btn');

// HUD Values
const distanceValue = document.getElementById('distance-value');
const orbsValue = document.getElementById('orbs-value');
const hitsValue = document.getElementById('hits-value');
const scoreValue = document.getElementById('score-value');
const menuOrbsValue = document.getElementById('menu-orbs-value');
const menuTopDistanceValue = document.getElementById('menu-top-distance-value');
const finalTopDistance = document.getElementById('final-top-distance');
const storeBtn = document.getElementById('store-btn');
const storeOverlay = document.getElementById('store-overlay');
const storeCloseBtn = document.getElementById('store-close');
const storeTabs = document.getElementById('store-tabs');
const storeGrid = document.getElementById('store-grid');
const storeSectionTitle = document.getElementById('store-section-title');
const finalDistance = document.getElementById('final-distance');
const finalOrbs = document.getElementById('final-orbs');
const finalScore = document.getElementById('final-score');

// Dev tool settings (main menu only)
const DevSettings = {
    startWithShield: false,
    startWithMagnet: false,
    forceBonus: false,
    godMode: false
};
