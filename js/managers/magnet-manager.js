// ========================================
// MAGNET POWER-UP
// ========================================
const MagnetManager = {
    _magnetPool: null,
    aura: null,          // THREE.Mesh — assigned by createPlayer() in player.js
    _timeoutId: null,    // setTimeout handle for magnet deactivation
    pickups: [],         // Active magnet pickup groups in the scene
    lastSpawnTime: -Infinity,
    nextSpawnTime: 0,
    lastSpawnWasMagnet: false,
    minDistance: 150,
    cooldownMin: 25,
    cooldownMax: 35,
    magnetDuration: 15,
    magnetRange: 10,
    magnetPull: 7,

    /**
     * Lazily create the ObjectPool for magnet pickups on first spawn.
     * Re-entrant safe (no-ops if pool already exists).
     */
    initPool() {
        if (this._magnetPool) return;
        this._magnetPool = new ObjectPool(
            () => this.createPickup(),
            (pickup) => {
                pickup.position.set(0, 0, 0);
                pickup.rotation.set(0, 0, 0);
                pickup.scale.set(1, 1, 1);
                pickup.visible = true;
                pickup.userData.baseY = 1.8;
                pickup.userData.phase = Math.random() * Math.PI * 2;
                // Reset material opacities
                if (pickup.userData.glow && pickup.userData.glow.material) {
                    pickup.userData.glow.material.opacity = 0.2;
                }
            }
        );
    },

    /**
     * Move all active pickups, animate bobbing, and attempt a new spawn each frame.
     * Also pulses the magnet aura while the magnet is active.
     * @param {number} delta - Seconds since last frame
     * @param {number} elapsed - Total seconds elapsed since game start
     */
    update(delta, elapsed) {
        const moveAmount = GameState.speed * delta;

        for (let i = MagnetManager.pickups.length - 1; i >= 0; i--) {
            const pickup = MagnetManager.pickups[i];

            pickup.position.z -= moveAmount;
            pickup.rotation.y += delta * 1.6;
            pickup.rotation.x += delta * 0.6;
            pickup.position.y = pickup.userData.baseY + Math.sin(elapsed * 3 + pickup.userData.phase) * 0.2;

            if (pickup.position.z < CONFIG.DESPAWN_DISTANCE) {
                scene.remove(pickup);
                if (this._magnetPool) {
                    this._magnetPool.release(pickup);
                } else {
                    ObstacleManager.disposeObject(pickup);
                }
                MagnetManager.pickups.splice(i, 1);
            }
        }

        if (GameState.isMagnetActive && MagnetManager.aura) {
            const pulse = 0.9 + Math.sin(elapsed * 5) * 0.08;
            MagnetManager.aura.scale.set(pulse, pulse, pulse);
        }

        this.trySpawn(elapsed);
    },

    /**
     * Check all spawn preconditions and call spawn() if they are met.
     * Power-ups are disabled in Stage Mode. Backs off 4 s if no clear location found.
     * @param {number} elapsed - Total seconds elapsed since game start
     */
    trySpawn(elapsed) {
        if (GameState.isStageMode) return;
        if (!player) return;
        if (GameState.distance < this.minDistance) return;
        if (elapsed < this.nextSpawnTime) return;
        if (this.lastSpawnWasMagnet) return;
        if (MagnetManager.pickups.length > 0 || GameState.isMagnetActive) return;

        const spawn = this.findSpawnLocation();
        if (!spawn) {
            this.nextSpawnTime = elapsed + 4;
            return;
        }

        this.spawn(spawn.x, spawn.z, elapsed);
    },

    /**
     * Delegate to the shared power-up spawn location finder.
     * Tries up to 6 random positions, rejecting those blocked by obstacles.
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
        const pickup = this._magnetPool.acquire();
        pickup.position.set(x, 1.8, z);
        pickup.userData.baseY = 1.8;
        pickup.userData.phase = Math.random() * Math.PI * 2;
        scene.add(pickup);
        MagnetManager.pickups.push(pickup);

        this.lastSpawnWasMagnet = true;
        this.lastSpawnTime = elapsed;
        this.nextSpawnTime = elapsed + this.randomCooldown();
    },

    /**
     * Build the magnet pickup mesh group using cached geometries.
     * Sub-mesh references are stored in group.userData for efficient pool resets.
     * @returns {THREE.Group}
     */
    createPickup() {
        const group = new THREE.Group();

        const bodyGeo = GeometryCache.get('torus', 0.5, 0.12, 10, 24, Math.PI);
        const bodyMat = new THREE.MeshStandardMaterial({
            color: CONFIG.COLORS.ORANGE,
            emissive: CONFIG.COLORS.ORANGE,
            emissiveIntensity: 0.6,
            metalness: 0.8,
            roughness: 0.2
        });
        const body = new THREE.Mesh(bodyGeo, bodyMat);
        body.rotation.z = Math.PI;
        group.add(body);

        const poleGeo = GeometryCache.get('cylinder', 0.12, 0.12, 0.35, 12);
        const poleMat = new THREE.MeshStandardMaterial({
            color: CONFIG.COLORS.WHITE,
            emissive: CONFIG.COLORS.WHITE,
            emissiveIntensity: 0.8,
            metalness: 0.9,
            roughness: 0.1
        });
        const leftPole = new THREE.Mesh(poleGeo, poleMat);
        leftPole.position.set(-0.45, -0.35, 0);
        group.add(leftPole);

        const rightPole = new THREE.Mesh(poleGeo, poleMat);
        rightPole.position.set(0.45, -0.35, 0);
        group.add(rightPole);

        const glowGeo = GeometryCache.get('sphere', 0.75, 12, 12);
        const glowMat = new THREE.MeshBasicMaterial({
            color: CONFIG.COLORS.ORANGE,
            transparent: true,
            opacity: 0.2
        });
        const glow = new THREE.Mesh(glowGeo, glowMat);
        group.add(glow);

        // Store refs for pool reset
        group.userData.body = body;
        group.userData.leftPole = leftPole;
        group.userData.rightPole = rightPole;
        group.userData.glow = glow;

        return group;
    },

    /**
     * Test proximity of each magnet pickup against the player; collect on contact.
     * Collected pickups are released back to the pool and the magnet is activated.
     */
    checkCollection() {
        if (!player) return;

        const playerX = player.position.x;
        const playerZ = player.position.z;
        const collectRadius = 1.4;

        for (let i = MagnetManager.pickups.length - 1; i >= 0; i--) {
            const pickup = MagnetManager.pickups[i];
            const dx = pickup.position.x - playerX;
            const dz = pickup.position.z - playerZ;
            const distSq = dx * dx + dz * dz;

            if (distSq < collectRadius * collectRadius) {
                scene.remove(pickup);
                if (this._magnetPool) {
                    this._magnetPool.release(pickup);
                } else {
                    ObstacleManager.disposeObject(pickup);
                }
                MagnetManager.pickups.splice(i, 1);
                this.activate();
                flashScreen(0.1, '#66ffff');
                if (typeof hapticFeedback !== 'undefined') hapticFeedback.powerUp();
                if (typeof BoosterHUD !== 'undefined') {
                    BoosterHUD.announce('magnet');
                    BoosterHUD.activateBadge('magnet', MagnetManager.magnetDuration);
                }
            }
        }
    },

    /**
     * Enable the magnet, show the aura, and schedule auto-deactivation after magnetDuration.
     * No-ops if already active (prevents timeout stacking).
     */
    activate() {
        if (GameState.isMagnetActive) return;
        GameState.isMagnetActive = true;
        if (MagnetManager.aura) {
            MagnetManager.aura.visible = true;
        }
        if (MagnetManager._timeoutId) {
            clearTimeout(MagnetManager._timeoutId);
        }
        MagnetManager._timeoutId = setTimeout(() => {
            this.deactivate();
        }, this.magnetDuration * 1000);
    },

    /**
     * Disable the magnet effect and hide the aura.
     */
    deactivate() {
        GameState.isMagnetActive = false;
        if (MagnetManager.aura) {
            MagnetManager.aura.visible = false;
            MagnetManager.aura.scale.set(1, 1, 1);
        }
        if (typeof BoosterHUD !== 'undefined') BoosterHUD.removeBadge('magnet');
    },

    /**
     * Return a random cooldown duration between cooldownMin and cooldownMax seconds.
     * @returns {number} Cooldown in seconds
     */
    randomCooldown() {
        return this.cooldownMin + Math.random() * (this.cooldownMax - this.cooldownMin);
    },

    /**
     * Release all active pickups back to the pool, deactivate the magnet effect,
     * and cancel any pending timeout. Called on game restart and menu return.
     */
    reset() {
        for (let i = MagnetManager.pickups.length - 1; i >= 0; i--) {
            scene.remove(MagnetManager.pickups[i]);
            if (this._magnetPool) {
                this._magnetPool.release(MagnetManager.pickups[i]);
            } else {
                ObstacleManager.disposeObject(MagnetManager.pickups[i]);
            }
        }
        MagnetManager.pickups.length = 0;
        this.lastSpawnTime = -Infinity;
        this.nextSpawnTime = this.randomCooldown();
        this.lastSpawnWasMagnet = false;
        this.deactivate();
        if (MagnetManager._timeoutId) {
            clearTimeout(MagnetManager._timeoutId);
            MagnetManager._timeoutId = null;
        }
    }
};
