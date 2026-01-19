// AUDIO - Sound Effects
// ========================================
function setupAudio() {
    try {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
        window.audioContext = audioContext; // Expose globally for haptic system
        gainNode = audioContext.createGain();
        gainNode.connect(audioContext.destination);
        gainNode.gain.value = 0.25;
    } catch (e) {
        console.log('Audio not supported');
    }
}

function resumeAudio() {
    if (audioContext && audioContext.state === 'suspended') {
        audioContext.resume();
    }
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
    } catch (e) {}
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
    } catch (e) {}
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
    } catch (e) {}
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
    } catch (e) {}
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
    } catch (e) {}
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
        console.log('Victory fanfare failed:', e);
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

