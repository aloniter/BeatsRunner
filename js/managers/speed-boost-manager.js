/**
 * Find a valid spawn location for a power-up pickup that doesn't overlap existing obstacles.
 * Shared by MagnetManager and SpeedBoostManager.
 * @param {number} [maxAttempts=6] - Maximum random placement attempts
 * @returns {{x: number, z: number}|null} Spawn position or null if all attempts blocked
 */
function findPowerUpSpawnLocation(maxAttempts = 6) {
    const spawnBase = CONFIG.SPAWN_DISTANCE + 10;

    for (let i = 0; i < maxAttempts; i++) {
        const laneIndex = Math.floor(Math.random() * CONFIG.LANE_POSITIONS.length);
        const x = CONFIG.LANE_POSITIONS[laneIndex];
        const z = spawnBase + Math.random() * 20;

        let blocked = false;
        for (const obstacle of obstacles) {
            const dz = Math.abs(obstacle.position.z - z);
            if (obstacle.userData.requiresJump && dz < 14) {
                blocked = true;
                break;
            }
            if (!obstacle.userData.requiresJump && obstacle.userData.lane === laneIndex && dz < 8) {
                blocked = true;
                break;
            }
            if (dz < 6) {
                blocked = true;
                break;
            }
        }

        if (!blocked) {
            return { x, z };
        }
    }

    return null;
}

// ========================================
// SPEED BOOST MODEL - Shared by SpeedBoostManager and ExitBoosterManager
// ========================================
/**
 * Build the speed-boost pickup mesh group: a rocket-shaped assembly of shaft, cone head,
 * two fins, and a cone glow using cached geometries. Returns the group plus arrays of
 * meshes used for glow pulsing and fade-out, so callers can animate without re-traversal.
 * @returns {{ group: THREE.Group, glowMeshes: THREE.Mesh[], fadeMeshes: THREE.Mesh[], flashColor: string }}
 */
function createSpeedBoosterModel() {
    const group = new THREE.Group();

    const shaftGeo = GeometryCache.get('cylinder', 0.16, 0.16, 0.7, 12);
    const shaftMat = new THREE.MeshStandardMaterial({
        color: 0xffcc00,
        emissive: 0xffcc00,
        emissiveIntensity: 1.2,
        metalness: 0.6,
        roughness: 0.25
    });
    const shaft = new THREE.Mesh(shaftGeo, shaftMat);
    shaft.position.y = 0.1;
    group.add(shaft);

    const headGeo = GeometryCache.get('cone', 0.28, 0.6, 16);
    const headMat = new THREE.MeshStandardMaterial({
        color: 0xffff66,
        emissive: 0xffff66,
        emissiveIntensity: 1.4,
        metalness: 0.5,
        roughness: 0.2
    });
    const head = new THREE.Mesh(headGeo, headMat);
    head.position.y = 0.65;
    group.add(head);

    const finGeo = GeometryCache.get('box', 0.12, 0.35, 0.5);
    const finMat = new THREE.MeshStandardMaterial({
        color: 0xffee88,
        emissive: 0xffee88,
        emissiveIntensity: 1,
        metalness: 0.4,
        roughness: 0.3
    });
    const finLeft = new THREE.Mesh(finGeo, finMat);
    finLeft.position.set(-0.22, -0.05, 0);
    finLeft.rotation.z = 0.2;
    group.add(finLeft);

    const finRight = new THREE.Mesh(finGeo, finMat);
    finRight.position.set(0.22, -0.05, 0);
    finRight.rotation.z = -0.2;
    group.add(finRight);

    const glowGeo = GeometryCache.get('cone', 0.5, 1.0, 16, 1, true);
    const glowMat = new THREE.MeshBasicMaterial({
        color: 0xffee88,
        transparent: true,
        opacity: 0.35,
        side: THREE.BackSide
    });
    const glow = new THREE.Mesh(glowGeo, glowMat);
    glow.position.y = 0.55;
    group.add(glow);

    return {
        group,
        glowMeshes: [glow],
        fadeMeshes: [shaft, head, finLeft, finRight, glow],
        flashColor: '#ffdd55'
    };
}

// ========================================
// SPEED BOOST POWER-UP
// ========================================
const SpeedBoostManager = {
    _speedPool: null,
    pickups: [],    // Active speed-boost pickup groups in the scene
    nextSpawnTime: 0,
    minDistance: 220,
    cooldownMin: 28,
    cooldownMax: 40,
    minElapsed: 10,

    /**
     * Lazily create the ObjectPool for speed-boost pickups on first spawn.
     * Re-entrant safe (no-ops if pool already exists).
     */
    initPool() {
        if (this._speedPool) return;
        this._speedPool = new ObjectPool(
            () => {
                const model = createSpeedBoosterModel();
                const pickup = model.group;
                pickup.userData.glowMeshes = model.glowMeshes;
                pickup.userData.fadeMeshes = model.fadeMeshes;
                pickup.userData.flashColor = model.flashColor;
                return pickup;
            },
            (pickup) => {
                pickup.position.set(0, 0, 0);
                pickup.rotation.set(0, 0, 0);
                pickup.scale.set(1, 1, 1);
                pickup.visible = true;
                pickup.userData.baseY = 1.85;
                pickup.userData.phase = Math.random() * Math.PI * 2;
                // Reset glow opacities
                if (pickup.userData.glowMeshes) {
                    pickup.userData.glowMeshes.forEach(mesh => {
                        if (mesh && mesh.material) {
                            mesh.material.opacity = 0.35;
                        }
                    });
                }
            }
        );
    },

    /**
     * Move all active pickups, animate bobbing and glow pulsing, and attempt a new spawn.
     * No-ops while bonus mode is active.
     * @param {number} delta - Seconds since last frame
     * @param {number} elapsed - Total seconds elapsed since game start
     */
    update(delta, elapsed) {
        if (GameState.isBonusActive) return;
        const moveAmount = GameState.speed * delta;

        for (let i = SpeedBoostManager.pickups.length - 1; i >= 0; i--) {
            const pickup = SpeedBoostManager.pickups[i];
            pickup.position.z -= moveAmount;
            pickup.rotation.y += delta * 1.4;
            pickup.rotation.x += delta * 0.5;
            pickup.position.y = pickup.userData.baseY + Math.sin(elapsed * 3.2 + pickup.userData.phase) * 0.2;

            if (pickup.userData.glowMeshes) {
                const glowOpacity = 0.32 + Math.sin(elapsed * 4.5 + i) * 0.18;
                pickup.userData.glowMeshes.forEach(mesh => {
                    if (mesh && mesh.material) {
                        mesh.material.opacity = glowOpacity;
                        mesh.material.transparent = true;
                    }
                });
            }

            if (pickup.position.z < CONFIG.DESPAWN_DISTANCE) {
                scene.remove(pickup);
                if (this._speedPool) {
                    this._speedPool.release(pickup);
                } else {
                    ObstacleManager.disposeObject(pickup);
                }
                SpeedBoostManager.pickups.splice(i, 1);
            }
        }

        this.trySpawn(elapsed);
    },

    /**
     * Check all spawn preconditions and call spawn() if they are met.
     * Power-ups are disabled in Stage Mode. Backs off 4 s if no clear location found.
     * @param {number} elapsed - Total seconds elapsed since game start
     */
    trySpawn(elapsed) {
        // Disable power-ups in Stage Mode
        if (GameState.isStageMode) return;

        if (!player) return;
        if (elapsed < this.minElapsed) return;
        if (GameState.distance < this.minDistance) return;
        if (elapsed < this.nextSpawnTime) return;
        if (SpeedBoostManager.pickups.length > 0) return;

        const spawn = this.findSpawnLocation();
        if (!spawn) {
            this.nextSpawnTime = elapsed + 4;
            return;
        }

        this.spawn(spawn.x, spawn.z, elapsed);
    },

    /**
     * Delegate to the shared power-up spawn location finder.
     * @returns {{x: number, z: number}|null} A clear spawn position, or null if all blocked
     */
    findSpawnLocation() {
        return findPowerUpSpawnLocation();
    },

    /**
     * Acquire a pickup from the pool, position it, and add it to the scene.
     * @param {number} x - World X position (lane center)
     * @param {number} z - World Z position (ahead of player)
     * @param {number} elapsed - Total seconds elapsed since game start
     */
    spawn(x, z, elapsed) {
        this.initPool();
        const pickup = this._speedPool.acquire();
        pickup.position.set(x, 1.85, z);
        pickup.userData.baseY = 1.85;
        pickup.userData.phase = Math.random() * Math.PI * 2;
        scene.add(pickup);
        SpeedBoostManager.pickups.push(pickup);

        this.nextSpawnTime = elapsed + this.randomCooldown();
    },

    /**
     * Test proximity of each speed-boost pickup against the player; collect on contact.
     * Collected pickups are released back to the pool and the speed boost is activated.
     */
    checkCollection() {
        if (!player) return;

        const playerX = player.position.x;
        const playerZ = player.position.z;
        const collectRadius = 1.4;

        for (let i = SpeedBoostManager.pickups.length - 1; i >= 0; i--) {
            const pickup = SpeedBoostManager.pickups[i];
            const dx = pickup.position.x - playerX;
            const dz = pickup.position.z - playerZ;
            const distSq = dx * dx + dz * dz;

            if (distSq < collectRadius * collectRadius) {
                scene.remove(pickup);
                if (this._speedPool) {
                    this._speedPool.release(pickup);
                } else {
                    ObstacleManager.disposeObject(pickup);
                }
                SpeedBoostManager.pickups.splice(i, 1);
                ExitBoosterManager.activateBooster('speed');
                flashScreen(0.1, '#ffdd55');
                playCollectSound();
                if (typeof hapticFeedback !== 'undefined') hapticFeedback.powerUp();
                if (typeof BoosterHUD !== 'undefined') {
                    BoosterHUD.announce('speed');
                    BoosterHUD.activateBadge('speed', CONFIG.POWERUP.SPEED_BOOST.DURATION);
                }
            }
        }
    },

    /**
     * Return a random cooldown duration between cooldownMin and cooldownMax seconds.
     * @returns {number} Cooldown in seconds
     */
    randomCooldown() {
        return this.cooldownMin + Math.random() * (this.cooldownMax - this.cooldownMin);
    },

    /**
     * Release all active pickups back to the pool and reset spawn timer.
     * Called on game restart and when returning to main menu.
     */
    reset() {
        for (let i = SpeedBoostManager.pickups.length - 1; i >= 0; i--) {
            scene.remove(SpeedBoostManager.pickups[i]);
            if (this._speedPool) {
                this._speedPool.release(SpeedBoostManager.pickups[i]);
            } else {
                ObstacleManager.disposeObject(SpeedBoostManager.pickups[i]);
            }
        }
        SpeedBoostManager.pickups.length = 0;
        this.nextSpawnTime = 0;
    }
};
