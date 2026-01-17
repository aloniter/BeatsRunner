// ========================================
// OBSTACLES - Blocking Gates/Cubes
// ========================================
const ObstacleManager = {
    lastSpawnZ: 60,
    spawnQueue: [],

    // Patterns: array of lane indices to block
    patterns: [
        [0], [1], [2],           // Single lane blocks
        [0, 1], [1, 2], [0, 2],  // Double lane blocks
    ],

    spawn() {
        // Get stage-specific settings (or defaults for Free Run)
        const stage = GameState.isStageMode ? GameState.currentStage : null;
        const pool = stage ? getPatternPool(stage) : null;

        // Calculate gap based on stage tier (or use default for Free Run)
        const minGap = pool ? pool.gap : CONFIG.OBSTACLE_MIN_GAP;
        const z = this.lastSpawnZ + minGap + Math.random() * 12;

        // Determine jump frequency based on stage
        const jumpChance = pool ? pool.jumpFrequency : 0.35;
        const useJumpObstacle = Math.random() < jumpChance;

        if (useJumpObstacle) {
            // Spawn low obstacle across all lanes (must jump)
            const obstacle = this.createJumpObstacle();
            obstacle.position.set(0, 0.6, z);
            obstacle.userData.requiresJump = true;
            scene.add(obstacle);
            obstacles.push(obstacle);
        } else {
            // Select pattern from stage pool (or use default patterns for Free Run)
            let pattern;
            if (pool) {
                pattern = selectRandomPattern(pool);
            } else {
                // Free Run: use existing hardcoded patterns
                const patternIndex = Math.floor(Math.random() * this.patterns.length);
                pattern = this.patterns[patternIndex];
            }

            // Create obstacles for blocked lanes
            pattern.forEach(lane => {
                const obstacle = this.createObstacle();
                obstacle.position.set(CONFIG.LANE_POSITIONS[lane], 1.2, z);
                obstacle.userData.lane = lane;
                obstacle.userData.requiresJump = false;
                scene.add(obstacle);
                obstacles.push(obstacle);
            });

            // Spawn collectible in one empty lane
            const emptyLanes = [0, 1, 2].filter(l => !pattern.includes(l));
            if (emptyLanes.length > 0 && Math.random() < CONFIG.ORB_SPAWN_CHANCE) {
                const orbLane = emptyLanes[Math.floor(Math.random() * emptyLanes.length)];
                CollectibleManager.spawn(CONFIG.LANE_POSITIONS[orbLane], z);
            }
        }

        this.lastSpawnZ = z;
    },

    createJumpObstacle() {
        const group = new THREE.Group();

        // Wide low barrier across all lanes
        const barrierGeo = new THREE.BoxGeometry(9, 1.2, 0.6);
        const barrierMat = new THREE.MeshStandardMaterial({
            color: 0x001a22,
            emissive: CONFIG.COLORS.ORANGE,
            emissiveIntensity: 0.6,
            metalness: 0.7,
            roughness: 0.3,
            transparent: true,
            opacity: 0.9
        });
        const barrier = new THREE.Mesh(barrierGeo, barrierMat);
        group.add(barrier);

        // Edge glow
        const edgeGeo = new THREE.EdgesGeometry(barrierGeo);
        const edgeMat = new THREE.LineBasicMaterial({
            color: CONFIG.COLORS.ORANGE,
            transparent: true,
            opacity: 1
        });
        const edges = new THREE.LineSegments(edgeGeo, edgeMat);
        group.add(edges);

        // Warning lights on top
        [-3, 0, 3].forEach(x => {
            const lightGeo = new THREE.SphereGeometry(0.15, 8, 8);
            const lightMat = new THREE.MeshBasicMaterial({
                color: CONFIG.COLORS.ORANGE,
                transparent: true,
                opacity: 0.9
            });
            const light = new THREE.Mesh(lightGeo, lightMat);
            light.position.set(x, 0.7, 0);
            group.add(light);
        });

        return group;
    },

    createObstacle() {
        const group = new THREE.Group();

        // Randomize type
        const isGate = Math.random() > 0.5;

        if (!isGate) {
            // Cube obstacle
            const cubeGeo = new THREE.BoxGeometry(2.2, 2.2, 0.8);
            const cubeMat = new THREE.MeshStandardMaterial({
                color: 0x1a0022,
                emissive: CONFIG.COLORS.PINK,
                emissiveIntensity: 0.4,
                metalness: 0.6,
                roughness: 0.4,
                transparent: true,
                opacity: 0.85
            });
            const cube = new THREE.Mesh(cubeGeo, cubeMat);
            group.add(cube);

            // Edge glow
            const edgeGeo = new THREE.EdgesGeometry(cubeGeo);
            const edgeMat = new THREE.LineBasicMaterial({
                color: CONFIG.COLORS.PINK,
                transparent: true,
                opacity: 0.9
            });
            const edges = new THREE.LineSegments(edgeGeo, edgeMat);
            group.add(edges);
        } else {
            // Gate obstacle
            const gateMat = new THREE.MeshStandardMaterial({
                color: 0x001a22,
                emissive: CONFIG.COLORS.ORANGE,
                emissiveIntensity: 0.5,
                metalness: 0.7,
                roughness: 0.3
            });

            const pillarGeo = new THREE.BoxGeometry(0.25, 2.8, 0.25);

            // Left pillar
            const leftPillar = new THREE.Mesh(pillarGeo, gateMat);
            leftPillar.position.set(-1.1, 0.4, 0);
            group.add(leftPillar);

            // Right pillar
            const rightPillar = new THREE.Mesh(pillarGeo, gateMat);
            rightPillar.position.set(1.1, 0.4, 0);
            group.add(rightPillar);

            // Top bar
            const barGeo = new THREE.BoxGeometry(2.45, 0.25, 0.25);
            const topBar = new THREE.Mesh(barGeo, gateMat);
            topBar.position.set(0, 1.8, 0);
            group.add(topBar);

            // Blocking panel
            const panelGeo = new THREE.BoxGeometry(1.95, 1.4, 0.08);
            const panelMat = new THREE.MeshBasicMaterial({
                color: CONFIG.COLORS.ORANGE,
                transparent: true,
                opacity: 0.35
            });
            const panel = new THREE.Mesh(panelGeo, panelMat);
            panel.position.set(0, 0.7, 0);
            group.add(panel);
        }

        return group;
    },

    update(delta) {
        const moveAmount = GameState.speed * delta;

        // Move and cleanup obstacles
        for (let i = obstacles.length - 1; i >= 0; i--) {
            const obstacle = obstacles[i];
            obstacle.position.z -= moveAmount;

            if (obstacle.position.z < CONFIG.DESPAWN_DISTANCE) {
                scene.remove(obstacle);
                obstacles.splice(i, 1);
            }
        }

        // Spawn new obstacles
        this.lastSpawnZ -= moveAmount;
        if (GameState.isBonusActive) {
            this.lastSpawnZ = Math.max(this.lastSpawnZ, CONFIG.SPAWN_DISTANCE);
            return;
        }
        while (this.lastSpawnZ < CONFIG.SPAWN_DISTANCE) {
            this.spawn();
        }
    },

    checkCollision() {
        if (!player) return false;

        const playerX = player.position.x;
        const playerZ = player.position.z;
        const playerY = player.position.y;
        const hitboxWidth = 0.7;
        const hitboxDepth = 0.7;

        for (let i = obstacles.length - 1; i >= 0; i--) {
            const obstacle = obstacles[i];

            // Skip obstacles that have already registered a hit (Stage Mode fix)
            if (obstacle.userData.hasBeenHit) continue;

            const oz = obstacle.position.z;
            const ox = obstacle.position.x;

            // Check Z collision first
            if (Math.abs(oz - playerZ) < hitboxDepth) {

                // Check if it's a jump obstacle
                if (obstacle.userData.requiresJump) {
                    // Jump obstacle - check if player is high enough
                    if (playerY < 2.2) { // Must be above 2.2 to clear the barrier
                        if (GameState.hasShield) {
                            ShieldManager.breakShield();
                            scene.remove(obstacle);
                            obstacles.splice(i, 1);
                            return false;
                        }
                        // Mark obstacle as hit to prevent double-counting in Stage Mode
                        obstacle.userData.hasBeenHit = true;
                        return true;
                    }
                } else {
                    // Regular obstacle - check X position
                    if (Math.abs(ox - playerX) < hitboxWidth + 0.8) {
                        if (GameState.hasShield) {
                            ShieldManager.breakShield();
                            scene.remove(obstacle);
                            obstacles.splice(i, 1);
                            return false;
                        }
                        // Mark obstacle as hit to prevent double-counting in Stage Mode
                        obstacle.userData.hasBeenHit = true;
                        return true;
                    }
                }
            }
        }
        return false;
    },

    reset() {
        for (let i = obstacles.length - 1; i >= 0; i--) {
            scene.remove(obstacles[i]);
        }
        obstacles.length = 0;
        this.lastSpawnZ = 60;
    },

    clearForBonus() {
        for (let i = obstacles.length - 1; i >= 0; i--) {
            scene.remove(obstacles[i]);
        }
        obstacles.length = 0;
        this.lastSpawnZ = CONFIG.SPAWN_DISTANCE;
    },

    resumeAfterBonus() {
        this.lastSpawnZ = CONFIG.SPAWN_DISTANCE;
    }
};
