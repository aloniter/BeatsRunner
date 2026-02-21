// ========================================
// SHIELD POWER-UP
// ========================================
const ShieldManager = {
    _shieldPool: null,
    aura: null,             // THREE.Group — assigned by createPlayer() in player.js
    _breakTimeoutId: null,  // setTimeout handle for post-break scale reset
    pickups: [],            // Active shield pickup groups in the scene
    nextSpawnTime: 0,
    minDistance: 200,
    cooldownMin: 30,
    cooldownMax: 45,
    minElapsed: 8,

    /**
     * Lazily create the ObjectPool for shield pickups on first spawn.
     * Re-entrant safe (no-ops if pool already exists).
     */
    initPool() {
        if (this._shieldPool) return;
        this._shieldPool = new ObjectPool(
            () => this.createPickup(),
            (pickup) => {
                pickup.position.set(0, 0, 0);
                pickup.rotation.set(0, 0, 0);
                pickup.scale.set(1, 1, 1);
                pickup.visible = true;
                pickup.userData.phase = Math.random() * Math.PI * 2;
                // Reset material opacities
                if (pickup.userData.glow && pickup.userData.glow.material) {
                    pickup.userData.glow.material.opacity = 0.35;
                }
                if (pickup.userData.ring && pickup.userData.ring.material) {
                    pickup.userData.ring.material.opacity = 0.5;
                }
                if (pickup.userData.shieldIcon && pickup.userData.shieldIcon.material) {
                    pickup.userData.shieldIcon.material.opacity = 0.6;
                }
            }
        );
    },

    /**
     * Move all active pickups, animate pulse, and attempt a new spawn each frame.
     * @param {number} delta - Seconds since last frame
     * @param {number} elapsed - Total seconds elapsed since game start
     */
    update(delta, elapsed) {
        const moveAmount = GameState.speed * delta;

        for (let i = ShieldManager.pickups.length - 1; i >= 0; i--) {
            const pickup = ShieldManager.pickups[i];

            pickup.position.z -= moveAmount;
            pickup.rotation.y += delta * 1.3;
            pickup.rotation.x += delta * 0.5;
            const pulse = 1 + Math.sin(elapsed * 4 + pickup.userData.phase) * 0.06;
            pickup.scale.set(pulse, pulse, pulse);

            if (pickup.position.z < CONFIG.DESPAWN_DISTANCE) {
                scene.remove(pickup);
                if (this._shieldPool) {
                    this._shieldPool.release(pickup);
                } else {
                    ObstacleManager.disposeObject(pickup);
                }
                ShieldManager.pickups.splice(i, 1);
            }
        }

        if (GameState.hasShield && ShieldManager.aura) {
            const auraPulse = 0.98 + Math.sin(elapsed * 3.5) * 0.04;
            ShieldManager.aura.scale.set(auraPulse, auraPulse, auraPulse);
        }

        this.trySpawn(elapsed);
    },

    /**
     * Check all spawn preconditions and call spawn() if they are met.
     * Power-ups are disabled in Stage Mode.
     * @param {number} elapsed - Total seconds elapsed since game start
     */
    trySpawn(elapsed) {
        if (GameState.isStageMode) return;
        if (!player) return;
        if (elapsed < this.minElapsed) return;
        if (GameState.distance < this.minDistance) return;
        if (elapsed < this.nextSpawnTime) return;
        if (GameState.hasShield) return;
        if (ShieldManager.pickups.length > 0) return;

        this.spawn(elapsed);
    },

    /**
     * Acquire a pickup from the pool, position it at a random lane, and add it to the scene.
     * @param {number} elapsed - Total seconds elapsed since game start
     */
    spawn(elapsed) {
        this.initPool();
        const laneIndex = Math.floor(Math.random() * CONFIG.LANE_POSITIONS.length);
        const x = CONFIG.LANE_POSITIONS[laneIndex];
        const z = CONFIG.SPAWN_DISTANCE + 12 + Math.random() * 14;
        const pickup = this._shieldPool.acquire();

        pickup.position.set(x, 1.9, z);
        pickup.userData.phase = Math.random() * Math.PI * 2;
        scene.add(pickup);
        ShieldManager.pickups.push(pickup);

        this.nextSpawnTime = elapsed + this.randomCooldown();
    },

    /**
     * Build the shield pickup mesh group using cached geometries.
     * Sub-mesh references are stored in group.userData for efficient pool resets.
     * @returns {THREE.Group}
     */
    createPickup() {
        const group = new THREE.Group();

        const coreGeo = GeometryCache.get('sphere', 0.35, 16, 16);
        const coreMat = new THREE.MeshStandardMaterial({
            color: CONFIG.COLORS.BLUE,
            emissive: CONFIG.COLORS.BLUE,
            emissiveIntensity: 1,
            metalness: 0.7,
            roughness: 0.2
        });
        const core = new THREE.Mesh(coreGeo, coreMat);
        group.add(core);

        const glowGeo = GeometryCache.get('sphere', 0.65, 14, 14);
        const glowMat = new THREE.MeshBasicMaterial({
            color: CONFIG.COLORS.CYAN,
            transparent: true,
            opacity: 0.35
        });
        const glow = new THREE.Mesh(glowGeo, glowMat);
        group.add(glow);

        const ringGeo = GeometryCache.get('torus', 0.5, 0.05, 10, 28);
        const ringMat = new THREE.MeshBasicMaterial({
            color: CONFIG.COLORS.WHITE,
            transparent: true,
            opacity: 0.5
        });
        const ring = new THREE.Mesh(ringGeo, ringMat);
        ring.rotation.x = Math.PI / 2;
        group.add(ring);

        const shieldShape = new THREE.Shape();
        shieldShape.moveTo(0, 0.6);
        shieldShape.quadraticCurveTo(0.45, 0.45, 0.5, 0.1);
        shieldShape.quadraticCurveTo(0.45, -0.35, 0, -0.7);
        shieldShape.quadraticCurveTo(-0.45, -0.35, -0.5, 0.1);
        shieldShape.quadraticCurveTo(-0.45, 0.45, 0, 0.6);
        const shieldGeo = new THREE.ShapeGeometry(shieldShape);
        const shieldMat = new THREE.MeshBasicMaterial({
            color: CONFIG.COLORS.WHITE,
            transparent: true,
            opacity: 0.6,
            side: THREE.DoubleSide
        });
        const shieldIcon = new THREE.Mesh(shieldGeo, shieldMat);
        shieldIcon.position.z = 0.55;
        group.add(shieldIcon);

        // Store refs for pool reset
        group.userData.core = core;
        group.userData.glow = glow;
        group.userData.ring = ring;
        group.userData.shieldIcon = shieldIcon;

        return group;
    },

    /**
     * Test proximity of each shield pickup against the player; collect on contact.
     * Collected pickups are released back to the pool and shield is activated.
     */
    checkCollection() {
        if (!player) return;

        const playerX = player.position.x;
        const playerZ = player.position.z;
        const collectRadius = 1.4;

        for (let i = ShieldManager.pickups.length - 1; i >= 0; i--) {
            const pickup = ShieldManager.pickups[i];
            const dx = pickup.position.x - playerX;
            const dz = pickup.position.z - playerZ;
            const dist = Math.sqrt(dx * dx + dz * dz);

            if (dist < collectRadius) {
                scene.remove(pickup);
                if (this._shieldPool) {
                    this._shieldPool.release(pickup);
                } else {
                    ObstacleManager.disposeObject(pickup);
                }
                ShieldManager.pickups.splice(i, 1);
                this.activate();
                flashScreen(0.08, '#66ccff');
                if (typeof BoosterHUD !== 'undefined') {
                    BoosterHUD.announce('shield');
                    BoosterHUD.activateBadge('shield', null); // infinite until broken
                }
            }
        }
    },

    /**
     * Enable the shield state and make the shield aura visible.
     * No-ops if the shield is already active.
     */
    activate() {
        if (GameState.hasShield) return;
        GameState.hasShield = true;
        if (ShieldManager.aura) {
            ShieldManager.aura.visible = true;
        }
    },

    /**
     * Remove the shield on a hit: hides the aura, triggers a screen flash,
     * and schedules a brief scale-reset animation.
     */
    breakShield() {
        if (!GameState.hasShield) return;
        GameState.hasShield = false;
        if (ShieldManager.aura) {
            ShieldManager.aura.visible = false;
            ShieldManager.aura.scale.set(1.2, 1.2, 1.2);
        }
        flashScreen(0.12, '#99e6ff');
        if (typeof BoosterHUD !== 'undefined') BoosterHUD.removeBadge('shield');
        if (ShieldManager._breakTimeoutId) {
            clearTimeout(ShieldManager._breakTimeoutId);
        }
        ShieldManager._breakTimeoutId = setTimeout(() => {
            if (ShieldManager.aura) {
                ShieldManager.aura.scale.set(1, 1, 1);
            }
        }, 180);
    },

    /**
     * Return a random cooldown duration between cooldownMin and cooldownMax seconds.
     * @returns {number} Cooldown in seconds
     */
    randomCooldown() {
        return this.cooldownMin + Math.random() * (this.cooldownMax - this.cooldownMin);
    },

    /**
     * Release all active pickups back to the pool, clear the shield state and aura,
     * and cancel any pending break timeout. Called on game restart and menu return.
     */
    reset() {
        for (let i = ShieldManager.pickups.length - 1; i >= 0; i--) {
            scene.remove(ShieldManager.pickups[i]);
            if (this._shieldPool) {
                this._shieldPool.release(ShieldManager.pickups[i]);
            } else {
                ObstacleManager.disposeObject(ShieldManager.pickups[i]);
            }
        }
        ShieldManager.pickups.length = 0;
        this.nextSpawnTime = 0;
        GameState.hasShield = false;
        if (ShieldManager.aura) {
            ShieldManager.aura.visible = false;
            ShieldManager.aura.scale.set(1, 1, 1);
        }
        if (ShieldManager._breakTimeoutId) {
            clearTimeout(ShieldManager._breakTimeoutId);
            ShieldManager._breakTimeoutId = null;
        }
    }
};
