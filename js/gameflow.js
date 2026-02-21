// GAME FLOW
// ========================================
/**
 * Initialize and begin a Free Run session. Resets all game state, all managers,
 * shows the HUD + pause button, starts background music, and fires the tutorial
 * for first-time players.
 */
function startGame() {
    resumeAudio();

    GameState.isPlaying = true;
    GameState.isPaused = false;
    GameState.distance = DevSettings.forceBonus ? CONFIG.BONUS_START_DISTANCE : 0;
    GameState.orbs = 0;
    GameState.score = 0;
    GameState.currentLane = 1;
    GameState.speed = CONFIG.INITIAL_SPEED;
    GameState.gameStartTime = performance.now();
    GameState.isMagnetActive = false;
    GameState.hasShield = false;
    GameState.isBonusActive = false;
    GameState.bonusTriggered = false;
    GameState.bonusTransitionProgress = DevSettings.forceBonus ? 1 : 0;

    // Reset lives system
    GameState.lives = GameState.maxLives;
    GameState.isInvincible = false;
    GameState.invincibleTimer = 0;

    PlayerController.reset();
    BeatManager.reset();
    MagnetManager.reset();
    ShieldManager.reset();
    SpeedBoostManager.reset();

    if (DevSettings.forceBonus) {
        enterBonusMode();
    }

    if (DevSettings.startWithShield) {
        ShieldManager.activate();
    }
    if (DevSettings.startWithMagnet) {
        MagnetManager.activate();
    }

    startScreen.style.display = 'none';
    beatIndicator.style.display = 'block';

    // Detect mobile device for UI adjustments
    const device = QualityManager.detectDevice();
    const isMobile = device.isTouchDevice || device.isSmallScreen;

    // Show HUD and pause button on all devices
    hud.style.display = 'flex';
    pauseBtn.style.display = 'flex';
    pauseBtn.classList.remove('is-paused');
    pauseBtn.textContent = 'Ⅱ';

    // Set HUD label for Free Run (lives)
    const hitsLabel = document.querySelector('.hud-item-hits .hud-label');
    if (hitsLabel) hitsLabel.textContent = 'Lives';
    if (hitsValue) hitsValue.textContent = GameState.lives;

    // Show mobile controls on mobile devices
    if (isMobile) {
        mobileControls.style.display = 'flex';
    }

    // Start background music
    if (bgMusic) {
        bgMusic.currentTime = 0; // Start from beginning
        bgMusic.play().catch(e => console.log('Audio play failed:', e));
    }

    lastTime = performance.now();

    // Start Free Run tutorial for first-time players
    if (typeof TutorialOverlay !== 'undefined') {
        TutorialOverlay.start('free-run');
    }
}

// ========================================
// STAGE MODE - Week 2
// ========================================

/**
 * Start a specific stage (Stage Mode)
 * @param {string} stageId - Stage ID from registry
 */
function startStage(stageId) {
    // Get stage from registry
    const stage = getStage(stageId);
    if (!stage) {
        console.error('Invalid stage ID:', stageId);
        return;
    }

    // Check if stage is unlocked
    // Allow if unlocked normally OR if QA mode is active
    const isQA = typeof LevelSelectUI !== 'undefined' && LevelSelectUI.qaMode;
    if (!isStageUnlocked(stageId) && !isQA) {
        console.error('Stage is locked:', stageId);
        return;
    }

    resumeAudio();

    // Set Stage Mode state
    GameState.isStageMode = true;
    GameState.currentStage = stage;
    GameState.crashes = 0;
    GameState.orbsCollected = 0;
    GameState.distanceTraveled = 0;

    // Apply stage settings
    GameState.speed = stage.speed;
    GameState.isPlaying = true;
    GameState.isPaused = false;
    GameState.distance = 0;
    GameState.orbs = 0;
    GameState.score = 0;
    GameState.currentLane = 1;
    GameState.gameStartTime = performance.now();
    GameState.isMagnetActive = false;
    GameState.hasShield = false;
    GameState.isBonusActive = false;
    GameState.bonusTriggered = false;
    GameState.bonusTransitionProgress = 0;

    // Create finish line at stage distance
    createFinishLine(stage.distance);

    // Reset all managers
    PlayerController.reset();
    BeatManager.reset();
    ObstacleManager.reset();
    CollectibleManager.reset();
    MagnetManager.reset();
    ShieldManager.reset();
    SpeedBoostManager.reset();
    BonusOrbManager.reset();
    ExitBoosterManager.reset();

    // Hide menus, show HUD
    startScreen.style.display = 'none';
    beatIndicator.style.display = 'block';

    // Detect mobile device for UI adjustments
    const device = QualityManager.detectDevice();
    const isMobile = device.isTouchDevice || device.isSmallScreen;

    // Show HUD and pause button on all devices
    hud.style.display = 'flex';
    pauseBtn.style.display = 'flex';
    pauseBtn.classList.remove('is-paused');
    pauseBtn.textContent = 'Ⅱ';

    // Set HUD label for Stage Mode (hits)
    const hitsLabel = document.querySelector('.hud-item-hits .hud-label');
    if (hitsLabel) hitsLabel.textContent = 'Hits';
    if (hitsValue) hitsValue.textContent = '0';

    // Show mobile controls on mobile devices
    if (isMobile) {
        mobileControls.style.display = 'flex';
    }

    // Start background music
    if (bgMusic) {
        bgMusic.currentTime = 0;
        bgMusic.play().catch(e => console.log('Audio play failed:', e));
    }

    lastTime = performance.now();

    // Show Stage Mode HUD
    if (typeof StageHudUI !== 'undefined') {
        StageHudUI.show();
    }

    // Start tutorial for Stage 1 (first-time players only)
    if (typeof TutorialOverlay !== 'undefined') {
        TutorialOverlay.start(stageId);
    }

    // Show real-time performance HUD
    if (typeof GameplayHUD !== 'undefined') {
        GameplayHUD.show();
    }

    if (DEBUG) console.log(`Starting Stage: ${stage.name} (${stage.distance}m, speed ${stage.speed})`);
}

/**
 * Exit Stage Mode and return to Free Run defaults
 */
function exitStageMode() {
    GameState.isStageMode = false;
    GameState.currentStage = null;
    GameState.crashes = 0;
    GameState.orbsCollected = 0;
    GameState.distanceTraveled = 0;

    // Hide Stage Mode HUD
    if (typeof StageHudUI !== 'undefined') {
        StageHudUI.hide();
    }

    // Stop tutorial if active
    if (typeof TutorialOverlay !== 'undefined') {
        TutorialOverlay.stop(GameState.currentStage?.id);
    }

    // Hide real-time performance HUD
    if (typeof GameplayHUD !== 'undefined') {
        GameplayHUD.hide();
    }

    // Destroy finish line
    destroyFinishLine();

    // Reset speed to default
    GameState.speed = CONFIG.INITIAL_SPEED;
}

/**
 * Activate rainbow bonus mode: clear obstacles and normal collectibles, reset bonus
 * orbs, and mark the transition as triggered. No-ops if bonus is already active.
 * Exit boosters are spawned later by the main loop at the correct distance.
 */
function enterBonusMode() {
    if (GameState.isBonusActive) return;
    if (GameState.distance < CONFIG.BONUS_START_DISTANCE) {
        GameState.distance = CONFIG.BONUS_START_DISTANCE;
    }
    GameState.isBonusActive = true;
    GameState.bonusTriggered = true;
    ObstacleManager.clearForBonus();
    CollectibleManager.reset();
    BonusOrbManager.reset();
    SpeedBoostManager.reset();
}

/**
 * Deactivate bonus mode and resume normal obstacle spawning.
 * No-ops if bonus mode is not currently active.
 */
function exitBonusMode() {
    if (!GameState.isBonusActive) return;
    GameState.isBonusActive = false;
    ObstacleManager.resumeAfterBonus();
    // Exit boosters now spawn at distance 1145 (in loop.js)
}

/**
 * End the current game session: stop gameplay, play death FX (camera shake +
 * particle burst + player shrink animation), update high score, and show the
 * game-over screen after a 500 ms delay to let animations play.
 */
function gameOver() {
    GameState.isPlaying = false;

    // Stop Free Run tutorial if active
    if (typeof TutorialOverlay !== 'undefined') {
        TutorialOverlay.stop('free-run');
    }

    playGameOverSound();
    flashScreen(0.4, '#ff0066');

    // Death animation: camera shake + particle burst + player shrink
    if (cameraShake) cameraShake.addTrauma(1.0);

    if (player && typeof createParticleBurst === 'function') {
        const burstCount = qualitySettings?.effects?.particleBurstCounts?.collision || 15;
        createParticleBurst(player.position, {
            count: burstCount * 2,
            color: 0xff0066,
            spread: 2.5,
            duration: 0.8
        });
    }

    // Player shrink animation
    if (player) {
        const shrinkDuration = 300;
        const startScale = player.scale.x;
        const startTime = performance.now();

        function animateShrink() {
            const elapsed = performance.now() - startTime;
            const progress = Math.min(elapsed / shrinkDuration, 1);
            const scale = startScale * (1 - progress);
            player.scale.set(scale, scale, scale);

            if (progress < 1) {
                requestAnimationFrame(animateShrink);
            } else {
                // Restore scale after game over screen shows
                player.scale.set(startScale, startScale, startScale);
            }
        }
        animateShrink();
    }

    // Pause background music
    if (bgMusic) {
        bgMusic.pause();
    }

    // Calculate final score
    const finalScoreValue = GameState.score + Math.floor(GameState.distance);
    updateTopDistance(GameState.distance);

    // Update display
    finalDistance.textContent = Math.floor(GameState.distance);
    finalOrbs.textContent = GameState.orbs;
    finalScore.textContent = finalScoreValue;
    finalTopDistance.textContent = GameState.topDistance;

    // Reset combo display
    const comboDisplay = document.getElementById('combo-display');
    if (comboDisplay) comboDisplay.classList.remove('active');

    // Show game over after brief delay (let death animation play)
    setTimeout(() => {
        hud.style.display = 'none';
        beatIndicator.style.display = 'none';
        mobileControls.style.display = 'none';
        pauseBtn.style.display = 'none';
        gameoverScreen.style.display = 'flex';
        gameoverScreen.classList.add('screen-fade-in');
        setTimeout(() => gameoverScreen.classList.remove('screen-fade-in'), 350);
    }, 500);
}

/**
 * Reset track tiles and side pillars to their initial positions.
 * Shared by restartGame() and goToMainMenu() to avoid duplication.
 */
function resetTrackAndPillars() {
    // Reset normal track positions and opacity
    floorTilesNormal.forEach((tile, i) => {
        tile.position.z = i * tile.userData.length;
        tile.children.forEach(child => {
            if (child.material) {
                child.material.opacity = 1;
                child.material.transparent = false;
            }
        });
    });

    // Reset rainbow track positions and hide
    floorTilesRainbow.forEach((tile, i) => {
        tile.position.z = i * tile.userData.length;
        tile.visible = false;
    });

    // Backward compatibility
    floorTiles = floorTilesNormal;

    // Reset pillar positions
    const spacing = sidePillars[0]?.userData.spacing || 20;
    sidePillars.forEach((pillar, i) => {
        const pairIndex = Math.floor(i / 2);
        pillar.position.z = pairIndex * spacing;
    });
}

/**
 * Reset all managers and track geometry, then immediately restart the current mode
 * (Stage Mode restarts the same stage; otherwise starts a Free Run).
 */
function restartGame() {
    // Reset all managers
    ObstacleManager.reset();
    CollectibleManager.reset();
    ShieldManager.reset();
    SpeedBoostManager.reset();
    BonusOrbManager.reset();
    ExitBoosterManager.reset();
    if (typeof BoosterHUD !== 'undefined') BoosterHUD.reset();

    resetTrackAndPillars();

    // Hide game over
    gameoverScreen.style.display = 'none';

    // Start fresh (Stage Mode restarts same stage)
    if (GameState.isStageMode && GameState.currentStage) {
        startStage(GameState.currentStage.id);
    } else {
        startGame();
    }
}

/**
 * Abort the current session, reset all managers and track geometry, and return to
 * the start screen. Exits Stage Mode if active.
 */
function goToMainMenu() {
    // Exit Stage Mode if active
    if (GameState.isStageMode) {
        exitStageMode();
    }

    // Reset all managers
    ObstacleManager.reset();
    CollectibleManager.reset();
    ShieldManager.reset();
    MagnetManager.reset();
    SpeedBoostManager.reset();
    BonusOrbManager.reset();
    ExitBoosterManager.reset();
    if (typeof BoosterHUD !== 'undefined') BoosterHUD.reset();

    resetTrackAndPillars();

    // Reset player
    PlayerController.reset();

    // Pause background music
    if (bgMusic) {
        bgMusic.pause();
    }

    // Hide game over and show start screen with transition
    gameoverScreen.style.display = 'none';
    startScreen.style.display = 'flex';
    startScreen.classList.add('screen-fade-in');
    setTimeout(() => startScreen.classList.remove('screen-fade-in'), 350);
    pauseBtn.style.display = 'none';
}

/**
 * Toggle pause state. Updates the pause button icon, pauses or resumes background
 * music, and resets the frame-time reference so delta doesn't spike on resume.
 * No-ops when the game is not playing.
 */
function togglePause() {
    if (!GameState.isPlaying) return;

    GameState.isPaused = !GameState.isPaused;
    pauseBtn.classList.toggle('is-paused', GameState.isPaused);
    pauseBtn.textContent = GameState.isPaused ? '▶' : 'Ⅱ';

    if (bgMusic) {
        if (GameState.isPaused) {
            bgMusic.pause();
        } else {
            bgMusic.play().catch(e => console.log('Audio play failed:', e));
        }
    }

    if (!GameState.isPaused) {
        lastTime = performance.now();
    }
}
