// ========================================
// COLLECTIBLES - Glowing Orbs
// ========================================
const CollectibleManager = {
    _orbPool: null,

    /**
     * Lazily create the ObjectPool for orb pickups on first spawn.
     * Re-entrant safe (no-ops if pool already exists).
     */
    initPool() {
        if (this._orbPool) return;
        this._orbPool = new ObjectPool(
            () => this.createOrb(),
            (orb) => {
                orb.position.set(0, 0, 0);
                orb.rotation.set(0, 0, 0);
                orb.scale.set(1, 1, 1);
                orb.visible = true;
                orb.userData.baseY = 1.7;
                orb.userData.phase = Math.random() * Math.PI * 2;
                // Reset material opacities
                if (orb.userData.core && orb.userData.core.material) {
                    orb.userData.core.material.emissiveIntensity = orb.userData.baseEmissive || 1.2;
                    orb.userData.core.material.opacity = 0.95;
                }
                if (orb.userData.glow && orb.userData.glow.material) {
                    orb.userData.glow.material.opacity = 0.3;
                }
                if (orb.userData.ring && orb.userData.ring.material) {
                    orb.userData.ring.material.opacity = 0.4;
                }
            }
        );
    },

    /**
     * Traverse and dispose all non-cached materials and geometries on an orb group.
     * Only used as a fallback when the pool is unavailable.
     * @param {THREE.Group} orb - The orb group to dispose
     */
    disposeOrb(orb) {
        orb.traverse(child => {
            // Don't dispose cached geometries
            if (child.geometry && typeof GeometryCache !== 'undefined' && !GeometryCache._cache.has(child.geometry)) {
                child.geometry.dispose();
            }
            if (child.material) child.material.dispose();
        });
    },

    /**
     * Acquire an orb from the pool, position it, and add it to the scene.
     * No-ops while bonus mode is active (bonus orbs are handled by BonusOrbManager).
     * Also clears the magnet's consecutive-magnet guard so the next pickup can be a magnet.
     * @param {number} x - World X position (lane center)
     * @param {number} z - World Z spawn position
     */
    spawn(x, z) {
        if (GameState.isBonusActive) return;
        this.initPool();
        const orb = this._orbPool.acquire();
        orb.position.set(x, 1.7, z);
        orb.userData.baseY = 1.7;
        orb.userData.phase = Math.random() * Math.PI * 2;
        scene.add(orb);
        collectibles.push(orb);
        MagnetManager.lastSpawnWasMagnet = false;
    },

    /**
     * Build a collectible orb mesh group using cached geometries: cyan core sphere,
     * outer glow sphere, and equatorial ring. Sub-mesh refs stored in group.userData
     * for efficient pool resets without re-traversal.
     * @returns {THREE.Group}
     */
    createOrb() {
        const group = new THREE.Group();

        const chosenColor = CONFIG.COLORS.CYAN;

        // Core - smooth sphere (no hard edges) — use GeometryCache
        const coreGeo = GeometryCache.get('sphere', 0.28, 16, 16);
        const coreMat = new THREE.MeshStandardMaterial({
            color: chosenColor,
            emissive: chosenColor,
            emissiveIntensity: 1.2,
            metalness: 0,
            roughness: 0.3,
            transparent: true,
            opacity: 0.95
        });
        const core = new THREE.Mesh(coreGeo, coreMat);
        group.add(core);

        // Outer glow - soft energy aura
        const glowGeo = GeometryCache.get('sphere', 0.45, 12, 12);
        const glowMat = new THREE.MeshBasicMaterial({
            color: chosenColor,
            transparent: true,
            opacity: 0.3,
            side: THREE.BackSide
        });
        const glow = new THREE.Mesh(glowGeo, glowMat);
        group.add(glow);

        // Ring - energy shimmer
        const ringGeo = GeometryCache.get('torus', 0.35, 0.025, 6, 20);
        const ringMat = new THREE.MeshBasicMaterial({
            color: CONFIG.COLORS.WHITE,
            transparent: true,
            opacity: 0.4
        });
        const ring = new THREE.Mesh(ringGeo, ringMat);
        group.add(ring);

        // Store references for animation
        group.userData.core = core;
        group.userData.glow = glow;
        group.userData.ring = ring;
        group.userData.baseEmissive = 1.2;

        return group;
    },

    /**
     * Move all active orbs, animate bobbing/rotation/glow pulsing, apply magnet pull,
     * and despawn orbs that have passed behind the player.
     * No-ops (and clears all orbs) if bonus mode is active.
     * @param {number} delta - Seconds since last frame
     * @param {number} elapsed - Total seconds elapsed since game start
     */
    update(delta, elapsed) {
        if (GameState.isBonusActive) {
            if (collectibles.length > 0) {
                this.reset();
            }
            return;
        }
        const moveAmount = GameState.speed * delta;
        const magnetActive = GameState.isMagnetActive && player;
        const playerX = magnetActive ? player.position.x : 0;
        const playerZ = magnetActive ? player.position.z : 0;

        for (let i = collectibles.length - 1; i >= 0; i--) {
            const orb = collectibles[i];

            // Move toward player
            orb.position.z -= moveAmount;

            // Rotation
            orb.rotation.y += delta * 3;
            orb.rotation.x += delta * 2;

            // Bobbing
            orb.position.y = orb.userData.baseY + Math.sin(elapsed * 5 + orb.userData.phase) * 0.15;

            // Beat-synchronized pulsing (subtle shimmer)
            if (orb.userData.core) {
                const beatPulse = 1 + Math.sin(elapsed * 8 + orb.userData.phase) * 0.15;
                orb.userData.core.material.emissiveIntensity = orb.userData.baseEmissive * beatPulse;

                // Glow pulsing
                if (orb.userData.glow) {
                    orb.userData.glow.material.opacity = 0.25 + Math.sin(elapsed * 6 + orb.userData.phase) * 0.08;
                }

                // Ring shimmer
                if (orb.userData.ring) {
                    orb.userData.ring.material.opacity = 0.3 + Math.sin(elapsed * 7 + orb.userData.phase) * 0.15;
                }
            }

            if (magnetActive) {
                const dx = playerX - orb.position.x;
                const dz = playerZ - orb.position.z;
                const distSq = dx * dx + dz * dz;
                const rangeSq = MagnetManager.magnetRange * MagnetManager.magnetRange;

                if (distSq < rangeSq) {
                    const dist = Math.sqrt(distSq);
                    const pull = (1 - dist / MagnetManager.magnetRange) * MagnetManager.magnetPull;
                    orb.position.x += dx * pull * delta;
                    orb.position.z += dz * pull * delta * 0.65;
                }
            }

            // Remove if behind — release to pool for reuse
            if (orb.position.z < CONFIG.DESPAWN_DISTANCE) {
                scene.remove(orb);
                if (this._orbPool) {
                    this._orbPool.release(orb);
                } else {
                    this.disposeOrb(orb);
                }
                collectibles.splice(i, 1);
            }
        }
    },

    /**
     * Test proximity of each orb against the player; collect on contact.
     * Awards beat-timed points, updates combo/multiplier, triggers particle burst,
     * camera shake, haptic feedback, and floating timing label. No-ops in bonus mode.
     */
    checkCollection() {
        if (GameState.isBonusActive) return;
        if (!player) return;

        const playerX = player.position.x;
        const playerZ = player.position.z;
        const collectRadius = 1.3;

        for (let i = collectibles.length - 1; i >= 0; i--) {
            const orb = collectibles[i];
            const dx = orb.position.x - playerX;
            const dz = orb.position.z - playerZ;
            const distSq = dx * dx + dz * dz;

            if (distSq < collectRadius * collectRadius) {
                // Get timing accuracy for rhythm bonus
                const elapsed = (performance.now() - GameState.gameStartTime) / 1000;
                const timing = BeatManager.getTimingAccuracy(elapsed);
                const comboMultiplier = GameState.multiplier;
                const basePoints = 100;
                const points = Math.floor(basePoints * timing.multiplier * comboMultiplier);

                GameState.orbs++;
                GameState.score += points;
                addOrbs(1);

                // Update combo
                if (timing.rating === 'PERFECT' || timing.rating === 'GOOD') {
                    GameState.combo++;
                    if (GameState.combo > GameState.maxCombo) {
                        GameState.maxCombo = GameState.combo;
                    }
                    // Multiplier increases every 5 combo, max 3x
                    GameState.multiplier = Math.min(3, 1 + Math.floor(GameState.combo / 5) * 0.5);
                    // Play combo milestone sound
                    if (GameState.combo % 5 === 0 && typeof playComboSound === 'function') {
                        playComboSound(GameState.combo);
                    }
                } else if (timing.rating === 'MISS') {
                    GameState.combo = 0;
                    GameState.multiplier = 1;
                }
                GameState.lastCollectionRating = timing.rating;

                // Play timing feedback sound
                if (typeof playTimingSound === 'function') {
                    playTimingSound(timing.rating);
                }

                // Track orbs for Stage Mode star calculation
                if (GameState.isStageMode) {
                    GameState.orbsCollected++;
                }

                // Store orb position before removing
                const orbPos = orb.position.clone();

                scene.remove(orb);
                if (this._orbPool) {
                    this._orbPool.release(orb);
                } else {
                    this.disposeOrb(orb);
                }
                collectibles.splice(i, 1);

                playCollectSound();
                flashScreen(0.08, '#00ffff');

                // Show floating timing feedback
                if (typeof showTimingFeedback === 'function') {
                    showTimingFeedback(orbPos, timing.rating, points, timing.color);
                }

                // Add collection feedback
                if (cameraShake) cameraShake.addTrauma(0.15);
                if (typeof createParticleBurst === 'function') {
                    const burstCount = qualitySettings?.effects?.particleBurstCounts?.collect || 8;
                    createParticleBurst(orbPos, {
                        count: burstCount,
                        color: 0x00ffaa,
                        spread: 0.8,
                        duration: 0.5
                    });
                }
                if (typeof hapticFeedback !== 'undefined') {
                    hapticFeedback.collect();
                }
            }
        }
    },

    /**
     * Release all active orbs back to the pool and clear the collectibles array.
     * Called on game restart and when returning to main menu.
     */
    reset() {
        for (let i = collectibles.length - 1; i >= 0; i--) {
            scene.remove(collectibles[i]);
            if (this._orbPool) {
                this._orbPool.release(collectibles[i]);
            } else {
                this.disposeOrb(collectibles[i]);
            }
        }
        collectibles.length = 0;
    }
};
