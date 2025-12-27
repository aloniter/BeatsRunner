/* ========================================
   BEAT RUNNER - Level Select Screen
   Stage Mode UI: Stage progression path
   ======================================== */

/**
 * Level Select UI
 * Displays 15 stage nodes in a connected path
 * Handles stage selection and navigation
 */
const LevelSelectUI = {
    overlay: null,
    stagePath: null,
    selectedStageId: null,

    /**
     * Initialize Level Select screen
     */
    init() {
        this.overlay = document.getElementById('level-select-overlay');
        this.stagePath = document.getElementById('stage-path');

        // Back button
        document.getElementById('level-select-back').addEventListener('click', () => {
            this.hide();
            startScreen.style.display = 'flex';
        });

        // Initial render
        this.renderStageNodes();
    },

    /**
     * Show Level Select screen
     */
    show() {
        this.refreshStageNodes();
        this.updateTotalStars();
        this.overlay.classList.add('is-open');
        this.overlay.setAttribute('aria-hidden', 'false');
    },

    /**
     * Hide Level Select screen
     */
    hide() {
        this.overlay.classList.remove('is-open');
        this.overlay.setAttribute('aria-hidden', 'true');
    },

    /**
     * Render 15 stage nodes as connected path
     */
    renderStageNodes() {
        const stages = getAllStages();
        const progress = loadProgress();

        this.stagePath.innerHTML = '';

        stages.forEach((stage, index) => {
            const stageData = progress.stageProgress[stage.id];
            const isUnlocked = stageData ? stageData.unlocked : false;
            const isCompleted = stageData ? stageData.completed : false;
            const bestStars = stageData ? stageData.bestStars : 0;

            const node = document.createElement('div');
            node.className = 'stage-node';
            node.classList.add(isUnlocked ? 'unlocked' : 'locked');
            if (isCompleted) {
                node.classList.add('completed');
            }
            node.dataset.stageId = stage.id;
            node.dataset.order = stage.order;

            if (isUnlocked) {
                node.innerHTML = `
                    <div class="node-number">${stage.order}</div>
                    <div class="node-stars">${this.renderStarsSmall(bestStars)}</div>
                `;
                node.addEventListener('click', () => this.onStageClick(stage.id));
            } else {
                node.innerHTML = `
                    <div class="node-lock">🔒</div>
                `;
                node.addEventListener('click', (e) => this.showLockedTooltip(stage, node, e));
            }

            this.stagePath.appendChild(node);

            // Add connector line (except for last node)
            if (index < stages.length - 1) {
                const connector = document.createElement('div');
                connector.className = 'stage-connector';
                this.stagePath.appendChild(connector);
            }
        });
    },

    /**
     * Refresh node states without full re-render
     */
    refreshStageNodes() {
        const progress = loadProgress();
        const nodes = this.stagePath.querySelectorAll('.stage-node');

        nodes.forEach(node => {
            const stageId = node.dataset.stageId;
            const stageData = progress.stageProgress[stageId];

            if (!stageData) return;

            // Update classes
            node.classList.toggle('unlocked', stageData.unlocked);
            node.classList.toggle('locked', !stageData.unlocked);
            node.classList.toggle('completed', stageData.completed);

            // Update content for unlocked nodes
            if (stageData.unlocked) {
                const starsContainer = node.querySelector('.node-stars');
                if (starsContainer) {
                    starsContainer.innerHTML = this.renderStarsSmall(stageData.bestStars);
                }
            }
        });
    },

    /**
     * Render mini star display for node
     * @param {number} count - Star count (0-3)
     * @returns {string} Star emoji string
     */
    renderStarsSmall(count) {
        if (count === 0) return '';
        return '⭐'.repeat(count);
    },

    /**
     * Handle click on unlocked stage
     * @param {string} stageId - Stage ID
     */
    onStageClick(stageId) {
        this.selectedStageId = stageId;
        StageInfoCardUI.show(stageId);
    },

    /**
     * Show tooltip for locked stage
     * @param {object} stage - Stage object
     * @param {HTMLElement} node - Node element
     * @param {Event} e - Click event
     */
    showLockedTooltip(stage, node, e) {
        // Remove existing tooltips
        const existingTooltip = node.querySelector('.locked-tooltip');
        if (existingTooltip) {
            existingTooltip.remove();
            return;
        }

        // Get previous stage name
        const prevStage = getStageByOrder(stage.order - 1);
        const prevStageName = prevStage ? prevStage.name : 'previous stage';

        // Create tooltip
        const tooltip = document.createElement('div');
        tooltip.className = 'locked-tooltip';
        tooltip.textContent = `Complete "${prevStageName}" to unlock`;
        node.appendChild(tooltip);

        // Remove after 2 seconds
        setTimeout(() => {
            if (tooltip.parentNode) {
                tooltip.remove();
            }
        }, 2000);
    },

    /**
     * Update total stars display in header
     */
    updateTotalStars() {
        const summary = getProgressSummary();
        document.getElementById('level-select-total-stars').textContent = summary.totalStars;
    },

    /**
     * Update main menu stars display
     */
    updateMenuStars() {
        const summary = getProgressSummary();
        const menuStarsEl = document.getElementById('menu-total-stars');
        if (menuStarsEl) {
            menuStarsEl.textContent = summary.totalStars;
        }
    }
};
