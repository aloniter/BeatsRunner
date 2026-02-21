// ========================================
// HAPTIC FEEDBACK - Mobile Vibration System
// Multi-tier system with iOS AudioContext fallback
// ========================================

class HapticFeedback {
    constructor() {
        // Check if vibration API is available
        this.hasVibrateAPI = 'vibrate' in navigator;
        this.qualityEnabled = true; // Set by quality preset
        this.initialized = false;
        this.backend = 'none';
        this.lastHapticTime = 0;
        this.debounceMs = 20; // Prevent duplicate haptics

        // Detect iOS devices
        this.isIOS = this.detectIOS();

        // Test actual vibration capability
        this.canVibrate = this.hasVibrateAPI && !this.isIOS;

        // Select backend: native vibration or audio simulation
        if (this.canVibrate) {
            this.backend = 'vibration';
            if (DEBUG) console.log('✓ Haptics available (native vibration)');
        } else if (this.isIOS) {
            this.backend = 'audio';
            if (DEBUG) console.log('✓ Haptics available (AudioContext fallback for iOS)');
        } else {
            if (DEBUG) console.log('⚠ Haptic feedback not supported on this device');
        }
    }

    /**
     * Detect iOS devices (iPhone, iPad, iPod)
     */
    detectIOS() {
        const ua = navigator.userAgent;
        const isIOSUA = /iPad|iPhone|iPod/.test(ua);
        const isMacTouch = navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1;
        return isIOSUA || isMacTouch;
    }

    /**
     * Initialize haptics on first user gesture (required for iOS)
     * Call this from a user interaction event (touch, click)
     */
    async initialize() {
        if (this.initialized) return true;

        if (DEBUG) console.log('Initializing haptics...');

        // Test native vibration with a silent test
        if (this.canVibrate) {
            try {
                navigator.vibrate(0); // Silent test
                this.backend = 'vibration';
            } catch (e) {
                if (DEBUG) console.log('Vibration test failed, falling back to audio');
                this.backend = 'audio';
            }
        }

        // For iOS, ensure AudioContext is available
        if (this.backend === 'audio') {
            if (typeof window.audioContext === 'undefined' || !window.audioContext) {
                if (DEBUG) console.log('⚠ AudioContext not available for haptic simulation');
                this.backend = 'none';
                this.initialized = true;
                return false;
            }
        }

        this.initialized = true;
        if (DEBUG) console.log(`✓ Haptics initialized using ${this.backend} backend`);
        return true;
    }

    /**
     * AudioContext-based haptic simulation for iOS
     * Uses low-frequency bass pulses to create tactile feedback
     */
    vibrateAudio(pattern) {
        if (!window.audioContext) return;

        try {
            const durations = Array.isArray(pattern) ? pattern : [pattern];
            let timeOffset = 0;

            durations.forEach((duration, index) => {
                // Odd indices are pauses in vibration patterns
                if (index % 2 === 1) {
                    timeOffset += duration / 1000;
                    return;
                }

                // Create bass pulse for haptic effect
                const osc = window.audioContext.createOscillator();
                const gain = window.audioContext.createGain();

                osc.connect(gain);
                gain.connect(window.audioContext.destination);

                // Choose waveform based on duration (intensity)
                if (duration >= 100) {
                    // Heavy haptic: sawtooth wave for more punch
                    osc.type = 'sawtooth';
                    osc.frequency.value = 50; // 50Hz bass
                } else if (duration >= 30) {
                    // Medium haptic: sine wave
                    osc.type = 'sine';
                    osc.frequency.value = 40;
                } else {
                    // Light haptic: sine wave, higher pitch
                    osc.type = 'sine';
                    osc.frequency.value = 30;
                }

                const now = window.audioContext.currentTime + timeOffset;
                const durationSec = duration / 1000;

                // Envelope: quick attack, exponential decay
                gain.gain.setValueAtTime(0.3, now);
                gain.gain.exponentialRampToValueAtTime(0.001, now + durationSec);

                osc.start(now);
                osc.stop(now + durationSec);

                timeOffset += durationSec;
            });
        } catch (e) {
            if (DEBUG) console.log('Audio haptic failed:', e);
        }
    }

    /**
     * Main vibrate method - routes to native or audio backend
     */
    vibrate(pattern) {
        if (!this.qualityEnabled) return;

        // Debouncing to prevent duplicate haptics
        const now = performance.now();
        if (now - this.lastHapticTime < this.debounceMs) return;
        this.lastHapticTime = now;

        // Route to appropriate backend
        if (this.backend === 'vibration') {
            try {
                navigator.vibrate(pattern);
            } catch (e) {
                if (DEBUG) console.log('Vibration failed:', e);
            }
        } else if (this.backend === 'audio') {
            // iOS limitation: convert complex patterns to single pulse
            // iOS speakers work better with simplified patterns
            const simplifiedPattern = Array.isArray(pattern)
                ? pattern.reduce((sum, val, idx) => idx % 2 === 0 ? sum + val : sum, 0)
                : pattern;
            this.vibrateAudio(simplifiedPattern);
        }
    }

    impact(intensity = 'medium') {
        const patterns = {
            light: 20,
            medium: 50,
            heavy: [100, 50, 100]
        };
        this.vibrate(patterns[intensity] || patterns.medium);
    }

    collect() {
        // Quick tap for orb collection
        this.vibrate(20);
    }

    crash() {
        // Heavy pattern for collision
        this.vibrate([200, 100, 100]);
    }

    victory() {
        // Celebratory pattern for stage complete
        this.vibrate([100, 50, 100, 50, 200]);
    }

    laneChange() {
        // Very subtle feedback for lane changes
        this.vibrate(15);
    }

    setEnabled(enabled) {
        // Control haptics based on quality preset or user preference
        this.qualityEnabled = enabled;
    }
}

// Create singleton instance
const hapticFeedback = new HapticFeedback();
