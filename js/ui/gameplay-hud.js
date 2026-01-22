/* ========================================
   BEAT RUNNER - Real-Time Performance HUD
   Live feedback during Stage Mode gameplay
   Priority 1: Enhanced Player Feedback
   ======================================== */

/**
 * Gameplay Performance HUD
 * Shows real-time performance indicators:
 * - Crash count (red if exceeding 3⭐ limit)
 * - Orb percentage (green if above 3⭐ threshold)
 * - Current star prediction
 */

const GameplayHUD = {
    container: null,
    crashIndicator: null,
    orbIndicator: null,
    starPrediction: null,
    isActive: false,

    /**
     * Initialize the gameplay HUD
     */
    init() {
        this.createHUDElements();
    },

    /**
     * Create HUD elements
     */
    createHUDElements() {
        if (this.container) return;

        // Create container
        this.container = document.createElement('div');
        this.container.id = 'gameplay-hud';
        this.container.className = 'gameplay-hud';
        this.container.style.cssText = `
            position: fixed;
            top: calc(90px + var(--safe-area-inset-top));
            right: calc(16px + var(--safe-area-inset-right));
            display: none;
            flex-direction: column;
            gap: 10px;
            z-index: 100;
            pointer-events: none;
            max-width: 220px;
        `;

        // Crash indicator
        this.crashIndicator = document.createElement('div');
        this.crashIndicator.className = 'hud-performance-item';
        this.crashIndicator.innerHTML = '<div class="hud-perf-value">Crashes: <span id="gameplay-crashes">0</span>/<span id="gameplay-crashes-limit">2</span></div>';

        // Orb indicator
        this.orbIndicator = document.createElement('div');
        this.orbIndicator.className = 'hud-performance-item';
        this.orbIndicator.innerHTML = '<div class="hud-perf-value">Orbs: <span id="gameplay-orbs">0</span>/<span id="gameplay-orbs-total">12</span> (<span id="gameplay-orbs-percent">0</span>%)</div>';

        // Star prediction
        this.starPrediction = document.createElement('div');
        this.starPrediction.className = 'hud-star-prediction';
        this.starPrediction.innerHTML = '<span id="gameplay-star-text">Keep going!</span>';

        // Add all to container
        this.container.appendChild(this.crashIndicator);
        this.container.appendChild(this.orbIndicator);
        this.container.appendChild(this.starPrediction);

        // Add to page
        document.body.appendChild(this.container);
    },

    /**
     * Show the gameplay HUD (Stage Mode only)
     */
    show() {
        if (!GameState.isStageMode || !this.container) return;

        // Hide notification boxes on mobile for cleaner gameplay
        const device = QualityManager.detectDevice();
        const isMobile = device.isTouchDevice || device.isSmallScreen;

        if (isMobile) {
            this.isActive = false;
            this.container.style.display = 'none';
            return;
        }

        this.isActive = true;
        this.container.style.display = 'flex';
        this.update(); // Initial update
    },

    /**
     * Hide the gameplay HUD
     */
    hide() {
        if (!this.container) return;

        this.isActive = false;
        this.container.style.display = 'none';
    },

    /**
     * Update HUD with current gameplay state
     */
    update() {
        if (!this.isActive || !GameState.isStageMode) return;

        const stage = GameState.currentStage;
        if (!stage) return;

        const crashes = GameState.crashes || 0;
        const orbsCollected = GameState.orbsCollected || 0;
        const totalOrbs = stage.totalOrbs || 0;
        const orbPercent = totalOrbs > 0 ? Math.floor((orbsCollected / totalOrbs) * 100) : 0;

        // Get star requirements
        const star3Req = stage.stars.star3;
        const crashLimit = star3Req.crashes;
        const orbReq = star3Req.orbs;

        // Update crash counter
        const crashText = document.getElementById('gameplay-crashes');
        const crashLimitText = document.getElementById('gameplay-crashes-limit');
        if (crashText) crashText.textContent = crashes;
        if (crashLimitText) crashLimitText.textContent = crashLimit;

        // Color code crash indicator
        if (crashes > crashLimit) {
            this.crashIndicator.classList.add('status-bad');
            this.crashIndicator.classList.remove('status-good', 'status-warning');
        } else if (crashes === crashLimit) {
            this.crashIndicator.classList.add('status-warning');
            this.crashIndicator.classList.remove('status-good', 'status-bad');
        } else {
            this.crashIndicator.classList.add('status-good');
            this.crashIndicator.classList.remove('status-warning', 'status-bad');
        }

        // Update orb counter
        const orbText = document.getElementById('gameplay-orbs');
        const orbTotalText = document.getElementById('gameplay-orbs-total');
        const orbPercentText = document.getElementById('gameplay-orbs-percent');
        if (orbText) orbText.textContent = orbsCollected;
        if (orbTotalText) orbTotalText.textContent = totalOrbs;
        if (orbPercentText) orbPercentText.textContent = orbPercent;

        // Color code orb indicator
        if (orbPercent >= orbReq) {
            this.orbIndicator.classList.add('status-good');
            this.orbIndicator.classList.remove('status-warning', 'status-bad');
        } else if (orbPercent >= orbReq - 10) {
            this.orbIndicator.classList.add('status-warning');
            this.orbIndicator.classList.remove('status-good', 'status-bad');
        } else {
            this.orbIndicator.classList.add('status-bad');
            this.orbIndicator.classList.remove('status-good', 'status-warning');
        }

        // Predict current star rating
        const predictedStars = this.predictStars(crashes, orbPercent, stage);
        this.updateStarPrediction(predictedStars, crashes, orbPercent, crashLimit, orbReq);
    },

    /**
     * Predict current star rating
     * @param {number} crashes - Current crash count
     * @param {number} orbPercent - Current orb percentage
     * @param {object} stage - Current stage
     * @returns {number} Predicted stars (0-3)
     */
    predictStars(crashes, orbPercent, stage) {
        const star3 = stage.stars.star3;
        const star2 = stage.stars.star2;

        // Check for 3 stars
        if (crashes <= star3.crashes && orbPercent >= star3.orbs) {
            return 3;
        }

        // Check for 2 stars
        if (crashes <= star2.crashes && orbPercent >= star2.orbs) {
            return 2;
        }

        // At least 1 star for completing
        return 1;
    },

    /**
     * Update star prediction text
     */
    updateStarPrediction(predictedStars, crashes, orbPercent, crashLimit, orbReq) {
        const starText = document.getElementById('gameplay-star-text');
        if (!starText) return;

        let message = '';
        let statusClass = '';

        if (predictedStars === 3) {
            message = 'On track for ⭐⭐⭐!';
            statusClass = 'status-excellent';
        } else if (predictedStars === 2) {
            // Determine what's blocking 3 stars
            if (crashes > crashLimit && orbPercent < orbReq) {
                message = 'Reduce crashes and collect more orbs!';
            } else if (crashes > crashLimit) {
                message = `Avoid crashes for ⭐⭐⭐ (${crashLimit} max)`;
            } else {
                message = `Collect more orbs for ⭐⭐⭐ (${orbReq}% needed)`;
            }
            statusClass = 'status-decent';
        } else {
            message = 'Keep trying for more stars!';
            statusClass = 'status-poor';
        }

        starText.textContent = message;

        // Update class
        this.starPrediction.className = `hud-star-prediction ${statusClass}`;
    },

    /**
     * Reset HUD state
     */
    reset() {
        if (!this.container) return;

        // Reset all values to 0
        const elements = [
            'gameplay-crashes',
            'gameplay-crashes-limit',
            'gameplay-orbs',
            'gameplay-orbs-total',
            'gameplay-orbs-percent'
        ];

        elements.forEach(id => {
            const el = document.getElementById(id);
            if (el) el.textContent = '0';
        });

        // Reset classes
        this.crashIndicator.className = 'hud-performance-item';
        this.orbIndicator.className = 'hud-performance-item';
        this.starPrediction.className = 'hud-star-prediction';
    }
};

// Initialize on load
if (typeof window !== 'undefined') {
    window.addEventListener('load', () => {
        GameplayHUD.init();
    });
}
