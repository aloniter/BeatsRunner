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
        pixelRatio: 2.0,  // Increased from 1.5 - modern mobile devices can handle this
        antialias: true,
        bloom: {
            enabled: true,
            strength: 0.85,  // Increased from 0.7 for better visuals
            radius: 0.35,    // Increased from 0.3
            threshold: 0.88  // Reduced from 0.9 for more bloom
        },
        particles: {
            background: 150,
            flame: 30,
            ember: 15,
            sparkle: 20,
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
        pixelRatio: 1.5,  // Increased from 1.0 - even budget devices deserve better
        antialias: false,
        bloom: {
            enabled: true,
            strength: 0.6,   // Increased from 0.4 for more noticeable glow
            radius: 0.25,    // Increased from 0.2
            threshold: 0.92  // Reduced from 0.95 for more bloom
        },
        particles: {
            background: 80,
            flame: 20,
            ember: 10,
            sparkle: 10,
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

    // Initialize with auto-detection or saved preference
    init() {
        const savedQuality = Storage.get(Storage.KEYS.QUALITY);
        if (savedQuality && QUALITY_PRESETS[savedQuality]) {
            this.presetName = savedQuality;
        } else {
            this.presetName = this.autoDetectQuality();
        }
        this.currentPreset = QUALITY_PRESETS[this.presetName];

        // Log quality information
        const device = this.detectDevice();
        console.log(`✓ Graphics Quality: ${this.presetName}`);
        console.log(`  - Pixel Ratio: ${this.currentPreset.pixelRatio} (Device: ${device.pixelRatio})`);
        console.log(`  - Antialiasing: ${this.currentPreset.antialias ? 'ON' : 'OFF'}`);
        console.log(`  - Bloom Strength: ${this.currentPreset.bloom.strength}`);
        console.log(`  - Particles: ${this.currentPreset.particles.background}`);

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

    // Set quality level (for user preference)
    setQuality(presetName) {
        if (!QUALITY_PRESETS[presetName]) return false;
        this.presetName = presetName;
        this.currentPreset = QUALITY_PRESETS[presetName];
        Storage.set(Storage.KEYS.QUALITY, presetName);
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

        // Update haptic feedback state based on quality preset
        if (typeof hapticFeedback !== 'undefined' && hapticFeedback) {
            hapticFeedback.setEnabled(this.currentPreset.effects.haptics);
        }

        return true;
    }
};
