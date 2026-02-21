// AUDIO - Sound Effects
// ========================================

// Audio state tracking
const AudioState = {
    isMuted: false,
    sfxVolume: 0.25,
    musicVolume: 0.4
};

function setupAudio() {
    try {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
        window.audioContext = audioContext; // Expose globally for haptic system
        gainNode = audioContext.createGain();
        gainNode.connect(audioContext.destination);
        gainNode.gain.value = AudioState.sfxVolume;

        // Restore saved volumes
        const savedSfxVol = Storage.getNumber('beat-runner-sfx-volume', 25);
        const savedMusicVol = Storage.getNumber('beat-runner-music-volume', 40);
        AudioState.sfxVolume = savedSfxVol / 100;
        AudioState.musicVolume = savedMusicVol / 100;
        gainNode.gain.value = AudioState.sfxVolume;
    } catch (e) {
        console.warn('Audio not supported:', e.message);
    }
}

function resumeAudio() {
    if (audioContext && audioContext.state === 'suspended') {
        audioContext.resume();
    }
    // Update muted indicator
    updateMuteIndicator();
}

function updateMuteIndicator() {
    const muteIndicator = document.getElementById('mute-indicator');
    if (!muteIndicator) return;
    if (!audioContext || audioContext.state === 'suspended') {
        muteIndicator.style.display = 'block';
    } else {
        muteIndicator.style.display = 'none';
    }
}

function setSfxVolume(value) {
    AudioState.sfxVolume = Math.max(0, Math.min(1, value));
    if (gainNode) gainNode.gain.value = AudioState.sfxVolume;
    Storage.set('beat-runner-sfx-volume', Math.round(AudioState.sfxVolume * 100));
}

function setMusicVolume(value) {
    AudioState.musicVolume = Math.max(0, Math.min(1, value));
    if (bgMusic) bgMusic.volume = AudioState.musicVolume;
    Storage.set('beat-runner-music-volume', Math.round(AudioState.musicVolume * 100));
}

function playBeatSound() {
    if (!audioContext) return;

    try {
        const osc = audioContext.createOscillator();
        const gain = audioContext.createGain();

        osc.connect(gain);
        gain.connect(audioContext.destination);

        osc.type = 'sine';
        osc.frequency.setValueAtTime(70, audioContext.currentTime);
        osc.frequency.exponentialRampToValueAtTime(35, audioContext.currentTime + 0.08);

        gain.gain.setValueAtTime(0.15, audioContext.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.08);

        osc.start(audioContext.currentTime);
        osc.stop(audioContext.currentTime + 0.08);
    } catch (e) {
        if (DEBUG) console.warn('Audio: playBeatSound failed:', e.message);
    }
}

function playCollectSound() {
    if (!audioContext) return;

    try {
        const osc = audioContext.createOscillator();
        const gain = audioContext.createGain();

        osc.connect(gain);
        gain.connect(audioContext.destination);

        osc.type = 'sine';
        osc.frequency.setValueAtTime(880, audioContext.currentTime);
        osc.frequency.exponentialRampToValueAtTime(1760, audioContext.currentTime + 0.1);

        gain.gain.setValueAtTime(0.2, audioContext.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.12);

        osc.start(audioContext.currentTime);
        osc.stop(audioContext.currentTime + 0.12);
    } catch (e) {
        if (DEBUG) console.warn('Audio: playCollectSound failed:', e.message);
    }
}

function playLaneChangeSound() {
    if (!audioContext) return;

    try {
        const osc = audioContext.createOscillator();
        const gain = audioContext.createGain();

        osc.connect(gain);
        gain.connect(audioContext.destination);

        osc.type = 'square';
        osc.frequency.setValueAtTime(330, audioContext.currentTime);

        gain.gain.setValueAtTime(0.08, audioContext.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.04);

        osc.start(audioContext.currentTime);
        osc.stop(audioContext.currentTime + 0.04);
    } catch (e) {
        if (DEBUG) console.warn('Audio: playLaneChangeSound failed:', e.message);
    }
}

function playJumpSound() {
    if (!audioContext) return;

    try {
        const osc = audioContext.createOscillator();
        const gain = audioContext.createGain();

        osc.connect(gain);
        gain.connect(audioContext.destination);

        osc.type = 'sine';
        osc.frequency.setValueAtTime(440, audioContext.currentTime);
        osc.frequency.exponentialRampToValueAtTime(660, audioContext.currentTime + 0.1);

        gain.gain.setValueAtTime(0.12, audioContext.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.15);

        osc.start(audioContext.currentTime);
        osc.stop(audioContext.currentTime + 0.15);
    } catch (e) {
        if (DEBUG) console.warn('Audio: playJumpSound failed:', e.message);
    }
}

function playGameOverSound() {
    if (!audioContext) return;

    try {
        const osc = audioContext.createOscillator();
        const gain = audioContext.createGain();

        osc.connect(gain);
        gain.connect(audioContext.destination);

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(180, audioContext.currentTime);
        osc.frequency.exponentialRampToValueAtTime(40, audioContext.currentTime + 0.4);

        gain.gain.setValueAtTime(0.25, audioContext.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.4);

        osc.start(audioContext.currentTime);
        osc.stop(audioContext.currentTime + 0.4);
    } catch (e) {
        if (DEBUG) console.warn('Audio: playGameOverSound failed:', e.message);
    }
}

/**
 * Play timing feedback sound for rhythm system
 * @param {string} rating - PERFECT, GOOD, OK, or MISS
 */
function playTimingSound(rating) {
    if (!audioContext) return;

    try {
        const osc = audioContext.createOscillator();
        const gain = audioContext.createGain();

        osc.connect(gain);
        gain.connect(audioContext.destination);

        osc.type = 'sine';

        if (rating === 'PERFECT') {
            osc.frequency.setValueAtTime(1200, audioContext.currentTime);
            osc.frequency.exponentialRampToValueAtTime(1800, audioContext.currentTime + 0.08);
            gain.gain.setValueAtTime(0.18, audioContext.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.15);
            osc.start(audioContext.currentTime);
            osc.stop(audioContext.currentTime + 0.15);
        } else if (rating === 'GOOD') {
            osc.frequency.setValueAtTime(1000, audioContext.currentTime);
            osc.frequency.exponentialRampToValueAtTime(1400, audioContext.currentTime + 0.06);
            gain.gain.setValueAtTime(0.14, audioContext.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.1);
            osc.start(audioContext.currentTime);
            osc.stop(audioContext.currentTime + 0.1);
        }
        // OK and MISS don't play extra sound
    } catch (e) {
        if (DEBUG) console.warn('Audio: playTimingSound failed:', e.message);
    }
}

/**
 * Play combo milestone sound
 * @param {number} combo - Current combo count
 */
function playComboSound(combo) {
    if (!audioContext || combo < 5) return;

    try {
        const osc = audioContext.createOscillator();
        const gain = audioContext.createGain();

        osc.connect(gain);
        gain.connect(audioContext.destination);

        osc.type = 'triangle';
        // Higher pitch for bigger combos
        const baseFreq = 600 + Math.min(combo, 50) * 20;
        osc.frequency.setValueAtTime(baseFreq, audioContext.currentTime);
        osc.frequency.exponentialRampToValueAtTime(baseFreq * 1.5, audioContext.currentTime + 0.12);

        gain.gain.setValueAtTime(0.12, audioContext.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.2);

        osc.start(audioContext.currentTime);
        osc.stop(audioContext.currentTime + 0.2);
    } catch (e) {
        if (DEBUG) console.warn('Audio: playComboSound failed:', e.message);
    }
}

/**
 * Play victory fanfare (Stage 15 finale)
 * Triumphant ascending chord progression
 */
function playVictoryFanfare() {
    if (!audioContext) return;

    try {
        const notes = [
            { freq: 523, time: 0, duration: 0.3 },      // C5
            { freq: 659, time: 0.15, duration: 0.3 },   // E5
            { freq: 784, time: 0.3, duration: 0.5 },    // G5
            { freq: 1047, time: 0.5, duration: 0.6 }    // C6 (finale)
        ];

        notes.forEach(note => {
            const osc = audioContext.createOscillator();
            const gain = audioContext.createGain();

            osc.connect(gain);
            gain.connect(audioContext.destination);

            osc.type = 'triangle';
            osc.frequency.setValueAtTime(note.freq, audioContext.currentTime + note.time);

            gain.gain.setValueAtTime(0, audioContext.currentTime + note.time);
            gain.gain.linearRampToValueAtTime(0.2, audioContext.currentTime + note.time + 0.05);
            gain.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + note.time + note.duration);

            osc.start(audioContext.currentTime + note.time);
            osc.stop(audioContext.currentTime + note.time + note.duration);
        });

        // Add harmonic sparkle
        setTimeout(() => {
            const sparkle = audioContext.createOscillator();
            const sparkleGain = audioContext.createGain();

            sparkle.connect(sparkleGain);
            sparkleGain.connect(audioContext.destination);

            sparkle.type = 'sine';
            sparkle.frequency.setValueAtTime(2093, audioContext.currentTime); // C7

            sparkleGain.gain.setValueAtTime(0.15, audioContext.currentTime);
            sparkleGain.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.8);

            sparkle.start(audioContext.currentTime);
            sparkle.stop(audioContext.currentTime + 0.8);
        }, 600);
    } catch (e) {
        if (DEBUG) console.warn('Audio: playVictoryFanfare failed:', e.message);
    }
}

// ========================================
// VISUAL EFFECTS
// ========================================
function flashScreen(intensity, color) {
    screenFlash.style.background = color;
    screenFlash.style.opacity = intensity;

    setTimeout(() => {
        screenFlash.style.opacity = 0;
    }, 40);
}

// showTimingFeedback, updateComboDisplay, resetComboDisplay
// are now in js/ui/timing-feedback.js

// ========================================
// AUDIO MANAGER - Unified API Wrapper
// Wraps all audio functions into a single manager
// ========================================
const AudioManager = {
    get state() { return AudioState; },

    setup: setupAudio,
    resume: resumeAudio,

    // Volume controls
    setSfxVolume,
    setMusicVolume,

    getMusicVolume() { return AudioState.musicVolume; },
    getSfxVolume() { return AudioState.sfxVolume; },

    // Mute toggle
    toggleMute() {
        AudioState.isMuted = !AudioState.isMuted;
        if (AudioState.isMuted) {
            if (gainNode) gainNode.gain.value = 0;
            if (bgMusic) bgMusic.volume = 0;
        } else {
            if (gainNode) gainNode.gain.value = AudioState.sfxVolume;
            if (bgMusic) bgMusic.volume = AudioState.musicVolume;
        }
        return AudioState.isMuted;
    },

    get isMuted() { return AudioState.isMuted; },

    // Sound effects
    playBeat: playBeatSound,
    playCollect: playCollectSound,
    playLaneChange: playLaneChangeSound,
    playJump: playJumpSound,
    playGameOver: playGameOverSound,
    playTiming: playTimingSound,
    playCombo: playComboSound,
    playVictoryFanfare: playVictoryFanfare,

    // Visual effects (kept here for backward compatibility)
    flashScreen
};
