// ========================================
// SKIN ANIMATOR - Centralized skin update logic
// Moves per-skin animation code out of the main loop
// ========================================

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
    },

    // --- Disco Ball ---
    updateDiscoBall(delta, elapsed) {
        if (!discoBallGroup || !discoBallGroup.visible) return;
        discoBallGroup.rotation.y += delta * 0.9;
        if (discoBallBeams) {
            discoBallBeams.rotation.y += delta * 1.5;
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
     * Spin the Pokéball, pulse glow layers, animate energy sparks, update
     * AnimationMixer (if the GLB has embedded clips), and wobble on the beat.
     * children[0]=innerGlow, children[1]=outerGlow, children[2]=sparks,
     * children[3+]=GLB model (when loaded).
     * @param {number} delta - Seconds since last frame
     * @param {number} elapsed - Total elapsed seconds
     */
    updatePokeball(delta, elapsed) {
        if (!pokeballGroup || !pokeballGroup.visible) return;

        // Rotation
        pokeballGroup.rotation.y += delta * 1.2;

        // Update embedded GLB animations if present
        if (pokeballGroup.userData.mixer) {
            pokeballGroup.userData.mixer.update(delta);
        }

        // Glow pulse
        const beatPulse = Math.abs(Math.sin(elapsed * 3));
        const innerGlow = pokeballGroup.children[0];
        const outerGlow = pokeballGroup.children[1];
        if (innerGlow && innerGlow.material) {
            innerGlow.material.opacity = 0.18 + beatPulse * 0.14;
        }
        if (outerGlow && outerGlow.material) {
            outerGlow.material.opacity = 0.08 + beatPulse * 0.08;
        }

        // Animate energy sparks (children[2] = Points)
        if (QualityManager.shouldUpdateParticles()) {
            const sparks = pokeballGroup.children[2];
            if (sparks && sparks.geometry && sparks.geometry.userData.basePositions) {
                const positions = sparks.geometry.attributes.position.array;
                const basePositions = sparks.geometry.userData.basePositions;
                const phases = sparks.geometry.userData.phases;

                for (let i = 0; i < positions.length / 3; i++) {
                    const phase = phases[i];
                    // Orbit around the ball
                    positions[i * 3]     = basePositions[i * 3] + Math.sin(elapsed * 3 + phase) * 0.1;
                    positions[i * 3 + 1] = basePositions[i * 3 + 1] + Math.sin(elapsed * 2 + phase) * 0.12;
                    positions[i * 3 + 2] = basePositions[i * 3 + 2] + Math.cos(elapsed * 3 + phase) * 0.1;
                }
                sparks.geometry.attributes.position.needsUpdate = true;

                // Red ↔ white color cycling
                const colorT = (Math.sin(elapsed * 2) + 1) * 0.5;
                sparks.material.color.lerpColors(
                    new THREE.Color(0xff2222),
                    new THREE.Color(0xffffff),
                    colorT
                );
            }
        }

        // Subtle scale wobble on the model mesh
        if (pokeballGroup.userData.model) {
            const m = pokeballGroup.userData.model;
            if (!m.userData.baseScale) m.userData.baseScale = m.scale.x;
            const wobble = 1 + Math.sin(elapsed * 3) * 0.015;
            const s = m.userData.baseScale * wobble;
            m.scale.set(s, s, s);
        }
    }
};
