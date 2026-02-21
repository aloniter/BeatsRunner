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
            position: 'top-center',
            trigger: 'distance',
            triggerValue: 50
        },
        {
            id: 'avoid-obstacles',
            message: 'Avoid the pink barriers! They slow you down.',
            duration: 4000,
            position: 'top-center',
            trigger: 'distance',
            triggerValue: 150
        },
        {
            id: 'collect-orbs',
            message: 'Collect blue orbs for bonus stars!',
            duration: 4000,
            position: 'top-center',
            trigger: 'distance',
            triggerValue: 300
        },
        {
            id: 'goal',
            message: 'Reach the finish line to complete the stage!',
            duration: 4000,
            position: 'top-center',
            trigger: 'distance',
            triggerValue: 500
        }
    ],

    // Tutorial steps for Free Run (first time)
    freeRunSteps: [
        {
            id: 'freerun-welcome',
            message: 'Use ← → to switch lanes, Space/Up to jump',
            duration: 4000,
            position: 'top-center',
            showOnStart: true
        },
        {
            id: 'freerun-orbs',
            message: 'Collect orbs to earn currency for the store!',
            duration: 3500,
            position: 'top-center',
            trigger: 'distance',
            triggerValue: 80
        },
        {
            id: 'freerun-lives',
            message: 'You have 3 lives - dodge obstacles to survive!',
            duration: 3500,
            position: 'top-center',
            trigger: 'distance',
            triggerValue: 180
        },
        {
            id: 'freerun-speed',
            message: 'The track gets faster over time. Stay sharp!',
            duration: 3500,
            position: 'top-center',
            trigger: 'distance',
            triggerValue: 350
        }
    ],

    hasSeenFreeRunTutorial: false,
    activeSteps: null,  // Which step set is currently active

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
        this.hasSeenFreeRunTutorial = tutorialData && tutorialData['free-run'];
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
        // Determine which tutorial to show
        let stepsToUse = null;

        if (stageId === 'free-run') {
            if (this.hasSeenFreeRunTutorial) return;
            stepsToUse = this.freeRunSteps;
        } else if (stageId === 'stage-1-intro') {
            if (this.hasSeenTutorial) return;
            stepsToUse = this.steps;
        } else {
            return;
        }

        this.isActive = true;
        this.currentStep = 0;
        this.activeSteps = stepsToUse;
        this.container.style.display = 'block';

        // Show first step immediately
        const firstStep = stepsToUse[0];
        if (firstStep.showOnStart) {
            this.showStep(firstStep);
        }

        if (DEBUG) console.log('Tutorial started for', stageId);
    },

    /**
     * Update tutorial (called from game loop)
     * @param {number} distance - Current distance traveled
     * @param {number} crashes - Current crash count
     * @param {number} orbs - Current orbs collected
     */
    update(distance, crashes, orbs) {
        if (!this.isActive || !this.activeSteps) return;

        // Check if we should trigger next step
        const nextStep = this.activeSteps[this.currentStep + 1];
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

        if (DEBUG) console.log('Tutorial step shown:', step.id);
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
        this.activeSteps = null;
        this.container.style.display = 'none';
        this.container.innerHTML = ''; // Clear all steps

        // Save completion
        if (stageId === 'stage-1-intro' || stageId === 'free-run') {
            this.saveTutorialState(stageId);
        }

        if (DEBUG) console.log('Tutorial stopped');
    },

    /**
     * Skip tutorial (user option)
     */
    skip() {
        if (!this.isActive) return;

        this.isActive = false;
        this.container.style.display = 'none';
        this.container.innerHTML = '';

        if (DEBUG) console.log('Tutorial skipped');
    },

    /**
     * Reset tutorial state (for testing/development)
     */
    reset() {
        Storage.remove('tutorial-completed');
        this.hasSeenTutorial = false;
        if (DEBUG) console.log('Tutorial state reset');
    }
};

// Initialize on load
if (typeof window !== 'undefined') {
    window.addEventListener('load', () => {
        TutorialOverlay.init();
    });
}
