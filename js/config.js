/* ========================================
   BEAT RUNNER - Main Game Code
   A Neon Rhythm Runner Game
   Mobile-Optimized Version
   ======================================== */

// ========================================
// CONFIGURATION
// ========================================
// Debug flag - set to true to enable verbose logging
const DEBUG = false;

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
    },

    // Power-up constants (shared by ShieldManager, MagnetManager, SpeedBoostManager)
    POWERUP: {
        COLLECT_RADIUS: 1.4,        // Proximity radius for pickup collection (world units)
        SPAWN_OFFSET: 12,           // Min extra Z beyond SPAWN_DISTANCE when placing power-ups
        SPAWN_RANDOM_RANGE: 20,     // Random additional Z spread on top of SPAWN_OFFSET

        SHIELD: {
            MIN_DISTANCE: 200,      // Player distance before shield can first spawn
            COOLDOWN_MIN: 30,       // Seconds between shield spawns (min)
            COOLDOWN_MAX: 45,       // Seconds between shield spawns (max)
            MIN_ELAPSED: 8,         // Minimum game seconds before first shield spawn
            SPAWN_Y: 1.9            // World Y position of shield pickup
        },
        MAGNET: {
            MIN_DISTANCE: 150,      // Player distance before magnet can first spawn
            COOLDOWN_MIN: 25,       // Seconds between magnet spawns (min)
            COOLDOWN_MAX: 35,       // Seconds between magnet spawns (max)
            DURATION: 15,           // Seconds the magnet effect lasts
            RANGE: 10,              // World units within which orbs are attracted
            PULL: 7,                // Attraction force scalar
            SPAWN_Y: 1.8            // World Y position of magnet pickup
        },
        SPEED_BOOST: {
            MIN_DISTANCE: 220,      // Player distance before speed boost can first spawn
            COOLDOWN_MIN: 28,       // Seconds between speed boost spawns (min)
            COOLDOWN_MAX: 40,       // Seconds between speed boost spawns (max)
            MIN_ELAPSED: 10,        // Minimum game seconds before first speed boost spawn
            SPAWN_Y: 1.85,          // World Y position of speed boost pickup
            DURATION: 8,            // Seconds the speed boost lasts (from ExitBoosterManager)
            SPEED_ADD: 15           // Units/s added on speed boost activation
        }
    },

    // Beat timing thresholds (used by BeatManager.getTimingAccuracy)
    BEAT: {
        TIMING: {
            PERFECT: 0.15,  // Beat distance fraction for PERFECT rating  (3x multiplier)
            GOOD: 0.35,  // Beat distance fraction for GOOD rating      (2x multiplier)
            OK: 0.65   // Beat distance fraction for OK rating        (1.5x multiplier)
        },
        // Speed ramp breakpoints for onBeat() (speed units → multiplier)
        SPEED_RAMP: [
            { below: 34, multiplier: 0.08 },   // Normal ramp
            { below: 40, multiplier: 0.04 },   // Slower ramp
            { below: 48, multiplier: 0.02 },   // Very slow ramp
            { below: Infinity, multiplier: 0.01 } // Crawl to max
        ]
    },

    // Orb visual tuning — global defaults used when no per-skin config applies
    ORB_VISUALS: {
        exposure: 0.95,                // Tone mapping exposure
        toneMapping: THREE.ACESFilmicToneMapping,
        roughnessRange: [0.15, 0.85],  // Default roughness clamp range
        metalnessRange: [0.0, 0.6],    // Default metalness clamp range
        emissiveTint: 0x1a1a1a,        // Dark emissive tint for untextured materials
        emissiveIntensity: 0.15        // Conservative default — per-skin table overrides this
    },

    // Per-skin material look configuration.
    // Each entry overrides the global ORB_VISUALS clamp ranges for that skin.
    // - disco-ball: mirror tiles need near-max metalness + near-zero roughness
    // - basketball/soccer-ball: rubber/leather needs high roughness, minimal metalness
    // - furry-ball: fabric/fur needs max roughness, zero metalness
    SKIN_LOOK: {
        'disco-ball':  { roughnessMin: 0.02, roughnessMax: 0.25, metalnessMin: 0.7,  metalnessMax: 0.98, emissiveIntensity: 0.25 },
        'pokeball':    { roughnessMin: 0.25, roughnessMax: 0.75, metalnessMin: 0.0,  metalnessMax: 0.4,  emissiveIntensity: 0.15 },
        'eye-ball':    { roughnessMin: 0.1,  roughnessMax: 0.7,  metalnessMin: 0.0,  metalnessMax: 0.35, emissiveIntensity: 0.4  },
        'soccer-ball': { roughnessMin: 0.45, roughnessMax: 0.95, metalnessMin: 0.0,  metalnessMax: 0.15, emissiveIntensity: 0.05 },
        'basketball':  { roughnessMin: 0.5,  roughnessMax: 0.95, metalnessMin: 0.0,  metalnessMax: 0.1,  emissiveIntensity: 0.05 },
        'furry-ball':  { roughnessMin: 0.65, roughnessMax: 1.0,  metalnessMin: 0.0,  metalnessMax: 0.08, emissiveIntensity: 0.35 }
    },

    // Gameflow timing (milliseconds unless noted)
    TIMING: {
        DEATH_SCREEN_DELAY: 500,        // ms after gameOver() before death screen appears
        PLAYER_SHRINK_DURATION: 300,    // ms for player shrink animation on death
        SCREEN_TRANSITION: 350,         // ms for screen fade-in/out CSS transition
        BONUS_TRANSITION_SPEED: 0.75    // Transition progress units/second for bonus mode
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
            'rainbow-trail': 300,
            'pokeball-spark': 30,
            skipFrames: 0  // Update every frame
        },
        effects: {
            screenShakeIntensity: 1.0,
            particleBurstCounts: {
                collision: 30,
                collect: 15,
                victory: 100
            },
            haptics: true
        }
    },
    MEDIUM: {
        name: 'Medium',
        pixelRatio: 1.0,  // Mobile: 1.0 cuts GPU pixel fill ~4× vs 2.0 (huge perf win)
        antialias: false,
        bloom: {
            enabled: false,  // Bloom disabled on mobile — UnrealBloom renders scene twice
            strength: 0.85,
            radius: 0.35,
            threshold: 0.88
        },
        particles: {
            background: 150,
            flame: 30,
            ember: 15,
            sparkle: 20,
            'rainbow-trail': 150,
            'pokeball-spark': 18,
            skipFrames: 1  // Update every other frame
        },
        effects: {
            screenShakeIntensity: 0.7,
            particleBurstCounts: {
                collision: 15,
                collect: 8,
                victory: 50
            },
            haptics: true
        }
    },
    LOW: {
        name: 'Low',
        pixelRatio: 1.0,  // Budget devices: native CSS pixels, no supersampling
        antialias: false,
        bloom: {
            enabled: false,  // Bloom disabled — too expensive for low-end devices
            strength: 0.6,
            radius: 0.25,
            threshold: 0.92
        },
        particles: {
            background: 80,
            flame: 20,
            ember: 10,
            sparkle: 10,
            'rainbow-trail': 75,
            'pokeball-spark': 10,
            skipFrames: 2  // Update every third frame
        },
        effects: {
            screenShakeIntensity: 0.3,
            particleBurstCounts: {
                collision: 5,
                collect: 3,
                victory: 20
            },
            haptics: false  // Disable on LOW for performance
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

    /**
     * Inspect the browser environment to determine device capabilities.
     * Returns touch support, screen size class, pixel ratio, memory, and motion flags.
     * @returns {{ isTouchDevice: boolean, isSmallScreen: boolean, isMediumScreen: boolean,
     *             isHighDPIMobile: boolean, isLowMemory: boolean, prefersReducedMotion: boolean,
     *             pixelRatio: number, screenWidth: number, screenHeight: number, totalPixels: number }}
     */
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

    /**
     * Select the appropriate quality preset based on detected device capabilities.
     * Respects the prefers-reduced-motion accessibility setting first.
     * @returns {'LOW'|'MEDIUM'|'HIGH'} The recommended preset name
     */
    autoDetectQuality() {
        const device = this.detectDevice();

        // Respect user accessibility preferences first
        if (device.prefersReducedMotion) {
            return 'LOW';
        }

        // LOW: Only very old devices with low memory AND small screens
        if (device.isLowMemory && device.isSmallScreen) {
            return 'LOW';
        }

        // MEDIUM: Modern mobile devices (default for touch devices)
        // Modern phones have powerful GPUs and can handle MEDIUM quality well
        if (device.isTouchDevice) {
            return 'MEDIUM';
        }

        // HIGH: Desktop and tablets with large screens
        return 'HIGH';
    },

    /**
     * Load saved quality preference from storage or auto-detect, apply the preset,
     * log diagnostics in DEBUG mode, and show the quality notification.
     * @returns {object} The active quality preset object
     */
    init() {
        const savedQuality = Storage.get(Storage.KEYS.QUALITY);
        if (savedQuality && QUALITY_PRESETS[savedQuality]) {
            this.presetName = savedQuality;
        } else {
            this.presetName = this.autoDetectQuality();
        }
        this.currentPreset = QUALITY_PRESETS[this.presetName];

        // Log quality information
        if (DEBUG) {
            const device = this.detectDevice();
            console.log(`✓ Graphics Quality: ${this.presetName}`);
            console.log(`  - Pixel Ratio: ${this.currentPreset.pixelRatio} (Device: ${device.pixelRatio})`);
            console.log(`  - Antialiasing: ${this.currentPreset.antialias ? 'ON' : 'OFF'}`);
            console.log(`  - Bloom Strength: ${this.currentPreset.bloom.strength}`);
            console.log(`  - Particles: ${this.currentPreset.particles.background}`);
        }

        // Show quality notification
        this.showQualityNotification();

        return this.currentPreset;
    },

    // Show temporary quality notification
    showQualityNotification() {
        // Hide notification on mobile devices to avoid obstructing gameplay
        const device = this.detectDevice();
        const isMobile = device.isTouchDevice || device.isSmallScreen;
        if (isMobile) {
            return;
        }

        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            background: rgba(0, 0, 0, 0.85);
            border: 1px solid rgba(0, 255, 255, 0.5);
            border-radius: 8px;
            padding: 12px 16px;
            color: #fff;
            font-size: 13px;
            z-index: 10000;
            box-shadow: 0 4px 12px rgba(0, 255, 255, 0.3);
            animation: slideIn 0.3s ease-out;
        `;
        notification.innerHTML = `
            <div style="font-weight: bold; margin-bottom: 4px;">Graphics Quality: ${this.presetName}</div>
            <div style="font-size: 11px; color: rgba(255, 255, 255, 0.7);">
                ${this.currentPreset.pixelRatio}x resolution • ${this.currentPreset.antialias ? 'AA' : 'No AA'} • ${this.currentPreset.particles.background} particles
            </div>
        `;

        // Add animation keyframes
        const style = document.createElement('style');
        style.textContent = `
            @keyframes slideIn {
                from { transform: translateX(400px); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
            @keyframes slideOut {
                from { transform: translateX(0); opacity: 1; }
                to { transform: translateX(400px); opacity: 0; }
            }
        `;
        document.head.appendChild(style);

        document.body.appendChild(notification);

        // Auto-hide after 4 seconds
        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease-out';
            setTimeout(() => notification.remove(), 300);
        }, 4000);
    },

    /**
     * Persist a quality preset selection and apply it immediately.
     * @param {'LOW'|'MEDIUM'|'HIGH'} presetName - The preset to activate
     * @returns {boolean} False if presetName is not a valid key
     */
    setQuality(presetName) {
        if (!QUALITY_PRESETS[presetName]) return false;
        this.presetName = presetName;
        this.currentPreset = QUALITY_PRESETS[presetName];
        Storage.set(Storage.KEYS.QUALITY, presetName);
        if (DEBUG) console.log(`Quality changed to: ${presetName}`);
        return true;
    },

    /**
     * Return the currently active preset object. Falls back to HIGH if not yet initialized.
     * @returns {object} The active QUALITY_PRESETS entry
     */
    getPreset() {
        return this.currentPreset || QUALITY_PRESETS.HIGH;
    },

    /**
     * Throttle per-frame particle updates based on the preset's skipFrames setting.
     * Returns true on the frames where particles should be updated.
     * @returns {boolean}
     */
    shouldUpdateParticles() {
        const skipFrames = this.currentPreset?.particles?.skipFrames || 0;
        if (skipFrames === 0) return true;
        this.frameCounter++;
        return (this.frameCounter % (skipFrames + 1)) === 0;
    },

    /**
     * Return the particle count for a given particle system type from the current preset.
     * Falls back to the HIGH preset value if the current preset is unavailable.
     * @param {'background'|'flame'|'ember'|'sparkle'|'rainbow-trail'} type
     * @returns {number}
     */
    getParticleCount(type) {
        return this.currentPreset?.particles?.[type] || QUALITY_PRESETS.HIGH.particles[type];
    },

    /**
     * Switch to a new quality preset and immediately apply renderer pixel ratio,
     * bloom pass parameters, and haptic feedback state. Note: antialias changes
     * require a page reload and are NOT applied here.
     * @param {'LOW'|'MEDIUM'|'HIGH'} presetName
     * @returns {boolean} False if presetName is invalid
     */
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

        // Update haptic feedback state based on quality preset
        if (typeof hapticFeedback !== 'undefined' && hapticFeedback) {
            hapticFeedback.setEnabled(this.currentPreset.effects.haptics);
        }

        return true;
    }
};
