/* ========================================
   BEAT RUNNER - Main Game Code
   A Neon Rhythm Runner Game
   Mobile-Optimized Version
   ======================================== */

// ========================================
// CONFIGURATION
// ========================================
const CONFIG = {
    // Game settings - lanes ordered LEFT to RIGHT
    LANE_WIDTH: 3,
    LANE_POSITIONS: [-3, 0, 3], // Lane 0 = LEFT (-3), Lane 1 = CENTER (0), Lane 2 = RIGHT (+3)
    INITIAL_SPEED: 28,
    MAX_SPEED: 55,
    SPEED_INCREMENT: 0.3,

    // Jump physics
    JUMP_FORCE: 8,
    GRAVITY: 22,
    GROUND_Y: 1.2,

    // Beat settings
    BPM: 128,
    get BEAT_INTERVAL() { return 60 / this.BPM; },

    // Spawn settings
    SPAWN_DISTANCE: 180,  // Increased for better reaction time (3.6s vs 2.4s)
    DESPAWN_DISTANCE: -15,
    OBSTACLE_MIN_GAP: 18,
    ORB_SPAWN_CHANCE: 0.5,

    // Bonus mode
    BONUS_START_DISTANCE: 1000,
    BONUS_END_DISTANCE: 1250,  // Extended from 1150 for longer bonus with more orbs

    // Visual settings
    FOG_NEAR: 25,
    FOG_FAR: 120,

    // Colors
    COLORS: {
        PINK: 0xff00ff,
        CYAN: 0x00ffff,
        PURPLE: 0x9900ff,
        BLUE: 0x0066ff,
        ORANGE: 0xff6600,
        WHITE: 0xffffff
    }
};

// ========================================
// QUALITY PRESETS - Mobile Performance Optimization
// ========================================
const QUALITY_PRESETS = {
    HIGH: {
        name: 'High',
        pixelRatio: 2.0,
        antialias: true,
        bloom: {
            enabled: true,
            strength: 1.0,
            radius: 0.4,
            threshold: 0.85
        },
        particles: {
            background: 300,
            flame: 50,
            ember: 30,
            sparkle: 40,
            skipFrames: 0  // Update every frame
        }
    },
    MEDIUM: {
        name: 'Medium',
        pixelRatio: 1.5,
        antialias: true,
        bloom: {
            enabled: true,
            strength: 0.7,
            radius: 0.3,
            threshold: 0.9
        },
        particles: {
            background: 150,
            flame: 30,
            ember: 15,
            sparkle: 20,
            skipFrames: 1  // Update every other frame
        }
    },
    LOW: {
        name: 'Low',
        pixelRatio: 1.0,
        antialias: false,
        bloom: {
            enabled: true,
            strength: 0.4,
            radius: 0.2,
            threshold: 0.95
        },
        particles: {
            background: 80,
            flame: 20,
            ember: 10,
            sparkle: 10,
            skipFrames: 2  // Update every third frame
        }
    }
};

// ========================================
// QUALITY MANAGER - Device Detection & Settings
// ========================================
const QualityManager = {
    currentPreset: null,
    presetName: 'HIGH',
    frameCounter: 0,

    // Device capability detection
    detectDevice() {
        const width = window.innerWidth;
        const height = window.innerHeight;
        const pixelRatio = window.devicePixelRatio || 1;
        const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
        const isSmallScreen = Math.max(width, height) <= 768;
        const isMediumScreen = Math.max(width, height) <= 1024;

        // GPU capability estimation based on pixel count at native resolution
        const totalPixels = width * height * pixelRatio * pixelRatio;
        const isHighDPIMobile = totalPixels > 2000000 && isTouchDevice;

        // Check for low memory devices
        const isLowMemory = navigator.deviceMemory && navigator.deviceMemory <= 4;

        // Check for reduced motion preference
        const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

        return {
            isTouchDevice,
            isSmallScreen,
            isMediumScreen,
            isHighDPIMobile,
            isLowMemory,
            prefersReducedMotion,
            pixelRatio,
            screenWidth: width,
            screenHeight: height,
            totalPixels
        };
    },

    // Auto-select quality based on device capabilities
    autoDetectQuality() {
        const device = this.detectDevice();

        // LOW: User prefers reduced motion, low memory, or high-DPI mobile
        if (device.prefersReducedMotion || device.isLowMemory || device.isHighDPIMobile) {
            return 'LOW';
        }

        // MEDIUM: Any touch device or medium-sized screen
        if (device.isTouchDevice || device.isMediumScreen) {
            return 'MEDIUM';
        }

        // HIGH: Desktop with good capabilities
        return 'HIGH';
    },

    // Initialize with auto-detection or saved preference
    init() {
        const savedQuality = localStorage.getItem('beat-runner-quality');
        if (savedQuality && QUALITY_PRESETS[savedQuality]) {
            this.presetName = savedQuality;
        } else {
            this.presetName = this.autoDetectQuality();
        }
        this.currentPreset = QUALITY_PRESETS[this.presetName];
        console.log(`Quality preset: ${this.presetName} (${this.currentPreset.name})`);
        return this.currentPreset;
    },

    // Set quality level (for user preference)
    setQuality(presetName) {
        if (!QUALITY_PRESETS[presetName]) return false;
        this.presetName = presetName;
        this.currentPreset = QUALITY_PRESETS[presetName];
        localStorage.setItem('beat-runner-quality', presetName);
        console.log(`Quality changed to: ${presetName}`);
        return true;
    },

    // Get current preset
    getPreset() {
        return this.currentPreset || QUALITY_PRESETS.HIGH;
    },

    // Check if particles should update this frame (frame skipping)
    shouldUpdateParticles() {
        const skipFrames = this.currentPreset?.particles?.skipFrames || 0;
        if (skipFrames === 0) return true;
        this.frameCounter++;
        return (this.frameCounter % (skipFrames + 1)) === 0;
    },

    // Get particle count for a specific type
    getParticleCount(type) {
        return this.currentPreset?.particles?.[type] || QUALITY_PRESETS.HIGH.particles[type];
    },

    // Apply quality settings at runtime (partial - some require restart)
    applyQuality(presetName) {
        if (!this.setQuality(presetName)) return false;

        // Update renderer pixel ratio
        if (typeof renderer !== 'undefined' && renderer) {
            renderer.setPixelRatio(Math.min(window.devicePixelRatio, this.currentPreset.pixelRatio));
        }

        // Update bloom parameters
        if (typeof composer !== 'undefined' && composer) {
            const bloomPass = composer.passes.find(pass => pass instanceof THREE.UnrealBloomPass);
            if (bloomPass) {
                bloomPass.strength = this.currentPreset.bloom.strength;
                bloomPass.radius = this.currentPreset.bloom.radius;
                bloomPass.threshold = this.currentPreset.bloom.threshold;
            }
        }

        return true;
    }
};
