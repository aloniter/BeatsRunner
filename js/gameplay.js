// Player Movement Controller
// ========================================
const PlayerController = {
    targetX: 0,
    currentX: 0,
    laneChangeSpeed: 12,
    bobOffset: 0,
    
    // direction: +1 = move RIGHT (higher X), -1 = move LEFT (lower X)
    switchLane(direction) {
        if (!GameState.isPlaying) return;
        
        const newLane = GameState.currentLane + direction;
        if (newLane >= 0 && newLane <= 2) {
            GameState.currentLane = newLane;
            this.targetX = CONFIG.LANE_POSITIONS[newLane];
            playLaneChangeSound();
        }
    },
    
    beginJump() {
        GameState.isJumping = true;
        GameState.jumpVelocity = CONFIG.JUMP_FORCE;
        GameState.jumpQueued = false;
        if (player) {
            player.position.y = Math.max(player.position.y, CONFIG.GROUND_Y + 0.02);
        }
        playJumpSound();
    },

    jump() {
        if (!GameState.isPlaying || GameState.isPaused) return;
        if (!GameState.isJumping) {
            this.beginJump();
            return;
        }
        GameState.jumpQueued = true;
    },
    
    update(delta, elapsed) {
        // Smooth lane transition
        const diff = this.targetX - this.currentX;
        this.currentX += diff * Math.min(this.laneChangeSpeed * delta, 0.35);
        player.position.x = this.currentX;
        
        // Tilt effect during movement (tilt in direction of movement)
        const targetTilt = -diff * 0.3;
        player.rotation.z += (targetTilt - player.rotation.z) * 6 * delta;
        
        if (!GameState.isJumping && GameState.jumpQueued) {
            this.beginJump();
        }

        // Jump physics
        if (GameState.isJumping) {
            GameState.jumpVelocity -= CONFIG.GRAVITY * delta;
            player.position.y += GameState.jumpVelocity * delta;

            // Land
            if (player.position.y <= CONFIG.GROUND_Y + 0.001) {
                player.position.y = CONFIG.GROUND_Y;
                GameState.isJumping = false;
                GameState.jumpVelocity = 0;
                if (GameState.jumpQueued) {
                    this.beginJump();
                }
            }
        } else {
            // Smooth bobbing animation when not jumping
            this.bobOffset = Math.sin(elapsed * 6) * 0.08;
            player.position.y = CONFIG.GROUND_Y + this.bobOffset;
        }
        
        // Rotate effects
        if (playerGlow) {
            playerGlow.rotation.y += delta * 1.5;
        }
        if (playerRing) {
            playerRing.rotation.z += delta * 2;
        }
    },
    
    reset() {
        this.targetX = 0;
        this.currentX = 0;
        this.bobOffset = 0;
        GameState.currentLane = 1;
        GameState.isJumping = false;
        GameState.jumpVelocity = 0;
        GameState.jumpQueued = false;
        if (player) {
            player.position.set(0, CONFIG.GROUND_Y, 0);
            player.rotation.set(0, 0, 0);
        }
    }
};

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
// EXIT BOOSTER MANAGER - Bonus Mode Reward Selection
// ========================================
const ExitBoosterManager = {
    boosters: [],
    spawned: false,
    selectedBooster: null,
    speedBoostActive: false,
    speedBoostEndTime: 0,
    originalSpeed: 0,

    spawn() {
        if (this.spawned) return;
        this.spawned = true;

        const spawnZ = player.position.z + CONFIG.SPAWN_DISTANCE;
        const boosterTypes = ['speed', 'shield', 'magnet'];

        CONFIG.LANE_POSITIONS.forEach((x, laneIndex) => {
            const type = boosterTypes[laneIndex];
            const booster = this.createBooster(type, x, spawnZ, laneIndex);
            scene.add(booster);
            this.boosters.push(booster);
        });
    },

    createBooster(type, x, z, lane) {
        let group = null;
        let glowMeshes = [];
        let fadeMeshes = [];
        let flashColor = '#ffffff';

        if (type === 'magnet') {
            group = MagnetManager.createPickup();
            glowMeshes = [group.children[3]];
            fadeMeshes = [group.children[0], group.children[1], group.children[2], group.children[3]];
            flashColor = '#ff9900';
        } else if (type === 'shield') {
            group = ShieldManager.createPickup();
            glowMeshes = [group.children[1], group.children[2]];
            fadeMeshes = [group.children[0], group.children[1], group.children[2], group.children[3]];
            flashColor = '#66ccff';
        } else {
            const speedModel = createSpeedBoosterModel();
            group = speedModel.group;
            glowMeshes = speedModel.glowMeshes;
            fadeMeshes = speedModel.fadeMeshes;
            flashColor = speedModel.flashColor;
        }

        group.position.set(x, 1.8, z);
        group.userData.type = type;
        group.userData.lane = lane;
        group.userData.checked = false;
        group.userData.glowMeshes = glowMeshes.filter(Boolean);
        group.userData.fadeMeshes = fadeMeshes.filter(Boolean);
        group.userData.flashColor = flashColor;
        group.userData.baseScale = 2;
        group.scale.set(2, 2, 2);  // 2x larger than normal pickups

        return group;
    },

    update(delta, elapsed) {
        const moveAmount = GameState.speed * delta;

        // Update boosters
        for (let i = this.boosters.length - 1; i >= 0; i--) {
            const booster = this.boosters[i];

            // Move toward player
            booster.position.z -= moveAmount;

            // Rotate and pulse
            booster.rotation.y += delta * 2;
            const pulse = 1 + Math.sin(elapsed * 4) * 0.1;
            const baseScale = booster.userData.baseScale || 2;
            booster.scale.set(baseScale * pulse, baseScale * pulse, baseScale * pulse);

            // Pulse glow meshes
            if (booster.userData.glowMeshes) {
                const glowOpacity = 0.35 + Math.sin(elapsed * 5) * 0.2;
                booster.userData.glowMeshes.forEach(mesh => {
                    if (mesh && mesh.material) {
                        mesh.material.opacity = glowOpacity;
                        mesh.material.transparent = true;
                    }
                });
            }

            // Check if player passed through
            if (!booster.userData.checked && booster.position.z < player.position.z) {
                booster.userData.checked = true;

                if (booster.userData.lane === GameState.currentLane) {
                    // Player selected this booster!
                    this.activateBooster(booster.userData.type);
                    flashScreen(0.15, booster.userData.flashColor || '#ffffff');
                    playCollectSound();

                    // Visual: selected booster explodes
                    if (booster.userData.glowMeshes) {
                        booster.userData.glowMeshes.forEach(mesh => {
                            if (mesh && mesh.material) {
                                mesh.material.opacity = 1.0;
                                mesh.material.transparent = true;
                            }
                        });
                    }
                    booster.scale.set(4, 4, 4);
                } else {
                    // Fade out unselected boosters
                    if (booster.userData.fadeMeshes) {
                        booster.userData.fadeMeshes.forEach(mesh => {
                            if (mesh && mesh.material) {
                                mesh.material.opacity = 0.2;
                                mesh.material.transparent = true;
                            }
                        });
                    }
                }
            }

            // Remove if far behind player
            if (booster.position.z < player.position.z - 20) {
                scene.remove(booster);
                this.boosters.splice(i, 1);
            }
        }

        // Handle active speed boost
        if (this.speedBoostActive) {
            const currentTime = performance.now() / 1000;
            if (currentTime >= this.speedBoostEndTime) {
                // End speed boost
                GameState.speed = this.originalSpeed;
                this.speedBoostActive = false;
            }
        }
    },

    activateBooster(type) {
        this.selectedBooster = type;

        switch (type) {
            case 'speed':
                this.originalSpeed = GameState.speed;
                GameState.speed = Math.min(GameState.speed + 15, CONFIG.MAX_SPEED);
                this.speedBoostActive = true;
                this.speedBoostEndTime = (performance.now() / 1000) + 8;  // 8 second boost
                console.log('SPEED BOOST activated!');
                break;

            case 'shield':
                ShieldManager.activate();
                console.log('SHIELD activated!');
                break;

            case 'magnet':
                MagnetManager.activate();
                console.log('MAGNET activated!');
                break;
        }
    },

    reset() {
        this.boosters.forEach(booster => scene.remove(booster));
        this.boosters.length = 0;
        this.spawned = false;
        this.selectedBooster = null;
        if (this.speedBoostActive) {
            GameState.speed = this.originalSpeed;
            this.speedBoostActive = false;
        }
    }
};

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

// ========================================
// BEAT SYNC - Rhythm System
// ========================================
const BeatManager = {
    lastBeatTime: 0,
    beatCount: 0,
    intensity: 1,

    update(elapsed) {
        const beatInterval = CONFIG.BEAT_INTERVAL;
        const timeSinceBeat = elapsed - this.lastBeatTime;

        if (timeSinceBeat >= beatInterval) {
            this.onBeat();
            this.lastBeatTime = elapsed;
            this.beatCount++;
        }

        // Calculate beat phase (0-1)
        const phase = timeSinceBeat / beatInterval;
        this.intensity = Math.max(0, 1 - phase * 0.6);

        // Update visuals
        this.updateVisuals();
    },

    onBeat() {
        if (!GameState.isPlaying) return;

        // Beat indicator
        beatIndicator.classList.add('pulse');
        setTimeout(() => beatIndicator.classList.remove('pulse'), 80);

        // Camera micro-shake
        this.shakeCamera();

        // Sound
        playBeatSound();

        // Subtle flash with current disco ball color
        let flashColor = '#ff00ff';
        if (discoBallGroup && discoBallGroup.visible && discoBallCore && discoBallCore.material) {
            const color = discoBallCore.material.emissive;
            flashColor = `#${color.getHexString()}`;
        }
        flashScreen(0.04, flashColor);

        // Speed increase
        if (GameState.speed < CONFIG.MAX_SPEED) {
            GameState.speed += CONFIG.SPEED_INCREMENT * 0.08;
        }

        // Enhanced disco ball beat response
        if (discoBallGroup && discoBallGroup.visible) {
            // Scale pulse
            discoBallGroup.scale.set(1.1, 1.1, 1.1);
            setTimeout(() => {
                if (discoBallGroup) discoBallGroup.scale.set(1, 1, 1);
            }, 90);

            // Change color every 4 beats (every ~1.875 seconds at 128 BPM)
            if (this.beatCount % 4 === 0) {
                discoBallColorIndex = (discoBallColorIndex + 1) % 5; // Cycle through 5 colors
                discoBallColorTransition = 0;
            }
        }
    },

    updateVisuals() {
        // Update floor materials
        const emissiveIntensity = 0.15 + this.intensity * 0.25;
        floorTiles.forEach(tile => {
            const floorMesh = tile.children[0];
            if (floorMesh && floorMesh.material) {
                floorMesh.material.emissiveIntensity = emissiveIntensity;
            }
        });

        // Player glow
        if (playerGlow && playerGlow.material) {
            playerGlow.material.opacity = 0.2 + this.intensity * 0.2;
        }

        // Enhanced disco ball visuals
        if (discoBallGroup && discoBallGroup.visible) {
            // Smooth color transition (0.5 second transition time)
            discoBallColorTransition = Math.min(discoBallColorTransition + 0.016, 0.5); // ~16ms per frame

            // Get color palette (defined in skins.js)
            const DISCO_COLORS = [
                { hex: 0xbb00ff }, // purple
                { hex: 0x00ffff }, // cyan
                { hex: 0xff00aa }, // pink
                { hex: 0x0088ff }, // blue
                { hex: 0xffaa00 }  // gold
            ];

            const currentColor = DISCO_COLORS[discoBallColorIndex];
            const nextColor = DISCO_COLORS[(discoBallColorIndex + 1) % DISCO_COLORS.length];
            const t = Math.min(discoBallColorTransition / 0.5, 1); // Normalize to 0-1

            // Smooth color interpolation
            const lerpedColor = new THREE.Color(currentColor.hex).lerp(
                new THREE.Color(nextColor.hex),
                t
            );

            // Apply to core
            if (discoBallCore && discoBallCore.material) {
                discoBallCore.material.emissive.copy(lerpedColor);
                discoBallCore.material.emissiveIntensity = 1.2 + this.intensity * 1.0;
            }

            // Apply to tiles
            if (discoBallTiles && discoBallTiles.material) {
                discoBallTiles.material.emissive.copy(lerpedColor);
                discoBallTiles.material.emissiveIntensity = 0.9 + this.intensity * 0.9;
            }

            // Apply to inner glow
            if (discoBallInnerGlow && discoBallInnerGlow.material) {
                discoBallInnerGlow.material.color.copy(lerpedColor);
                discoBallInnerGlow.material.opacity = 0.35 + this.intensity * 0.2;
            }

            // Apply to outer glow (bloom effect)
            if (discoBallOuterGlow && discoBallOuterGlow.material) {
                discoBallOuterGlow.material.color.copy(lerpedColor);
                discoBallOuterGlow.material.opacity = 0.18 + this.intensity * 0.15;
                // Subtle scale pulse for bloom expansion
                const bloomScale = 1 + this.intensity * 0.08;
                discoBallOuterGlow.scale.set(bloomScale, bloomScale, bloomScale);
            }

            // Apply to light beams
            if (discoBallBeams && discoBallBeams.material) {
                discoBallBeams.material.color.copy(lerpedColor);
                discoBallBeams.material.opacity = 0.4 + this.intensity * 0.25;
            }

            // Apply to sparkles
            if (discoBallSparkles && discoBallSparkles.material) {
                discoBallSparkles.material.color.copy(lerpedColor);
                discoBallSparkles.material.opacity = 0.9 + this.intensity * 0.1;
            }
        }
    },

    shakeCamera() {
        const shakeAmount = 0.06;
        camera.position.y = 6 + (Math.random() - 0.5) * shakeAmount;

        setTimeout(() => {
            camera.position.y = 6;
        }, 40);
    },

    reset() {
        this.lastBeatTime = 0;
        this.beatCount = 0;
        this.intensity = 1;
        discoBallColorIndex = 0;
        discoBallColorTransition = 0;
    }
};

// ========================================
