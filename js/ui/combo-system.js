/* ========================================
   BEAT RUNNER - Combo & Rhythm System
   Tracks dodges + on-beat collections for score multiplier
   ======================================== */

const ComboSystem = {
    container: null,
    comboDisplay: null,
    multiplierDisplay: null,
    ratingPool: [],       // Pool of rating popup elements for reuse

    // Combo tier thresholds and their multipliers
    TIERS: [
        { min: 0,  multiplier: 1.0, color: '#ffffff', label: '' },
        { min: 5,  multiplier: 1.5, color: '#00ffff', label: 'NICE!' },
        { min: 10, multiplier: 2.0, color: '#ff00ff', label: 'GREAT!' },
        { min: 20, multiplier: 3.0, color: '#ffff00', label: 'AMAZING!' },
        { min: 50, multiplier: 5.0, color: '#ff6600', label: 'LEGENDARY!' }
    ],

    /**
     * Initialize combo UI
     */
    init() {
        this.createUI();
    },

    /**
     * Create combo display elements
     */
    createUI() {
        // Main combo container (bottom-center of screen)
        this.container = document.createElement('div');
        this.container.id = 'combo-container';
        this.container.className = 'combo-container';
        this.container.style.display = 'none';
        document.body.appendChild(this.container);

        // Combo count
        this.comboDisplay = document.createElement('div');
        this.comboDisplay.className = 'combo-count';
        this.comboDisplay.textContent = '';
        this.container.appendChild(this.comboDisplay);

        // Multiplier badge
        this.multiplierDisplay = document.createElement('div');
        this.multiplierDisplay.className = 'combo-multiplier';
        this.multiplierDisplay.textContent = '';
        this.container.appendChild(this.multiplierDisplay);
    },

    /**
     * Called when an obstacle is successfully dodged
     */
    onDodge() {
        if (!GameState.isPlaying || GameState.isPaused) return;

        this.incrementCombo();
    },

    /**
     * Called when an orb is collected
     * @param {string|null} rating - 'perfect', 'good', or null
     */
    onCollect(rating) {
        if (!GameState.isPlaying || GameState.isPaused) return;

        if (rating === 'perfect') {
            // Perfect gives bigger combo boost
            this.incrementCombo();
            this.incrementCombo();
        } else if (rating === 'good') {
            this.incrementCombo();
        }
        // No rating = no combo from this collection (still keeps existing combo alive)

        // Refresh timer on any collection
        GameState.comboTimer = CONFIG.COMBO_DECAY_TIME;
    },

    /**
     * Called when player collides with obstacle
     */
    onCrash() {
        this.breakCombo();
    },

    /**
     * Increment combo counter
     */
    incrementCombo() {
        GameState.combo++;
        GameState.comboTimer = CONFIG.COMBO_DECAY_TIME;

        if (GameState.combo > GameState.maxCombo) {
            GameState.maxCombo = GameState.combo;
        }

        // Update multiplier
        this.updateMultiplier();

        // Check for tier milestone sounds
        const prevTier = this.getTier(GameState.combo - 1);
        const newTier = this.getTier(GameState.combo);
        if (newTier.min > prevTier.min && newTier.min > 0) {
            const tierIndex = this.TIERS.indexOf(newTier);
            playComboSound(tierIndex);

            // Flash the tier label
            this.showTierLabel(newTier.label, newTier.color);
        }

        // Update UI
        this.updateDisplay();
    },

    /**
     * Break combo (on collision)
     */
    breakCombo() {
        if (GameState.combo > 0) {
            // Show combo break feedback
            if (GameState.combo >= 5) {
                this.showBreak();
            }
        }

        GameState.combo = 0;
        GameState.comboTimer = 0;
        GameState.scoreMultiplier = 1.0;
        this.updateDisplay();
    },

    /**
     * Update combo timer (called from game loop)
     */
    update(delta) {
        if (!GameState.isPlaying || GameState.isPaused) return;

        if (GameState.combo > 0 && GameState.comboTimer > 0) {
            GameState.comboTimer -= delta;
            if (GameState.comboTimer <= 0) {
                this.breakCombo();
            }
        }

        this.updateDisplay();
    },

    /**
     * Get tier for a combo count
     */
    getTier(combo) {
        let tier = this.TIERS[0];
        for (let i = 1; i < this.TIERS.length; i++) {
            if (combo >= this.TIERS[i].min) {
                tier = this.TIERS[i];
            }
        }
        return tier;
    },

    /**
     * Update score multiplier based on current combo
     */
    updateMultiplier() {
        const tier = this.getTier(GameState.combo);
        GameState.scoreMultiplier = tier.multiplier;
    },

    /**
     * Update the visual display
     */
    updateDisplay() {
        if (!this.container) return;

        if (GameState.combo < 2) {
            this.container.style.display = 'none';
            return;
        }

        this.container.style.display = 'flex';
        const tier = this.getTier(GameState.combo);

        // Combo count
        this.comboDisplay.textContent = `${GameState.combo}x`;
        this.comboDisplay.style.color = tier.color;
        this.comboDisplay.style.textShadow = `0 0 15px ${tier.color}, 0 0 30px ${tier.color}`;

        // Multiplier
        if (GameState.scoreMultiplier > 1) {
            this.multiplierDisplay.textContent = `×${GameState.scoreMultiplier.toFixed(1)}`;
            this.multiplierDisplay.style.color = tier.color;
            this.multiplierDisplay.style.display = 'block';
        } else {
            this.multiplierDisplay.style.display = 'none';
        }

        // Pulse animation on update
        this.comboDisplay.classList.remove('combo-pulse');
        void this.comboDisplay.offsetWidth; // Force reflow for re-trigger
        this.comboDisplay.classList.add('combo-pulse');
    },

    /**
     * Show rating popup at orb position ("PERFECT!", "GOOD!")
     */
    showRating(rating, worldPos) {
        // Project 3D position to screen
        if (!camera || !renderer) return;

        const screenPos = this.worldToScreen(worldPos);
        if (!screenPos) return;

        const popup = document.createElement('div');
        popup.className = 'combo-rating';

        if (rating === 'perfect') {
            popup.textContent = 'PERFECT!';
            popup.style.color = '#ffff00';
            popup.style.textShadow = '0 0 10px #ffff00, 0 0 20px #ffaa00';
        } else {
            popup.textContent = 'GOOD!';
            popup.style.color = '#00ffaa';
            popup.style.textShadow = '0 0 10px #00ffaa';
        }

        popup.style.left = screenPos.x + 'px';
        popup.style.top = screenPos.y + 'px';

        document.body.appendChild(popup);

        // Remove after animation
        setTimeout(() => {
            if (popup.parentNode) popup.parentNode.removeChild(popup);
        }, 800);
    },

    /**
     * Show tier milestone label
     */
    showTierLabel(label, color) {
        if (!label) return;

        const tierEl = document.createElement('div');
        tierEl.className = 'combo-tier-label';
        tierEl.textContent = label;
        tierEl.style.color = color;
        tierEl.style.textShadow = `0 0 15px ${color}, 0 0 30px ${color}`;

        document.body.appendChild(tierEl);

        setTimeout(() => {
            if (tierEl.parentNode) tierEl.parentNode.removeChild(tierEl);
        }, 1200);
    },

    /**
     * Show combo break feedback
     */
    showBreak() {
        const breakEl = document.createElement('div');
        breakEl.className = 'combo-break';
        breakEl.textContent = `${GameState.combo}× COMBO LOST`;

        document.body.appendChild(breakEl);

        setTimeout(() => {
            if (breakEl.parentNode) breakEl.parentNode.removeChild(breakEl);
        }, 1000);
    },

    /**
     * Project world position to screen coordinates
     */
    worldToScreen(worldPos) {
        if (!camera) return null;

        const vector = worldPos.clone();
        vector.project(camera);

        const halfW = window.innerWidth / 2;
        const halfH = window.innerHeight / 2;

        return {
            x: (vector.x * halfW) + halfW,
            y: -(vector.y * halfH) + halfH
        };
    },

    /**
     * Show combo display (called on game start)
     */
    show() {
        // Display is controlled by updateDisplay based on combo count
    },

    /**
     * Hide combo display (called on game over)
     */
    hide() {
        if (this.container) {
            this.container.style.display = 'none';
        }
    },

    /**
     * Reset combo state for new game
     */
    reset() {
        GameState.combo = 0;
        GameState.maxCombo = 0;
        GameState.comboTimer = 0;
        GameState.scoreMultiplier = 1.0;
        GameState.lastCollectRating = null;
        this.hide();
    }
};

// Initialize on load
if (typeof window !== 'undefined') {
    window.addEventListener('load', () => {
        ComboSystem.init();
    });
}
