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
    currentLane: 1, // Start in center
    speed: CONFIG.INITIAL_SPEED,
    lastBeatTime: 0,
    beatPhase: 0,
    gameStartTime: 0,
    isJumping: false,
    jumpVelocity: 0,
    jumpQueued: false,
    isMagnetActive: false,
    hasShield: false
};
