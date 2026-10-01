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
    unlockedNext: false,

    /**
     * Initialize Results Screen
     */
    init() {
        this.overlay = document.getElementById('results-overlay');

        // Distant skyline art shared by the results screen and the stage info card
        document.querySelectorAll('.rs-skyline').forEach(el => {
            el.innerHTML = NeonDistrictMap.skyline(560, 190);
        });

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
     * @param {boolean} unlockedNext - True if this run unlocked the next stage
     * @param {{completed: boolean, bestStars: number}|null} previousBest - Best before this run
     */
    show(stars, newReward = null, unlockedNext = false, previousBest = null) {
        this.starsEarned = stars;
        this.unlockedNext = unlockedNext;
        this.currentStageId = GameState.currentStage ? GameState.currentStage.id : null;

        const stage = GameState.currentStage;
        if (!stage) {
            console.error('No current stage for results!');
            return;
        }

        const orbPercent = stage.totalOrbs > 0
            ? Math.round((GameState.orbsCollected / stage.totalOrbs) * 100)
            : 0;
        const crashes = GameState.crashes;

        // Header: stage name, message, stars, badge
        document.getElementById('results-stage-name').textContent =
            `Stage ${stage.order} \u00b7 ${stage.name}`;
        document.getElementById('results-message').textContent = this.getStarMessage(stars);
        document.getElementById('results-stars').innerHTML = this.renderStars(stars);

        const badge = document.getElementById('results-badge');
        const prev = previousBest || { completed: true, bestStars: stars };
        let badgeText = '';
        if (!prev.completed) badgeText = 'FIRST CLEAR!';
        else if (stars > prev.bestStars) badgeText = 'NEW BEST!';
        badge.textContent = badgeText;
        badge.hidden = !badgeText;

        // Stats
        document.getElementById('results-orbs').textContent =
            `${GameState.orbsCollected}/${stage.totalOrbs}`;
        document.getElementById('results-orbs-pct').textContent = `${orbPercent}%`;
        this.renderOrbMeter(orbPercent, stage);
        document.getElementById('results-crashes').textContent = crashes;
        document.getElementById('results-crashes-sub').textContent =
            crashes === 0 ? 'No hits!' : (stars < 3 ? `max ${stage.stars.star3.crashes} for \u2605\u2605\u2605` : '');

        // Improvement tip
        const tip = this.getImprovementTip(stars, crashes, orbPercent, stage);
        const tipEl = document.getElementById('results-tip');
        if (tip) {
            tipEl.textContent = tip;
            tipEl.classList.add('is-visible');
        } else {
            tipEl.classList.remove('is-visible');
        }

        // Total progress: bar fills from where it was before this run
        const summary = getProgressSummary();
        const gain = prev.completed ? Math.max(0, stars - prev.bestStars) : stars;
        const beforePct = Math.max(0, ((summary.totalStars - gain) / summary.maxStars) * 100);
        const afterPct = (summary.totalStars / summary.maxStars) * 100;
        const fill = document.getElementById('results-progress-fill');
        fill.style.transition = 'none';
        fill.style.width = `${beforePct}%`;
        void fill.offsetWidth;
        fill.style.transition = '';
        requestAnimationFrame(() => { fill.style.width = `${afterPct}%`; });
        document.getElementById('results-progress-text').textContent =
            `${summary.totalStars}/${summary.maxStars}`;
        const gainEl = document.getElementById('results-progress-gain');
        gainEl.textContent = `+${gain}`;
        gainEl.hidden = gain <= 0;

        // Next button visibility (last stage: REPLAY becomes the main action)
        const nextStage = getNextStage(stage.id);
        const nextBtn = document.getElementById('results-next-btn');
        document.getElementById('results-buttons').classList.toggle('is-last', !nextStage);
        if (nextStage) {
            nextBtn.style.display = '';
            nextBtn.textContent = 'NEXT STAGE';
        } else {
            nextBtn.style.display = 'none'; // Last stage
        }

        // Hide game UI
        hud.style.display = 'none';
        if (typeof StageHudUI !== 'undefined') StageHudUI.hide();
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
     * Say exactly what is missing for the next star
     * @param {number} stars - Stars earned
     * @param {number} crashes - Crash count
     * @param {number} orbPercent - Orb collection percentage
     * @param {object} stage - Stage object
     * @returns {string|null} Improvement tip or null if 3 stars
     */
    getImprovementTip(stars, crashes, orbPercent, stage) {
        if (stars >= 3) return null;

        const target = stars <= 1 ? stage.stars.star2 : stage.stars.star3;
        const glyphs = stars <= 1 ? '\u2605\u2605' : '\u2605\u2605\u2605';
        const parts = [];

        const needOrbs = Math.ceil((target.orbs / 100) * stage.totalOrbs) - GameState.orbsCollected;
        if (needOrbs > 0) {
            parts.push(`collect ${needOrbs} more orb${needOrbs === 1 ? '' : 's'}`);
        }
        if (crashes > target.crashes) {
            parts.push(target.crashes === 0
                ? 'finish without crashing'
                : `crash ${target.crashes} time${target.crashes === 1 ? '' : 's'} or less`);
        }
        return parts.length
            ? `For ${glyphs}: ${parts.join(' and ')}`
            : 'Keep practicing to improve your score!';
    },

    /**
     * Orb meter with the 2-star / 3-star thresholds marked
     */
    renderOrbMeter(orbPercent, stage) {
        const pct = Math.max(0, Math.min(100, orbPercent));
        const fill = document.getElementById('results-orb-fill');
        fill.style.transition = 'none';
        fill.style.width = '0%';
        void fill.offsetWidth;
        fill.style.transition = '';
        requestAnimationFrame(() => { fill.style.width = `${pct}%`; });

        const t2 = stage.stars.star2.orbs;
        const t3 = stage.stars.star3.orbs;
        const tick2 = document.getElementById('results-tick2');
        const tick3 = document.getElementById('results-tick3');
        tick2.style.left = `${t2}%`;
        tick3.style.left = `${t3}%`;
        tick2.classList.toggle('is-met', orbPercent >= t2);
        tick3.classList.toggle('is-met', orbPercent >= t3);
    },

    /**
     * Render star display (three big SVG stars, earned ones filled)
     * @param {number} count - Stars earned (1-3)
     * @returns {string} HTML string
     */
    renderStars(count) {
        let html = '';
        for (let i = 1; i <= 3; i++) {
            const filled = i <= count;
            html += `<span class="result-star ${filled ? 'filled' : 'empty'}" style="--i:${i - 1}">${starIconSvg()}</span>`;
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

        // Let the map celebrate the new stage the next time it opens
        const next = this.currentStageId ? getNextStage(this.currentStageId) : null;
        if (this.unlockedNext && next) {
            LevelSelectUI.pendingAdvance = { fromId: this.currentStageId, toId: next.id, unlock: true };
        }

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
        resetTrackAndPillars();

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

        const startNext = () => {
            LevelSelectUI.hide();

            // Reset managers
            ObstacleManager.reset();
            CollectibleManager.reset();
            ShieldManager.reset();
            SpeedBoostManager.reset();
            BonusOrbManager.reset();
            ExitBoosterManager.reset();

            // Reset track
            resetTrackAndPillars();

            // Exit current stage mode state
            exitStageMode();

            // Start next stage
            startStage(nextStage.id);
        };

        // Walk the path on the Neon District map to the next stage, then start it
        // (skips straight to startNext when Reduced Motion is on)
        LevelSelectUI.playAdvance(this.currentStageId, nextStage.id, {
            unlock: this.unlockedNext,
            onDone: startNext
        });
    }
};

/**
 * One star as inline SVG (colour comes from CSS: .is-on / .is-off or the parent)
 * @returns {string} SVG markup
 */
function starIconSvg() {
    return '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M12 2.4l2.95 6.1 6.7.95-4.85 4.7 1.15 6.65L12 17.45 6.05 20.6 7.2 13.95 2.35 9.25l6.7-.95z" stroke-linejoin="round"/></svg>';
}

/**
 * A row of small stars, `count` of `max` filled
 * @param {number} count - Filled stars
 * @param {number} max - Total stars shown
 * @returns {string} HTML string
 */
function starIconsHtml(count, max = 3) {
    let html = '<span class="star-icons" aria-label="' + count + ' of ' + max + ' stars">';
    for (let i = 0; i < max; i++) {
        html += '<span class="star-icon ' + (i < count ? 'is-on' : 'is-off') + '">' + starIconSvg() + '</span>';
    }
    return html + '</span>';
}

/**
 * Global function called by finish-line.js
 * This bridges the gap between Week 2 code and Week 3 UI
 * @param {number} stars - Stars earned (1-3)
 * @param {object|null} newReward - Newly unlocked reward (if any)
 * @param {boolean} unlockedNext - True if this run unlocked the next stage
 * @param {{completed: boolean, bestStars: number}|null} previousBest - Best before this run
 */
function showStageResults(stars, newReward, unlockedNext, previousBest) {
    ResultsScreenUI.show(stars, newReward, unlockedNext, previousBest);
}
