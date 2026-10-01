// CONTROLS - SWAPPED DIRECTIONS + JUMP
// ========================================
function setupControls() {
    // Keyboard controls
    document.addEventListener('keydown', (e) => {
        if (!GameState.isPlaying) return;
        
        if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
            e.preventDefault();
            if (e.repeat) return; // holding the key must not slide multiple lanes
            changeLane(1); // Left arrow moves RIGHT
        }
        else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
            e.preventDefault();
            if (e.repeat) return;
            changeLane(-1); // Right arrow moves LEFT
        }
        else if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W' || e.key === ' ') {
            if (e.repeat) return;
            e.preventDefault();
            PlayerController.jump();
        }
        else if (e.key === 'Escape' || e.key === 'p' || e.key === 'P') {
            e.preventDefault();
            togglePause();
        }
    });
    
    // Touch / Swipe controls
    // One gesture = one action. The swipe fires as soon as the finger crosses the
    // threshold (touchmove) and is then locked, so lifting the finger can never
    // trigger a second lane change. Only the first finger of a gesture is tracked.
    let touchId = null;
    let touchStartX = 0;
    let touchStartY = 0;
    let gestureHandled = false;
    const swipeThreshold = Math.max(30, Math.min(80, window.innerWidth * 0.04));

    // Minimum gap between lane changes (ms) - filters duplicate/bounced inputs
    const LANE_COOLDOWN_MS = 90;
    let lastLaneChange = 0;
    function changeLane(direction) {
        const now = performance.now();
        if (now - lastLaneChange < LANE_COOLDOWN_MS) return;
        lastLaneChange = now;
        PlayerController.switchLane(direction);
    }

    function findTouch(list) {
        for (let i = 0; i < list.length; i++) {
            if (list[i].identifier === touchId) return list[i];
        }
        return null;
    }

    canvas.addEventListener('touchstart', (e) => {
        if (touchId !== null) return; // ignore extra fingers
        const t = e.changedTouches[0];
        touchId = t.identifier;
        touchStartX = t.clientX;
        touchStartY = t.clientY;
        gestureHandled = false;
    }, { passive: true });

    canvas.addEventListener('touchmove', (e) => {
        if (touchId === null || gestureHandled || !GameState.isPlaying) return;
        const t = findTouch(e.changedTouches);
        if (!t) return;
        const diffX = t.clientX - touchStartX;
        const diffY = t.clientY - touchStartY;

        if (Math.abs(diffY) > Math.abs(diffX) && Math.abs(diffY) > swipeThreshold) {
            gestureHandled = true;
            if (diffY < 0) PlayerController.jump(); // Swipe up -> jump
        } else if (Math.abs(diffX) > swipeThreshold) {
            gestureHandled = true;
            // Horizontal swipe (SWAPPED)
            changeLane(diffX > 0 ? -1 : 1); // Swipe right -> move LEFT, swipe left -> move RIGHT
        }
    }, { passive: true });

    canvas.addEventListener('touchend', (e) => {
        const t = findTouch(e.changedTouches);
        if (!t) return;
        touchId = null;
        if (gestureHandled || !GameState.isPlaying) return;

        // Tap/press - move toward tap position (SWAPPED)
        const screenWidth = window.innerWidth;
        const screenHeight = window.innerHeight;

        // Top third of screen = jump
        if (t.clientY < screenHeight / 3) {
            PlayerController.jump();
        }
        // Bottom two thirds = left/right movement
        else if (t.clientX < screenWidth / 3) {
            changeLane(1); // Tap left side -> move RIGHT
        } else if (t.clientX > screenWidth * 2 / 3) {
            changeLane(-1); // Tap right side -> move LEFT
        }
    }, { passive: true });

    canvas.addEventListener('touchcancel', (e) => {
        if (findTouch(e.changedTouches)) touchId = null;
    }, { passive: true });

    // Mobile button controls (SWAPPED)
    let lastTouchTime = 0;

    document.getElementById('left-btn').addEventListener('touchstart', (e) => {
        e.preventDefault();
        lastTouchTime = performance.now();
        if (GameState.isPlaying) {
            changeLane(1); // Left button moves RIGHT
        }
    });
    
    document.getElementById('right-btn').addEventListener('touchstart', (e) => {
        e.preventDefault();
        lastTouchTime = performance.now();
        if (GameState.isPlaying) {
            changeLane(-1); // Right button moves LEFT
        }
    });
    
    document.getElementById('jump-btn').addEventListener('touchstart', (e) => {
        e.preventDefault();
        lastTouchTime = performance.now();
        if (GameState.isPlaying) {
            PlayerController.jump();
        }
    });
    
    // Also handle click for desktop testing (SWAPPED)
    document.getElementById('left-btn').addEventListener('click', (e) => {
        e.preventDefault();
        if (performance.now() - lastTouchTime < 500) return;
        if (GameState.isPlaying) changeLane(1);
    });
    
    document.getElementById('right-btn').addEventListener('click', (e) => {
        e.preventDefault();
        if (performance.now() - lastTouchTime < 500) return;
        if (GameState.isPlaying) changeLane(-1);
    });
    
    document.getElementById('jump-btn').addEventListener('click', (e) => {
        e.preventDefault();
        if (performance.now() - lastTouchTime < 500) return;
        if (GameState.isPlaying) PlayerController.jump();
    });
    
    // UI Buttons
    document.getElementById('start-btn').addEventListener('click', startGame);
    document.getElementById('restart-btn').addEventListener('click', restartGame);
    document.getElementById('mainmenu-btn').addEventListener('click', goToMainMenu);
    pauseBtn.addEventListener('click', togglePause);
    document.getElementById('resume-btn').addEventListener('click', togglePause);
    document.getElementById('pause-mainmenu-btn').addEventListener('click', goToMainMenu);

    // Stage Mode button
    document.getElementById('stage-mode-btn').addEventListener('click', () => {
        startScreen.style.display = 'none';
        LevelSelectUI.show();
    });

    // Initialize Stage Mode UI
    initStageUI();

    // Initialize haptics on first user gesture (required for iOS)
    setupHapticInitialization();

    setupDevTools();
}

/**
 * Initialize all Stage Mode UI components
 */
function initStageUI() {
    LevelSelectUI.init();
    StageInfoCardUI.init();
    if (typeof StageHudUI !== 'undefined') StageHudUI.init();
    ResultsScreenUI.init();

    // Update menu stars on init
    LevelSelectUI.updateMenuStars();
}

/**
 * Initialize haptics on first user gesture
 * Required for iOS - vibration must be triggered from user interaction
 */
function setupHapticInitialization() {
    if (!hapticFeedback) return;

    const initHaptics = () => {
        hapticFeedback.initialize().then(success => {
            if (success) {
                console.log('✓ Haptics ready');
            }
        });
    };

    // Listen to various user interaction events (use once:true to auto-remove)
    // Canvas touch events (mobile swipes/taps)
    canvas.addEventListener('touchstart', initHaptics, { once: true, passive: true });

    // Mobile button touches
    const leftBtn = document.getElementById('left-btn');
    const rightBtn = document.getElementById('right-btn');
    const jumpBtn = document.getElementById('jump-btn');
    if (leftBtn) leftBtn.addEventListener('touchstart', initHaptics, { once: true, passive: true });
    if (rightBtn) rightBtn.addEventListener('touchstart', initHaptics, { once: true, passive: true });
    if (jumpBtn) jumpBtn.addEventListener('touchstart', initHaptics, { once: true, passive: true });

    // Start button click (desktop fallback)
    const startBtn = document.getElementById('start-btn');
    if (startBtn) startBtn.addEventListener('click', initHaptics, { once: true });
}

// ========================================
// VISIBILITY CHANGE HANDLER
// ========================================
function onVisibilityChange() {
    if (document.hidden && GameState.isPlaying) {
        GameState.isPaused = true;
        pauseBtn.classList.add('is-paused');
        pauseBtn.textContent = '▶';
        if (bgMusic && !bgMusic.paused) {
            bgMusic.pause();
        }
    } else if (!document.hidden && GameState.isPaused && pauseScreen.style.display !== 'flex') {
        GameState.isPaused = false;
        pauseBtn.classList.remove('is-paused');
        pauseBtn.textContent = 'Ⅱ';
        lastTime = performance.now();
        if (bgMusic && GameState.isPlaying) {
            bgMusic.play().catch(e => console.log('Audio play failed:', e));
        }
    }
}

// ========================================
// ORIENTATION CHANGE HANDLER
// ========================================
function onOrientationChange() {
    setTimeout(() => {
        onWindowResize();
    }, 100);
}

// ========================================
// DEV TOOLS (MAIN MENU)
// ========================================
function setupDevTools() {
    const panel = document.getElementById('dev-tools');
    const toggle = document.getElementById('dev-tools-toggle');
    const wrapper = document.getElementById('dev-tools-panel');
    if (toggle && panel) {
        toggle.addEventListener('click', () => {
            const isOpen = panel.classList.toggle('is-open');
            panel.setAttribute('aria-hidden', String(!isOpen));
            toggle.setAttribute('aria-expanded', String(isOpen));
            if (wrapper) {
                wrapper.classList.toggle('is-open', isOpen);
            }
        });
    }
    if (!panel) return;
    
    const orbsInput = document.getElementById('dev-orbs-input');
    const startShieldToggle = document.getElementById('dev-start-shield');
    const startMagnetToggle = document.getElementById('dev-start-magnet');
    const forceBonusToggle = document.getElementById('dev-force-bonus');
    const godModeToggle = document.getElementById('dev-god-mode');
    
    if (startShieldToggle) {
        startShieldToggle.addEventListener('change', () => {
            DevSettings.startWithShield = startShieldToggle.checked;
        });
    }
    
    if (startMagnetToggle) {
        startMagnetToggle.addEventListener('change', () => {
            DevSettings.startWithMagnet = startMagnetToggle.checked;
        });
    }

    if (forceBonusToggle) {
        forceBonusToggle.addEventListener('change', () => {
            DevSettings.forceBonus = forceBonusToggle.checked;
            if (!GameState.isPlaying) return;
            if (DevSettings.forceBonus) {
                GameState.distance = CONFIG.BONUS_START_DISTANCE;
                enterBonusMode();
                GameState.score = GameState.orbs * 100 + Math.floor(GameState.distance);
                if (distanceValue) distanceValue.textContent = Math.floor(GameState.distance);
                if (scoreValue) scoreValue.textContent = GameState.score;
            } else {
                exitBonusMode();
                if (GameState.distance < CONFIG.BONUS_START_DISTANCE) {
                    GameState.bonusTriggered = false;
                }
            }
        });
    }

    if (godModeToggle) {
        godModeToggle.addEventListener('change', () => {
            DevSettings.godMode = godModeToggle.checked;
        });
    }

    // Quality selector
    const qualitySelect = document.getElementById('quality-select');
    const qualityApplyBtn = document.getElementById('quality-apply');

    if (qualitySelect) {
        // Set initial value based on saved quality
        const savedQuality = Storage.get(Storage.KEYS.QUALITY);
        if (savedQuality) {
            qualitySelect.value = savedQuality;
        } else {
            qualitySelect.value = 'AUTO';
        }
    }

    if (qualityApplyBtn && qualitySelect) {
        qualityApplyBtn.addEventListener('click', () => {
            const selectedQuality = qualitySelect.value;

            if (selectedQuality === 'AUTO') {
                // Clear saved preference and auto-detect
                Storage.remove(Storage.KEYS.QUALITY);
                alert('Graphics quality will be automatically detected on next page reload.');
            } else {
                // Save preference
                Storage.set(Storage.KEYS.QUALITY, selectedQuality);
                alert(`Graphics quality set to ${selectedQuality}. Page will reload to apply changes.`);
            }

            // Reload page to apply quality changes
            setTimeout(() => {
                window.location.reload();
            }, 500);
        });
    }

    panel.addEventListener('click', (event) => {
        const target = event.target;
        if (!target || !target.dataset) return;
        
        const action = target.dataset.devAction;
        if (!action) return;
        
        if (action === 'orbs-add') {
            const amount = Number(target.dataset.amount) || 0;
            addOrbs(amount);
        } else if (action === 'orbs-remove') {
            const amount = Number(target.dataset.amount) || 0;
            spendOrbs(amount);
        } else if (action === 'orbs-reset') {
            resetOrbs();
        } else if (action === 'orbs-set') {
            const value = Number(orbsInput?.value) || 0;
            GameState.totalOrbs = Math.max(0, Math.floor(value));
            saveOrbs();
            if (menuOrbsValue) menuOrbsValue.textContent = GameState.totalOrbs;
            if (typeof refreshStoreUI === 'function') refreshStoreUI();
        } else if (action === 'skins-unlock-all') {
            getAllSkins().forEach(skin => {
                const ownedKey = getOwnedKey(skin.id);
                GameState[ownedKey] = true;
                saveSkinState(skin.id);
            });
            applySkins();
            if (typeof refreshStoreUI === 'function') refreshStoreUI();
        }
    });
}
