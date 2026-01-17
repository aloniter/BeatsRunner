// ========================================
// COLLECTIBLES - Glowing Orbs
// ========================================
const CollectibleManager = {
    spawn(x, z) {
        if (GameState.isBonusActive) return;
        const orb = this.createOrb();
        orb.position.set(x, 1.7, z);
        orb.userData.baseY = 1.7;
        orb.userData.phase = Math.random() * Math.PI * 2;
        scene.add(orb);
        collectibles.push(orb);
        MagnetManager.lastSpawnWasMagnet = false;
    },

    createOrb() {
        const group = new THREE.Group();

        const chosenColor = CONFIG.COLORS.CYAN;

        // Core - smooth sphere (no hard edges)
        const coreGeo = new THREE.SphereGeometry(0.28, 16, 16);
        const coreMat = new THREE.MeshStandardMaterial({
            color: chosenColor,
            emissive: chosenColor,
            emissiveIntensity: 1.2,
            metalness: 0,      // No metallic reflections
            roughness: 0.3,    // Soft, energy-like appearance
            transparent: true,
            opacity: 0.95
        });
        const core = new THREE.Mesh(coreGeo, coreMat);
        group.add(core);

        // Outer glow - soft energy aura
        const glowGeo = new THREE.SphereGeometry(0.45, 12, 12);
        const glowMat = new THREE.MeshBasicMaterial({
            color: chosenColor,
            transparent: true,
            opacity: 0.3,
            side: THREE.BackSide
        });
        const glow = new THREE.Mesh(glowGeo, glowMat);
        group.add(glow);

        // Ring - energy shimmer
        const ringGeo = new THREE.TorusGeometry(0.35, 0.025, 6, 20);
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
                const dist = Math.sqrt(dx * dx + dz * dz);

                if (dist < MagnetManager.magnetRange) {
                    const pull = (1 - dist / MagnetManager.magnetRange) * MagnetManager.magnetPull;
                    orb.position.x += dx * pull * delta;
                    orb.position.z += dz * pull * delta * 0.65;
                }
            }

            // Remove if behind
            if (orb.position.z < CONFIG.DESPAWN_DISTANCE) {
                scene.remove(orb);
                collectibles.splice(i, 1);
            }
        }
    },

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
            const dist = Math.sqrt(dx * dx + dz * dz);

            if (dist < collectRadius) {
                GameState.orbs++;
                GameState.score += 100;
                addOrbs(1);

                // Track orbs for Stage Mode star calculation
                if (GameState.isStageMode) {
                    GameState.orbsCollected++;
                }

                scene.remove(orb);
                collectibles.splice(i, 1);

                playCollectSound();
                flashScreen(0.08, '#00ffff');
            }
        }
    },

    reset() {
        for (let i = collectibles.length - 1; i >= 0; i--) {
            scene.remove(collectibles[i]);
        }
        collectibles.length = 0;
    }
};
