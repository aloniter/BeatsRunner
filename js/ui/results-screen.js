/* ========================================
   BEAT RUNNER - Results Screen
   Stage Mode UI: Post-stage results display
   ======================================== */

/**
 * Results Screen UI
 * Displays stars earned, stats, and navigation buttons after stage completion
 */
const ResultsScreenUI = {
    overlay: null,
    starsEarned: 0,
    currentStageId: null,

    /**
     * Initialize Results Screen
     */
    init() {
        this.overlay = document.getElementById('results-overlay');

        // Menu button
        document.getElementById('results-menu-btn').addEventListener('click', () => {
            this.goToMenu();
        });

        // Replay button
        document.getElementById('results-replay-btn').addEventListener('click', () => {
            this.replayStage();
        });

        // Next Stage button
        document.getElementById('results-next-btn').addEventListener('click', () => {
            this.nextStage();
        });
    },

    /**
     * Show results screen with stage performance
     * @param {number} stars - Stars earned (1-3)
     * @param {object|null} newReward - Newly unlocked reward (if any)
     */
    show(stars, newReward = null) {
        this.starsEarned = stars;
        this.currentStageId = GameState.currentStage ? GameState.currentStage.id : null;

        const stage = GameState.currentStage;
        if (!stage) {
            console.error('No current stage for results!');
            return;
        }

        const orbPercent = stage.totalOrbs > 0
            ? Math.round((GameState.orbsCollected / stage.totalOrbs) * 100)
            : 0;

        // Message based on stars
        const message = this.getStarMessage(stars);
        document.getElementById('results-message').textContent = message;

        // Render stars
        document.getElementById('results-stars').innerHTML = this.renderStars(stars);

        // Stats
        document.getElementById('results-orbs').textContent =
            `${GameState.orbsCollected}/${stage.totalOrbs} (${orbPercent}%)`;
        document.getElementById('results-crashes').textContent = GameState.crashes;

        // Improvement tip
        const tip = this.getImprovementTip(stars, GameState.crashes, orbPercent, stage);
        const tipEl = document.getElementById('results-tip');
        if (tip) {
            tipEl.textContent = tip;
            tipEl.classList.add('is-visible');
        } else {
            tipEl.classList.remove('is-visible');
        }

        // Total progress
        const summary = getProgressSummary();
        const progressPercent = (summary.totalStars / summary.maxStars) * 100;
        document.getElementById('results-progress-fill').style.width = `${progressPercent}%`;
        document.getElementById('results-progress-text').textContent =
            `⭐ ${summary.totalStars}/${summary.maxStars}`;

        // Next button visibility
        const nextStage = getNextStage(stage.id);
        const nextBtn = document.getElementById('results-next-btn');
        if (nextStage) {
            nextBtn.style.display = 'inline-block';
            nextBtn.textContent = 'NEXT STAGE';
        } else {
            nextBtn.style.display = 'none'; // Last stage
        }

        // Hide game UI
        hud.style.display = 'none';
        StageHudUI.hide();
        mobileControls.style.display = 'none';
        pauseBtn.style.display = 'none';
        beatIndicator.style.display = 'none';

        // Pause music
        if (bgMusic) {
            bgMusic.pause();
        }

        // Show results
        this.overlay.classList.add('is-open');
        this.overlay.setAttribute('aria-hidden', 'false');
    },

    /**
     * Get message based on star count
     * @param {number} stars - Stars earned (1-3)
     * @returns {string} Success message
     */
    getStarMessage(stars) {
        const messages = {
            3: ['PERFECT RUN!', 'FLAWLESS!', 'MASTERED!'],
            2: ['GREAT RUN!', 'NICE WORK!', 'SOLID!'],
            1: ['STAGE COMPLETE!', 'YOU DID IT!', 'FINISHED!']
        };
        const options = messages[stars] || messages[1];
        return options[Math.floor(Math.random() * options.length)];
    },

    /**
     * Get improvement tip based on performance
     * @param {number} stars - Stars earned
     * @param {number} crashes - Crash count
     * @param {number} orbPercent - Orb collection percentage
     * @param {object} stage - Stage object
     * @returns {string|null} Improvement tip or null if 3 stars
     */
    getImprovementTip(stars, crashes, orbPercent, stage) {
        if (stars >= 3) return null;

        const starReqs = stage.stars;

        // Check what's holding back 3 stars
        if (crashes > starReqs.star3.crashes && orbPercent < starReqs.star3.orbs) {
            return 'Avoid obstacles and collect more orbs for 3 stars!';
        } else if (crashes > starReqs.star3.crashes) {
            return `Reduce crashes to ${starReqs.star3.crashes} or less for 3 stars!`;
        } else if (orbPercent < starReqs.star3.orbs) {
            return `Collect at least ${starReqs.star3.orbs}% of orbs for 3 stars!`;
        }

        return 'Keep practicing to improve your score!';
    },

    /**
     * Render star display
     * @param {number} count - Stars earned (1-3)
     * @returns {string} HTML string
     */
    renderStars(count) {
        let html = '';
        for (let i = 1; i <= 3; i++) {
            const filled = i <= count;
            html += `<span class="result-star ${filled ? 'filled' : 'empty'}">${filled ? '⭐' : '☆'}</span>`;
        }
        return html;
    },

    /**
     * Hide results screen
     */
    hide() {
        this.overlay.classList.remove('is-open');
        this.overlay.setAttribute('aria-hidden', 'true');
    },

    /**
     * Go back to main menu
     */
    goToMenu() {
        this.hide();
        exitStageMode();
        LevelSelectUI.updateMenuStars();
        startScreen.style.display = 'flex';
    },

    /**
     * Replay current stage
     */
    replayStage() {
        if (!this.currentStageId) return;

        this.hide();

        // Reset managers and restart stage
        ObstacleManager.reset();
        CollectibleManager.reset();
        ShieldManager.reset();
        SpeedBoostManager.reset();
        BonusOrbManager.reset();
        ExitBoosterManager.reset();

        // Reset track
        floorTilesNormal.forEach((tile, i) => {
            tile.position.z = i * tile.userData.length;
            tile.children.forEach(child => {
                if (child.material) {
                    child.material.opacity = 1;
                    child.material.transparent = false;
                }
            });
        });

        floorTilesRainbow.forEach((tile, i) => {
            tile.position.z = i * tile.userData.length;
            tile.visible = false;
        });

        floorTiles = floorTilesNormal;

        // Reset pillars
        const spacing = sidePillars[0]?.userData.spacing || 20;
        sidePillars.forEach((pillar, i) => {
            const pairIndex = Math.floor(i / 2);
            pillar.position.z = pairIndex * spacing;
        });

        // Start stage again
        startStage(this.currentStageId);
    },

    /**
     * Go to next stage
     */
    nextStage() {
        if (!this.currentStageId) return;

        const nextStage = getNextStage(this.currentStageId);
        if (!nextStage) return;

        this.hide();

        // Reset managers
        ObstacleManager.reset();
        CollectibleManager.reset();
        ShieldManager.reset();
        SpeedBoostManager.reset();
        BonusOrbManager.reset();
        ExitBoosterManager.reset();

        // Reset track
        floorTilesNormal.forEach((tile, i) => {
            tile.position.z = i * tile.userData.length;
            tile.children.forEach(child => {
                if (child.material) {
                    child.material.opacity = 1;
                    child.material.transparent = false;
                }
            });
        });

        floorTilesRainbow.forEach((tile, i) => {
            tile.position.z = i * tile.userData.length;
            tile.visible = false;
        });

        floorTiles = floorTilesNormal;

        // Reset pillars
        const spacing = sidePillars[0]?.userData.spacing || 20;
        sidePillars.forEach((pillar, i) => {
            const pairIndex = Math.floor(i / 2);
            pillar.position.z = pairIndex * spacing;
        });

        // Exit current stage mode state
        exitStageMode();

        // Start next stage
        startStage(nextStage.id);
    }
};

/**
 * Global function called by finish-line.js
 * This bridges the gap between Week 2 code and Week 3 UI
 * @param {number} stars - Stars earned (1-3)
 * @param {object|null} newReward - Newly unlocked reward (if any)
 */
function showStageResults(stars, newReward) {
    ResultsScreenUI.show(stars, newReward);
}
