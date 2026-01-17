/* ========================================
   BEAT RUNNER - Stage Mode HUD
   Secondary HUD row removed - hits now displayed in main HUD
   This file maintains backward compatibility interface
   ======================================== */

/**
 * Stage HUD UI
 * Secondary HUD row (Stage X, diamonds, hits) has been removed.
 * Hits are now displayed in the main HUD alongside Distance and Orbs.
 * This object maintains the interface for backward compatibility.
 */
const StageHudUI = {
    /**
     * Initialize Stage HUD - No-op (secondary HUD removed)
     */
    init() {
        // Secondary HUD removed - hits now in main HUD
    },

    /**
     * Show Stage HUD - No-op (secondary HUD removed)
     */
    show() {
        // Secondary HUD removed - hits now in main HUD
    },

    /**
     * Hide Stage HUD - No-op (secondary HUD removed)
     */
    hide() {
        // Secondary HUD removed - hits now in main HUD
    },

    /**
     * Update HUD values - No-op (hits updated in main loop.js)
     */
    update() {
        // Secondary HUD removed - hits now updated in main HUD (loop.js)
    }
};
