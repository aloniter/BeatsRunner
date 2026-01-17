// ========================================
// SPEED BOOST MODEL - Shared by SpeedBoostManager and ExitBoosterManager
// ========================================
function createSpeedBoosterModel() {
    const group = new THREE.Group();

    const shaftGeo = new THREE.CylinderGeometry(0.16, 0.16, 0.7, 12);
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

    const headGeo = new THREE.ConeGeometry(0.28, 0.6, 16);
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

    const finGeo = new THREE.BoxGeometry(0.12, 0.35, 0.5);
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

    const glowGeo = new THREE.ConeGeometry(0.5, 1.0, 16, 1, true);
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
    nextSpawnTime: 0,
    minDistance: 220,
    cooldownMin: 28,
    cooldownMax: 40,
    minElapsed: 10,

    update(delta, elapsed) {
        if (GameState.isBonusActive) return;
        const moveAmount = GameState.speed * delta;

        for (let i = speedPickups.length - 1; i >= 0; i--) {
            const pickup = speedPickups[i];
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
                speedPickups.splice(i, 1);
            }
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
        if (speedPickups.length > 0) return;

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
        const model = createSpeedBoosterModel();
        const pickup = model.group;
        pickup.position.set(x, 1.85, z);
        pickup.userData.baseY = 1.85;
        pickup.userData.phase = Math.random() * Math.PI * 2;
        pickup.userData.glowMeshes = model.glowMeshes;
        scene.add(pickup);
        speedPickups.push(pickup);

        this.nextSpawnTime = elapsed + this.randomCooldown();
    },

    checkCollection() {
        if (!player) return;

        const playerX = player.position.x;
        const playerZ = player.position.z;
        const collectRadius = 1.4;

        for (let i = speedPickups.length - 1; i >= 0; i--) {
            const pickup = speedPickups[i];
            const dx = pickup.position.x - playerX;
            const dz = pickup.position.z - playerZ;
            const dist = Math.sqrt(dx * dx + dz * dz);

            if (dist < collectRadius) {
                scene.remove(pickup);
                speedPickups.splice(i, 1);
                ExitBoosterManager.activateBooster('speed');
                flashScreen(0.1, '#ffdd55');
                playCollectSound();
            }
        }
    },

    randomCooldown() {
        return this.cooldownMin + Math.random() * (this.cooldownMax - this.cooldownMin);
    },

    reset() {
        for (let i = speedPickups.length - 1; i >= 0; i--) {
            scene.remove(speedPickups[i]);
        }
        speedPickups.length = 0;
        this.nextSpawnTime = 0;
    }
};
