// ========================================
// BONUS ORB MANAGER - Rainbow Bonus Collectibles
// ========================================
class BonusOrb {
    constructor(x, y, z) {
        this.group = BonusOrbManager.createOrbMesh();
        this.group.position.set(x, y, z);
        this.lastZ = z;
        this.baseY = y;
        this.phase = Math.random() * Math.PI * 2;
    }

    update(delta, elapsed, moveAmount) {
        this.lastZ = this.group.position.z;
        // Move toward player
        this.group.position.z -= moveAmount;

        // Light bobbing for readability
        this.group.position.y = this.baseY + Math.sin(elapsed * 4 + this.phase) * 0.12;

        // Subtle pulse for visibility without changing color
        const pulse = 1 + Math.sin(elapsed * 4 + this.phase) * 0.06;
        this.group.children[0].material.emissiveIntensity = 1.4 * pulse;
        this.group.children[1].material.opacity = 0.45 + Math.sin(elapsed * 3 + this.phase) * 0.1;

        // Rotate (faster than normal orbs)
        this.group.rotation.y += delta * 5;
        this.group.rotation.x += delta * 3;
    }
}

const BonusOrbManager = {
    bonusOrbs: [],
    lastSpawnZ: 0,
    maxOrbs: 18,
    spawnGapMin: 2.6,
    spawnGapMax: 3.6,
    heightLanes: [1.6, 2.1, 2.6],
    laneIndex: 1,
    laneDir: 1,
    heightIndex: 0,
    heightDir: 1,

    createOrbMesh() {
        const group = new THREE.Group();

        // Bright, consistent orb visuals for clarity on rainbow floor
        const coreGeo = new THREE.SphereGeometry(0.36, 16, 16);
        const coreMat = new THREE.MeshStandardMaterial({
            color: 0xffffff,
            emissive: CONFIG.COLORS.CYAN,
            emissiveIntensity: 1.6,
            metalness: 0,
            roughness: 0.3
        });
        const core = new THREE.Mesh(coreGeo, coreMat);
        group.add(core);

        // Brighter outer glow
        const glowGeo = new THREE.SphereGeometry(0.55, 12, 12);
        const glowMat = new THREE.MeshBasicMaterial({
            color: CONFIG.COLORS.CYAN,
            transparent: true,
            opacity: 0.5,
            side: THREE.BackSide
        });
        const glow = new THREE.Mesh(glowGeo, glowMat);
        group.add(glow);

        // Consistent ring
        const ringGeo = new THREE.TorusGeometry(0.45, 0.03, 8, 24);
        const ringMat = new THREE.MeshBasicMaterial({
            color: CONFIG.COLORS.WHITE,
            transparent: true,
            opacity: 0.6
        });
        const ring = new THREE.Mesh(ringGeo, ringMat);
        ring.rotation.x = Math.PI / 2;
        group.add(ring);

        scene.add(group);
        return group;
    },

    update(delta, elapsed) {
        if (!GameState.isBonusActive) {
            if (this.bonusOrbs.length > 0) {
                this.reset();
            }
            return;
        }

        const moveAmount = GameState.speed * delta;

        if (this.lastSpawnZ <= 0) {
            this.lastSpawnZ = CONFIG.SPAWN_DISTANCE - 1;
        }

        this.lastSpawnZ -= moveAmount;
        while (this.lastSpawnZ < CONFIG.SPAWN_DISTANCE && this.bonusOrbs.length < this.maxOrbs) {
            const patternLength = this.spawnSingleOrb(this.lastSpawnZ);
            const gap = this.spawnGapMin + Math.random() * (this.spawnGapMax - this.spawnGapMin);
            this.lastSpawnZ = this.lastSpawnZ + patternLength + gap;
        }

        for (let i = this.bonusOrbs.length - 1; i >= 0; i--) {
            const orb = this.bonusOrbs[i];
            orb.update(delta, elapsed, moveAmount);

            if (GameState.isMagnetActive) {
                const dx = player.position.x - orb.group.position.x;
                const dz = player.position.z - orb.group.position.z;
                const dist = Math.sqrt(dx * dx + dz * dz);

                if (dist < MagnetManager.magnetRange) {
                    orb.group.position.x += (dx / dist) * MagnetManager.magnetPull * delta;
                    orb.group.position.z += (dz / dist) * MagnetManager.magnetPull * delta * 0.65;
                }
            }

            const bonusDespawnZ = player.position.z + CONFIG.DESPAWN_DISTANCE - 10;
            if (orb.group.position.z < bonusDespawnZ) {
                scene.remove(orb.group);
                this.bonusOrbs.splice(i, 1);
            }
        }
    },

    spawnSingleOrb(zBase) {
        const x = CONFIG.LANE_POSITIONS[this.laneIndex];
        const y = this.heightLanes[this.heightIndex];
        this.bonusOrbs.push(new BonusOrb(x, y, zBase));

        this.laneIndex += this.laneDir;
        if (this.laneIndex <= 0 || this.laneIndex >= CONFIG.LANE_POSITIONS.length - 1) {
            this.laneDir *= -1;
        }

        this.heightIndex += this.heightDir;
        if (this.heightIndex <= 0 || this.heightIndex >= this.heightLanes.length - 1) {
            this.heightDir *= -1;
        }

        return 0;
    },

    checkCollection() {
        const playerX = player.position.x;
        const playerY = player.position.y;
        const playerZ = player.position.z;

        for (let i = this.bonusOrbs.length - 1; i >= 0; i--) {
            const orb = this.bonusOrbs[i];
            const dx = playerX - orb.group.position.x;
            const dz = playerZ - orb.group.position.z;
            const dy = playerY - orb.group.position.y;

            const dist3D = Math.sqrt(dx * dx + dy * dy + dz * dz);
            const crossedPlayer = orb.lastZ >= playerZ && orb.group.position.z <= playerZ;
            const closeXY = Math.abs(dx) < 1.4 && Math.abs(dy) < 1.6;
            const collected = dist3D < 2.1 || (crossedPlayer && closeXY);

            if (collected) {
                GameState.orbs++;
                GameState.score += 100;
                addOrbs(1);

                playCollectSound();
                flashScreen(0.1, '#00ffff');

                scene.remove(orb.group);
                this.bonusOrbs.splice(i, 1);
            }
        }
    },

    reset() {
        this.bonusOrbs.forEach(orb => scene.remove(orb.group));
        this.bonusOrbs.length = 0;
        this.lastSpawnZ = 0;
        this.laneIndex = 1;
        this.laneDir = 1;
        this.heightIndex = 0;
        this.heightDir = 1;
    }
};
