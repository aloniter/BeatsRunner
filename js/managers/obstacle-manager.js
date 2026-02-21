// ========================================
// OBSTACLES - Blocking Gates/Cubes
// ========================================
const ObstacleManager = {
    lastSpawnZ: 60,
    spawnQueue: [],

    // Object pools for obstacle reuse
    _cubePool: null,
    _gatePool: null,
    _jumpPool: null,

    initPools() {
        if (this._cubePool) return; // Already initialized

        this._cubePool = new ObjectPool(
            () => this.createObstacleType('cube'),
            (obj) => this._resetObstacle(obj)
        );
        this._gatePool = new ObjectPool(
            () => this.createObstacleType('gate'),
            (obj) => this._resetObstacle(obj)
        );
        this._jumpPool = new ObjectPool(
            () => this.createJumpObstacle(),
            (obj) => this._resetObstacle(obj)
        );
    },

    _resetObstacle(obj) {
        obj.position.set(0, 0, 0);
        obj.rotation.set(0, 0, 0);
        obj.scale.set(1, 1, 1);
        obj.visible = true;
        obj.userData.hasBeenHit = false;
        obj.userData.requiresJump = false;
        obj.userData.lane = 0;
        // Reset material opacity for all children
        obj.traverse(child => {
            if (child.material) {
                if (child.material.opacity !== undefined) {
                    child.material.opacity = child.userData.originalOpacity || 1;
                }
            }
        });
    },

    // Patterns: array of lane indices to block
    patterns: [
        [0], [1], [2],           // Single lane blocks
        [0, 1], [1, 2], [0, 2],  // Double lane blocks
    ],

    /**
     * Get Free Run difficulty settings based on current distance.
     * Progressively introduces harder obstacle patterns:
     * - 0-200m: Single-lane only, no jumps, wide gaps (learn to move)
     * - 200-500m: Add double-lane blocks, introduce jumps, tighter gaps
     * - 500-800m: Full patterns, moderate jump freq, normal gaps
     * - 800m+: Everything, high density
     */
    getFreeRunDifficulty() {
        const d = GameState.distance;
        if (d < 200) {
            return {
                patterns: [[0], [1], [2]],   // Single lane only
                jumpChance: 0,               // No jumps yet
                minGap: 24,                  // Wide spacing
                extraRandom: 16
            };
        } else if (d < 500) {
            return {
                patterns: [[0], [1], [2], [0, 1], [1, 2], [0, 2]],
                jumpChance: 0.15,            // Rare jumps
                minGap: 20,                  // Moderate spacing
                extraRandom: 14
            };
        } else if (d < 800) {
            return {
                patterns: this.patterns,     // All patterns
                jumpChance: 0.25,
                minGap: CONFIG.OBSTACLE_MIN_GAP,
                extraRandom: 12
            };
        } else {
            return {
                patterns: this.patterns,
                jumpChance: 0.35,            // Full difficulty
                minGap: CONFIG.OBSTACLE_MIN_GAP - 2,
                extraRandom: 10
            };
        }
    },

    spawn() {
        // Get stage-specific settings (or defaults for Free Run)
        const stage = GameState.isStageMode ? GameState.currentStage : null;
        const pool = stage ? getPatternPool(stage) : null;

        // Free Run: use distance-based difficulty curve
        const freeRunDiff = (!stage) ? this.getFreeRunDifficulty() : null;

        // Calculate gap based on stage tier or Free Run difficulty
        const minGap = pool ? pool.gap : (freeRunDiff ? freeRunDiff.minGap : CONFIG.OBSTACLE_MIN_GAP);
        const extraRandom = freeRunDiff ? freeRunDiff.extraRandom : 12;
        // Quantize spawn positions to beat intervals for rhythmic feel
        const rawZ = this.lastSpawnZ + minGap + Math.random() * extraRandom;
        const distPerBeat = GameState.speed * CONFIG.BEAT_INTERVAL;
        const z = distPerBeat > 0 ? Math.round(rawZ / distPerBeat) * distPerBeat : rawZ;

        // Determine jump frequency based on stage or difficulty
        const jumpChance = pool ? pool.jumpFrequency : (freeRunDiff ? freeRunDiff.jumpChance : 0.35);
        const useJumpObstacle = Math.random() < jumpChance;

        // Ensure pools are initialized
        this.initPools();

        if (useJumpObstacle) {
            // Spawn low obstacle across all lanes (must jump)
            const obstacle = this._jumpPool.acquire();
            obstacle.position.set(0, 0.6, z);
            obstacle.userData.requiresJump = true;
            obstacle.userData.poolType = 'jump';
            scene.add(obstacle);
            obstacles.push(obstacle);
        } else {
            // Select pattern from stage pool or Free Run difficulty
            let pattern;
            if (pool) {
                pattern = selectRandomPattern(pool);
            } else if (freeRunDiff) {
                const patternIndex = Math.floor(Math.random() * freeRunDiff.patterns.length);
                pattern = freeRunDiff.patterns[patternIndex];
            } else {
                const patternIndex = Math.floor(Math.random() * this.patterns.length);
                pattern = this.patterns[patternIndex];
            }

            // Create obstacles for blocked lanes
            pattern.forEach(lane => {
                const isGate = Math.random() > 0.5;
                const pool_ = isGate ? this._gatePool : this._cubePool;
                const obstacle = pool_.acquire();
                obstacle.position.set(CONFIG.LANE_POSITIONS[lane], 1.2, z);
                obstacle.userData.lane = lane;
                obstacle.userData.requiresJump = false;
                obstacle.userData.poolType = isGate ? 'gate' : 'cube';
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

        // Wide low barrier across all lanes — use GeometryCache
        const barrierGeo = GeometryCache.get('box', 9, 1.2, 0.6);
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
        barrier.userData.originalOpacity = 0.9;
        group.add(barrier);

        // Edge glow
        const edgeGeo = GeometryCache.getEdges(barrierGeo);
        const edgeMat = new THREE.LineBasicMaterial({
            color: CONFIG.COLORS.ORANGE,
            transparent: true,
            opacity: 1
        });
        const edges = new THREE.LineSegments(edgeGeo, edgeMat);
        edges.userData.originalOpacity = 1;
        group.add(edges);

        // Warning lights on top
        const lightGeo = GeometryCache.get('sphere', 0.15, 8, 8);
        [-3, 0, 3].forEach(x => {
            const lightMat = new THREE.MeshBasicMaterial({
                color: CONFIG.COLORS.ORANGE,
                transparent: true,
                opacity: 0.9
            });
            const light = new THREE.Mesh(lightGeo, lightMat);
            light.userData.originalOpacity = 0.9;
            light.position.set(x, 0.7, 0);
            group.add(light);
        });

        return group;
    },

    createObstacle() {
        // Legacy method — randomly picks cube or gate
        const isGate = Math.random() > 0.5;
        return this.createObstacleType(isGate ? 'gate' : 'cube');
    },

    createObstacleType(type) {
        const group = new THREE.Group();

        if (type === 'cube') {
            // Cube obstacle — use GeometryCache
            const cubeGeo = GeometryCache.get('box', 2.2, 2.2, 0.8);
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
            cube.userData.originalOpacity = 0.85;
            group.add(cube);

            // Edge glow
            const edgeGeo = GeometryCache.getEdges(cubeGeo);
            const edgeMat = new THREE.LineBasicMaterial({
                color: CONFIG.COLORS.PINK,
                transparent: true,
                opacity: 0.9
            });
            const edges = new THREE.LineSegments(edgeGeo, edgeMat);
            edges.userData.originalOpacity = 0.9;
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

            const pillarGeo = GeometryCache.get('box', 0.25, 2.8, 0.25);

            // Left pillar
            const leftPillar = new THREE.Mesh(pillarGeo, gateMat);
            leftPillar.position.set(-1.1, 0.4, 0);
            group.add(leftPillar);

            // Right pillar
            const rightPillar = new THREE.Mesh(pillarGeo, gateMat.clone());
            rightPillar.position.set(1.1, 0.4, 0);
            group.add(rightPillar);

            // Top bar
            const barGeo = GeometryCache.get('box', 2.45, 0.25, 0.25);
            const topBar = new THREE.Mesh(barGeo, gateMat.clone());
            topBar.position.set(0, 1.8, 0);
            group.add(topBar);

            // Blocking panel
            const panelGeo = GeometryCache.get('box', 1.95, 1.4, 0.08);
            const panelMat = new THREE.MeshBasicMaterial({
                color: CONFIG.COLORS.ORANGE,
                transparent: true,
                opacity: 0.35
            });
            const panel = new THREE.Mesh(panelGeo, panelMat);
            panel.userData.originalOpacity = 0.35;
            panel.position.set(0, 0.7, 0);
            group.add(panel);
        }

        return group;
    },

    /**
     * Release an obstacle back to its pool for reuse
     */
    _releaseToPool(obj) {
        const poolType = obj.userData.poolType;
        if (poolType === 'jump' && this._jumpPool) {
            this._jumpPool.release(obj);
        } else if (poolType === 'gate' && this._gatePool) {
            this._gatePool.release(obj);
        } else if (poolType === 'cube' && this._cubePool) {
            this._cubePool.release(obj);
        } else {
            // Fallback: dispose if no pool match
            this.disposeObject(obj);
        }
    },

    /**
     * Dispose all geometries and materials in a group to prevent memory leaks
     * (fallback for non-pooled objects)
     */
    disposeObject(obj) {
        obj.traverse(child => {
            // Don't dispose cached geometries — they're shared via GeometryCache
            if (child.geometry) {
                let isCached = false;
                if (typeof GeometryCache !== 'undefined') {
                    GeometryCache._cache.forEach(cachedGeo => {
                        if (cachedGeo === child.geometry) isCached = true;
                    });
                }
                if (!isCached) child.geometry.dispose();
            }
            if (child.material) {
                if (Array.isArray(child.material)) {
                    child.material.forEach(m => m.dispose());
                } else {
                    child.material.dispose();
                }
            }
        });
    },

    update(delta) {
        const moveAmount = GameState.speed * delta;

        // Move and cleanup obstacles
        for (let i = obstacles.length - 1; i >= 0; i--) {
            const obstacle = obstacles[i];
            obstacle.position.z -= moveAmount;

            if (obstacle.position.z < CONFIG.DESPAWN_DISTANCE) {
                scene.remove(obstacle);
                this._releaseToPool(obstacle);
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
                            this._releaseToPool(obstacle);
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
                            this._releaseToPool(obstacle);
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
            this._releaseToPool(obstacles[i]);
        }
        obstacles.length = 0;
        this.lastSpawnZ = 60;
    },

    clearForBonus() {
        for (let i = obstacles.length - 1; i >= 0; i--) {
            scene.remove(obstacles[i]);
            this._releaseToPool(obstacles[i]);
        }
        obstacles.length = 0;
        this.lastSpawnZ = CONFIG.SPAWN_DISTANCE;
    },

    resumeAfterBonus() {
        this.lastSpawnZ = CONFIG.SPAWN_DISTANCE;
    }
};
