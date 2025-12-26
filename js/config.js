/* ========================================
   BEAT RUNNER - Main Game Code
   A Neon Rhythm Runner Game
   Mobile-Optimized Version
   ======================================== */

// ========================================
// CONFIGURATION
// ========================================
const CONFIG = {
    // Game settings - lanes ordered LEFT to RIGHT
    LANE_WIDTH: 3,
    LANE_POSITIONS: [-3, 0, 3], // Lane 0 = LEFT (-3), Lane 1 = CENTER (0), Lane 2 = RIGHT (+3)
    INITIAL_SPEED: 28,
    MAX_SPEED: 55,
    SPEED_INCREMENT: 0.3,
    
    // Jump physics
    JUMP_FORCE: 8,
    GRAVITY: 22,
    GROUND_Y: 1.2,
    
    // Beat settings
    BPM: 128,
    get BEAT_INTERVAL() { return 60 / this.BPM; },
    
    // Spawn settings
    SPAWN_DISTANCE: 180,  // Increased for better reaction time (3.6s vs 2.4s)
    DESPAWN_DISTANCE: -15,
    OBSTACLE_MIN_GAP: 18,
    ORB_SPAWN_CHANCE: 0.5,

    // Bonus mode
    BONUS_START_DISTANCE: 1000,
    BONUS_END_DISTANCE: 1250,  // Extended from 1150 for longer bonus with more orbs
    
    // Visual settings
    FOG_NEAR: 25,
    FOG_FAR: 120,
    
    // Colors
    COLORS: {
        PINK: 0xff00ff,
        CYAN: 0x00ffff,
        PURPLE: 0x9900ff,
        BLUE: 0x0066ff,
        ORANGE: 0xff6600,
        WHITE: 0xffffff
    }
};
