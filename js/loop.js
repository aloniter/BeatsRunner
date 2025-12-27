// UPDATE LOOP
// ========================================
function updateGame(delta, elapsed) {
    if (!GameState.isPlaying || GameState.isPaused) return;
    
    // Update beat system
    BeatManager.update(elapsed);
    
    // Update player
    PlayerController.update(delta, elapsed);
    if (discoBallGroup && discoBallGroup.visible) {
        discoBallGroup.rotation.y += delta * 0.9;
        // Rotate light beams independently for dynamic effect
        if (discoBallBeams) {
            discoBallBeams.rotation.y += delta * 1.5;
        }
    }

    // Animate Fire Ball skin
    if (fireBallGroup && fireBallGroup.visible) {
        fireBallGroup.rotation.y += delta * 0.6;

        // Animate flames
        if (fireBallFlames && fireBallFlames.geometry) {
            const positions = fireBallFlames.geometry.attributes.position.array;
            const basePositions = fireBallFlames.geometry.userData.basePositions;
            const phases = fireBallFlames.geometry.userData.phases;

            if (basePositions && phases) {
                for (let i = 0; i < positions.length / 3; i++) {
                    const phase = phases[i];
                    // Flames rise and flicker
                    positions[i * 3 + 1] = basePositions[i * 3 + 1] +
                        Math.sin(elapsed * 5 + phase) * 0.12 +
                        (elapsed * 0.8 + phase) % 0.6;
                    // Horizontal wobble
                    positions[i * 3] = basePositions[i * 3] + Math.sin(elapsed * 4 + phase) * 0.04;
                    positions[i * 3 + 2] = basePositions[i * 3 + 2] + Math.cos(elapsed * 4 + phase) * 0.04;
                }
                fireBallFlames.geometry.attributes.position.needsUpdate = true;
            }
        }

        // Animate embers
        if (fireBallEmbers && fireBallEmbers.geometry) {
            const positions = fireBallEmbers.geometry.attributes.position.array;
            const basePositions = fireBallEmbers.geometry.userData.basePositions;
            const phases = fireBallEmbers.geometry.userData.phases;

            if (basePositions && phases) {
                for (let i = 0; i < positions.length / 3; i++) {
                    const phase = phases[i];
                    // Embers float upward
                    positions[i * 3 + 1] = basePositions[i * 3 + 1] +
                        Math.sin(elapsed * 2.5 + phase) * 0.15 +
                        (elapsed * 0.4 + phase) % 1.0;
                    positions[i * 3] = basePositions[i * 3] + Math.sin(elapsed * 2 + phase) * 0.08;
                    positions[i * 3 + 2] = basePositions[i * 3 + 2] + Math.cos(elapsed * 2 + phase) * 0.08;
                }
                fireBallEmbers.geometry.attributes.position.needsUpdate = true;
            }
        }

        // Pulse the fire ball intensity with beat
        const beatPulse = Math.abs(Math.sin(elapsed * 3));
        if (fireBallCore && fireBallCore.material) {
            fireBallCore.material.emissiveIntensity = 1.5 + beatPulse * 0.5;
        }
        if (fireBallInnerGlow && fireBallInnerGlow.material) {
            fireBallInnerGlow.material.opacity = 0.4 + beatPulse * 0.15;
        }
    }
    
    // Update distance/score
    if (DevSettings.godMode) {
        const boostSpeed = Math.min(CONFIG.MAX_SPEED, CONFIG.INITIAL_SPEED + 15);
        if (GameState.speed < boostSpeed) {
            GameState.speed = boostSpeed;
        }
    }
    GameState.distance += GameState.speed * delta * 0.5;
    GameState.score = GameState.orbs * 100 + Math.floor(GameState.distance);

    // Track distance for Stage Mode finish line
    if (GameState.isStageMode) {
        GameState.distanceTraveled = GameState.distance;
        updateFinishLine();

        // Update Stage Mode HUD
        if (typeof StageHudUI !== 'undefined') {
            StageHudUI.update();
        }
    }

    // Bonus Mode only in Free Run (disabled in Stage Mode)
    if (!GameState.isStageMode && !GameState.bonusTriggered && GameState.distance >= CONFIG.BONUS_START_DISTANCE) {
        enterBonusMode();
        console.log('BONUS START (1000)');
    }

    // Spawn exit boosters before bonus ends (at 1195) so they're visible
    if (GameState.isBonusActive && !ExitBoosterManager.spawned && GameState.distance >= 1195) {
        ExitBoosterManager.spawn();
        console.log('EXIT BOOSTERS SPAWNED (1195)');
    }

    if (GameState.isBonusActive && GameState.distance >= CONFIG.BONUS_END_DISTANCE) {
        exitBonusMode();
        console.log('BONUS END (1250)');
    }

    // Update bonus mode visual transition (0.75 second fade)
    const transitionSpeed = delta / 0.75;
    if (GameState.isBonusActive) {
        GameState.bonusTransitionProgress = Math.min(1, GameState.bonusTransitionProgress + transitionSpeed);
    } else {
        GameState.bonusTransitionProgress = Math.max(0, GameState.bonusTransitionProgress - transitionSpeed);
    }

    // Apply rainbow visual effects during bonus mode
    if (GameState.bonusTransitionProgress > 0) {
        updateBonusVisuals(elapsed, GameState.distance, GameState.bonusTransitionProgress);
    }
    
    // Update obstacles
    ObstacleManager.update(delta);
    
    // Update magnet power-up
    MagnetManager.update(delta, elapsed);
    MagnetManager.checkCollection();
    
    // Update shield power-up
    ShieldManager.update(delta, elapsed);
    ShieldManager.checkCollection();

    // Update speed boost power-up
    SpeedBoostManager.update(delta, elapsed);
    SpeedBoostManager.checkCollection();
    
    // Update collectibles
    CollectibleManager.update(delta, elapsed);
    CollectibleManager.checkCollection();

    // Update bonus orbs (during Rainbow Bonus)
    BonusOrbManager.update(delta, elapsed);
    BonusOrbManager.checkCollection();

    // Update exit boosters
    ExitBoosterManager.update(delta, elapsed);

    // Check collision
    if (!GameState.isBonusActive && !DevSettings.godMode && ObstacleManager.checkCollision()) {
        if (GameState.isStageMode) {
            // Stage Mode: Count crash, don't end game
            GameState.crashes++;
            flashScreen(0.15, '#ff0066');
            // Continue playing - no gameOver()
        } else {
            // Free Run: Game over as usual
            gameOver();
        }
        return;
    }
    
    // Update floor (infinite scroll) - handle both track sets
    const moveAmount = GameState.speed * delta;
    const tileLength = floorTilesNormal[0].userData.length;
    const totalLength = floorTilesNormal.length * tileLength;

    // Move normal track tiles
    floorTilesNormal.forEach(tile => {
        tile.position.z -= moveAmount;
        if (tile.position.z < -tileLength) {
            tile.position.z += totalLength;
        }
    });

    // Move rainbow track tiles (synchronized)
    floorTilesRainbow.forEach(tile => {
        tile.position.z -= moveAmount;
        if (tile.position.z < -tileLength) {
            tile.position.z += totalLength;
        }
    });
    
    // Update pillars
    const pillarSpacing = sidePillars[0]?.userData.spacing || 20;
    const totalPillarLength = (sidePillars.length / 2) * pillarSpacing;
    
    sidePillars.forEach(pillar => {
        pillar.position.z -= moveAmount;
        if (pillar.position.z < -pillarSpacing) {
            pillar.position.z += totalPillarLength;
        }
    });
    
    // Update particles
    if (particleSystem) {
        const positions = particleSystem.geometry.attributes.position.array;
        const velocities = particleSystem.geometry.userData.velocities;
        
        for (let i = 0; i < positions.length / 3; i++) {
            positions[i * 3 + 2] -= moveAmount * velocities[i];
            if (positions[i * 3 + 2] < -10) {
                positions[i * 3 + 2] += 160;
                positions[i * 3] = (Math.random() - 0.5) * 40;
                positions[i * 3 + 1] = Math.random() * 25;
            }
        }
        particleSystem.geometry.attributes.position.needsUpdate = true;
    }
    
    // Update HUD
    distanceValue.textContent = Math.floor(GameState.distance);
    orbsValue.textContent = GameState.orbs;
    scoreValue.textContent = GameState.score;
}

// ========================================
// BONUS MODE VISUAL EFFECTS - Dual Track System
// ========================================
function updateBonusVisuals(elapsed, distance, transitionProgress) {
    // === OPACITY CROSSFADE TRANSITION ===
    const normalOpacity = 1 - transitionProgress;
    const rainbowOpacity = transitionProgress;

    // Fade out normal track
    floorTilesNormal.forEach(tile => {
        tile.children.forEach(child => {
            if (child.material) {
                child.material.opacity = normalOpacity;
                child.material.transparent = true;
            }
        });
    });

    // Fade in rainbow track
    floorTilesRainbow.forEach(tile => {
        tile.visible = transitionProgress > 0; // Show when transitioning
        tile.children.forEach(child => {
            if (child.material) {
                child.material.opacity = rainbowOpacity;
                child.material.transparent = true;
            }
        });
    });

    // === RAINBOW COLOR ANIMATION - VIVID AND DOMINANT ===
    if (window.rainbowMaterials && transitionProgress > 0) {
        // Slow, smooth color cycling with forward spatial flow
        const timeCycle = elapsed * 0.3;        // Slower for smooth cycling
        const spatialFlow = distance * 0.04;    // Forward flow along track
        const hue = (timeCycle + spatialFlow) % 1.0;

        // Animate floor colors - STRONG and VIVID
        window.rainbowMaterials.floors.forEach(mat => {
            const rainbowColor = new THREE.Color().setHSL(hue, 1.0, 0.65);
            mat.color.copy(rainbowColor);  // Full intensity color
            mat.emissive.copy(rainbowColor.clone().multiplyScalar(0.9));  // Strong emissive
            mat.emissiveIntensity = 1.8;  // Very high emissive intensity
        });

        // Animate edges with offset hue - keep readable
        window.rainbowMaterials.edges.forEach((mat, index) => {
            const offsetHue = (hue + index * 0.15) % 1.0;
            const edgeColor = new THREE.Color().setHSL(offsetHue, 0.95, 0.65);
            mat.color.copy(edgeColor);
        });

        // Animate grids with subtle offset
        window.rainbowMaterials.grids.forEach((mat, index) => {
            const offsetHue = (hue + index * 0.08) % 1.0;
            const gridColor = new THREE.Color().setHSL(offsetHue, 0.85, 0.55);
            mat.color.copy(gridColor);
        });
    }
}

// ========================================
// RENDER LOOP - Smooth animation
// ========================================
function animate(currentTime = 0) {
    animationFrameId = requestAnimationFrame(animate);
    
    // Calculate delta with cap to prevent huge jumps after tab switch
    const delta = Math.min((currentTime - lastTime) / 1000, 0.05);
    lastTime = currentTime;
    
    // Skip if delta is too small
    if (delta < 0.001) return;
    
    // Calculate elapsed time for animations
    const elapsed = (currentTime - GameState.gameStartTime) / 1000;
    
    // Update game logic
    updateGame(delta, elapsed);
    
    // Render
    renderer.render(scene, camera);
    if (typeof renderDiscoPreview === 'function') {
        renderDiscoPreview(delta, elapsed);
    }
}

// ========================================
// RESIZE HANDLER
// ========================================
function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    if (typeof resizeDiscoPreview === 'function') {
        resizeDiscoPreview();
    }
    
    // Show/hide mobile controls based on device
    if (GameState.isPlaying) {
        const isMobile = window.innerWidth <= 768 || 'ontouchstart' in window;
        mobileControls.style.display = isMobile ? 'flex' : 'none';
    }
}
