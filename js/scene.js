// ========================================
// INITIALIZATION
// ========================================
function init() {
    loadOrbs();
    loadTopDistance();
    loadDiscoBallState();

    // Create scene
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x050010);
    scene.fog = new THREE.Fog(0x050010, CONFIG.FOG_NEAR, CONFIG.FOG_FAR);
    
    // Create camera - positioned BEHIND player looking FORWARD
    // Adjusted for better mobile view - higher and further back
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 500);
    camera.position.set(0, 6, -10);
    camera.lookAt(0, 1, 25);
    
    // Create renderer with optimizations
    renderer = new THREE.WebGLRenderer({ 
        canvas: canvas, 
        antialias: window.devicePixelRatio < 2,
        powerPreference: "high-performance",
        stencil: false,
        depth: true
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    
    // Create game elements
    createLights();
    createFloor();
    createPlayer();
    createSidePillars();
    createParticles();
    
    // Setup audio
    setupAudio();
    
    // Setup background music
    bgMusic = document.getElementById('bg-music');
    bgMusic.volume = 0.4; // Set volume to 40%
    
    // Setup controls
    setupControls();
    setupStore();
    
    // Handle resize
    window.addEventListener('resize', onWindowResize);
    
    // Handle orientation change
    window.addEventListener('orientationchange', onOrientationChange);
    
    // Handle visibility change (pause when tab hidden)
    document.addEventListener('visibilitychange', onVisibilityChange);
    
    // Start render loop
    lastTime = performance.now();
    animate();
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

// ========================================
// FLOOR - Infinite Neon Track
// ========================================
function createFloor() {
    const tileLength = 25;
    const numTiles = 10;
    
    for (let i = 0; i < numTiles; i++) {
        const tile = createFloorTile(tileLength);
        tile.position.z = i * tileLength;
        tile.userData.length = tileLength;
        scene.add(tile);
        floorTiles.push(tile);
    }
}

function createFloorTile(length) {
    const group = new THREE.Group();
    
    // Main floor
    const floorGeo = new THREE.PlaneGeometry(14, length, 1, 1);
    const floorMat = new THREE.MeshStandardMaterial({
        color: 0x0a0a1a,
        emissive: 0x110022,
        emissiveIntensity: 0.2,
        metalness: 0.7,
        roughness: 0.4
    });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    group.add(floor);
    
    // Lane dividers (shared geometry)
    const dividerGeo = new THREE.BoxGeometry(0.08, 0.08, length);
    const dividerMat = new THREE.MeshBasicMaterial({
        color: CONFIG.COLORS.PINK,
        transparent: true,
        opacity: 0.7
    });
    
    [-1.5, 1.5].forEach(x => {
        const divider = new THREE.Mesh(dividerGeo, dividerMat);
        divider.position.set(x, 0.04, 0);
        group.add(divider);
    });
    
    // Edge lines
    const edgeGeo = new THREE.BoxGeometry(0.15, 0.15, length);
    const edgeMat = new THREE.MeshBasicMaterial({
        color: CONFIG.COLORS.CYAN,
        transparent: true,
        opacity: 0.85
    });
    
    [-7, 7].forEach(x => {
        const edge = new THREE.Mesh(edgeGeo, edgeMat);
        edge.position.set(x, 0.08, 0);
        group.add(edge);
    });
    
    // Grid lines (reduced count for performance)
    const gridGeo = new THREE.BoxGeometry(14, 0.03, 0.06);
    const gridMat = new THREE.MeshBasicMaterial({
        color: CONFIG.COLORS.PURPLE,
        transparent: true,
        opacity: 0.25
    });
    
    for (let i = 0; i < length; i += 4) {
        const gridLine = new THREE.Mesh(gridGeo, gridMat);
        gridLine.position.set(0, 0.015, i - length / 2);
        group.add(gridLine);
    }
    
    return group;
}

// ========================================
// PLAYER - Glowing Neon Sphere
// ========================================
function createPlayer() {
    const group = new THREE.Group();
    
    // Main sphere
    const sphereGeo = new THREE.SphereGeometry(0.45, 24, 24);
    const sphereMat = new THREE.MeshStandardMaterial({
        color: CONFIG.COLORS.CYAN,
        emissive: CONFIG.COLORS.CYAN,
        emissiveIntensity: 0.9,
        metalness: 0.95,
        roughness: 0.05
    });
    playerCore = new THREE.Mesh(sphereGeo, sphereMat);
    group.add(playerCore);
    
    // Inner glow
    const glowGeo = new THREE.SphereGeometry(0.6, 16, 16);
    const glowMat = new THREE.MeshBasicMaterial({
        color: CONFIG.COLORS.CYAN,
        transparent: true,
        opacity: 0.25,
        side: THREE.BackSide
    });
    playerGlow = new THREE.Mesh(glowGeo, glowMat);
    group.add(playerGlow);
    
    // Outer ring
    const ringGeo = new THREE.TorusGeometry(0.6, 0.04, 8, 24);
    const ringMat = new THREE.MeshBasicMaterial({
        color: CONFIG.COLORS.PINK,
        transparent: true,
        opacity: 0.7
    });
    playerRing = new THREE.Mesh(ringGeo, ringMat);
    playerRing.rotation.x = Math.PI / 2;
    group.add(playerRing);

    // Magnet aura (hidden by default)
    const auraGeo = new THREE.RingGeometry(0.85, 1.55, 32);
    const auraMat = new THREE.MeshBasicMaterial({
        color: CONFIG.COLORS.CYAN,
        transparent: true,
        opacity: 0.25,
        side: THREE.DoubleSide
    });
    magnetAura = new THREE.Mesh(auraGeo, auraMat);
    magnetAura.rotation.x = -Math.PI / 2;
    magnetAura.position.y = 0.05;
    magnetAura.visible = false;
    group.add(magnetAura);

    // Shield aura (hidden by default)
    shieldAura = new THREE.Group();
    shieldAura.visible = false;
    
    const shieldGeo = new THREE.SphereGeometry(0.8, 18, 18);
    const shieldMat = new THREE.MeshBasicMaterial({
        color: 0x66ccff,
        transparent: true,
        opacity: 0.28,
        side: THREE.BackSide
    });
    const shieldShell = new THREE.Mesh(shieldGeo, shieldMat);
    shieldAura.add(shieldShell);
    
    const shieldPlateGeo = new THREE.CircleGeometry(0.55, 24);
    const shieldPlateMat = new THREE.MeshBasicMaterial({
        color: CONFIG.COLORS.CYAN,
        transparent: true,
        opacity: 0.12
    });
    const shieldPlate = new THREE.Mesh(shieldPlateGeo, shieldPlateMat);
    shieldPlate.position.z = 0.6;
    shieldAura.add(shieldPlate);
    
    const shieldOutlineGeo = new THREE.RingGeometry(0.6, 0.66, 6);
    const shieldOutlineMat = new THREE.MeshBasicMaterial({
        color: CONFIG.COLORS.WHITE,
        transparent: true,
        opacity: 0.5,
        side: THREE.DoubleSide
    });
    const shieldOutline = new THREE.Mesh(shieldOutlineGeo, shieldOutlineMat);
    shieldOutline.position.z = 0.61;
    shieldAura.add(shieldOutline);
    
    group.add(shieldAura);
    
    // Point light
    const playerLight = new THREE.PointLight(CONFIG.COLORS.CYAN, 1.5, 8);
    group.add(playerLight);
    
    const discoSkin = createDiscoBallSkin();
    discoSkin.visible = false;
    group.add(discoSkin);

    group.position.set(0, CONFIG.GROUND_Y, 0);
    scene.add(group);
    player = group;
    applyDiscoBallSkin();
}

// ========================================
// SIDE PILLARS - Light Columns
// ========================================
function createSidePillars() {
    const pillarCount = 12;
    const spacing = 20;
    
    for (let i = 0; i < pillarCount; i++) {
        [-12, 12].forEach(x => {
            const pillar = createPillar(x < 0);
            pillar.position.set(x, 0, i * spacing);
            pillar.userData.spacing = spacing;
            scene.add(pillar);
            sidePillars.push(pillar);
        });
    }
}

function createPillar(isLeft) {
    const group = new THREE.Group();
    
    // Main pillar
    const pillarGeo = new THREE.BoxGeometry(0.4, 12, 0.4);
    const pillarMat = new THREE.MeshStandardMaterial({
        color: 0x1a1a2e,
        emissive: CONFIG.COLORS.PURPLE,
        emissiveIntensity: 0.25,
        metalness: 0.7,
        roughness: 0.3
    });
    const pillar = new THREE.Mesh(pillarGeo, pillarMat);
    pillar.position.y = 6;
    group.add(pillar);
    
    // Light strip
    const stripGeo = new THREE.BoxGeometry(0.08, 11, 0.08);
    const stripColor = isLeft ? CONFIG.COLORS.PINK : CONFIG.COLORS.CYAN;
    const stripMat = new THREE.MeshBasicMaterial({
        color: stripColor,
        transparent: true,
        opacity: 0.85
    });
    const strip = new THREE.Mesh(stripGeo, stripMat);
    strip.position.set(isLeft ? 0.2 : -0.2, 6, 0.2);
    group.add(strip);
    
    // Top light (reduced intensity for performance)
    const topLight = new THREE.PointLight(stripColor, 0.4, 12);
    topLight.position.y = 12;
    group.add(topLight);
    
    return group;
}

// ========================================
// PARTICLES - Background Effect
// ========================================
function createParticles() {
    const particleCount = 300;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const velocities = new Float32Array(particleCount);
    
    for (let i = 0; i < particleCount; i++) {
        positions[i * 3] = (Math.random() - 0.5) * 40;
        positions[i * 3 + 1] = Math.random() * 25;
        positions[i * 3 + 2] = Math.random() * 150;
        velocities[i] = 0.3 + Math.random() * 0.7;
    }
    
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.userData.velocities = velocities;
    
    const material = new THREE.PointsMaterial({
        color: CONFIG.COLORS.CYAN,
        size: 0.15,
        transparent: true,
        opacity: 0.5,
        blending: THREE.AdditiveBlending,
        sizeAttenuation: true
    });
    
    particleSystem = new THREE.Points(geometry, material);
    scene.add(particleSystem);
}
