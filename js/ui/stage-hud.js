/* ========================================
   BEAT RUNNER - Stage Mode HUD
   In-game UI: Progress bar, orbs, crashes
   ======================================== */

/**
 * Stage HUD UI
 * Displays stage progress, orb count, and crash count during gameplay
 */
const StageHudUI = {
    container: null,
    progressFill: null,
    progressPercent: null,
    orbCount: null,
    orbTotal: null,
    crashCount: null,
    stageName: null,

    /**
     * Initialize Stage HUD
     */
    init() {
        this.container = document.getElementById('stage-hud');
        this.progressFill = document.getElementById('stage-progress-fill');
        this.progressPercent = document.getElementById('stage-progress-percent');
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

        // Reset values
        this.orbCount.textContent = '0';
        this.crashCount.textContent = '0';
        this.progressFill.style.width = '0%';
        this.progressPercent.textContent = '0%';

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
     */
    update() {
        if (!GameState.isStageMode || !GameState.currentStage) return;

        const stage = GameState.currentStage;
        const distance = GameState.distanceTraveled;
        const progress = Math.min(100, (distance / stage.distance) * 100);

        // Update progress bar
        this.progressFill.style.width = `${progress}%`;
        this.progressPercent.textContent = `${Math.floor(progress)}%`;

        // Update counters
        this.orbCount.textContent = GameState.orbsCollected;
        this.crashCount.textContent = GameState.crashes;
    }
};
