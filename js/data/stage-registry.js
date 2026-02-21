/* ========================================
   BEAT RUNNER - Stage Registry
   Stage Mode MVP: 15 Stages, 1 World
   ======================================== */

/**
 * Stage Registry - All 15 stage definitions for MVP
 * World 1: Neon District (Easy → Medium → Hard)
 *
 * Each stage has:
 * - Gameplay settings (distance, speed, orbs)
 * - Star thresholds (crashes + orbs%)
 * - Unlock requirements
 * - Obstacle pattern type
 */

const STAGES = {
  // ========================================
  // EASY TIER (Stages 1-5)
  // Goal: Build confidence, 90%+ get 3 stars
  // ========================================

  'stage-1-intro': {
    id: 'stage-1-intro',
    name: 'Neon Intro',
    description: 'Welcome to the Neon District. Use Left/Right arrows to switch lanes. Avoid the pink barriers!',
    order: 1,
    world: 'neon-district',

    // Gameplay
    distance: 800,  // Slightly longer for better intro experience
    targetTime: 35,
    speed: 28,
    totalOrbs: 12,  // Proportionally reduced

    // Star thresholds
    stars: {
      star3: { crashes: 2, orbs: 60 },
      star2: { crashes: 5, orbs: 40 }
    },

    // Obstacle pattern
    pattern: 'single-lane',

    // Unlock
    unlock: { type: 'default' }
  },

  'stage-2-rhythm': {
    id: 'stage-2-rhythm',
    name: 'Rhythm Basics',
    description: 'Feel the rhythm! Collect orbs to keep the beat alive. Watch out for obstacles.',
    order: 2,
    world: 'neon-district',

    distance: 900,  // +200m from Stage 1 (incremental)
    targetTime: 38,
    speed: 28,
    totalOrbs: 16,  // More orbs = more rhythm emphasis

    stars: {
      star3: { crashes: 2, orbs: 60 },
      star2: { crashes: 5, orbs: 40 }
    },

    pattern: 'single-lane',
    unlock: { type: 'complete-previous', requiredStageId: 'stage-1-intro' }
  },

  'stage-3-jump': {
    id: 'stage-3-jump',
    name: 'Jump Practice',
    description: 'Time to fly! Press Up or Space to jump over low barriers. Timing is everything.',
    order: 3,
    world: 'neon-district',

    distance: 1000,  // +100m from Stage 2 (practice jumping longer)
    targetTime: 42,
    speed: 28,
    totalOrbs: 18,

    stars: {
      star3: { crashes: 2, orbs: 60 },
      star2: { crashes: 5, orbs: 40 }
    },

    pattern: 'single-lane-jump-focus',  // 25% jumps (up from 15%)
    unlock: { type: 'complete-previous', requiredStageId: 'stage-2-rhythm' }
  },

  'stage-4-lane': {
    id: 'stage-4-lane',
    name: 'Lane Switching',
    description: 'Reflex test! Obstacles are coming faster. Switch lanes quickly to survive.',
    order: 4,
    world: 'neon-district',

    distance: 1100,  // +100m from Stage 3 (Phase 2: Reinforcement)
    targetTime: 46,
    speed: 28,
    totalOrbs: 20,

    stars: {
      star3: { crashes: 2, orbs: 60 },
      star2: { crashes: 5, orbs: 40 }
    },

    pattern: 'single-lane-dense',
    unlock: { type: 'complete-previous', requiredStageId: 'stage-3-jump' }
  },

  'stage-5-speed': {
    id: 'stage-5-speed',
    name: 'Speed Boost',
    description: 'Speed pulsing! The music is speeding up. Stay focused and keep moving.',
    order: 5,
    world: 'neon-district',

    distance: 1200,  // +100m + speed increase (Phase 2 → 3 transition)
    targetTime: 46,  // Adjusted for speed 30
    speed: 30,       // Changed from 29 to 30 to smooth Stage 6 transition
    totalOrbs: 22,

    stars: {
      star3: { crashes: 2, orbs: 60 },
      star2: { crashes: 5, orbs: 40 }
    },

    pattern: 'mixed-intro',
    unlock: { type: 'complete-previous', requiredStageId: 'stage-4-lane' }
  },

  // ========================================
  // MEDIUM TIER (Stages 6-10)
  // Goal: Combine mechanics, 60% get 3 stars
  // ========================================

  'stage-6-double': {
    id: 'stage-6-double',
    name: 'Double Trouble',
    description: 'Double trouble! Two lanes are blocked now. Find the safe lane instantly.',
    order: 6,
    world: 'neon-district',

    distance: 1250,
    targetTime: 60,
    speed: 30,
    totalOrbs: 22,

    stars: {
      star3: { crashes: 2, orbs: 70 },
      star2: { crashes: 5, orbs: 50 }
    },

    pattern: 'mixed',
    unlock: { type: 'complete-previous', requiredStageId: 'stage-5-speed' }
  },

  'stage-7-rhythm-run': {
    id: 'stage-7-rhythm-run',
    name: 'Rhythm Run',
    description: 'Find your flow. Smooth movements are key to maintaining momentum.',
    order: 7,
    world: 'neon-district',

    distance: 1300,
    targetTime: 62,
    speed: 30,
    totalOrbs: 23,

    stars: {
      star3: { crashes: 2, orbs: 70 },
      star2: { crashes: 5, orbs: 50 }
    },

    pattern: 'mixed-rhythm',
    unlock: { type: 'complete-previous', requiredStageId: 'stage-6-double' }
  },

  'stage-8-jump-chain': {
    id: 'stage-8-jump-chain',
    name: 'Jump Chains',
    description: 'Chain reaction! Be ready to jump multiple times in a row. Don\'t touch the ground!',
    order: 8,
    world: 'neon-district',

    distance: 1300,
    targetTime: 62,
    speed: 30,
    totalOrbs: 24,

    stars: {
      star3: { crashes: 2, orbs: 70 },
      star2: { crashes: 5, orbs: 50 }
    },

    pattern: 'mixed-jump-chains',
    unlock: { type: 'complete-previous', requiredStageId: 'stage-7-rhythm-run' }
  },

  'stage-9-reflex': {
    id: 'stage-9-reflex',
    name: 'Quick Reflexes',
    description: 'Fast reflexes required! The city is blurring past you. React or restart.',
    order: 9,
    world: 'neon-district',

    distance: 1350,
    targetTime: 65,
    speed: 31,
    totalOrbs: 24,

    stars: {
      star3: { crashes: 2, orbs: 70 },
      star2: { crashes: 5, orbs: 50 }
    },

    pattern: 'mixed-reflex',
    unlock: { type: 'complete-previous', requiredStageId: 'stage-8-jump-chain' }
  },

  'stage-10-gauntlet': {
    id: 'stage-10-gauntlet',
    name: 'Neon Gauntlet',
    description: 'The Gauntlet. A long, grueling run through the district\'s core. Endure.',
    order: 10,
    world: 'neon-district',

    distance: 1400,
    targetTime: 68,
    speed: 31,
    totalOrbs: 25,

    stars: {
      star3: { crashes: 2, orbs: 70 },
      star2: { crashes: 5, orbs: 50 }
    },

    pattern: 'mixed-gauntlet',
    unlock: { type: 'complete-previous', requiredStageId: 'stage-9-reflex' }
  },

  // ========================================
  // HARD TIER (Stages 11-15)
  // Goal: Test mastery, 30% get 3 stars
  // ========================================

  'stage-11-speed': {
    id: 'stage-11-speed',
    name: 'Speed Demon',
    description: 'Speed Demon. Maximum velocity approaching. Blink and you\'ll miss it.',
    order: 11,
    world: 'neon-district',

    distance: 1450,
    targetTime: 70,
    speed: 32,
    totalOrbs: 26,

    stars: {
      star3: { crashes: 1, orbs: 75 },
      star2: { crashes: 4, orbs: 50 }
    },

    pattern: 'complex',
    unlock: { type: 'complete-previous', requiredStageId: 'stage-10-gauntlet' }
  },

  'stage-12-timing': {
    id: 'stage-12-timing',
    name: 'Perfect Timing',
    description: 'Perfect Timing. Precision is mandatory. One mistake could be your last.',
    order: 12,
    world: 'neon-district',

    distance: 1450,
    targetTime: 70,
    speed: 32,
    totalOrbs: 27,

    stars: {
      star3: { crashes: 1, orbs: 75 },
      star2: { crashes: 4, orbs: 50 }
    },

    pattern: 'complex',
    unlock: { type: 'complete-previous', requiredStageId: 'stage-11-speed' }
  },

  'stage-13-jump-master': {
    id: 'stage-13-jump-master',
    name: 'Jump Master',
    description: 'Airborne. You\'ll spend more time in the air than on the ground. Master the jump.',
    order: 13,
    world: 'neon-district',

    distance: 1500,
    targetTime: 72,
    speed: 32,
    totalOrbs: 28,

    stars: {
      star3: { crashes: 1, orbs: 80 },
      star2: { crashes: 4, orbs: 50 }
    },

    pattern: 'complex-jump-master',
    unlock: { type: 'complete-previous', requiredStageId: 'stage-12-timing' }
  },

  'stage-14-chaos': {
    id: 'stage-14-chaos',
    name: 'Neon Chaos',
    description: 'Chaos Theory. The grid is becoming unstable. Predict the unpredictable.',
    order: 14,
    world: 'neon-district',

    distance: 1500,
    targetTime: 72,
    speed: 32,
    totalOrbs: 29,

    stars: {
      star3: { crashes: 1, orbs: 80 },
      star2: { crashes: 4, orbs: 50 }
    },

    pattern: 'complex-chaos',
    unlock: { type: 'complete-previous', requiredStageId: 'stage-13-jump-master' }
  },

  'stage-15-final': {
    id: 'stage-15-final',
    name: 'Final Challenge',
    description: 'The Final Run. Prove your mastery. The finish line awaits the champion.',
    order: 15,
    world: 'neon-district',
    isFinale: true,

    distance: 1600,
    targetTime: 78,
    speed: 32,
    totalOrbs: 30,

    stars: {
      star3: { crashes: 1, orbs: 80 },
      star2: { crashes: 4, orbs: 50 }
    },

    pattern: 'complex-final',
    unlock: { type: 'complete-previous', requiredStageId: 'stage-14-chaos' }
  },
};

/**
 * Get stage by ID
 * @param {string} stageId - Stage ID (e.g., 'stage-1-intro')
 * @returns {object|null} Stage object or null if not found
 */
function getStage(stageId) {
  return STAGES[stageId] || null;
}

/**
 * Get stage by order number
 * @param {number} order - Stage order (1-15)
 * @returns {object|null} Stage object or null if not found
 */
function getStageByOrder(order) {
  return Object.values(STAGES).find(stage => stage.order === order) || null;
}

/**
 * Get next stage in sequence
 * @param {string} currentStageId - Current stage ID
 * @returns {object|null} Next stage object or null if last stage
 */
function getNextStage(currentStageId) {
  const currentStage = STAGES[currentStageId];
  if (!currentStage) return null;

  const nextOrder = currentStage.order + 1;
  return getStageByOrder(nextOrder);
}

/**
 * Get all stages as array, sorted by order
 * @returns {array} Array of stage objects
 */
function getAllStages() {
  return Object.values(STAGES).sort((a, b) => a.order - b.order);
}

/**
 * Get total number of stages
 * @returns {number} Total stages (15 in MVP)
 */
function getTotalStages() {
  return Object.keys(STAGES).length;
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    STAGES,
    getStage,
    getStageByOrder,
    getNextStage,
    getAllStages,
    getTotalStages
  };
}
