/* ========================================
   BEAT RUNNER - Star Calculator
   Rule-based star rating (crashes + orbs%)
   ======================================== */

/**
 * Star Calculator
 * Simple rule-based system: crashes ≤ X AND orbs ≥ Y%
 *
 * NO complex scoring formula in MVP.
 * Stars are determined by 2 metrics:
 * 1. Crashes (how many obstacles hit)
 * 2. Orbs collected % (percentage of total orbs collected)
 */

/**
 * Calculate stars earned for a stage completion
 * @param {number} crashes - Number of obstacles hit
 * @param {number} orbsCollected - Number of orbs collected
 * @param {number} totalOrbs - Total orbs in the stage
 * @param {object} stage - Stage object (from stage-registry.js)
 * @returns {number} Stars earned (1, 2, or 3)
 */
function calculateStars(crashes, orbsCollected, totalOrbs, stage) {
  // Validate inputs
  if (!stage || !stage.stars) {
    console.error('Invalid stage object:', stage);
    return 1; // Default to 1 star if error
  }

  // Calculate orb percentage
  const orbPercent = totalOrbs > 0 ? (orbsCollected / totalOrbs) * 100 : 0;

  // Check for 3 stars
  // Must meet BOTH crash AND orb requirements
  if (crashes <= stage.stars.star3.crashes && orbPercent >= stage.stars.star3.orbs) {
    return 3;
  }

  // Check for 2 stars
  // Must meet BOTH crash AND orb requirements
  if (crashes <= stage.stars.star2.crashes && orbPercent >= stage.stars.star2.orbs) {
    return 2;
  }

  // Always at least 1 star for completing
  return 1;
}

/**
 * Get star requirements for a stage (for UI display)
 * @param {object} stage - Stage object
 * @returns {object} Star requirements
 */
function getStarRequirements(stage) {
  if (!stage || !stage.stars) {
    return {
      star1: { crashes: 'N/A', orbs: 'N/A' },
      star2: { crashes: 'N/A', orbs: 'N/A' },
      star3: { crashes: 'N/A', orbs: 'N/A' }
    };
  }

  return {
    star1: { crashes: '∞', orbs: '0%' }, // Just complete
    star2: {
      crashes: `≤${stage.stars.star2.crashes}`,
      orbs: `≥${stage.stars.star2.orbs}%`
    },
    star3: {
      crashes: `≤${stage.stars.star3.crashes}`,
      orbs: `≥${stage.stars.star3.orbs}%`
    }
  };
}

/**
 * Predict stars based on current performance (for HUD)
 * @param {number} crashes - Current crashes
 * @param {number} orbsCollected - Current orbs collected
 * @param {number} totalOrbs - Total orbs in stage
 * @param {object} stage - Stage object
 * @returns {number} Predicted stars (1-3)
 */
function predictStars(crashes, orbsCollected, totalOrbs, stage) {
  // Same logic as calculateStars, but for live prediction
  return calculateStars(crashes, orbsCollected, totalOrbs, stage);
}

/**
 * Check if player is on pace for a specific star rating
 * @param {number} targetStars - Target star rating (2 or 3)
 * @param {number} crashes - Current crashes
 * @param {number} orbsCollected - Current orbs collected
 * @param {number} totalOrbs - Total orbs in stage
 * @param {object} stage - Stage object
 * @returns {object} Status for crashes and orbs
 */
function checkStarPace(targetStars, crashes, orbsCollected, totalOrbs, stage) {
  if (!stage || !stage.stars) {
    return { crashesOK: false, orbsOK: false };
  }

  const orbPercent = totalOrbs > 0 ? (orbsCollected / totalOrbs) * 100 : 0;
  const thresholds = targetStars === 3 ? stage.stars.star3 : stage.stars.star2;

  return {
    crashesOK: crashes <= thresholds.crashes,
    orbsOK: orbPercent >= thresholds.orbs,
    crashesRemaining: Math.max(0, thresholds.crashes - crashes),
    orbsNeeded: Math.max(0, Math.ceil((thresholds.orbs / 100) * totalOrbs) - orbsCollected)
  };
}

/**
 * Get star message for Results screen
 * @param {number} stars - Stars earned
 * @returns {string} Message to display
 */
function getStarMessage(stars) {
  const messages = {
    3: ['FLAWLESS VICTORY!', 'PERFECT RUN!', 'MASTERED!'],
    2: ['GREAT RUN!', 'SOLID PERFORMANCE!', 'NICE WORK!'],
    1: ['STAGE COMPLETE!', 'YOU DID IT!', 'FINISHED!']
  };

  const options = messages[stars] || messages[1];
  return options[Math.floor(Math.random() * options.length)];
}

/**
 * Get improvement tip for Results screen (when not 3 stars)
 * @param {number} stars - Stars earned
 * @param {number} crashes - Crashes
 * @param {number} orbPercent - Orb percentage
 * @param {object} stage - Stage object
 * @returns {string|null} Tip or null if 3 stars
 */
function getImprovementTip(stars, crashes, orbPercent, stage) {
  if (stars === 3) return null;

  const needsBetterCrashes = stage && crashes > stage.stars.star3.crashes;
  const needsBetterOrbs = stage && orbPercent < stage.stars.star3.orbs;

  const tips = [];

  if (needsBetterCrashes) {
    tips.push('Avoid obstacles to earn more stars!');
    tips.push('Try jumping over obstacles!');
    tips.push('Watch for 2-lane blocks - find the safe path!');
  }

  if (needsBetterOrbs) {
    tips.push('Collect more orbs for a perfect score!');
    tips.push('Don\'t miss those orbs!');
  }

  if (tips.length === 0) {
    tips.push('Keep practicing!');
  }

  return tips[Math.floor(Math.random() * tips.length)];
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    calculateStars,
    getStarRequirements,
    predictStars,
    checkStarPace,
    getStarMessage,
    getImprovementTip
  };
}
