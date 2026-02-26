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
        this.lastBeatHapticTime = 0; // Separate tracking so beat never blocks action haptics
        this.debounceMs = 20; // Prevent duplicate haptics on same-type events

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
     * Handles full vibration patterns (on/off/on/off...)
     */
    vibrateAudio(pattern) {
        if (!window.audioContext) return;

        try {
            const durations = Array.isArray(pattern) ? pattern : [pattern];
            let timeOffset = window.audioContext.currentTime;

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

                const durationSec = duration / 1000;

                // Envelope: quick attack, exponential decay
                gain.gain.setValueAtTime(0.3, timeOffset);
                gain.gain.exponentialRampToValueAtTime(0.001, timeOffset + durationSec);

                osc.start(timeOffset);
                osc.stop(timeOffset + durationSec);

                timeOffset += durationSec;
            });
        } catch (e) {
            if (DEBUG) console.log('Audio haptic failed:', e);
        }
    }

    /**
     * Main vibrate method - routes to native or audio backend.
     * Uses shared debounce so rapid duplicate events don't stack.
     */
    vibrate(pattern) {
        if (!this.qualityEnabled) return;

        // Debouncing to prevent duplicate haptics
        const now = performance.now();
        if (now - this.lastHapticTime < this.debounceMs) return;
        this.lastHapticTime = now;

        this._send(pattern);
    }

    /**
     * Beat-specific vibrate — uses its own debounce so it never blocks
     * action haptics (collect, crash, lane change, etc.)
     */
    vibrateBeat(pattern) {
        if (!this.qualityEnabled) return;
        const now = performance.now();
        if (now - this.lastBeatHapticTime < 80) return; // min 80ms between beat ticks
        this.lastBeatHapticTime = now;

        this._send(pattern);
    }

    /**
     * Internal: send pattern to the active backend (vibration API or AudioContext).
     */
    _send(pattern) {
        if (this.backend === 'vibration') {
            try {
                navigator.vibrate(pattern);
            } catch (e) {
                if (DEBUG) console.log('Vibration failed:', e);
            }
        } else if (this.backend === 'audio') {
            // Pass the original pattern — vibrateAudio handles on/off sequences correctly
            this.vibrateAudio(pattern);
        }
    }

    // ── Action haptics (use shared debounce) ──────────────────────────────

    impact(intensity = 'medium') {
        const patterns = {
            light: 20,
            medium: 50,
            heavy: [100, 50, 100]
        };
        this.vibrate(patterns[intensity] || patterns.medium);
    }

    /** Quick tick when collecting an orb */
    collect() {
        this.vibrate(30);
    }

    /** Double-bump for crash / obstacle hit */
    crash() {
        this.vibrate([200, 100, 100]);
    }

    /** Celebratory burst for stage complete */
    victory() {
        this.vibrate([100, 50, 100, 50, 200]);
    }

    /** Subtle nudge for lane switches */
    laneChange() {
        this.vibrate(15);
    }

    /** Light tap when the player jumps */
    jump() {
        this.vibrate(25);
    }

    /** Soft thud when the player lands */
    land() {
        this.vibrate(12);
    }

    /** Rising pulse for power-up pickup (magnet, shield, speed boost) */
    powerUp() {
        this.vibrate([40, 30, 60]);
    }

    /** Sharp crack when shield absorbs a hit */
    shieldBreak() {
        this.vibrate([80, 40, 80]);
    }

    // ── Rhythm haptic (independent debounce) ─────────────────────────────

    /** Very subtle pulse synced to the music beat */
    beat() {
        this.vibrateBeat(12);
    }

    // ── Control ───────────────────────────────────────────────────────────

    setEnabled(enabled) {
        // Control haptics based on quality preset or user preference
        this.qualityEnabled = enabled;
    }
}

// Create singleton instance
const hapticFeedback = new HapticFeedback();
