// ========================================
// GAME STATE
// ========================================
const GameState = {
    isPlaying: false,
    isPaused: false,
    distance: 0,
    orbs: 0,  // Session orbs collected in current run
    score: 0,
    totalOrbs: 0,  // Persistent orb currency (renamed from coins)
    topDistance: 0,
    discoBallOwned: false,
    discoBallEquipped: false,
    fireBallOwned: false,
    fireBallEquipped: false,
    rainbowOrbOwned: false,
    rainbowOrbEquipped: false,
    falafelBallOwned: false,
    falafelBallEquipped: false,
    currentLane: 1, // Start in center
    speed: CONFIG.INITIAL_SPEED,
    lastBeatTime: 0,
    beatPhase: 0,
    gameStartTime: 0,
    isJumping: false,
    jumpVelocity: 0,
    jumpQueued: false,
    isMagnetActive: false,
    hasShield: false,
    isBonusActive: false,
    bonusTriggered: false,
    bonusTransitionProgress: 0, // 0 = normal, 1 = full rainbow

    // Lives system (Free Run)
    lives: 3,
    maxLives: 3,
    isInvincible: false,
    invincibleTimer: 0,
    INVINCIBLE_DURATION: 1.5, // seconds of invincibility after hit

    // Combo system
    combo: 0,                    // Current combo count
    maxCombo: 0,                 // Best combo this run
    comboTimer: 0,               // Time remaining before combo decays
    scoreMultiplier: 1.0,        // Current score multiplier from combo
    lastCollectRating: null,     // 'perfect' | 'good' | null

    // Stage Mode (MVP) - Week 1
    isStageMode: false,          // Flag: Stage Mode active (false = Free Run)
    currentStage: null,          // Current stage object (from stage-registry.js)
    crashes: 0,                  // Crash counter for star calculation
    orbsCollected: 0,            // Orbs collected in current stage (for stars)
    distanceTraveled: 0          // Actual distance for finish line detection
};
