// ========================================
// BEAT SYNC - Rhythm System
// ========================================
const BeatManager = {
    lastBeatTime: 0,
    beatCount: 0,
    intensity: 1,

    update(elapsed) {
        const beatInterval = CONFIG.BEAT_INTERVAL;
        const timeSinceBeat = elapsed - this.lastBeatTime;

        if (timeSinceBeat >= beatInterval) {
            this.onBeat();
            this.lastBeatTime = elapsed;
            this.beatCount++;
        }

        // Calculate beat phase (0-1)
        const phase = timeSinceBeat / beatInterval;
        this.intensity = Math.max(0, 1 - phase * 0.6);

        // Update visuals
        this.updateVisuals();
    },

    onBeat() {
        if (!GameState.isPlaying) return;

        // Beat indicator
        beatIndicator.classList.add('pulse');
        setTimeout(() => beatIndicator.classList.remove('pulse'), 80);

        // Camera micro-shake
        this.shakeCamera();

        // Sound
        playBeatSound();

        // Subtle flash with current disco ball color
        let flashColor = '#ff00ff';
        if (discoBallGroup && discoBallGroup.visible && discoBallCore && discoBallCore.material) {
            const color = discoBallCore.material.emissive;
            flashColor = `#${color.getHexString()}`;
        }
        flashScreen(0.04, flashColor);

        // Speed increase
        if (GameState.speed < CONFIG.MAX_SPEED) {
            GameState.speed += CONFIG.SPEED_INCREMENT * 0.08;
        }

        // Enhanced disco ball beat response
        if (discoBallGroup && discoBallGroup.visible) {
            // Scale pulse
            discoBallGroup.scale.set(1.1, 1.1, 1.1);
            setTimeout(() => {
                if (discoBallGroup) discoBallGroup.scale.set(1, 1, 1);
            }, 90);

            // Change color every 4 beats (every ~1.875 seconds at 128 BPM)
            if (this.beatCount % 4 === 0) {
                discoBallColorIndex = (discoBallColorIndex + 1) % 5; // Cycle through 5 colors
                discoBallColorTransition = 0;
            }
        }
    },

    updateVisuals() {
        // Update floor materials
        const emissiveIntensity = 0.15 + this.intensity * 0.25;
        floorTiles.forEach(tile => {
            const floorMesh = tile.children[0];
            if (floorMesh && floorMesh.material) {
                floorMesh.material.emissiveIntensity = emissiveIntensity;
            }
        });

        // Player glow
        if (playerGlow && playerGlow.material) {
            playerGlow.material.opacity = 0.2 + this.intensity * 0.2;
        }

        // Enhanced disco ball visuals
        if (discoBallGroup && discoBallGroup.visible) {
            // Smooth color transition (0.5 second transition time)
            discoBallColorTransition = Math.min(discoBallColorTransition + 0.016, 0.5); // ~16ms per frame

            // Get color palette (defined in skins.js)
            const DISCO_COLORS = [
                { hex: 0xbb00ff }, // purple
                { hex: 0x00ffff }, // cyan
                { hex: 0xff00aa }, // pink
                { hex: 0x0088ff }, // blue
                { hex: 0xffaa00 }  // gold
            ];

            const currentColor = DISCO_COLORS[discoBallColorIndex];
            const nextColor = DISCO_COLORS[(discoBallColorIndex + 1) % DISCO_COLORS.length];
            const t = Math.min(discoBallColorTransition / 0.5, 1); // Normalize to 0-1

            // Smooth color interpolation
            const lerpedColor = new THREE.Color(currentColor.hex).lerp(
                new THREE.Color(nextColor.hex),
                t
            );

            // Apply to core
            if (discoBallCore && discoBallCore.material) {
                discoBallCore.material.emissive.copy(lerpedColor);
                discoBallCore.material.emissiveIntensity = 1.2 + this.intensity * 1.0;
            }

            // Apply to tiles
            if (discoBallTiles && discoBallTiles.material) {
                discoBallTiles.material.emissive.copy(lerpedColor);
                discoBallTiles.material.emissiveIntensity = 0.9 + this.intensity * 0.9;
            }

            // Apply to inner glow
            if (discoBallInnerGlow && discoBallInnerGlow.material) {
                discoBallInnerGlow.material.color.copy(lerpedColor);
                discoBallInnerGlow.material.opacity = 0.35 + this.intensity * 0.2;
            }

            // Apply to outer glow (bloom effect)
            if (discoBallOuterGlow && discoBallOuterGlow.material) {
                discoBallOuterGlow.material.color.copy(lerpedColor);
                discoBallOuterGlow.material.opacity = 0.18 + this.intensity * 0.15;
                // Subtle scale pulse for bloom expansion
                const bloomScale = 1 + this.intensity * 0.08;
                discoBallOuterGlow.scale.set(bloomScale, bloomScale, bloomScale);
            }

            // Apply to light beams
            if (discoBallBeams && discoBallBeams.material) {
                discoBallBeams.material.color.copy(lerpedColor);
                discoBallBeams.material.opacity = 0.4 + this.intensity * 0.25;
            }

            // Apply to sparkles
            if (discoBallSparkles && discoBallSparkles.material) {
                discoBallSparkles.material.color.copy(lerpedColor);
                discoBallSparkles.material.opacity = 0.9 + this.intensity * 0.1;
            }
        }
    },

    shakeCamera() {
        const shakeAmount = 0.06;
        camera.position.y = 6 + (Math.random() - 0.5) * shakeAmount;

        setTimeout(() => {
            camera.position.y = 6;
        }, 40);
    },

    reset() {
        this.lastBeatTime = 0;
        this.beatCount = 0;
        this.intensity = 1;
        discoBallColorIndex = 0;
        discoBallColorTransition = 0;
    }
};
