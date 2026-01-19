/* ========================================
   BEAT RUNNER - Tutorial Overlay System
   Interactive guidance for first-time players
   Priority 1: Enhanced Onboarding
   ======================================== */

/**
 * Tutorial Overlay System
 * Shows contextual hints and guidance during gameplay
 * Designed for Stage 1 first-time experience
 */

const TutorialOverlay = {
    container: null,
    currentStep: 0,
    isActive: false,
    hasSeenTutorial: false,

    // Tutorial steps for Stage 1
    steps: [
        {
            id: 'welcome',
            message: 'Welcome to BeatsRunner! Let\'s learn the basics.',
            duration: 3000,
            position: 'top-center',
            showOnStart: true
        },
        {
            id: 'lane-switching',
            message: 'Use ← → Arrow Keys (or swipe) to switch lanes',
            duration: 5000,
            position: 'top-center',  // Changed to top to not block gameplay
            trigger: 'distance',
            triggerValue: 50  // Show at 50m
        },
        {
            id: 'avoid-obstacles',
            message: 'Avoid the pink barriers! They slow you down.',
            duration: 4000,
            position: 'top-center',  // Changed to top to not block gameplay
            trigger: 'distance',
            triggerValue: 150  // Show at 150m
        },
        {
            id: 'collect-orbs',
            message: 'Collect blue orbs for bonus stars! ⭐',
            duration: 4000,
            position: 'top-center',  // Changed to top to not block gameplay
            trigger: 'distance',
            triggerValue: 300  // Show at 300m
        },
        {
            id: 'goal',
            message: 'Reach the finish line to complete the stage!',
            duration: 4000,
            position: 'top-center',  // Changed to top to not block gameplay
            trigger: 'distance',
            triggerValue: 500  // Show at 500m
        }
    ],

    /**
     * Initialize tutorial system
     */
    init() {
        this.createOverlayContainer();
        this.loadTutorialState();
    },

    /**
     * Create the overlay container element
     */
    createOverlayContainer() {
        if (this.container) return;

        this.container = document.createElement('div');
        this.container.id = 'tutorial-overlay';
        this.container.className = 'tutorial-overlay';
        this.container.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
            z-index: 999;
            display: none;
        `;

        document.body.appendChild(this.container);
    },

    /**
     * Load tutorial state from storage
     */
    loadTutorialState() {
        const tutorialData = Storage.getJSON('tutorial-completed', null);
        this.hasSeenTutorial = tutorialData && tutorialData['stage-1-intro'];
    },

    /**
     * Save tutorial completion state
     */
    saveTutorialState(stageId) {
        const tutorialData = Storage.getJSON('tutorial-completed', {});
        tutorialData[stageId] = true;
        Storage.setJSON('tutorial-completed', tutorialData);
        this.hasSeenTutorial = true;
    },

    /**
     * Start tutorial for a stage
     * @param {string} stageId - Stage ID
     */
    start(stageId) {
        // Only show tutorial for Stage 1 on first playthrough
        if (stageId !== 'stage-1-intro' || this.hasSeenTutorial) {
            return;
        }

        this.isActive = true;
        this.currentStep = 0;
        this.container.style.display = 'block';

        // Show first step immediately
        const firstStep = this.steps[0];
        if (firstStep.showOnStart) {
            this.showStep(firstStep);
        }

        console.log('Tutorial started for', stageId);
    },

    /**
     * Update tutorial (called from game loop)
     * @param {number} distance - Current distance traveled
     * @param {number} crashes - Current crash count
     * @param {number} orbs - Current orbs collected
     */
    update(distance, crashes, orbs) {
        if (!this.isActive) return;

        // Check if we should trigger next step
        const nextStep = this.steps[this.currentStep + 1];
        if (!nextStep) return;

        // Check trigger condition
        if (nextStep.trigger === 'distance' && distance >= nextStep.triggerValue) {
            this.currentStep++;
            this.showStep(nextStep);
        }
    },

    /**
     * Show a tutorial step
     * @param {object} step - Tutorial step configuration
     */
    showStep(step) {
        // Create step element
        const stepElement = document.createElement('div');
        stepElement.className = `tutorial-step tutorial-step-${step.position}`;
        stepElement.innerHTML = `
            <div class="tutorial-message">
                <div class="tutorial-text">${step.message}</div>
            </div>
        `;

        // Position styles
        const positionStyles = this.getPositionStyles(step.position);
        stepElement.style.cssText = `
            position: absolute;
            ${positionStyles}
            pointer-events: auto;
            animation: tutorial-fade-in 0.5s ease-out;
        `;

        // Add to container
        this.container.appendChild(stepElement);

        // Auto-hide after duration
        setTimeout(() => {
            stepElement.style.animation = 'tutorial-fade-out 0.5s ease-out';
            setTimeout(() => {
                if (stepElement.parentNode) {
                    stepElement.parentNode.removeChild(stepElement);
                }
            }, 500);
        }, step.duration);

        console.log('Tutorial step shown:', step.id);
    },

    /**
     * Get CSS position styles for step position
     * @param {string} position - Position identifier
     * @returns {string} CSS position styles
     */
    getPositionStyles(position) {
        switch (position) {
            case 'top-center':
                // Position below the main HUD (Distance/Orbs/Hits at top)
                // Account for safe area insets on mobile
                return 'top: calc(90px + var(--safe-area-inset-top, 0px)); left: 50%; transform: translateX(-50%);';
            case 'middle-center':
                return 'top: 50%; left: 50%; transform: translate(-50%, -50%);';
            case 'bottom-center':
                return 'bottom: calc(80px + var(--safe-area-inset-bottom, 0px)); left: 50%; transform: translateX(-50%);';
            default:
                return 'top: calc(90px + var(--safe-area-inset-top, 0px)); left: 50%; transform: translateX(-50%);';
        }
    },

    /**
     * Stop tutorial (when stage ends)
     * @param {string} stageId - Stage ID
     */
    stop(stageId) {
        if (!this.isActive) return;

        this.isActive = false;
        this.container.style.display = 'none';
        this.container.innerHTML = ''; // Clear all steps

        // Save completion
        if (stageId === 'stage-1-intro') {
            this.saveTutorialState(stageId);
        }

        console.log('Tutorial stopped');
    },

    /**
     * Skip tutorial (user option)
     */
    skip() {
        if (!this.isActive) return;

        this.isActive = false;
        this.container.style.display = 'none';
        this.container.innerHTML = '';

        console.log('Tutorial skipped');
    },

    /**
     * Reset tutorial state (for testing/development)
     */
    reset() {
        Storage.remove('tutorial-completed');
        this.hasSeenTutorial = false;
        console.log('Tutorial state reset');
    }
};

// Initialize on load
if (typeof window !== 'undefined') {
    window.addEventListener('load', () => {
        TutorialOverlay.init();
    });
}
