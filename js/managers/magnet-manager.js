// ========================================
// MAGNET POWER-UP
// ========================================
const MagnetManager = {
    lastSpawnTime: -Infinity,
    nextSpawnTime: 0,
    lastSpawnWasMagnet: false,
    minDistance: 150,
    cooldownMin: 25,
    cooldownMax: 35,
    magnetDuration: 15,
    magnetRange: 10,
    magnetPull: 7,

    update(delta, elapsed) {
        const moveAmount = GameState.speed * delta;

        for (let i = magnetPickups.length - 1; i >= 0; i--) {
            const pickup = magnetPickups[i];

            pickup.position.z -= moveAmount;
            pickup.rotation.y += delta * 1.6;
            pickup.rotation.x += delta * 0.6;
            pickup.position.y = pickup.userData.baseY + Math.sin(elapsed * 3 + pickup.userData.phase) * 0.2;

            if (pickup.position.z < CONFIG.DESPAWN_DISTANCE) {
                scene.remove(pickup);
                magnetPickups.splice(i, 1);
            }
        }

        if (GameState.isMagnetActive && magnetAura) {
            const pulse = 0.9 + Math.sin(elapsed * 5) * 0.08;
            magnetAura.scale.set(pulse, pulse, pulse);
        }

        this.trySpawn(elapsed);
    },

    trySpawn(elapsed) {
        // Disable power-ups in Stage Mode
        if (GameState.isStageMode) return;

        if (!player) return;
        if (GameState.distance < this.minDistance) return;
        if (elapsed < this.nextSpawnTime) return;
        if (this.lastSpawnWasMagnet) return;
        if (magnetPickups.length > 0 || GameState.isMagnetActive) return;

        const spawn = this.findSpawnLocation();
        if (!spawn) {
            this.nextSpawnTime = elapsed + 4;
            return;
        }

        this.spawn(spawn.x, spawn.z, elapsed);
    },

    findSpawnLocation() {
        const maxAttempts = 6;
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
    },

    spawn(x, z, elapsed) {
        const pickup = this.createPickup();
        pickup.position.set(x, 1.8, z);
        pickup.userData.baseY = 1.8;
        pickup.userData.phase = Math.random() * Math.PI * 2;
        scene.add(pickup);
        magnetPickups.push(pickup);

        this.lastSpawnWasMagnet = true;
        this.lastSpawnTime = elapsed;
        this.nextSpawnTime = elapsed + this.randomCooldown();
    },

    createPickup() {
        const group = new THREE.Group();

        const bodyGeo = new THREE.TorusGeometry(0.5, 0.12, 10, 24, Math.PI);
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

        const poleGeo = new THREE.CylinderGeometry(0.12, 0.12, 0.35, 12);
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

        const glowGeo = new THREE.SphereGeometry(0.75, 12, 12);
        const glowMat = new THREE.MeshBasicMaterial({
            color: CONFIG.COLORS.ORANGE,
            transparent: true,
            opacity: 0.2
        });
        const glow = new THREE.Mesh(glowGeo, glowMat);
        group.add(glow);

        return group;
    },

    checkCollection() {
        if (!player) return;

        const playerX = player.position.x;
        const playerZ = player.position.z;
        const collectRadius = 1.4;

        for (let i = magnetPickups.length - 1; i >= 0; i--) {
            const pickup = magnetPickups[i];
            const dx = pickup.position.x - playerX;
            const dz = pickup.position.z - playerZ;
            const dist = Math.sqrt(dx * dx + dz * dz);

            if (dist < collectRadius) {
                scene.remove(pickup);
                magnetPickups.splice(i, 1);
                this.activate();
                flashScreen(0.1, '#66ffff');
            }
        }
    },

    activate() {
        GameState.isMagnetActive = true;
        if (magnetAura) {
            magnetAura.visible = true;
        }

        if (magnetTimeoutId) {
            clearTimeout(magnetTimeoutId);
        }
        magnetTimeoutId = setTimeout(() => {
            this.deactivate();
        }, this.magnetDuration * 1000);
    },

    deactivate() {
        GameState.isMagnetActive = false;
        if (magnetAura) {
            magnetAura.visible = false;
            magnetAura.scale.set(1, 1, 1);
        }
    },

    randomCooldown() {
        return this.cooldownMin + Math.random() * (this.cooldownMax - this.cooldownMin);
    },

    reset() {
        for (let i = magnetPickups.length - 1; i >= 0; i--) {
            scene.remove(magnetPickups[i]);
        }
        magnetPickups.length = 0;
        this.lastSpawnTime = -Infinity;
        this.nextSpawnTime = this.randomCooldown();
        this.lastSpawnWasMagnet = false;
        this.deactivate();
        if (magnetTimeoutId) {
            clearTimeout(magnetTimeoutId);
            magnetTimeoutId = null;
        }
    }
};
