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
     * Ensures progression data is always fresh by reloading from localStorage
     * FIX: This handles the progression bug by calling refreshStageNodes()
     * which properly updates stages that have been completed and unlocked
     */
    show() {
        // Refresh all stage nodes with latest progress data from localStorage
        // This ensures completed stages and newly unlocked stages are visible
        this.refreshStageNodes();
        // Update the total stars count in the header
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
        this.clearInfoBar();
    },

    /**
     * Clear the info bar
     */
    clearInfoBar() {
        const infoBar = document.getElementById('stage-info-bar');
        if (infoBar) {
            infoBar.textContent = '';
        }
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
     * FIX: Properly handles locked→unlocked transitions by re-rendering node HTML
     * Ensures that when a stage is completed and the next stage unlocks,
     * the UI immediately reflects these changes when the level select is shown
     */
    refreshStageNodes() {
        const progress = loadProgress();
        const nodes = this.stagePath.querySelectorAll('.stage-node');

        nodes.forEach(node => {
            const stageId = node.dataset.stageId;
            const stageData = progress.stageProgress[stageId];

            if (!stageData) return;

            // Get stage for rendering locked/unlocked content
            const stage = getStage(stageId);
            if (!stage) return;

            const isCurrentlyUnlocked = node.classList.contains('unlocked');
            const shouldBeUnlocked = stageData.unlocked;

            // If unlock state has changed, we need to update the entire node HTML
            // This is the FIX for the progression bug: when a stage transitions from
            // locked to unlocked, the node HTML needs to be completely re-rendered
            if (isCurrentlyUnlocked !== shouldBeUnlocked) {
                // Clear old event listeners by replacing the element
                const newNode = node.cloneNode(false);
                newNode.dataset.stageId = stageId;
                newNode.dataset.order = stage.order;

                if (shouldBeUnlocked) {
                    // Stage is now unlocked
                    newNode.className = 'stage-node unlocked';
                    if (stageData.completed) {
                        newNode.classList.add('completed');
                    }
                    newNode.innerHTML = `
                        <div class="node-number">${stage.order}</div>
                        <div class="node-stars">${this.renderStarsSmall(stageData.bestStars)}</div>
                    `;
                    newNode.addEventListener('click', () => this.onStageClick(stageId));
                } else {
                    // Stage is locked
                    newNode.className = 'stage-node locked';
                    newNode.innerHTML = `
                        <div class="node-lock">🔒</div>
                    `;
                    newNode.addEventListener('click', (e) => this.showLockedTooltip(stage, newNode, e));
                }

                // Replace the old node with the new one
                node.parentNode.replaceChild(newNode, node);
            } else {
                // Unlock state unchanged - just update visual state
                node.classList.toggle('completed', stageData.completed);

                // If already unlocked, update the star display
                if (shouldBeUnlocked) {
                    const starsContainer = node.querySelector('.node-stars');
                    if (starsContainer) {
                        starsContainer.innerHTML = this.renderStarsSmall(stageData.bestStars);
                    }
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
        this.clearInfoBar();
        StageInfoCardUI.show(stageId);
    },

    /**
     * Show hint for locked stage in bottom info bar
     * @param {object} stage - Stage object
     * @param {HTMLElement} node - Node element
     * @param {Event} e - Click event
     */
    showLockedTooltip(stage, node, e) {
        // Get previous stage name
        const prevStage = getStageByOrder(stage.order - 1);
        const prevStageName = prevStage ? prevStage.name : 'previous stage';

        // Display in the info bar at the bottom
        const infoBar = document.getElementById('stage-info-bar');
        if (infoBar) {
            infoBar.textContent = `Complete "${prevStageName}" to unlock`;
        }
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
