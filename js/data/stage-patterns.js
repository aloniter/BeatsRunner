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
        jumpFrequency: 0.30,  // 30% (up from 15%) - noticeably emphasizes jumping
        gap: 25               // 25m maintained (generous for intro phase)
    },

    // Stage 4 "Lane Switching" pattern
    // Reduces gap to train reaction time without increasing spatial complexity
    'single-lane-dense': {
        obstacles: [
            [0], [1], [2]
        ],
        jumpFrequency: 0.15,
        gap: 20               // 20m (tighter than 25m)
    },

    // Stage 5 "Speed Boost" pattern
    // Gentle intro to double-lanes (20%) before Stage 6 hits (40%)
    'mixed-intro': {
        obstacles: [
            [0], [1], [2],           // Single lane (heavily weighted)
            [0], [1], [2],
            [0], [1], [2],
            [0, 1], [1, 2], [0, 2]   // Double lane (low weight ~20%)
        ],
        jumpFrequency: 0.20,
        gap: 20
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

    // Stage 8 "Jump Chains" - Mixed pattern with high jump focus
    'mixed-jump-chains': {
        obstacles: [
            [0], [1], [2],
            [0], [1], [2],
            [0, 1], [1, 2], [0, 2]
        ],
        jumpFrequency: 0.35,  // 35% (up from 25%)
        gap: 20
    },

    // Stage 7 "Rhythm Run" pattern - Flow focus
    // Higher single-lane weight (70%) for smoother rhythm
    'mixed-rhythm': {
        obstacles: [
            [0], [1], [2],
            [0], [1], [2],           // Single lane
            [0], [1], [2],           // Single lane (~70% total)
            [0, 1], [1, 2], [0, 2]   // Double lane (~30% total)
        ],
        jumpFrequency: 0.20,  // Slightly lower jumps to focus on lane switching
        gap: 20
    },

    // Stage 9 "Quick Reflexes" pattern - Reaction focus
    // Higher double-lane weight (50%) to test reflexes
    'mixed-reflex': {
        obstacles: [
            [0], [1], [2],
            [0], [1], [2],           // Single lane (50%)
            [0, 1], [1, 2], [0, 2],
            [0, 1], [1, 2], [0, 2]   // Double lane (50%)
        ],
        jumpFrequency: 0.30,  // Higher jumps
        gap: 20
    },

    // Stage 10 "Neon Gauntlet" pattern - Endurance/Hard-intro
    // Bridge to Hard tier: 19m gap (between 20 and 18)
    'mixed-gauntlet': {
        obstacles: [
            [0], [1], [2],           // Single lane (40%)
            [0], [1], [2],
            [0, 1], [1, 2], [0, 2],
            [0, 1], [1, 2], [0, 2],  // Double lane (60%)
            [0, 1], [1, 2], [0, 2]
        ],
        jumpFrequency: 0.30,
        gap: 19              // 19m (tighter than 20, easier than 18)
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
    },

    // Stage 13 "Jump Master" - Serious airtime required
    'complex-jump-master': {
        obstacles: [
            [0, 1], [1, 2], [0, 2],
            [0, 1], [1, 2], [0, 2],
            [0], [1], [2]
        ],
        jumpFrequency: 0.45,  // 45% (highest jump rate)
        gap: 18
    },

    // Stage 14 "Neon Chaos" - Speed and reflex test
    'complex-chaos': {
        obstacles: [
            [0, 1], [1, 2], [0, 2],
            [0, 1], [1, 2], [0, 2],
            [0], [1], [2]
        ],
        jumpFrequency: 0.35,
        gap: 16               // 16m (tightest possible gap without unavoidable hits)
    },

    // Stage 15 "Final Challenge" - The ultimate test
    'complex-final': {
        obstacles: [
            [0, 1], [1, 2], [0, 2],
            [0, 1], [1, 2], [0, 2],
            [0], [1], [2]
        ],
        jumpFrequency: 0.40,  // High jumps
        gap: 16               // High density
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
