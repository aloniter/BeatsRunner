/* ========================================
   BEAT RUNNER - Stage Info Card
   Stage Mode UI: Stage details modal
   ======================================== */

/**
 * Stage Info Card UI
 * Modal card showing stage details with PLAY and BACK buttons
 */
const StageInfoCardUI = {
    overlay: null,
    currentStageId: null,

    /**
     * Initialize Stage Info Card
     */
    init() {
        this.overlay = document.getElementById('stage-info-overlay');

        // Back button
        document.getElementById('card-back-btn').addEventListener('click', () => {
            this.hide();
        });

        // Play button
        document.getElementById('card-play-btn').addEventListener('click', () => {
            this.playStage();
        });
    },

    /**
     * Show card for specific stage
     * @param {string} stageId - Stage ID
     */
    show(stageId) {
        this.currentStageId = stageId;
        const stage = getStage(stageId);
        const stageData = getStageData(stageId);

        if (!stage) {
            console.error('Stage not found:', stageId);
            return;
        }

        // Populate card
        document.getElementById('card-stage-number').textContent = stage.order;
        document.getElementById('card-stage-name').textContent = stage.name;
        document.getElementById('card-stage-description').textContent = stage.description || '';
        document.getElementById('card-distance').textContent = `${stage.distance}m`;

        // Best performance
        const best = stageData && stageData.completed ? stageData.bestStars : 0;
        const bestEl = document.getElementById('card-best-stars');
        if (stageData && stageData.completed) {
            bestEl.innerHTML = starIconsHtml(best, 3);
        } else {
            bestEl.textContent = '--';
        }

        // Star goals: icons per tier, ticked when already reached
        this.overlay.querySelectorAll('.star-goal').forEach(row => {
            const tier = Number(row.dataset.tier);
            row.querySelector('.star-tier').innerHTML = starIconsHtml(tier, tier);
            row.classList.toggle('is-done', best >= tier);
        });

        // Star requirements
        const stars = stage.stars;
        document.getElementById('card-star2-req').textContent =
            `≤${stars.star2.crashes} crashes, ${stars.star2.orbs}% orbs`;
        document.getElementById('card-star3-req').textContent =
            `≤${stars.star3.crashes} crashes, ${stars.star3.orbs}% orbs`;

        // Show overlay
        this.overlay.classList.add('is-open');
        this.overlay.setAttribute('aria-hidden', 'false');
    },

    /**
     * Hide card
     */
    hide() {
        this.overlay.classList.remove('is-open');
        this.overlay.setAttribute('aria-hidden', 'true');
    },

    /**
     * Start playing the stage
     */
    playStage() {
        this.hide();
        LevelSelectUI.hide();
        startStage(this.currentStageId);
    }
};
