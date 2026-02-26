// ========================================
// SKIN ANIMATOR - Centralized skin update logic
// Moves per-skin animation code out of the main loop
// ========================================

const FULL_TURN = Math.PI * 2;
const EYE_BALL_SPIN_SPEED = FULL_TURN / 2.4; // clear 360 cycle every ~2.4s

const SkinAnimator = {
    /**
     * Update the currently active skin's animations.
     * Called once per frame from the main game loop.
     */
    update(delta, elapsed) {
        this.updateDiscoBall(delta, elapsed);
        this.updateFireBall(delta, elapsed);
        this.updateRainbowOrb(delta, elapsed);
        this.updateFalafelBall(delta, elapsed);
        this.updatePokeball(delta, elapsed);
        this.updateEyeBall(delta, elapsed);
        this.updateSoccerBall(delta, elapsed);
        this.updateBasketball(delta, elapsed);
        this.updateSun(delta, elapsed);
    },

    // --- Disco Ball ---
    updateDiscoBall(delta, elapsed) {
        if (!discoBallGroup || !discoBallGroup.visible) return;
        discoBallGroup.rotation.y += delta * 0.9;
        if (discoBallGroup.userData.mixer) {
            discoBallGroup.userData.mixer.update(delta);
        }
    },

    // --- Fire Ball ---
    updateFireBall(delta, elapsed) {
        if (!fireBallGroup || !fireBallGroup.visible) return;
        fireBallGroup.rotation.y += delta * 0.6;

        if (QualityManager.shouldUpdateParticles()) {
            // Animate flames
            if (fireBallFlames && fireBallFlames.geometry) {
                const positions = fireBallFlames.geometry.attributes.position.array;
                const basePositions = fireBallFlames.geometry.userData.basePositions;
                const phases = fireBallFlames.geometry.userData.phases;

                if (basePositions && phases) {
                    for (let i = 0; i < positions.length / 3; i++) {
                        const phase = phases[i];
                        positions[i * 3 + 1] = basePositions[i * 3 + 1] +
                            Math.sin(elapsed * 5 + phase) * 0.12 +
                            (elapsed * 0.8 + phase) % 0.6;
                        positions[i * 3] = basePositions[i * 3] + Math.sin(elapsed * 4 + phase) * 0.04;
                        positions[i * 3 + 2] = basePositions[i * 3 + 2] + Math.cos(elapsed * 4 + phase) * 0.04;
                    }
                    fireBallFlames.geometry.attributes.position.needsUpdate = true;
                }
            }

            // Animate embers
            if (fireBallEmbers && fireBallEmbers.geometry) {
                const positions = fireBallEmbers.geometry.attributes.position.array;
                const basePositions = fireBallEmbers.geometry.userData.basePositions;
                const phases = fireBallEmbers.geometry.userData.phases;

                if (basePositions && phases) {
                    for (let i = 0; i < positions.length / 3; i++) {
                        const phase = phases[i];
                        positions[i * 3 + 1] = basePositions[i * 3 + 1] +
                            Math.sin(elapsed * 2.5 + phase) * 0.15 +
                            (elapsed * 0.4 + phase) % 1.0;
                        positions[i * 3] = basePositions[i * 3] + Math.sin(elapsed * 2 + phase) * 0.08;
                        positions[i * 3 + 2] = basePositions[i * 3 + 2] + Math.cos(elapsed * 2 + phase) * 0.08;
                    }
                    fireBallEmbers.geometry.attributes.position.needsUpdate = true;
                }
            }
        }

        // Pulse intensity with beat (keep every frame for visual consistency)
        const beatPulse = Math.abs(Math.sin(elapsed * 3));
        if (fireBallCore && fireBallCore.material) {
            fireBallCore.material.emissiveIntensity = 1.5 + beatPulse * 0.5;
        }
        if (fireBallInnerGlow && fireBallInnerGlow.material) {
            fireBallInnerGlow.material.opacity = 0.4 + beatPulse * 0.15;
        }
    },

    // --- Rainbow Orb ---
    updateRainbowOrb(delta, elapsed) {
        if (!rainbowOrbGroup || !rainbowOrbGroup.visible) return;
        rainbowOrbGroup.rotation.y += delta * 0.55;

        if (QualityManager.shouldUpdateParticles()) {
            if (rainbowOrbTrails && rainbowOrbTrails.geometry) {
                const positions = rainbowOrbTrails.geometry.attributes.position.array;
                const basePositions = rainbowOrbTrails.geometry.userData.basePositions;
                const phases = rainbowOrbTrails.geometry.userData.phases;

                if (basePositions && phases) {
                    for (let i = 0; i < positions.length / 3; i++) {
                        const phase = phases[i];
                        positions[i * 3 + 1] = basePositions[i * 3 + 1] +
                            Math.sin(elapsed * 2 + phase) * 0.18;
                        positions[i * 3] = basePositions[i * 3] +
                            Math.sin(elapsed * 2.5 + phase) * 0.08;
                        positions[i * 3 + 2] = basePositions[i * 3 + 2] +
                            Math.cos(elapsed * 2.5 + phase) * 0.08;
                    }
                    rainbowOrbTrails.geometry.attributes.position.needsUpdate = true;
                }
            }
        }

        const beatPulse = Math.abs(Math.sin(elapsed * 3));
        if (rainbowOrbCore && rainbowOrbCore.material) {
            rainbowOrbCore.material.emissiveIntensity = 1.2 + beatPulse * 0.4;
        }
        if (rainbowOrbInnerGlow && rainbowOrbInnerGlow.material) {
            rainbowOrbInnerGlow.material.opacity = 0.45 + beatPulse * 0.15;
        }
    },

    // --- Falafel Ball ---
    updateFalafelBall(delta, elapsed) {
        if (!falafelBallGroup || !falafelBallGroup.visible) return;
        falafelBallGroup.rotation.y += delta * 0.5;

        if (QualityManager.shouldUpdateParticles()) {
            // Steam particles (rise upward)
            if (falafelBallSteam && falafelBallSteam.geometry) {
                const positions = falafelBallSteam.geometry.attributes.position.array;
                const basePositions = falafelBallSteam.geometry.userData.basePositions;

                for (let i = 0; i < positions.length / 3; i++) {
                    positions[i * 3 + 1] += delta * 0.3;
                    if (positions[i * 3 + 1] > basePositions[i * 3 + 1] + 1.2) {
                        positions[i * 3 + 1] = basePositions[i * 3 + 1];
                    }
                }
                falafelBallSteam.geometry.attributes.position.needsUpdate = true;
            }

            // Crumb particles (fall downward with drift)
            if (falafelBallCrumbs && falafelBallCrumbs.geometry) {
                const positions = falafelBallCrumbs.geometry.attributes.position.array;
                const basePositions = falafelBallCrumbs.geometry.userData.basePositions;
                const phases = falafelBallCrumbs.geometry.userData.phases;

                for (let i = 0; i < positions.length / 3; i++) {
                    const phase = phases[i];
                    positions[i * 3 + 1] -= delta * 0.2;
                    positions[i * 3] = basePositions[i * 3] + Math.sin(elapsed * 1.5 + phase) * 0.06;
                    positions[i * 3 + 2] = basePositions[i * 3 + 2] + Math.cos(elapsed * 1.5 + phase) * 0.06;
                    if (positions[i * 3 + 1] < basePositions[i * 3 + 1] - 1.0) {
                        positions[i * 3 + 1] = basePositions[i * 3 + 1];
                    }
                }
                falafelBallCrumbs.geometry.attributes.position.needsUpdate = true;
            }
        }

        const beatPulse = Math.abs(Math.sin(elapsed * 3));
        if (falafelBallCore && falafelBallCore.material) {
            falafelBallCore.material.emissiveIntensity = 0.8 + beatPulse * 0.3;
        }
        if (falafelBallInnerGlow && falafelBallInnerGlow.material) {
            falafelBallInnerGlow.material.opacity = 0.25 + beatPulse * 0.1;
        }
    },

    // --- Pokeball ---
    /**
     * Spin the Pokéball and update embedded GLB animations (if present).
     * @param {number} delta - Seconds since last frame
     */
    updatePokeball(delta) {
        if (!pokeballGroup || !pokeballGroup.visible) return;

        // Rotation
        pokeballGroup.rotation.y += delta * 1.2;

        // Update embedded GLB animations if present
        if (pokeballGroup.userData.mixer) {
            pokeballGroup.userData.mixer.update(delta);
        }
    },

    // --- Eye Ball ---
    updateEyeBall(delta) {
        if (!eyeBallGroup || !eyeBallGroup.visible) return;

        eyeBallGroup.rotation.y = (eyeBallGroup.rotation.y + delta * EYE_BALL_SPIN_SPEED) % FULL_TURN;

        if (eyeBallGroup.userData.mixer) {
            eyeBallGroup.userData.mixer.update(delta);
        }
    },

    // --- Soccer Ball ---
    updateSoccerBall(delta) {
        if (!soccerBallGroup || !soccerBallGroup.visible) return;

        soccerBallGroup.rotation.y += delta * 1.05;

        if (soccerBallGroup.userData.mixer) {
            soccerBallGroup.userData.mixer.update(delta);
        }
    },

    // --- Basketball ---
    updateBasketball(delta) {
        if (!basketballGroup || !basketballGroup.visible) return;

        basketballGroup.rotation.y += delta * 1.0;

        if (basketballGroup.userData.mixer) {
            basketballGroup.userData.mixer.update(delta);
        }
    },

    // --- Sun ---
    updateSun(delta, elapsed) {
        if (!sunGroup || !sunGroup.visible) return;

        sunGroup.rotation.y += delta * 0.6;

        if (sunGroup.userData.mixer) {
            sunGroup.userData.mixer.update(delta);
        }
    }
};
