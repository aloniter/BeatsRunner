/* ========================================
   BEAT RUNNER - Stage Progress Storage
   Storage abstraction for Stage Mode
   ======================================== */

/**
 * Stage Progress Storage
 * Handles saving and loading stage completion data, unlocks, and rewards
 */

// Reward thresholds (total stars needed)
const REWARD_THRESHOLDS = [
  { stars: 5, id: 'neon-trail', name: 'Neon Trail' },
  { stars: 10, id: 'crystal-ball', name: 'Crystal Ball Skin' },
  { stars: 15, id: 'rainbow-particles', name: 'Rainbow Particle Effect' }
];

/**
 * Initialize progress data with Stage 1 unlocked
 * @returns {object} Fresh progress data
 */
function initializeProgress() {
  const progress = {
    stageProgress: {},
    totalStars: 0,
    stagesCompleted: 0,
    unlockedRewards: [],
    newRewardsAvailable: false
  };

  // Initialize all 15 stages
  for (let i = 1; i <= 15; i++) {
    const stageId = getStageIdByOrder(i);
    progress.stageProgress[stageId] = {
      unlocked: i === 1, // Only Stage 1 starts unlocked
      completed: false,
      bestStars: 0,
      bestCrashes: 999,
      bestOrbs: 0,
      totalOrbs: 0,
      playCount: 0
    };
  }

  return progress;
}

/**
 * Helper: Get stage ID by order number
 * @param {number} order - Stage order (1-15)
 * @returns {string} Stage ID
 */
function getStageIdByOrder(order) {
  const stageNames = [
    'intro', 'rhythm', 'jump', 'lane', 'speed',
    'double', 'rhythm-run', 'jump-chain', 'reflex', 'gauntlet',
    'speed', 'timing', 'jump-master', 'chaos', 'final'
  ];
  return `stage-${order}-${stageNames[order - 1]}`;
}

/**
 * Load progress from storage
 * @returns {object} Progress data (initialized if not exists)
 */
function loadProgress() {
  const progress = Storage.getJSON(Storage.KEYS.STAGE_PROGRESS, null);

  // Validate structure
  if (progress && progress.stageProgress && typeof progress.totalStars === 'number') {
    return progress;
  }

  // Return fresh progress if load fails or no save exists
  return initializeProgress();
}

/**
 * Save progress to storage
 * @param {object} progress - Progress data to save
 */
function saveProgressData(progress) {
  Storage.setJSON(Storage.KEYS.STAGE_PROGRESS, progress);
}

/**
 * Save stage completion and update progress
 * @param {string} stageId - Stage ID
 * @param {number} stars - Stars earned (1-3)
 * @param {number} crashes - Crash count
 * @param {number} orbsCollected - Orbs collected
 * @param {number} totalOrbs - Total orbs in stage
 * @returns {object|null} Newly unlocked reward (if any)
 */
function saveProgress(stageId, stars, crashes, orbsCollected, totalOrbs) {
  const progress = loadProgress();
  const stageData = progress.stageProgress[stageId];

  if (!stageData) {
    console.error('Invalid stage ID:', stageId);
    return null;
  }

  // Update if new best (or first completion)
  const isNewBest = !stageData.completed || stars > stageData.bestStars;

  if (isNewBest) {
    stageData.bestStars = stars;
    stageData.bestCrashes = crashes;
    stageData.bestOrbs = orbsCollected;
  }

  stageData.completed = true;
  stageData.totalOrbs = totalOrbs;
  stageData.playCount++;

  // Unlock next stage
  const nextStageId = getNextStageId(stageId);
  if (nextStageId && progress.stageProgress[nextStageId]) {
    progress.stageProgress[nextStageId].unlocked = true;
  }

  // Recalculate totals
  progress.totalStars = calculateTotalStars(progress.stageProgress);
  progress.stagesCompleted = countCompletedStages(progress.stageProgress);

  // Check for reward unlocks
  const newReward = checkRewardUnlocks(progress);

  // Save to localStorage
  saveProgressData(progress);

  return newReward;
}

/**
 * Calculate total stars across all stages
 * @param {object} stageProgress - Stage progress data
 * @returns {number} Total stars
 */
function calculateTotalStars(stageProgress) {
  let total = 0;
  for (const stageId in stageProgress) {
    total += stageProgress[stageId].bestStars;
  }
  return total;
}

/**
 * Count completed stages
 * @param {object} stageProgress - Stage progress data
 * @returns {number} Number of completed stages
 */
function countCompletedStages(stageProgress) {
  let count = 0;
  for (const stageId in stageProgress) {
    if (stageProgress[stageId].completed) {
      count++;
    }
  }
  return count;
}

/**
 * Get next stage ID in sequence
 * @param {string} currentStageId - Current stage ID
 * @returns {string|null} Next stage ID or null if last stage
 */
function getNextStageId(currentStageId) {
  // Extract order from stage ID
  const match = currentStageId.match(/stage-(\d+)-/);
  if (!match) return null;

  const currentOrder = parseInt(match[1], 10);
  const nextOrder = currentOrder + 1;

  if (nextOrder > 15) return null; // Last stage

  return getStageIdByOrder(nextOrder);
}

/**
 * Check for and unlock new rewards based on total stars
 * @param {object} progress - Progress data
 * @returns {object|null} Newly unlocked reward or null
 */
function checkRewardUnlocks(progress) {
  const totalStars = progress.totalStars;
  const unlockedIds = progress.unlockedRewards;

  for (const reward of REWARD_THRESHOLDS) {
    if (totalStars >= reward.stars && !unlockedIds.includes(reward.id)) {
      // Unlock this reward
      progress.unlockedRewards.push(reward.id);
      progress.newRewardsAvailable = true;

      // Return reward for Results screen to display
      return { id: reward.id, name: reward.name };
    }
  }

  return null;
}

/**
 * Clear "new rewards available" flag
 */
function clearNewRewardsFlag() {
  const progress = loadProgress();
  progress.newRewardsAvailable = false;
  saveProgressData(progress);
}

/**
 * Check if a stage is unlocked
 * @param {string} stageId - Stage ID
 * @returns {boolean} True if unlocked
 */
function isStageUnlocked(stageId) {
  const progress = loadProgress();
  const stageData = progress.stageProgress[stageId];
  return stageData ? stageData.unlocked : false;
}

/**
 * Get stage completion data
 * @param {string} stageId - Stage ID
 * @returns {object|null} Stage data or null
 */
function getStageData(stageId) {
  const progress = loadProgress();
  return progress.stageProgress[stageId] || null;
}

/**
 * Reset all progress (for testing/debugging)
 * WARNING: Deletes all saved data!
 */
function resetProgress() {
  const fresh = initializeProgress();
  saveProgressData(fresh);
  return fresh;
}

/**
 * Get summary stats for UI display
 * @returns {object} Summary stats
 */
function getProgressSummary() {
  const progress = loadProgress();
  return {
    totalStars: progress.totalStars,
    maxStars: 45, // 15 stages × 3 stars
    stagesCompleted: progress.stagesCompleted,
    totalStages: 15,
    unlockedRewards: progress.unlockedRewards,
    newRewardsAvailable: progress.newRewardsAvailable
  };
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    initializeProgress,
    loadProgress,
    saveProgress,
    calculateTotalStars,
    getNextStageId,
    checkRewardUnlocks,
    clearNewRewardsFlag,
    isStageUnlocked,
    getStageData,
    resetProgress,
    getProgressSummary,
    REWARD_THRESHOLDS
  };
}
