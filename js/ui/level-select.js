/* ========================================
   BEAT RUNNER - Level Select Screen
   Stage Mode UI: Neon District map
   ======================================== */

/**
 * Level Select UI
 * Displays the stage nodes along a path through the Neon District
 * (scenery comes from NeonDistrictMap; state comes from stage progress)
 * Handles stage selection and navigation
 */
const LevelSelectUI = {
    overlay: null,
    panel: null,
    stagePath: null,
    selectedStageId: null,
    qaMode: false,

    // Stage-to-stage transition: { fromId, toId, unlock, onDone } waiting for show(),
    // and the running one (with its timers)
    pendingAdvance: null,
    _advance: null,

    _layoutKey: '',
    _scrollRaf: 0,
    _resizeRaf: 0,

    /**
     * Initialize Level Select screen
     */
    init() {
        this.overlay = document.getElementById('level-select-overlay');
        this.panel = this.overlay.querySelector('.level-select-panel');
        this.stagePath = document.getElementById('stage-path');
        this.sky = this.overlay.querySelector('.ls-sky');

        const skyline = document.getElementById('ls-sky-skyline');
        if (skyline) skyline.innerHTML = NeonDistrictMap.skyline(560, 190);

        // Back button
        document.getElementById('level-select-back').addEventListener('click', () => {
            this.hide();
            startScreen.style.display = 'flex';
        });

        // One delegated handler for every node (nodes are re-rendered freely)
        this.stagePath.addEventListener('click', (e) => {
            const node = e.target.closest('.stage-node');
            if (!node) return;
            const stage = getStage(node.dataset.stageId);
            if (!stage) return;
            if (node.classList.contains('locked')) {
                this.showLockedTooltip(stage, node, e);
            } else {
                if (typeof hapticFeedback !== 'undefined') hapticFeedback.impact('light');
                this.onStageClick(stage.id);
            }
        });

        // Tap anywhere during the transition to skip it
        document.getElementById('ls-skip').addEventListener('click', () => this.finishAdvance(true));

        // Parallax: far skyline drifts slower than the map
        this.stagePath.addEventListener('scroll', () => {
            if (this._scrollRaf) return;
            this._scrollRaf = requestAnimationFrame(() => {
                this._scrollRaf = 0;
                this.updateParallax();
            });
        }, { passive: true });

        // Re-layout on rotation / resize while open
        if (typeof ResizeObserver !== 'undefined') {
            new ResizeObserver(() => {
                if (!this.isOpen() || this._resizeRaf) return;
                this._resizeRaf = requestAnimationFrame(() => {
                    this._resizeRaf = 0;
                    const key = this.getLayoutKey();
                    if (key !== this._layoutKey) this.renderStageNodes();
                });
            }).observe(this.panel);
        }

        // QA Unlock Toggle Button
        this.createQAToggle();

        // Initial render
        this.renderStageNodes();
    },

    isOpen() {
        return this.overlay.classList.contains('is-open');
    },

    prefersReducedMotion() {
        return window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    },

    /**
     * Create and inject QA toggle button
     */
    createQAToggle() {
        const host = document.getElementById('ls-header-sub') || this.panel;
        if (!host) return;

        const qaBtn = document.createElement('button');
        qaBtn.id = 'qa-unlock-btn';
        qaBtn.type = 'button';
        qaBtn.className = 'ls-qa-btn';
        qaBtn.textContent = '🔒 QA: Default';
        qaBtn.setAttribute('aria-pressed', 'false');

        qaBtn.addEventListener('click', () => this.toggleQAMode(qaBtn));
        host.appendChild(qaBtn);
    },

    /**
     * Toggle QA Mode
     * @param {HTMLElement} btn - Button element
     */
    toggleQAMode(btn) {
        this.qaMode = !this.qaMode;

        btn.textContent = this.qaMode ? '🔓 QA: Unlocked' : '🔒 QA: Default';
        btn.classList.toggle('is-active', this.qaMode);
        btn.setAttribute('aria-pressed', String(this.qaMode));

        // Refresh UI to reflect new state
        this.refreshStageNodes();
    },

    /**
     * Show Level Select screen
     * Ensures progression data is always fresh by reloading from localStorage
     */
    show() {
        this.overlay.classList.add('is-open');
        this.overlay.setAttribute('aria-hidden', 'false');

        // Render after opening so the map can measure the screen.
        // Re-reading progress here keeps newly completed/unlocked stages in sync.
        const advance = this.pendingAdvance;
        this.pendingAdvance = null;
        const advancing = !!advance && !this.prefersReducedMotion() && this.startAdvance(advance);
        if (!advancing) {
            this.refreshStageNodes();
            this.scrollToCurrent();
            if (advance && advance.onDone) advance.onDone();
        }
        // Update the total stars count in the header
        this.updateTotalStars();

        if (!this.prefersReducedMotion()) {
            this.overlay.classList.remove('ls-entering');
            void this.overlay.offsetWidth; // restart entrance animation
            this.overlay.classList.add('ls-entering');
            clearTimeout(this._enterTimer);
            this._enterTimer = setTimeout(() => this.overlay.classList.remove('ls-entering'), 1400);
        }
    },

    /**
     * Hide Level Select screen
     */
    hide() {
        this.cancelAdvance();
        this.overlay.classList.remove('is-open', 'ls-entering');
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
     * Resolve display state for every stage from saved progress
     * @returns {Array<{stage, isUnlocked, isCompleted, bestStars, isCurrent}>}
     */
    getStageStates() {
        const stages = getAllStages();
        const progress = loadProgress();

        const states = stages.map(stage => {
            const stageData = progress.stageProgress[stage.id];
            // QA Mode overrides unlocked state
            const isUnlocked = this.qaMode || (stageData ? stageData.unlocked : false);
            return {
                stage,
                isUnlocked,
                isCompleted: stageData ? stageData.completed : false,
                bestStars: stageData ? stageData.bestStars : 0,
                isCurrent: false
            };
        });

        // "Current" = first playable stage not yet completed (the frontier)
        const current = states.find(s => s.isUnlocked && !s.isCompleted);
        if (current) current.isCurrent = true;
        return states;
    },

    getLayoutKey() {
        return `${this.stagePath.clientWidth}x${this.stagePath.clientHeight}`;
    },

    /**
     * Render the district map and all stage nodes
     * @param {{from: number, to: number, unlock: boolean}|null} advance - draw the "before"
     *   state of a stage-to-stage transition (path lit up to `from`, `to` still locked)
     */
    renderStageNodes(advance = null) {
        const width = this.stagePath.clientWidth;
        const height = this.stagePath.clientHeight;
        // Hidden overlays have no size; show() renders again once visible
        if (!width || !height) return;

        const states = this.getStageStates();
        const header = this.overlay.querySelector('.ls-header');
        const infoBar = document.getElementById('stage-info-bar');
        const panelRect = this.panel.getBoundingClientRect();
        const topInset = header ? header.getBoundingClientRect().bottom - panelRect.top : 0;
        const bottomInset = infoBar ? panelRect.bottom - infoBar.getBoundingClientRect().top + 8 : 0;

        const layout = NeonDistrictMap.computeLayout({
            width, viewportHeight: height, topInset, bottomInset, count: states.length
        });
        this.layout = layout;
        this._layoutKey = this.getLayoutKey();

        // Path lights up to the furthest playable stage; the spark runs one step beyond it
        let lastUnlocked = 0;
        states.forEach((s, i) => { if (s.isUnlocked) lastUnlocked = i; });
        const currentIndex = states.findIndex(s => s.isCurrent);
        const sparkTo = (currentIndex >= 0 ? currentIndex : lastUnlocked) + 1;

        const scene = NeonDistrictMap.render(layout, { litUntil: lastUnlocked, sparkTo, advance });

        const world = document.createElement('div');
        world.className = 'ls-world';
        world.style.height = `${layout.H}px`;
        world.style.setProperty('--n', `${layout.N}px`);
        world.innerHTML = scene.svg;

        scene.lanterns.forEach((l, i) => {
            const el = document.createElement('span');
            el.className = 'ls-lantern';
            el.style.left = `${l.x}px`;
            el.style.top = `${l.y}px`;
            el.style.setProperty('--s', l.size);
            el.style.animationDelay = `${-(i * 0.7)}s`;
            world.appendChild(el);
        });

        if (scene.spark && !this.prefersReducedMotion() && window.CSS && CSS.supports('offset-path', "path('M 0 0 L 1 1')")) {
            const spark = document.createElement('span');
            spark.className = advance ? 'ls-spark ls-spark--advance' : 'ls-spark';
            spark.style.offsetPath = `path('${scene.spark}')`;
            if (!advance) {
                const probe = world.querySelector('svg');
                const length = this.measurePath(probe, scene.spark);
                spark.style.animationDuration = `${Math.max(1.8, length / 150).toFixed(2)}s`;
            }
            world.appendChild(spark);
        }

        states.forEach((state, index) => {
            const arriving = !!(advance && advance.unlock && index === advance.to);
            world.appendChild(this.createNode(state, layout.positions[index], index, arriving));
        });

        this.stagePath.innerHTML = '';
        this.stagePath.appendChild(world);
        this.updateParallax();
    },

    /**
     * Refresh node states (full re-render keeps locked→unlocked transitions correct)
     */
    refreshStageNodes() {
        this.renderStageNodes();
    },

    /**
     * Build one stage node button
     */
    createNode({ stage, isUnlocked, isCompleted, bestStars, isCurrent }, pos, index, arriving = false) {
        const node = document.createElement('button');
        node.type = 'button';
        node.className = 'stage-node';
        node.classList.add(isUnlocked ? 'unlocked' : 'locked');
        if (isCompleted) node.classList.add('completed');
        if (isCurrent) node.classList.add('current');
        node.dataset.stageId = stage.id;
        node.dataset.order = stage.order;
        node.style.left = `${pos.x}px`;
        node.style.top = `${pos.y}px`;
        node.style.setProperty('--i', index);

        if (isUnlocked) {
            node.setAttribute('aria-label', `Stage ${stage.order}: ${stage.name}${isCompleted ? `, ${bestStars} of 3 stars` : ''}`);
            if (isCurrent) node.setAttribute('aria-current', 'step');
            const showStars = isCompleted || bestStars > 0;
            node.innerHTML = `
                ${isCurrent ? '<span class="node-aura" aria-hidden="true"></span>' : ''}
                <span class="node-plinth" aria-hidden="true"></span>
                <span class="node-face"><span class="node-number">${stage.order}</span></span>
                ${showStars ? `<span class="node-stars" aria-hidden="true">${this.renderStarsSmall(bestStars)}</span>` : ''}
            `;
            if (arriving) {
                // Locked-looking lid that breaks away when the spark arrives
                node.classList.add('is-arriving');
                node.insertAdjacentHTML('beforeend',
                    `<span class="node-ghost" aria-hidden="true"><span class="node-lock">${this.lockIcon()}</span></span>`);
            }
        } else {
            node.setAttribute('aria-label', `Stage ${stage.order}: locked`);
            node.setAttribute('aria-disabled', 'true');
            node.innerHTML = `
                <span class="node-plinth" aria-hidden="true"></span>
                <span class="node-face"><span class="node-lock" aria-hidden="true">${this.lockIcon()}</span></span>
            `;
        }
        return node;
    },

    lockIcon() {
        return `<svg viewBox="0 0 32 32" aria-hidden="true" focusable="false">
            <defs>
                <linearGradient id="lk-body" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffe7a0"/><stop offset="0.45" stop-color="#f2b640"/><stop offset="1" stop-color="#a8650f"/></linearGradient>
                <linearGradient id="lk-shackle" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#8a5a1a"/><stop offset="0.4" stop-color="#f7d27a"/><stop offset="1" stop-color="#8a5a1a"/></linearGradient>
            </defs>
            <path d="M10 14V10.5a6 6 0 0 1 12 0V14" fill="none" stroke="#3a2306" stroke-width="5" stroke-linecap="round"/>
            <path d="M10 14V10.5a6 6 0 0 1 12 0V14" fill="none" stroke="url(#lk-shackle)" stroke-width="3" stroke-linecap="round"/>
            <rect x="6" y="13" width="20" height="16" rx="3.5" fill="url(#lk-body)" stroke="#5c3608" stroke-width="1.2"/>
            <rect x="7.5" y="14.2" width="17" height="2.2" rx="1.1" fill="#fff6cf" opacity="0.55"/>
            <circle cx="16" cy="20.5" r="2.4" fill="#4a2a05"/>
            <path d="M15 21.5h2l.6 4h-3.2z" fill="#4a2a05"/>
        </svg>`;
    },

    /**
     * Render mini star display for node
     * @param {number} count - Star count (0-3)
     * @returns {string} Star markup (3 slots, earned ones filled)
     */
    renderStarsSmall(count) {
        let out = '';
        for (let i = 0; i < 3; i++) {
            out += `<svg class="node-star${i < count ? ' is-earned' : ''}" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M12 2.5l2.9 6 6.6.9-4.8 4.6 1.2 6.6L12 17.4l-5.9 3.2 1.2-6.6L2.5 9.4l6.6-.9z"/></svg>`;
        }
        return out;
    },

    measurePath(svg, d) {
        if (!svg || !d) return 0;
        try {
            const p = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            p.setAttribute('d', d);
            svg.appendChild(p);
            const len = p.getTotalLength();
            p.remove();
            return len;
        } catch (e) {
            return 0;
        }
    },

    /**
     * Bring the current stage into view (instant: happens while opening)
     */
    scrollToCurrent() {
        const node = this.stagePath.querySelector('.stage-node.current') ||
            [...this.stagePath.querySelectorAll('.stage-node.unlocked')].pop();
        if (!node || !this.layout) return;
        const y = parseFloat(node.style.top) || 0;
        const view = this.stagePath.clientHeight;
        const max = this.stagePath.scrollHeight - view;
        this.stagePath.scrollTop = Math.max(0, Math.min(max, y - view * 0.5));
        this.updateParallax();
    },

    updateParallax() {
        if (!this.sky || this.prefersReducedMotion()) return;
        const y = -this.stagePath.scrollTop * 0.35;
        this.sky.style.transform = `translate3d(0, ${y.toFixed(1)}px, 0)`;
    },

    // ---------- Stage-to-stage transition ----------
    // Timeline (ms) mirrors the animation delays in css/level-select.css:
    // 0-500 map settles, 500-1400 spark runs the new path segment, 1350 lock breaks,
    // 1700 the stage ignites, 2700 hand over to the next stage.
    ADVANCE_UNLOCK_MS: 1350,
    ADVANCE_DONE_MS: 2700,

    /**
     * Walk the path from a finished stage to the next one.
     * Opens the map, plays the transition, then calls onDone (e.g. to start the stage).
     * With Reduced Motion the map is skipped and onDone runs immediately.
     * @param {string} fromId - Stage just finished
     * @param {string} toId - Stage to move to
     * @param {{unlock?: boolean, onDone?: Function}} opts - unlock: play the unlock burst
     */
    playAdvance(fromId, toId, { unlock = true, onDone = null } = {}) {
        if (this.prefersReducedMotion()) {
            if (onDone) onDone();
            return;
        }
        this.pendingAdvance = { fromId, toId, unlock, onDone };
        this.show();
    },

    /**
     * Render the "before" state and start the timeline
     * @returns {boolean} False if the transition can't run (caller falls back)
     */
    startAdvance({ fromId, toId, unlock, onDone }) {
        const stages = getAllStages();
        const from = stages.findIndex(s => s.id === fromId);
        const to = stages.findIndex(s => s.id === toId);
        if (from < 0 || to !== from + 1) return false;

        this.renderStageNodes({ from, to, unlock });
        if (!this.layout || !this.layout.positions[to]) return false;

        const next = stages[to];
        const infoBar = document.getElementById('stage-info-bar');
        if (infoBar) infoBar.textContent = `Stage ${stages[from].order} complete!`;

        // Frame both nodes
        const mid = (this.layout.positions[from].y + this.layout.positions[to].y) / 2;
        const view = this.stagePath.clientHeight;
        const max = Math.max(0, this.stagePath.scrollHeight - view);
        this.stagePath.scrollTop = Math.max(0, Math.min(max, mid - view * 0.5));
        this.updateParallax();

        const timers = [];
        this._advance = { fromId, toId, onDone, timers };
        this.overlay.classList.add('ls-advancing');
        void this.overlay.offsetWidth; // commit the "before" state, then run
        this.overlay.classList.add('ls-advance-run');

        timers.push(setTimeout(() => {
            if (infoBar) infoBar.textContent = unlock
                ? `Stage ${next.order} unlocked: ${next.name}`
                : `Next up: Stage ${next.order}, ${next.name}`;
            if (unlock && typeof hapticFeedback !== 'undefined') hapticFeedback.impact('medium');
        }, this.ADVANCE_UNLOCK_MS));
        timers.push(setTimeout(() => this.finishAdvance(true), this.ADVANCE_DONE_MS));
        return true;
    },

    /**
     * End the transition (timer or tap-to-skip)
     * @param {boolean} runCallback - Call onDone (otherwise just settle the map)
     */
    finishAdvance(runCallback) {
        const adv = this._advance;
        if (!adv) return;
        this._advance = null;
        adv.timers.forEach(clearTimeout);
        this.overlay.classList.remove('ls-advancing', 'ls-advance-run');
        this.clearInfoBar();

        if (runCallback && adv.onDone) {
            adv.onDone();
        } else {
            this.renderStageNodes();
            this.scrollToCurrent();
        }
    },

    /**
     * Abort without running onDone (screen is being hidden)
     */
    cancelAdvance() {
        const adv = this._advance;
        if (!adv) return;
        this._advance = null;
        adv.timers.forEach(clearTimeout);
        this.overlay.classList.remove('ls-advancing', 'ls-advance-run');
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

        // Small "nope" shake on the locked node
        node.classList.remove('is-denied');
        void node.offsetWidth;
        node.classList.add('is-denied');
    },

    /**
     * Update total stars display in header
     */
    updateTotalStars() {
        const summary = getProgressSummary();
        document.getElementById('level-select-total-stars').textContent = summary.totalStars;
        const maxEl = document.getElementById('level-select-max-stars');
        if (maxEl && summary.maxStars) maxEl.textContent = summary.maxStars;
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
