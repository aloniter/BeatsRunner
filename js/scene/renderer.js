// ========================================
// RENDERER - Three.js Setup & Initialization
// ========================================

function init() {
    // Show loading progress
    const loadingBar = document.getElementById('loading-bar');
    const loadingText = document.getElementById('loading-text');
    const loadingScreen = document.getElementById('loading-screen');

    function setLoadProgress(pct, msg) {
        if (loadingBar) loadingBar.style.width = pct + '%';
        if (loadingText) loadingText.textContent = msg;
    }

    setLoadProgress(10, 'Loading saved data...');
    loadOrbs();
    loadTopDistance();
    loadDiscoBallState();
    loadFireBallState();

    // Initialize quality settings based on device capabilities
    setLoadProgress(20, 'Detecting device...');
    qualitySettings = QualityManager.init();

    // Create scene
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x050010);
    scene.fog = new THREE.Fog(0x050010, CONFIG.FOG_NEAR, CONFIG.FOG_FAR);

    // Create camera - positioned BEHIND player looking FORWARD
    // Adjusted for better mobile view - higher and further back
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 500);
    camera.position.set(0, 6, -10);
    camera.lookAt(0, 1, 25);

    // Initialize camera shake system
    cameraShake = new CameraShake(camera);
    cameraShake.setBasePosition(camera.position);
    cameraShake.setIntensity(qualitySettings.effects ? qualitySettings.effects.screenShakeIntensity || 1.0 : 1.0);

    // Create renderer with quality-based optimizations
    renderer = new THREE.WebGLRenderer({
        canvas: canvas,
        antialias: qualitySettings.antialias,
        powerPreference: "high-performance",
        stencil: false,
        depth: true
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, qualitySettings.pixelRatio));
    renderer.outputColorSpace = THREE.SRGBColorSpace;

    // ========================================
    // POST-PROCESSING SETUP - Quality-Aware Bloom
    // ========================================
    // Check if post-processing modules loaded successfully
    if (qualitySettings.bloom.enabled &&
        typeof THREE.EffectComposer !== 'undefined' &&
        typeof THREE.RenderPass !== 'undefined' &&
        typeof THREE.UnrealBloomPass !== 'undefined') {

        // Create composer
        composer = new THREE.EffectComposer(renderer);

        // Add render pass - renders scene normally
        const renderPass = new THREE.RenderPass(scene, camera);
        composer.addPass(renderPass);

        // Add bloom pass with quality-adjusted parameters
        const bloomPass = new THREE.UnrealBloomPass(
            new THREE.Vector2(window.innerWidth, window.innerHeight),
            qualitySettings.bloom.strength,    // Quality-based strength
            qualitySettings.bloom.radius,      // Quality-based radius
            qualitySettings.bloom.threshold    // Quality-based threshold
        );
        composer.addPass(bloomPass);

        console.log(`✓ Bloom initialized (${QualityManager.presetName}): strength=${qualitySettings.bloom.strength}, radius=${qualitySettings.bloom.radius}`);
    } else {
        console.warn('⚠ Post-processing modules not loaded or bloom disabled');
        composer = null; // Fallback to direct rendering
    }

    // Create game elements
    setLoadProgress(40, 'Building scene...');
    createLights();
    createFloor();
    setLoadProgress(55, 'Creating player...');
    createPlayer();
    createSidePillars();
    setLoadProgress(70, 'Generating particles...');
    createParticles();

    // Setup audio
    setLoadProgress(80, 'Setting up audio...');
    setupAudio();

    // Setup background music
    bgMusic = document.getElementById('bg-music');
    bgMusic.volume = 0.4; // Set volume to 40%

    // Setup controls
    setLoadProgress(90, 'Initializing controls...');
    setupControls();
    setupStore();

    // Handle resize
    window.addEventListener('resize', onWindowResize);

    // Handle orientation change
    window.addEventListener('orientationchange', onOrientationChange);

    // Handle visibility change (pause when tab hidden)
    document.addEventListener('visibilitychange', onVisibilityChange);

    // Start render loop
    setLoadProgress(100, 'Ready!');
    lastTime = performance.now();
    animate();

    // Fade out loading screen
    setTimeout(() => {
        if (loadingScreen) {
            loadingScreen.classList.add('fade-out');
            setTimeout(() => loadingScreen.remove(), 600);
        }
    }, 300);
}

// ========================================
// CAMERA SHAKE SYSTEM - Trauma-Based Screen Shake
// ========================================
class CameraShake {
    constructor(camera) {
        this.camera = camera;
        this.trauma = 0; // 0-1 intensity
        this.decay = 2.5; // Decay rate per second
        this.originalPosition = new THREE.Vector3();
        this.shakeIntensity = 1.0; // Quality multiplier (set by quality preset)
    }

    addTrauma(amount) {
        // Add trauma capped at 1.0, scaled by quality intensity
        this.trauma = Math.min(this.trauma + (amount * this.shakeIntensity), 1.0);
    }

    update(deltaTime) {
        if (this.trauma > 0) {
            // Decay trauma over time
            this.trauma = Math.max(0, this.trauma - this.decay * deltaTime);

            // Square for smooth falloff (trauma² creates more natural feel)
            const shake = this.trauma * this.trauma;

            // Apply random offset to camera position (position-only shake)
            this.camera.position.x = this.originalPosition.x + (Math.random() - 0.5) * shake * 0.5;
            this.camera.position.y = this.originalPosition.y + (Math.random() - 0.5) * shake * 0.3;
        } else {
            // Reset to original position when trauma is 0
            this.camera.position.copy(this.originalPosition);
        }
    }

    setBasePosition(position) {
        // Store current camera position as the base position
        this.originalPosition.copy(position);
    }

    setIntensity(intensity) {
        // Set shake intensity multiplier (for quality presets)
        this.shakeIntensity = intensity;
    }
}

// ========================================
// LIGHTS
// ========================================
function createLights() {
    // Ambient light
    const ambient = new THREE.AmbientLight(0x333355, 0.6);
    scene.add(ambient);

    // Hemisphere light for better ambient
    const hemi = new THREE.HemisphereLight(0x0066ff, 0xff00ff, 0.3);
    scene.add(hemi);
}
