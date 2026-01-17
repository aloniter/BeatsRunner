// ========================================
// SHIELD POWER-UP
// ========================================
const ShieldManager = {
    nextSpawnTime: 0,
    minDistance: 200,
    cooldownMin: 30,
    cooldownMax: 45,
    minElapsed: 8,

    update(delta, elapsed) {
        const moveAmount = GameState.speed * delta;

        for (let i = shieldPickups.length - 1; i >= 0; i--) {
            const pickup = shieldPickups[i];

            pickup.position.z -= moveAmount;
            pickup.rotation.y += delta * 1.3;
            pickup.rotation.x += delta * 0.5;
            const pulse = 1 + Math.sin(elapsed * 4 + pickup.userData.phase) * 0.06;
            pickup.scale.set(pulse, pulse, pulse);

            if (pickup.position.z < CONFIG.DESPAWN_DISTANCE) {
                scene.remove(pickup);
                shieldPickups.splice(i, 1);
            }
        }

        if (GameState.hasShield && shieldAura) {
            const auraPulse = 0.98 + Math.sin(elapsed * 3.5) * 0.04;
            shieldAura.scale.set(auraPulse, auraPulse, auraPulse);
        }

        this.trySpawn(elapsed);
    },

    trySpawn(elapsed) {
        // Disable power-ups in Stage Mode
        if (GameState.isStageMode) return;

        if (!player) return;
        if (elapsed < this.minElapsed) return;
        if (GameState.distance < this.minDistance) return;
        if (elapsed < this.nextSpawnTime) return;
        if (GameState.hasShield) return;
        if (shieldPickups.length > 0) return;

        this.spawn(elapsed);
    },

    spawn(elapsed) {
        const laneIndex = Math.floor(Math.random() * CONFIG.LANE_POSITIONS.length);
        const x = CONFIG.LANE_POSITIONS[laneIndex];
        const z = CONFIG.SPAWN_DISTANCE + 12 + Math.random() * 14;
        const pickup = this.createPickup();

        pickup.position.set(x, 1.9, z);
        pickup.userData.phase = Math.random() * Math.PI * 2;
        scene.add(pickup);
        shieldPickups.push(pickup);

        this.nextSpawnTime = elapsed + this.randomCooldown();
    },

    createPickup() {
        const group = new THREE.Group();

        const coreGeo = new THREE.SphereGeometry(0.35, 16, 16);
        const coreMat = new THREE.MeshStandardMaterial({
            color: CONFIG.COLORS.BLUE,
            emissive: CONFIG.COLORS.BLUE,
            emissiveIntensity: 1,
            metalness: 0.7,
            roughness: 0.2
        });
        const core = new THREE.Mesh(coreGeo, coreMat);
        group.add(core);

        const glowGeo = new THREE.SphereGeometry(0.65, 14, 14);
        const glowMat = new THREE.MeshBasicMaterial({
            color: CONFIG.COLORS.CYAN,
            transparent: true,
            opacity: 0.35
        });
        const glow = new THREE.Mesh(glowGeo, glowMat);
        group.add(glow);

        const ringGeo = new THREE.TorusGeometry(0.5, 0.05, 10, 28);
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

        return group;
    },

    checkCollection() {
        if (!player) return;

        const playerX = player.position.x;
        const playerZ = player.position.z;
        const collectRadius = 1.4;

        for (let i = shieldPickups.length - 1; i >= 0; i--) {
            const pickup = shieldPickups[i];
            const dx = pickup.position.x - playerX;
            const dz = pickup.position.z - playerZ;
            const dist = Math.sqrt(dx * dx + dz * dz);

            if (dist < collectRadius) {
                scene.remove(pickup);
                shieldPickups.splice(i, 1);
                this.activate();
                flashScreen(0.08, '#66ccff');
            }
        }
    },

    activate() {
        if (GameState.hasShield) return;
        GameState.hasShield = true;
        if (shieldAura) {
            shieldAura.visible = true;
        }
    },

    breakShield() {
        if (!GameState.hasShield) return;
        GameState.hasShield = false;
        if (shieldAura) {
            shieldAura.visible = false;
            shieldAura.scale.set(1.2, 1.2, 1.2);
        }
        flashScreen(0.12, '#99e6ff');
        if (shieldBreakTimeoutId) {
            clearTimeout(shieldBreakTimeoutId);
        }
        shieldBreakTimeoutId = setTimeout(() => {
            if (shieldAura) {
                shieldAura.scale.set(1, 1, 1);
            }
        }, 180);
    },

    randomCooldown() {
        return this.cooldownMin + Math.random() * (this.cooldownMax - this.cooldownMin);
    },

    reset() {
        for (let i = shieldPickups.length - 1; i >= 0; i--) {
            scene.remove(shieldPickups[i]);
        }
        shieldPickups.length = 0;
        this.nextSpawnTime = 0;
        GameState.hasShield = false;
        if (shieldAura) {
            shieldAura.visible = false;
            shieldAura.scale.set(1, 1, 1);
        }
        if (shieldBreakTimeoutId) {
            clearTimeout(shieldBreakTimeoutId);
            shieldBreakTimeoutId = null;
        }
    }
};
