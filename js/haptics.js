// ========================================
// HAPTIC FEEDBACK - Mobile Vibration System
// ========================================

class HapticFeedback {
    constructor() {
        // Check if vibration API is available
        this.enabled = 'vibrate' in navigator;
        this.qualityEnabled = true; // Set by quality preset

        if (!this.enabled) {
            console.log('⚠ Haptic feedback not supported on this device');
        }
    }

    vibrate(pattern) {
        if (this.enabled && this.qualityEnabled) {
            navigator.vibrate(pattern);
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
