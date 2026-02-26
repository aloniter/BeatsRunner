// ========================================
// ADAPTIVE RESOLUTION - Auto-lower pixel ratio when FPS drops
// Only active on touch devices (phones/tablets). Adjusts at most once every 3s.
// ========================================
const adaptiveRes = {
    _history: [],
    _maxHistory: 60,   // ~1 second of samples at 60 fps
    _cooldown: 0,      // seconds until next adjustment is allowed
    _COOLDOWN: 3.0,    // seconds between adjustments (hysteresis)
    _LOW_FPS: 50,      // lower pixel ratio when avg FPS falls below this
    _HIGH_FPS: 58,     // raise pixel ratio when avg FPS recovers above this
    _MIN_RATIO: 0.75,  // floor — never go below this
    _isMobile: null,   // cached mobile check

    update(delta) {
        if (!renderer || !qualitySettings) return;
        // Only run on mobile — desktop GPU is fast enough
        if (this._isMobile === null) {
            this._isMobile = ('ontouchstart' in window || navigator.maxTouchPoints > 0);
        }
        if (!this._isMobile) return;

        const fps = delta > 0 ? 1 / delta : 60;
        this._history.push(fps);
        if (this._history.length > this._maxHistory) this._history.shift();
        if (this._history.length < this._maxHistory) return; // wait for a full second of data

        this._cooldown -= delta;
        if (this._cooldown > 0) return;

        const avg = this._history.reduce((a, b) => a + b, 0) / this._history.length;
        const cur = renderer.getPixelRatio();
        const max = qualitySettings.pixelRatio;

        if (avg < this._LOW_FPS && cur > this._MIN_RATIO) {
            const next = Math.max(this._MIN_RATIO, +(cur - 0.25).toFixed(2));
            renderer.setPixelRatio(next);
            if (composer) composer.setSize(window.innerWidth, window.innerHeight);
            this._cooldown = this._COOLDOWN;
            this._history = [];
        } else if (avg > this._HIGH_FPS && cur < max) {
            const next = Math.min(max, +(cur + 0.25).toFixed(2));
            renderer.setPixelRatio(next);
            if (composer) composer.setSize(window.innerWidth, window.innerHeight);
            this._cooldown = this._COOLDOWN;
            this._history = [];
        }
    }
};

// UPDATE LOOP
// ========================================
function updateGame(delta, elapsed) {
    if (!GameState.isPlaying || GameState.isPaused) return;
    
    // Update beat system
    BeatManager.update(elapsed);
    
    // Update player
    PlayerController.update(delta, elapsed);

    // Update skin animations (centralized in SkinAnimator)
    if (typeof SkinAnimator !== 'undefined') {
        SkinAnimator.update(delta, elapsed);
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

        // Update tutorial overlay (Stage 1 only, first-time players)
        if (typeof TutorialOverlay !== 'undefined') {
            TutorialOverlay.update(GameState.distance, GameState.crashes, GameState.orbsCollected);
        }

        // Update real-time performance HUD
        if (typeof GameplayHUD !== 'undefined') {
            GameplayHUD.update();
        }

        // Stage 15 finale visuals (rainbow track at 800m)
        if (GameState.currentStage && GameState.currentStage.isFinale) {
            updateFinaleVisuals(delta, elapsed);
        }
    }

    // Update Free Run tutorial overlay
    if (!GameState.isStageMode && typeof TutorialOverlay !== 'undefined') {
        TutorialOverlay.update(GameState.distance, GameState.crashes, GameState.orbs);
    }

    // Bonus Mode only in Free Run (disabled in Stage Mode)
    if (!GameState.isStageMode && !GameState.bonusTriggered && GameState.distance >= CONFIG.BONUS_START_DISTANCE) {
        enterBonusMode();
        if (DEBUG) console.log('BONUS START (1000)');
    }

    // Spawn exit boosters before bonus ends (at 1195) so they're visible
    if (GameState.isBonusActive && !ExitBoosterManager.spawned && GameState.distance >= 1195) {
        ExitBoosterManager.spawn();
        if (DEBUG) console.log('EXIT BOOSTERS SPAWNED (1195)');
    }

    if (GameState.isBonusActive && GameState.distance >= CONFIG.BONUS_END_DISTANCE) {
        exitBonusMode();
        if (DEBUG) console.log('BONUS END (1250)');
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

    // Update invincibility timer (Free Run)
    if (!GameState.isStageMode && GameState.isInvincible) {
        GameState.invincibleTimer -= delta;
        if (GameState.invincibleTimer <= 0) {
            GameState.isInvincible = false;
            GameState.invincibleTimer = 0;
            // Restore player opacity
            if (player) player.traverse(child => {
                if (child.material && child.material._savedOpacity !== undefined) {
                    child.material.opacity = child.material._savedOpacity;
                    delete child.material._savedOpacity;
                }
            });
        } else {
            // Blink player during invincibility
            const blinkRate = Math.sin(GameState.invincibleTimer * 15);
            if (player) player.traverse(child => {
                if (child.material) {
                    if (child.material._savedOpacity === undefined) {
                        child.material._savedOpacity = child.material.opacity;
                    }
                    child.material.opacity = blinkRate > 0 ? child.material._savedOpacity : 0.15;
                }
            });
        }
    }

    // Check collision
    if (!GameState.isBonusActive && !DevSettings.godMode && !GameState.isInvincible && ObstacleManager.checkCollision()) {
        if (GameState.isStageMode) {
            // Stage Mode: Count crash, don't end game
            GameState.crashes++;
            GameState.combo = 0;
            GameState.multiplier = 1;
            flashScreen(0.15, '#ff0066');

            // Add impact feedback
            if (cameraShake) cameraShake.addTrauma(0.7);
            if (typeof createParticleBurst === 'function') {
                const burstCount = qualitySettings?.effects?.particleBurstCounts?.collision || 15;
                createParticleBurst(player.position, {
                    count: burstCount,
                    color: 0xff3333,
                    spread: 1.5
                });
            }
            if (typeof hapticFeedback !== 'undefined') {
                hapticFeedback.crash();
            }

            // Continue playing - no gameOver()
        } else {
            // Free Run: Lives system
            GameState.lives--;
            GameState.crashes++;
            GameState.combo = 0;
            GameState.multiplier = 1;

            // Impact feedback
            flashScreen(0.2, '#ff0066');
            if (cameraShake) cameraShake.addTrauma(0.7);
            if (typeof createParticleBurst === 'function') {
                const burstCount = qualitySettings?.effects?.particleBurstCounts?.collision || 15;
                createParticleBurst(player.position, {
                    count: burstCount,
                    color: 0xff3333,
                    spread: 1.5
                });
            }
            if (typeof hapticFeedback !== 'undefined') {
                hapticFeedback.crash();
            }

            if (GameState.lives <= 0) {
                gameOver();
            } else {
                // Activate invincibility frames
                GameState.isInvincible = true;
                GameState.invincibleTimer = GameState.INVINCIBLE_DURATION;
                // Update lives HUD
                if (hitsValue) hitsValue.textContent = GameState.lives;
            }
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
    
    // Update particles (with quality-based frame skipping)
    if (particleSystem && QualityManager.shouldUpdateParticles()) {
        const positions = particleSystem.geometry.attributes.position.array;
        const velocities = particleSystem.geometry.userData.velocities;
        // Compensate for skipped frames by multiplying movement
        const skipFrames = QualityManager.getPreset().particles.skipFrames;
        const moveMultiplier = skipFrames > 0 ? (skipFrames + 1) : 1;

        for (let i = 0; i < positions.length / 3; i++) {
            positions[i * 3 + 2] -= moveAmount * velocities[i] * moveMultiplier;
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
    // In Free Run show remaining lives, in Stage Mode show crash count
    if (GameState.isStageMode) {
        hitsValue.textContent = GameState.crashes;
    } else {
        hitsValue.textContent = GameState.lives;
    }
    scoreValue.textContent = GameState.score;

    // Update combo display
    const comboDisplay = document.getElementById('combo-display');
    const comboCount = document.getElementById('combo-count');
    const comboMult = document.getElementById('combo-multiplier');
    if (comboDisplay && comboCount) {
        if (GameState.combo >= 2) {
            comboDisplay.classList.add('active');
            comboCount.textContent = `${GameState.combo}x`;
            // Pop animation
            comboCount.classList.add('pop');
            setTimeout(() => comboCount.classList.remove('pop'), 150);
            if (comboMult) {
                comboMult.textContent = GameState.multiplier > 1 ? `${GameState.multiplier.toFixed(1)}x bonus` : '';
            }
        } else {
            comboDisplay.classList.remove('active');
        }
    }

    // Update booster HUD badge countdowns
    if (typeof BoosterHUD !== 'undefined') {
        BoosterHUD.update();
    }
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

/**
 * Update Stage 15 finale visuals
 * Rainbow track transition at 800m (50% of 1600m stage)
 */
function updateFinaleVisuals(delta, elapsed) {
    const FINALE_TRANSITION_START = 800;  // 50% of 1600m stage
    const TRANSITION_DURATION = 200;       // 200m transition zone

    // Calculate transition progress (0 to 1)
    let transitionProgress = 0;
    if (GameState.distance >= FINALE_TRANSITION_START) {
        const distanceIntoTransition = GameState.distance - FINALE_TRANSITION_START;
        transitionProgress = Math.min(distanceIntoTransition / TRANSITION_DURATION, 1);
    }

    // Only apply visuals if transitioning
    if (transitionProgress > 0) {
        // Opacity crossfade between normal and rainbow tracks
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
            tile.visible = true;
            tile.children.forEach(child => {
                if (child.material) {
                    child.material.opacity = rainbowOpacity;
                    child.material.transparent = true;
                }
            });
        });

        // Animate rainbow colors (similar to bonus mode)
        if (window.rainbowMaterials) {
            const timeCycle = elapsed * 0.4;       // Slightly faster than bonus mode
            const spatialFlow = GameState.distance * 0.05;
            const hue = (timeCycle + spatialFlow) % 1.0;

            // Vibrant floor colors
            window.rainbowMaterials.floors.forEach(mat => {
                const rainbowColor = new THREE.Color().setHSL(hue, 1.0, 0.7);
                mat.color.copy(rainbowColor);
                mat.emissive.copy(rainbowColor.clone().multiplyScalar(0.95));
                mat.emissiveIntensity = 2.0; // Extra vivid for finale
            });

            // Offset edge colors
            window.rainbowMaterials.edges.forEach((mat, index) => {
                const offsetHue = (hue + index * 0.2) % 1.0;
                const edgeColor = new THREE.Color().setHSL(offsetHue, 0.95, 0.7);
                mat.color.copy(edgeColor);
            });

            // Subtle grid colors
            window.rainbowMaterials.grids.forEach((mat, index) => {
                const offsetHue = (hue + index * 0.1) % 1.0;
                const gridColor = new THREE.Color().setHSL(offsetHue, 0.9, 0.6);
                mat.color.copy(gridColor);
            });
        }

        // Increase particle intensity in final stretch (last 400m)
        const FINALE_PARTICLE_BOOST_START = 1200; // Last 400m
        if (GameState.distance >= FINALE_PARTICLE_BOOST_START && window.particleSystem) {
            const particleBoostProgress = (GameState.distance - FINALE_PARTICLE_BOOST_START) / 400;
            const particleIntensity = 1 + (particleBoostProgress * 0.5); // Up to 50% more particles

            // Increase particle visibility/opacity
            if (window.particleSystem.material) {
                window.particleSystem.material.opacity = Math.min(0.8, 0.5 * particleIntensity);
            }
        }
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

    // Update particle bursts
    if (typeof updateParticleBursts === 'function') {
        updateParticleBursts(delta);
    }

    // Update camera shake
    if (cameraShake) {
        cameraShake.update(delta);
    }

    // Render - Use bloom composer if available, fallback to direct render
    if (composer) {
        composer.render();
    } else {
        renderer.render(scene, camera);
    }

    // Adaptively lower/raise pixel ratio to maintain smooth FPS on mobile
    adaptiveRes.update(delta);

    // Render disco ball/fireball preview canvases (independent renderers)
    if (typeof renderDiscoPreview === 'function') {
        renderDiscoPreview(delta, elapsed);
    }
}

// ========================================
// RESIZE HANDLER (Quality-Aware)
// ========================================
function onWindowResize() {
    const width = window.innerWidth;
    const height = window.innerHeight;

    // Update camera
    camera.aspect = width / height;
    camera.updateProjectionMatrix();

    // Update renderer with quality-based pixel ratio
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, QualityManager.getPreset().pixelRatio));

    // Update composer and bloom pass resolution
    if (composer) {
        composer.setSize(width, height);

        // Update bloom pass render targets to prevent blurriness after resize
        const bloomPass = composer.passes.find(pass => pass instanceof THREE.UnrealBloomPass);
        if (bloomPass) {
            bloomPass.resolution.set(width, height);
        }
    }

    // Resize disco ball preview renderers (independent)
    if (typeof resizeDiscoPreview === 'function') {
        resizeDiscoPreview();
    }

    // Show/hide mobile controls based on device detection
    if (GameState.isPlaying) {
        const device = QualityManager.detectDevice();
        mobileControls.style.display = device.isTouchDevice ? 'flex' : 'none';
    }
}
