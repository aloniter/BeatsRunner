const DISCO_PRICE = 50;
const DISCO_OWNED_KEY = 'beat-runner-disco-owned';
const DISCO_EQUIPPED_KEY = 'beat-runner-disco-equipped';

const FIREBALL_PRICE = 75;
const FIREBALL_OWNED_KEY = 'beat-runner-fireball-owned';
const FIREBALL_EQUIPPED_KEY = 'beat-runner-fireball-equipped';

const STORE_CATEGORIES = [
    {
        id: 'skins',
        label: 'Skins',
        items: [
            { id: 'disco-ball', name: 'Disco Ball', price: DISCO_PRICE, preview: 'disco', description: 'Light up the rhythm. Pure party energy.' },
            { id: 'fire-ball', name: 'Fire Ball', price: FIREBALL_PRICE, preview: 'fire', description: 'Feel the heat. A ball of pure rhythmic power.' }
        ]
    }
];

let selectedCategoryId = 'skins';
const storeItemElements = new Map();
const previewScenes = new Map();

function loadDiscoBallState() {
    GameState.discoBallOwned = localStorage.getItem(DISCO_OWNED_KEY) === 'true';
    GameState.discoBallEquipped = localStorage.getItem(DISCO_EQUIPPED_KEY) === 'true';
    if (!GameState.discoBallOwned) {
        GameState.discoBallEquipped = false;
    }
    refreshStoreUI();
}

function saveDiscoBallState() {
    localStorage.setItem(DISCO_OWNED_KEY, String(GameState.discoBallOwned));
    localStorage.setItem(DISCO_EQUIPPED_KEY, String(GameState.discoBallEquipped));
}

function loadFireBallState() {
    GameState.fireBallOwned = localStorage.getItem(FIREBALL_OWNED_KEY) === 'true';
    GameState.fireBallEquipped = localStorage.getItem(FIREBALL_EQUIPPED_KEY) === 'true';
    if (!GameState.fireBallOwned) {
        GameState.fireBallEquipped = false;
    }
    refreshStoreUI();
}

function saveFireBallState() {
    localStorage.setItem(FIREBALL_OWNED_KEY, String(GameState.fireBallOwned));
    localStorage.setItem(FIREBALL_EQUIPPED_KEY, String(GameState.fireBallEquipped));
}

// Disco color palette: purple, cyan, pink, blue, gold
const DISCO_COLORS = [
    { hex: 0xbb00ff, name: 'purple' },   // Rich purple
    { hex: 0x00ffff, name: 'cyan' },     // Vibrant cyan
    { hex: 0xff00aa, name: 'pink' },     // Hot pink
    { hex: 0x0088ff, name: 'blue' },     // Electric blue
    { hex: 0xffaa00, name: 'gold' }      // Golden
];

function buildDiscoBall(radius = 1, assignGlobals = false) {
    const group = new THREE.Group();

    // Enhanced core with stronger emissive
    const coreGeo = new THREE.SphereGeometry(radius, 20, 14);
    const coreMat = new THREE.MeshStandardMaterial({
        color: 0xffffff,
        metalness: 0.95,
        roughness: 0.05,
        emissive: 0xffffff,
        emissiveIntensity: 1.2  // Increased from 0.7
    });
    const core = new THREE.Mesh(coreGeo, coreMat);
    group.add(core);

    // Enhanced tiles with dynamic color capability
    const tileSize = radius * 0.24;
    const tileDepth = radius * 0.08;
    const tileGeo = new THREE.BoxGeometry(tileSize, tileSize, tileDepth);
    const tileMat = new THREE.MeshStandardMaterial({
        color: 0xffffff,
        metalness: 1,
        roughness: 0.03,  // Reduced for more shine
        emissive: 0xffffff,
        emissiveIntensity: 0.9  // Increased from 0.5
    });

    const latSteps = 8;
    const lonSteps = 12;
    const total = latSteps * lonSteps;
    const tiles = new THREE.InstancedMesh(tileGeo, tileMat, total);
    let i = 0;

    for (let lat = 0; lat < latSteps; lat++) {
        const v = (lat + 0.5) / latSteps;
        const theta = v * Math.PI;
        const sinTheta = Math.sin(theta);
        const cosTheta = Math.cos(theta);

        for (let lon = 0; lon < lonSteps; lon++) {
            const u = (lon + 0.5) / lonSteps;
            const phi = u * Math.PI * 2;
            const sinPhi = Math.sin(phi);
            const cosPhi = Math.cos(phi);

            const normal = new THREE.Vector3(
                sinTheta * cosPhi,
                cosTheta,
                sinTheta * sinPhi
            );

            const position = normal.clone().multiplyScalar(radius + 0.05);
            const matrix = new THREE.Matrix4();
            const quaternion = new THREE.Quaternion().setFromUnitVectors(
                new THREE.Vector3(0, 0, 1),
                normal
            );
            matrix.compose(position, quaternion, new THREE.Vector3(1, 1, 1));
            tiles.setMatrixAt(i, matrix);
            i++;
        }
    }

    tiles.instanceMatrix.needsUpdate = true;
    group.add(tiles);

    // Multi-layered glow for bloom effect
    const innerGlowGeo = new THREE.SphereGeometry(radius * 1.12, 16, 12);
    const innerGlowMat = new THREE.MeshBasicMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0.35,  // Increased from 0.28
        blending: THREE.AdditiveBlending
    });
    const innerGlow = new THREE.Mesh(innerGlowGeo, innerGlowMat);
    group.add(innerGlow);

    // Outer glow layer for enhanced bloom
    const outerGlowGeo = new THREE.SphereGeometry(radius * 1.25, 16, 12);
    const outerGlowMat = new THREE.MeshBasicMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0.18,
        blending: THREE.AdditiveBlending
    });
    const outerGlow = new THREE.Mesh(outerGlowGeo, outerGlowMat);
    group.add(outerGlow);

    // Light beams projecting outward (8 beams)
    const beamCount = 8;
    const beamGeo = new THREE.CylinderGeometry(0.02, 0.08, radius * 3, 4);
    const beamMat = new THREE.MeshBasicMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0.4,
        blending: THREE.AdditiveBlending
    });
    const beams = new THREE.InstancedMesh(beamGeo, beamMat, beamCount);

    for (let b = 0; b < beamCount; b++) {
        const angle = (b / beamCount) * Math.PI * 2;
        const beamMatrix = new THREE.Matrix4();
        const beamPos = new THREE.Vector3(
            Math.cos(angle) * radius * 1.5,
            0,
            Math.sin(angle) * radius * 1.5
        );
        const beamQuat = new THREE.Quaternion();
        beamQuat.setFromAxisAngle(new THREE.Vector3(0, 0, 1), angle + Math.PI / 2);
        beamMatrix.compose(beamPos, beamQuat, new THREE.Vector3(1, 1, 1));
        beams.setMatrixAt(b, beamMatrix);
    }
    beams.instanceMatrix.needsUpdate = true;
    group.add(beams);

    // Enhanced sparkles with more particles
    const sparkleGeo = new THREE.BufferGeometry();
    const sparkleCount = 40;  // Increased from 30
    const sparklePositions = new Float32Array(sparkleCount * 3);
    for (let s = 0; s < sparkleCount; s++) {
        const angle = Math.random() * Math.PI * 2;
        const height = (Math.random() - 0.5) * 2;
        const radiusOffset = radius + 0.2 + Math.random() * 0.35;
        sparklePositions[s * 3] = Math.cos(angle) * radiusOffset;
        sparklePositions[s * 3 + 1] = height * 0.7;
        sparklePositions[s * 3 + 2] = Math.sin(angle) * radiusOffset;
    }
    sparkleGeo.setAttribute('position', new THREE.BufferAttribute(sparklePositions, 3));
    const sparkleMat = new THREE.PointsMaterial({
        color: 0xffffff,
        size: 0.09,  // Increased from 0.07
        transparent: true,
        opacity: 0.9,  // Increased from 0.8
        blending: THREE.AdditiveBlending
    });
    const sparkles = new THREE.Points(sparkleGeo, sparkleMat);
    group.add(sparkles);

    if (assignGlobals) {
        discoBallGroup = group;
        discoBallCore = core;
        discoBallTiles = tiles;
        discoBallSparkles = sparkles;
        discoBallInnerGlow = innerGlow;
        discoBallOuterGlow = outerGlow;
        discoBallBeams = beams;
        // Initialize color state
        discoBallColorIndex = 0;
        discoBallColorTransition = 0;
    }

    return { group, core, tiles, innerGlow, outerGlow, beams };
}

// Fire Ball color palette: orange, red, yellow for flame effect
const FIRE_COLORS = [
    { hex: 0xff4400, name: 'orange' },    // Deep orange
    { hex: 0xff0000, name: 'red' },       // Hot red
    { hex: 0xffaa00, name: 'yellow' },    // Golden yellow
    { hex: 0xff2200, name: 'crimson' },   // Crimson
    { hex: 0xff6600, name: 'flame' }      // Flame orange
];

function buildFireBall(radius = 1, assignGlobals = false) {
    const group = new THREE.Group();

    // Fiery core with hot center
    const coreGeo = new THREE.SphereGeometry(radius, 20, 14);
    const coreMat = new THREE.MeshStandardMaterial({
        color: 0xff6600,
        metalness: 0.3,
        roughness: 0.4,
        emissive: 0xff4400,
        emissiveIntensity: 1.5
    });
    const core = new THREE.Mesh(coreGeo, coreMat);
    group.add(core);

    // Inner glow - hot orange
    const innerGlowGeo = new THREE.SphereGeometry(radius * 1.15, 16, 12);
    const innerGlowMat = new THREE.MeshBasicMaterial({
        color: 0xff4400,
        transparent: true,
        opacity: 0.4,
        blending: THREE.AdditiveBlending
    });
    const innerGlow = new THREE.Mesh(innerGlowGeo, innerGlowMat);
    group.add(innerGlow);

    // Outer glow - warm yellow/orange haze
    const outerGlowGeo = new THREE.SphereGeometry(radius * 1.35, 16, 12);
    const outerGlowMat = new THREE.MeshBasicMaterial({
        color: 0xffaa00,
        transparent: true,
        opacity: 0.2,
        blending: THREE.AdditiveBlending
    });
    const outerGlow = new THREE.Mesh(outerGlowGeo, outerGlowMat);
    group.add(outerGlow);

    // Flame particles rising upward
    const flameCount = 50;
    const flameGeo = new THREE.BufferGeometry();
    const flamePositions = new Float32Array(flameCount * 3);
    const flameSizes = new Float32Array(flameCount);
    const flamePhases = new Float32Array(flameCount);

    for (let i = 0; i < flameCount; i++) {
        const angle = Math.random() * Math.PI * 2;
        const r = radius * (0.3 + Math.random() * 0.7);
        flamePositions[i * 3] = Math.cos(angle) * r;
        flamePositions[i * 3 + 1] = Math.random() * radius * 1.5;
        flamePositions[i * 3 + 2] = Math.sin(angle) * r;
        flameSizes[i] = 0.08 + Math.random() * 0.12;
        flamePhases[i] = Math.random() * Math.PI * 2;
    }

    flameGeo.setAttribute('position', new THREE.BufferAttribute(flamePositions, 3));
    flameGeo.setAttribute('size', new THREE.BufferAttribute(flameSizes, 1));
    flameGeo.userData.phases = flamePhases;
    flameGeo.userData.basePositions = flamePositions.slice();

    const flameMat = new THREE.PointsMaterial({
        color: 0xffaa00,
        size: 0.12,
        transparent: true,
        opacity: 0.9,
        blending: THREE.AdditiveBlending,
        sizeAttenuation: true
    });
    const flames = new THREE.Points(flameGeo, flameMat);
    group.add(flames);

    // Ember particles - smaller, more scattered
    const emberCount = 30;
    const emberGeo = new THREE.BufferGeometry();
    const emberPositions = new Float32Array(emberCount * 3);
    const emberPhases = new Float32Array(emberCount);

    for (let i = 0; i < emberCount; i++) {
        const angle = Math.random() * Math.PI * 2;
        const r = radius * (0.8 + Math.random() * 0.8);
        emberPositions[i * 3] = Math.cos(angle) * r;
        emberPositions[i * 3 + 1] = (Math.random() - 0.3) * radius * 2;
        emberPositions[i * 3 + 2] = Math.sin(angle) * r;
        emberPhases[i] = Math.random() * Math.PI * 2;
    }

    emberGeo.setAttribute('position', new THREE.BufferAttribute(emberPositions, 3));
    emberGeo.userData.phases = emberPhases;
    emberGeo.userData.basePositions = emberPositions.slice();

    const emberMat = new THREE.PointsMaterial({
        color: 0xff2200,
        size: 0.06,
        transparent: true,
        opacity: 0.8,
        blending: THREE.AdditiveBlending,
        sizeAttenuation: true
    });
    const embers = new THREE.Points(emberGeo, emberMat);
    group.add(embers);

    if (assignGlobals) {
        fireBallGroup = group;
        fireBallCore = core;
        fireBallFlames = flames;
        fireBallEmbers = embers;
        fireBallInnerGlow = innerGlow;
        fireBallOuterGlow = outerGlow;
    }

    return { group, core, flames, embers, innerGlow, outerGlow };
}

function createDiscoBallSkin() {
    return buildDiscoBall(0.45, true).group;
}

function createFireBallSkin() {
    return buildFireBall(0.45, true).group;
}

function applyDiscoBallSkin() {
    if (!player || !discoBallGroup) return;
    const equipped = GameState.discoBallOwned && GameState.discoBallEquipped;
    discoBallGroup.visible = equipped;
    // Only show default if neither skin is equipped
    const anyEquipped = equipped || (GameState.fireBallOwned && GameState.fireBallEquipped);
    if (playerCore) playerCore.visible = !anyEquipped;
    if (playerGlow) playerGlow.visible = !anyEquipped;
    if (playerRing) playerRing.visible = !anyEquipped;
}

function applyFireBallSkin() {
    if (!player || !fireBallGroup) return;
    const equipped = GameState.fireBallOwned && GameState.fireBallEquipped;
    fireBallGroup.visible = equipped;
    // Only show default if neither skin is equipped
    const anyEquipped = equipped || (GameState.discoBallOwned && GameState.discoBallEquipped);
    if (playerCore) playerCore.visible = !anyEquipped;
    if (playerGlow) playerGlow.visible = !anyEquipped;
    if (playerRing) playerRing.visible = !anyEquipped;
}

function applySkins() {
    applyDiscoBallSkin();
    applyFireBallSkin();
}

function purchaseDiscoBall() {
    if (GameState.discoBallOwned) return;
    if (GameState.totalOrbs < DISCO_PRICE) return;
    if (!spendOrbs(DISCO_PRICE)) return;
    GameState.discoBallOwned = true;
    GameState.discoBallEquipped = true;
    saveDiscoBallState();
    applyDiscoBallSkin();
    refreshStoreUI();
}

function toggleDiscoBallEquip() {
    if (!GameState.discoBallOwned) return;
    // Unequip fire ball if equipping disco ball
    if (!GameState.discoBallEquipped && GameState.fireBallEquipped) {
        GameState.fireBallEquipped = false;
        saveFireBallState();
    }
    GameState.discoBallEquipped = !GameState.discoBallEquipped;
    saveDiscoBallState();
    applySkins();
    refreshStoreUI();
}

function purchaseFireBall() {
    if (GameState.fireBallOwned) return;
    if (GameState.totalOrbs < FIREBALL_PRICE) return;
    if (!spendOrbs(FIREBALL_PRICE)) return;
    GameState.fireBallOwned = true;
    GameState.fireBallEquipped = true;
    // Unequip disco ball when purchasing and equipping fire ball
    if (GameState.discoBallEquipped) {
        GameState.discoBallEquipped = false;
        saveDiscoBallState();
    }
    saveFireBallState();
    applySkins();
    refreshStoreUI();
}

function toggleFireBallEquip() {
    if (!GameState.fireBallOwned) return;
    // Unequip disco ball if equipping fire ball
    if (!GameState.fireBallEquipped && GameState.discoBallEquipped) {
        GameState.discoBallEquipped = false;
        saveDiscoBallState();
    }
    GameState.fireBallEquipped = !GameState.fireBallEquipped;
    saveFireBallState();
    applySkins();
    refreshStoreUI();
}

function refreshStoreUI() {
    storeItemElements.forEach((elements, itemId) => {
        const { status, price, actionBtn } = elements;

        if (itemId === 'disco-ball') {
            if (!GameState.discoBallOwned) {
                actionBtn.disabled = GameState.totalOrbs < DISCO_PRICE;
                actionBtn.textContent = 'Buy';
                status.textContent = GameState.totalOrbs < DISCO_PRICE ? 'Not enough orbs' : '';
                price.innerHTML = '<span class="orb-icon"></span> ' + DISCO_PRICE + ' Orbs';
                return;
            }
            status.textContent = GameState.discoBallEquipped ? 'Equipped' : 'Owned';
            price.textContent = GameState.discoBallEquipped ? 'Equipped' : 'Owned';
            actionBtn.disabled = GameState.discoBallEquipped;
            actionBtn.textContent = GameState.discoBallEquipped ? 'Equipped' : 'Equip';
        } else if (itemId === 'fire-ball') {
            if (!GameState.fireBallOwned) {
                actionBtn.disabled = GameState.totalOrbs < FIREBALL_PRICE;
                actionBtn.textContent = 'Buy';
                status.textContent = GameState.totalOrbs < FIREBALL_PRICE ? 'Not enough orbs' : '';
                price.innerHTML = '<span class="orb-icon"></span> ' + FIREBALL_PRICE + ' Orbs';
                return;
            }
            status.textContent = GameState.fireBallEquipped ? 'Equipped' : 'Owned';
            price.textContent = GameState.fireBallEquipped ? 'Equipped' : 'Owned';
            actionBtn.disabled = GameState.fireBallEquipped;
            actionBtn.textContent = GameState.fireBallEquipped ? 'Equipped' : 'Equip';
        }
    });
}

function setupDiscoPreview(canvas, itemId) {
    if (!canvas) return;
    const renderer = new THREE.WebGLRenderer({
        canvas,
        alpha: true,
        antialias: true,
        powerPreference: 'low-power'
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 20);
    camera.position.set(0, 0.1, 2.2);
    camera.lookAt(0, 0, 0);

    const { group, core, tiles, innerGlow, outerGlow, beams } = buildDiscoBall(0.45, false);
    group.scale.set(0.85, 0.85, 0.85);
    scene.add(group);

    const ambient = new THREE.AmbientLight(0xffffff, 1.0);
    scene.add(ambient);
    const pinkLight = new THREE.PointLight(0xff66ff, 1.4, 6);
    pinkLight.position.set(-1, 1.2, 2);
    scene.add(pinkLight);
    const cyanLight = new THREE.PointLight(0x66ffff, 1.4, 6);
    cyanLight.position.set(1, -1, 2);
    scene.add(cyanLight);

    previewScenes.set(itemId, {
        renderer, scene, camera, group, core, tiles, innerGlow, outerGlow, beams, canvas,
        colorIndex: 0, colorTransition: 0, type: 'disco'
    });
    resizeDiscoPreview();
}

function setupFirePreview(canvas, itemId) {
    if (!canvas) return;
    const renderer = new THREE.WebGLRenderer({
        canvas,
        alpha: true,
        antialias: true,
        powerPreference: 'low-power'
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 20);
    camera.position.set(0, 0.1, 2.2);
    camera.lookAt(0, 0, 0);

    const { group, core, flames, embers, innerGlow, outerGlow } = buildFireBall(0.45, false);
    group.scale.set(0.85, 0.85, 0.85);
    scene.add(group);

    const ambient = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambient);
    const orangeLight = new THREE.PointLight(0xff6600, 1.6, 6);
    orangeLight.position.set(-1, 1.2, 2);
    scene.add(orangeLight);
    const redLight = new THREE.PointLight(0xff2200, 1.4, 6);
    redLight.position.set(1, -1, 2);
    scene.add(redLight);

    previewScenes.set(itemId, {
        renderer, scene, camera, group, core, flames, embers, innerGlow, outerGlow, canvas,
        colorIndex: 0, colorTransition: 0, type: 'fire'
    });
    resizeDiscoPreview();
}

function resizeDiscoPreview() {
    previewScenes.forEach((preview) => {
        const rect = preview.canvas.getBoundingClientRect();
        if (rect.width === 0 || rect.height === 0) return;
        preview.renderer.setSize(rect.width, rect.height, false);
    });
}

function renderDiscoPreview(delta, elapsed) {
    previewScenes.forEach((preview) => {
        if (preview.type === 'fire') {
            renderFirePreviewItem(preview, delta, elapsed);
        } else {
            renderDiscoPreviewItem(preview, delta, elapsed);
        }
        preview.renderer.render(preview.scene, preview.camera);
    });
}

function renderDiscoPreviewItem(preview, delta, elapsed) {
    // Rotation
    preview.group.rotation.y += delta * 0.55;

    // Pulse effect
    const pulse = 1 + Math.sin(elapsed * 2.2) * 0.025;
    preview.group.scale.set(0.85 * pulse, 0.85 * pulse, 0.85 * pulse);

    // Color cycling (change every 2 seconds)
    preview.colorTransition += delta;
    if (preview.colorTransition >= 2.0) {
        preview.colorTransition = 0;
        preview.colorIndex = (preview.colorIndex + 1) % DISCO_COLORS.length;
    }

    // Smooth color interpolation
    const currentColor = DISCO_COLORS[preview.colorIndex];
    const nextColor = DISCO_COLORS[(preview.colorIndex + 1) % DISCO_COLORS.length];
    const t = Math.min(preview.colorTransition / 0.5, 1); // 0.5s transition time
    const lerpedColor = new THREE.Color(currentColor.hex).lerp(
        new THREE.Color(nextColor.hex),
        t
    );

    // Apply colors and intensity
    const beatPhase = Math.abs(Math.sin(elapsed * 2.2));
    if (preview.core && preview.core.material) {
        preview.core.material.emissive.copy(lerpedColor);
        preview.core.material.emissiveIntensity = 1.2 + beatPhase * 0.5;
    }
    if (preview.tiles && preview.tiles.material) {
        preview.tiles.material.emissive.copy(lerpedColor);
        preview.tiles.material.emissiveIntensity = 0.9 + beatPhase * 0.4;
    }
    if (preview.innerGlow && preview.innerGlow.material) {
        preview.innerGlow.material.color.copy(lerpedColor);
        preview.innerGlow.material.opacity = 0.35 + beatPhase * 0.15;
    }
    if (preview.outerGlow && preview.outerGlow.material) {
        preview.outerGlow.material.color.copy(lerpedColor);
        preview.outerGlow.material.opacity = 0.18 + beatPhase * 0.1;
    }
    if (preview.beams && preview.beams.material) {
        preview.beams.material.color.copy(lerpedColor);
        // Rotate beams
        preview.beams.rotation.y = elapsed * 1.2;
    }
}

function renderFirePreviewItem(preview, delta, elapsed) {
    // Slow rotation
    preview.group.rotation.y += delta * 0.4;

    // Fire pulse effect - more intense and erratic
    const pulse = 1 + Math.sin(elapsed * 3.5) * 0.04 + Math.sin(elapsed * 7) * 0.02;
    preview.group.scale.set(0.85 * pulse, 0.85 * pulse, 0.85 * pulse);

    // Color cycling through fire colors
    preview.colorTransition += delta;
    if (preview.colorTransition >= 1.5) {
        preview.colorTransition = 0;
        preview.colorIndex = (preview.colorIndex + 1) % FIRE_COLORS.length;
    }

    const currentColor = FIRE_COLORS[preview.colorIndex];
    const nextColor = FIRE_COLORS[(preview.colorIndex + 1) % FIRE_COLORS.length];
    const t = Math.min(preview.colorTransition / 0.4, 1);
    const lerpedColor = new THREE.Color(currentColor.hex).lerp(
        new THREE.Color(nextColor.hex),
        t
    );

    // Intensity flicker for fire effect
    const flicker = 0.8 + Math.random() * 0.2;
    const beatPhase = Math.abs(Math.sin(elapsed * 3.5));

    if (preview.core && preview.core.material) {
        preview.core.material.emissive.copy(lerpedColor);
        preview.core.material.emissiveIntensity = (1.5 + beatPhase * 0.5) * flicker;
    }
    if (preview.innerGlow && preview.innerGlow.material) {
        preview.innerGlow.material.color.copy(lerpedColor);
        preview.innerGlow.material.opacity = (0.4 + beatPhase * 0.2) * flicker;
    }
    if (preview.outerGlow && preview.outerGlow.material) {
        preview.outerGlow.material.color.lerp(new THREE.Color(0xffaa00), 0.3);
        preview.outerGlow.material.opacity = (0.2 + beatPhase * 0.1) * flicker;
    }

    // Animate flame particles
    if (preview.flames && preview.flames.geometry) {
        const positions = preview.flames.geometry.attributes.position.array;
        const basePositions = preview.flames.geometry.userData.basePositions;
        const phases = preview.flames.geometry.userData.phases;

        if (basePositions && phases) {
            for (let i = 0; i < positions.length / 3; i++) {
                const phase = phases[i];
                // Flames rise and flicker
                positions[i * 3 + 1] = basePositions[i * 3 + 1] +
                    Math.sin(elapsed * 4 + phase) * 0.15 +
                    (elapsed * 0.5 + phase) % 0.8;
                // Slight horizontal wobble
                positions[i * 3] = basePositions[i * 3] + Math.sin(elapsed * 3 + phase) * 0.05;
                positions[i * 3 + 2] = basePositions[i * 3 + 2] + Math.cos(elapsed * 3 + phase) * 0.05;
            }
            preview.flames.geometry.attributes.position.needsUpdate = true;
        }
        preview.flames.material.color.copy(lerpedColor);
    }

    // Animate ember particles
    if (preview.embers && preview.embers.geometry) {
        const positions = preview.embers.geometry.attributes.position.array;
        const basePositions = preview.embers.geometry.userData.basePositions;
        const phases = preview.embers.geometry.userData.phases;

        if (basePositions && phases) {
            for (let i = 0; i < positions.length / 3; i++) {
                const phase = phases[i];
                // Embers float and drift
                positions[i * 3 + 1] = basePositions[i * 3 + 1] +
                    Math.sin(elapsed * 2 + phase) * 0.2 +
                    (elapsed * 0.3 + phase) % 1.2;
                positions[i * 3] = basePositions[i * 3] + Math.sin(elapsed * 1.5 + phase) * 0.1;
                positions[i * 3 + 2] = basePositions[i * 3 + 2] + Math.cos(elapsed * 1.5 + phase) * 0.1;
            }
            preview.embers.geometry.attributes.position.needsUpdate = true;
        }
    }
}

function renderStoreTabs() {
    if (!storeTabs) return;
    storeTabs.innerHTML = '';
    STORE_CATEGORIES.forEach((category) => {
        const button = document.createElement('button');
        button.className = 'store-tab';
        button.textContent = category.label;
        if (category.id === selectedCategoryId) {
            button.classList.add('is-active');
        }
        button.addEventListener('click', () => {
            selectedCategoryId = category.id;
            renderStoreTabs();
            renderStoreItems();
        });
        storeTabs.appendChild(button);
    });
}

function renderStoreItems() {
    if (!storeGrid) return;
    storeGrid.innerHTML = '';
    storeItemElements.clear();
    previewScenes.clear();

    const category = STORE_CATEGORIES.find((c) => c.id === selectedCategoryId);
    if (!category) return;
    if (storeSectionTitle) storeSectionTitle.textContent = category.label.toUpperCase();

    category.items.forEach((item) => {
        const card = document.createElement('div');
        card.className = 'store-card';

        const preview = document.createElement('div');
        preview.className = 'store-preview';
        const canvas = document.createElement('canvas');
        canvas.width = 120;
        canvas.height = 120;
        canvas.setAttribute('aria-label', `${item.name} preview`);
        preview.appendChild(canvas);

        const info = document.createElement('div');
        info.className = 'store-info';

        const title = document.createElement('div');
        title.className = 'store-title';
        title.textContent = item.name;

        // Description - always included for consistent card height
        const desc = document.createElement('div');
        desc.className = 'store-description';
        desc.textContent = item.description || '';

        const price = document.createElement('div');
        price.className = 'store-price';
        price.innerHTML = '<span class="orb-icon"></span> ' + item.price + ' Orbs';

        const status = document.createElement('div');
        status.className = 'store-status';

        const actions = document.createElement('div');
        actions.className = 'store-actions';
        const actionBtn = document.createElement('button');
        actionBtn.className = 'btn btn-secondary store-btn';
        actionBtn.textContent = 'Buy';
        actions.appendChild(actionBtn);

        // Build card in consistent order: title, description, price, status, actions
        info.appendChild(title);
        info.appendChild(desc);
        info.appendChild(price);
        info.appendChild(status);
        info.appendChild(actions);

        card.appendChild(preview);
        card.appendChild(info);
        storeGrid.appendChild(card);

        storeItemElements.set(item.id, { status, price, actionBtn });

        if (item.id === 'disco-ball') {
            actionBtn.addEventListener('click', () => {
                if (!GameState.discoBallOwned) {
                    purchaseDiscoBall();
                } else {
                    toggleDiscoBallEquip();
                }
            });
            setupDiscoPreview(canvas, item.id);
        } else if (item.id === 'fire-ball') {
            actionBtn.addEventListener('click', () => {
                if (!GameState.fireBallOwned) {
                    purchaseFireBall();
                } else {
                    toggleFireBallEquip();
                }
            });
            setupFirePreview(canvas, item.id);
        }
    });
}

function renderStore() {
    renderStoreTabs();
    renderStoreItems();
}

function setupStore() {
    if (storeBtn && storeOverlay) {
        storeBtn.addEventListener('click', () => {
            storeOverlay.classList.add('is-open');
            storeOverlay.setAttribute('aria-hidden', 'false');
            if (typeof resizeDiscoPreview === 'function') resizeDiscoPreview();
        });
    }
    if (storeCloseBtn && storeOverlay) {
        storeCloseBtn.addEventListener('click', () => {
            storeOverlay.classList.remove('is-open');
            storeOverlay.setAttribute('aria-hidden', 'true');
        });
    }
    if (storeOverlay) {
        storeOverlay.addEventListener('click', (e) => {
            if (e.target === storeOverlay) {
                storeOverlay.classList.remove('is-open');
                storeOverlay.setAttribute('aria-hidden', 'true');
            }
        });
    }
    renderStore();
    refreshStoreUI();
}
