/* ========================================
   BEAT RUNNER - Stage Mode HUD
   In-game UI: Distance, Orbs, Hit counter
   ======================================== */

/**
 * Stage HUD UI
 * Displays stage name, orb count, and hit/crash count during gameplay
 * Progress bar removed for cleaner arcade-style HUD
 */
const StageHudUI = {
    container: null,
    orbCount: null,
    orbTotal: null,
    crashCount: null,
    stageName: null,

    /**
     * Initialize Stage HUD
     */
    init() {
        this.container = document.getElementById('stage-hud');
        this.orbCount = document.getElementById('stage-orb-count');
        this.orbTotal = document.getElementById('stage-orb-total');
        this.crashCount = document.getElementById('stage-crash-count');
        this.stageName = document.getElementById('stage-hud-name');
    },

    /**
     * Show Stage HUD for current stage
     */
    show() {
        if (!GameState.isStageMode || !GameState.currentStage) return;

        const stage = GameState.currentStage;

        // Set stage info
        this.stageName.textContent = `Stage ${stage.order}`;
        this.orbTotal.textContent = stage.totalOrbs;

        // Reset counter values
        this.orbCount.textContent = '0';
        this.crashCount.textContent = '0';

        // Show HUD
        this.container.classList.add('is-visible');
    },

    /**
     * Hide Stage HUD
     */
    hide() {
        this.container.classList.remove('is-visible');
    },

    /**
     * Update HUD values (called every frame in loop.js)
     * Note: Progress bar removed - distance tracking handled by main Distance stat
     */
    update() {
        if (!GameState.isStageMode || !GameState.currentStage) return;

        // Update counters (Orbs collected and Hit/crash count)
        this.orbCount.textContent = GameState.orbsCollected;
        this.crashCount.textContent = GameState.crashes;
    }
};
