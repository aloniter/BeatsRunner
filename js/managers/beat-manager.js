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
        }

        // Rainbow orb beat response
        if (rainbowOrbGroup && rainbowOrbGroup.visible) {
            // Change rainbow orb color every 3 beats (faster than disco's 4 beats)
            if (this.beatCount % 3 === 0) {
                rainbowOrbColorIndex = (rainbowOrbColorIndex + 1) % 7; // 7 colors
                rainbowOrbColorTransition = 0;
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

        // Disco ball - traditional silver appearance with subtle beat response
        if (discoBallGroup && discoBallGroup.visible) {
            const SILVER_COLOR = 0xc0c0c0; // Traditional disco ball silver

            // Apply static silver to all components
            if (discoBallCore && discoBallCore.material) {
                discoBallCore.material.emissive.setHex(SILVER_COLOR);
                discoBallCore.material.emissiveIntensity = 0.8 + this.intensity * 0.4; // Subtle pulse
            }

            if (discoBallTiles && discoBallTiles.material) {
                discoBallTiles.material.emissive.setHex(SILVER_COLOR);
                discoBallTiles.material.emissiveIntensity = 0.6 + this.intensity * 0.3;
            }

            if (discoBallInnerGlow && discoBallInnerGlow.material) {
                discoBallInnerGlow.material.color.setHex(0xe8e8e8); // Light silver glow
                discoBallInnerGlow.material.opacity = 0.2 + this.intensity * 0.15;
            }

            if (discoBallOuterGlow && discoBallOuterGlow.material) {
                discoBallOuterGlow.material.color.setHex(0xffffff); // White bloom
                discoBallOuterGlow.material.opacity = 0.12 + this.intensity * 0.1;
            }

            if (discoBallBeams && discoBallBeams.material) {
                discoBallBeams.material.color.setHex(0xe8e8e8);
                discoBallBeams.material.opacity = 0.3 + this.intensity * 0.2;
            }

            if (discoBallSparkles && discoBallSparkles.material) {
                discoBallSparkles.material.color.setHex(0xffffff); // White sparkles
                discoBallSparkles.material.opacity = 0.8 + this.intensity * 0.2;
            }
        }

        // Enhanced rainbow orb visuals
        if (rainbowOrbGroup && rainbowOrbGroup.visible) {
            // Smooth color transition (0.5 second transition time)
            rainbowOrbColorTransition = Math.min(rainbowOrbColorTransition + 0.016, 0.5);

            // Use 7-color rainbow palette (defined in rainbow-orb.js)
            const RAINBOW_COLORS = [
                { hex: 0xff0000 }, // red
                { hex: 0xff7f00 }, // orange
                { hex: 0xffff00 }, // yellow
                { hex: 0x00ff00 }, // green
                { hex: 0x0000ff }, // blue
                { hex: 0x4b0082 }, // indigo
                { hex: 0x9400d3 }  // violet
            ];

            const currentColor = RAINBOW_COLORS[rainbowOrbColorIndex];
            const nextColor = RAINBOW_COLORS[(rainbowOrbColorIndex + 1) % RAINBOW_COLORS.length];
            const t = Math.min(rainbowOrbColorTransition / 0.5, 1);

            // Smooth color interpolation
            const lerpedColor = new THREE.Color(currentColor.hex).lerp(
                new THREE.Color(nextColor.hex),
                t
            );

            // Apply to core
            if (rainbowOrbCore && rainbowOrbCore.material) {
                rainbowOrbCore.material.emissive.copy(lerpedColor);
                rainbowOrbCore.material.emissiveIntensity = 1.2 + this.intensity * 0.6;
            }

            // Apply to inner glow
            if (rainbowOrbInnerGlow && rainbowOrbInnerGlow.material) {
                rainbowOrbInnerGlow.material.color.copy(lerpedColor);
                rainbowOrbInnerGlow.material.opacity = 0.45 + this.intensity * 0.2;
            }

            // Apply to outer glow
            if (rainbowOrbOuterGlow && rainbowOrbOuterGlow.material) {
                rainbowOrbOuterGlow.material.color.copy(lerpedColor);
                rainbowOrbOuterGlow.material.opacity = 0.25 + this.intensity * 0.15;
            }

            // Apply to trail particles
            if (rainbowOrbTrails && rainbowOrbTrails.material) {
                rainbowOrbTrails.material.color.copy(lerpedColor);
                rainbowOrbTrails.material.opacity = 0.85 + this.intensity * 0.15;
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
        rainbowOrbColorIndex = 0;
        rainbowOrbColorTransition = 0;
    }
};
