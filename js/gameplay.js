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
        const z = this.lastSpawnZ + CONFIG.OBSTACLE_MIN_GAP + Math.random() * 12;
        
        // Randomly choose between regular obstacles and jump obstacles
        const useJumpObstacle = Math.random() < 0.35; // 35% chance of jump obstacle
        
        if (useJumpObstacle) {
            // Spawn low obstacle across all lanes (must jump)
            const obstacle = this.createJumpObstacle();
            obstacle.position.set(0, 0.6, z);
            obstacle.userData.requiresJump = true;
            scene.add(obstacle);
            obstacles.push(obstacle);
        } else {
            // Regular lane-blocking obstacles
            const patternIndex = Math.floor(Math.random() * this.patterns.length);
            const pattern = this.patterns[patternIndex];
            
            // Create obstacles for blocked lanes
            pattern.forEach(lane => {
                const obstacle = this.createObstacle();
                obstacle.position.set(CONFIG.LANE_POSITIONS[lane], 1.2, z);
                obstacle.userData.lane = lane;
                obstacle.userData.requiresJump = false;
                scene.add(obstacle);
                obstacles.push(obstacle);
            });
            
            // Always spawn collectible in one empty lane
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
        
        for (const obstacle of obstacles) {
            const oz = obstacle.position.z;
            const ox = obstacle.position.x;
            
            // Check Z collision first
            if (Math.abs(oz - playerZ) < hitboxDepth) {
                
                // Check if it's a jump obstacle
                if (obstacle.userData.requiresJump) {
                    // Jump obstacle - check if player is high enough
                    if (playerY < 2.2) { // Must be above 2.2 to clear the barrier
                        return true;
                    }
                } else {
                    // Regular obstacle - check X position
                    if (Math.abs(ox - playerX) < hitboxWidth + 0.8) {
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
    }
};

// ========================================
// COLLECTIBLES - Glowing Orbs
// ========================================
const CollectibleManager = {
    spawn(x, z) {
        const orb = this.createOrb();
        orb.position.set(x, 1.7, z);
        orb.userData.baseY = 1.7;
        orb.userData.phase = Math.random() * Math.PI * 2;
        scene.add(orb);
        collectibles.push(orb);
    },
    
    createOrb() {
        const group = new THREE.Group();
        
        // Core
        const coreGeo = new THREE.IcosahedronGeometry(0.28, 1);
        const coreMat = new THREE.MeshStandardMaterial({
            color: CONFIG.COLORS.CYAN,
            emissive: CONFIG.COLORS.CYAN,
            emissiveIntensity: 1,
            metalness: 0.9,
            roughness: 0.1
        });
        const core = new THREE.Mesh(coreGeo, coreMat);
        group.add(core);
        
        // Outer glow
        const glowGeo = new THREE.SphereGeometry(0.45, 12, 12);
        const glowMat = new THREE.MeshBasicMaterial({
            color: CONFIG.COLORS.CYAN,
            transparent: true,
            opacity: 0.25,
            side: THREE.BackSide
        });
        group.add(new THREE.Mesh(glowGeo, glowMat));
        
        // Ring
        const ringGeo = new THREE.TorusGeometry(0.35, 0.025, 6, 20);
        const ringMat = new THREE.MeshBasicMaterial({
            color: CONFIG.COLORS.WHITE,
            transparent: true,
            opacity: 0.5
        });
        group.add(new THREE.Mesh(ringGeo, ringMat));
        
        return group;
    },
    
    update(delta, elapsed) {
        const moveAmount = GameState.speed * delta;
        
        for (let i = collectibles.length - 1; i >= 0; i--) {
            const orb = collectibles[i];
            
            // Move toward player
            orb.position.z -= moveAmount;
            
            // Rotation
            orb.rotation.y += delta * 3;
            orb.rotation.x += delta * 2;
            
            // Bobbing
            orb.position.y = orb.userData.baseY + Math.sin(elapsed * 5 + orb.userData.phase) * 0.15;
            
            // Remove if behind
            if (orb.position.z < CONFIG.DESPAWN_DISTANCE) {
                scene.remove(orb);
                collectibles.splice(i, 1);
            }
        }
    },
    
    checkCollection() {
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
                addCoin(1);
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
        
        // Subtle flash
        flashScreen(0.03, '#ff00ff');
        
        // Speed increase
        if (GameState.speed < CONFIG.MAX_SPEED) {
            GameState.speed += CONFIG.SPEED_INCREMENT * 0.08;
        }

        if (discoBallGroup && discoBallGroup.visible) {
            discoBallGroup.scale.set(1.08, 1.08, 1.08);
            setTimeout(() => {
                if (discoBallGroup) discoBallGroup.scale.set(1, 1, 1);
            }, 90);
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

        if (discoBallCore && discoBallCore.material) {
            discoBallCore.material.emissiveIntensity = 0.7 + this.intensity * 0.9;
        }
        if (discoBallTiles && discoBallTiles.material) {
            discoBallTiles.material.emissiveIntensity = 0.5 + this.intensity * 0.8;
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
    }
};

// ========================================
