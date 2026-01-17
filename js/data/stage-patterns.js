/* ========================================
   BEAT RUNNER - Stage Patterns
   Semi-random obstacle pools per pattern type
   Week 2: Content Creation
   ======================================== */

/**
 * Pattern pools define which obstacle configurations can spawn
 * Each stage has a pattern TYPE that maps to a pool
 * Spawner randomly selects from the pool
 */

const PATTERN_POOLS = {
    // ========================================
    // EASY TIER (Stages 1-5): single-lane
    // Single lane obstacles only, generous gaps
    // Target: 90% players get 3 stars
    // ========================================
    'single-lane': {
        obstacles: [
            [0],    // Left lane blocked
            [1],    // Center lane blocked
            [2]     // Right lane blocked
        ],
        jumpFrequency: 0.15,  // 15% chance of jump obstacle
        gap: 25               // 25m minimum between obstacles
    },

    // Stage 3 "Jump Practice" pattern
    // Emphasizes jump mechanics with increased frequency
    // Following Stage Mode Design skill: Phase 1 jump introduction
    'single-lane-jump-focus': {
        obstacles: [
            [0],    // Left lane blocked
            [1],    // Center lane blocked
            [2]     // Right lane blocked
        ],
        jumpFrequency: 0.25,  // 25% (up from 15%) - emphasizes jumping
        gap: 25               // 25m maintained (generous for intro phase)
    },

    // ========================================
    // MEDIUM TIER (Stages 6-10): mixed
    // Mix of single and double lane blocks
    // Target: 60% players get 3 stars
    // ========================================
    'mixed': {
        obstacles: [
            [0], [1], [2],           // Single lane (weighted more)
            [0], [1], [2],           // Duplicated for 60% weight
            [0, 1], [1, 2], [0, 2]   // Double lane (40% weight)
        ],
        jumpFrequency: 0.25,  // 25% chance of jump obstacle
        gap: 20               // 20m minimum between obstacles
    },

    // ========================================
    // HARD TIER (Stages 11-15): complex
    // Primarily double lane blocks, tight timing
    // Target: 30% players get 3 stars
    // ========================================
    'complex': {
        obstacles: [
            [0, 1], [1, 2], [0, 2],  // Double lane (primary)
            [0, 1], [1, 2], [0, 2],  // Duplicated for 60% weight
            [0], [1], [2]            // Single lane (less frequent)
        ],
        jumpFrequency: 0.35,  // 35% chance of jump obstacle
        gap: 18               // 18m minimum (tightest)
    }
};

/**
 * Get pattern pool for a stage
 * @param {object} stage - Stage object from registry
 * @returns {object} Pattern pool configuration
 */
function getPatternPool(stage) {
    if (!stage || !stage.pattern) {
        return PATTERN_POOLS['single-lane']; // Fallback for safety
    }
    return PATTERN_POOLS[stage.pattern] || PATTERN_POOLS['single-lane'];
}

/**
 * Select random obstacle pattern from pool
 * @param {object} pool - Pattern pool
 * @returns {array} Lane indices to block
 */
function selectRandomPattern(pool) {
    const patterns = pool.obstacles;
    return patterns[Math.floor(Math.random() * patterns.length)];
}

/**
 * Check if next obstacle should be a jump obstacle
 * @param {object} pool - Pattern pool
 * @returns {boolean} True if should spawn jump obstacle
 */
function shouldSpawnJump(pool) {
    return Math.random() < pool.jumpFrequency;
}

/**
 * Get minimum gap for current stage
 * @param {object} stage - Stage object (or null for Free Run)
 * @returns {number} Minimum gap in meters
 */
function getObstacleGap(stage) {
    if (!stage) return CONFIG.OBSTACLE_MIN_GAP; // Free Run default (18)
    const pool = getPatternPool(stage);
    return pool.gap;
}

/**
 * Get jump frequency for current stage
 * @param {object} stage - Stage object (or null for Free Run)
 * @returns {number} Jump frequency (0-1)
 */
function getJumpFrequency(stage) {
    if (!stage) return 0.35; // Free Run default
    const pool = getPatternPool(stage);
    return pool.jumpFrequency;
}
