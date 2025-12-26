// GAME FLOW
// ========================================
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
    
    PlayerController.reset();
    BeatManager.reset();
    MagnetManager.reset();
    ShieldManager.reset();

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
    hud.style.display = 'flex';
    beatIndicator.style.display = 'block';
    pauseBtn.style.display = 'flex';
    pauseBtn.classList.remove('is-paused');
    pauseBtn.textContent = 'Ⅱ';
    
    // Show mobile controls on mobile devices
    const isMobile = window.innerWidth <= 768 || 'ontouchstart' in window;
    if (isMobile) {
        mobileControls.style.display = 'flex';
    }
    
    // Start background music
    if (bgMusic) {
        bgMusic.currentTime = 0; // Start from beginning
        bgMusic.play().catch(e => console.log('Audio play failed:', e));
    }
    
    lastTime = performance.now();
}

function enterBonusMode() {
    if (GameState.isBonusActive) return;
    if (GameState.distance < CONFIG.BONUS_START_DISTANCE) {
        GameState.distance = CONFIG.BONUS_START_DISTANCE;
    }
    GameState.isBonusActive = true;
    GameState.bonusTriggered = true;
    ObstacleManager.clearForBonus();
}

function exitBonusMode() {
    if (!GameState.isBonusActive) return;
    GameState.isBonusActive = false;
    ObstacleManager.resumeAfterBonus();
    ExitBoosterManager.spawn();
}

function gameOver() {
    GameState.isPlaying = false;
    
    playGameOverSound();
    flashScreen(0.4, '#ff0066');
    
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
    
    // Show game over after brief delay
    setTimeout(() => {
        hud.style.display = 'none';
        beatIndicator.style.display = 'none';
        mobileControls.style.display = 'none';
        pauseBtn.style.display = 'none';
        gameoverScreen.style.display = 'flex';
    }, 400);
}

function restartGame() {
    // Reset all managers
    ObstacleManager.reset();
    CollectibleManager.reset();
    ShieldManager.reset();
    BonusOrbManager.reset();
    ExitBoosterManager.reset();

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

    // Hide game over
    gameoverScreen.style.display = 'none';

    // Start fresh
    startGame();
}

function goToMainMenu() {
    // Reset all managers
    ObstacleManager.reset();
    CollectibleManager.reset();
    ShieldManager.reset();
    MagnetManager.reset();
    BonusOrbManager.reset();
    ExitBoosterManager.reset();

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

    // Reset player
    PlayerController.reset();

    // Pause background music
    if (bgMusic) {
        bgMusic.pause();
    }

    // Hide game over and show start screen
    gameoverScreen.style.display = 'none';
    startScreen.style.display = 'flex';
    pauseBtn.style.display = 'none';
}

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
