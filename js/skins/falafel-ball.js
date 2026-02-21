// ========================================
// FALAFEL BALL SKIN - 3D Model and Effects
// ========================================

// Falafel Ball color palette: golden brown, tan, cream for realistic food texture
const FALAFEL_COLORS = [
    { hex: 0xd4a574, name: 'golden-brown' },  // Base color
    { hex: 0xc89850, name: 'deep-golden' },   // Deep golden accents
    { hex: 0xe8c896, name: 'light-tan' },     // Light tan patches
    { hex: 0xf5ead2, name: 'sesame' }         // Sesame seed color
];

function buildFalafelBall(radius = 1, assignGlobals = false) {
    const group = new THREE.Group();

    // Bumpy crispy core using IcosahedronGeometry
    const coreGeo = new THREE.IcosahedronGeometry(radius, 1);
    const coreMat = new THREE.MeshStandardMaterial({
        color: 0xd4a574,
        metalness: 0.2,
        roughness: 0.8,
        emissive: 0xff9944,
        emissiveIntensity: 0.8
    });
    const core = new THREE.Mesh(coreGeo, coreMat);
    group.add(core);

    // Inner glow - warm orange-brown
    const innerGlowGeo = new THREE.SphereGeometry(radius * 1.15, 16, 12);
    const innerGlowMat = new THREE.MeshBasicMaterial({
        color: 0xff9944,
        transparent: true,
        opacity: 0.25,
        blending: THREE.AdditiveBlending
    });
    const innerGlow = new THREE.Mesh(innerGlowGeo, innerGlowMat);
    group.add(innerGlow);

    // Outer glow - soft golden haze
    const outerGlowGeo = new THREE.SphereGeometry(radius * 1.35, 16, 12);
    const outerGlowMat = new THREE.MeshBasicMaterial({
        color: 0xe8c896,
        transparent: true,
        opacity: 0.15,
        blending: THREE.AdditiveBlending
    });
    const outerGlow = new THREE.Mesh(outerGlowGeo, outerGlowMat);
    group.add(outerGlow);

    // Sesame seed particles - stuck to surface (quality-based count)
    const sesameCount = QualityManager.getParticleCount('falafelSesame', 25, 15, 8);
    const sesameGeo = new THREE.BufferGeometry();
    const sesamePositions = new Float32Array(sesameCount * 3);
    const sesameSizes = new Float32Array(sesameCount);

    for (let i = 0; i < sesameCount; i++) {
        // Distribute on sphere surface using spherical coordinates
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(2 * Math.random() - 1);
        const r = radius * 1.05; // Slightly above surface

        sesamePositions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
        sesamePositions[i * 3 + 1] = r * Math.cos(phi);
        sesamePositions[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta);
        sesameSizes[i] = 0.04 + Math.random() * 0.02;
    }

    sesameGeo.setAttribute('position', new THREE.BufferAttribute(sesamePositions, 3));
    sesameGeo.setAttribute('size', new THREE.BufferAttribute(sesameSizes, 1));

    const sesameMat = new THREE.PointsMaterial({
        color: 0xf5ead2,
        size: 0.05,
        transparent: true,
        opacity: 0.95,
        sizeAttenuation: true
    });
    const sesame = new THREE.Points(sesameGeo, sesameMat);
    group.add(sesame);

    // Steam particles - rising from top (quality-based count)
    const steamCount = QualityManager.getParticleCount('falafelSteam', 20, 12, 6);
    const steamGeo = new THREE.BufferGeometry();
    const steamPositions = new Float32Array(steamCount * 3);
    const steamSizes = new Float32Array(steamCount);

    for (let i = 0; i < steamCount; i++) {
        // Start from top hemisphere
        const angle = Math.random() * Math.PI * 2;
        const r = radius * (0.2 + Math.random() * 0.4);
        steamPositions[i * 3] = Math.cos(angle) * r;
        steamPositions[i * 3 + 1] = radius * 0.5 + Math.random() * radius * 0.8;
        steamPositions[i * 3 + 2] = Math.sin(angle) * r;
        steamSizes[i] = 0.06 + Math.random() * 0.04;
    }

    steamGeo.setAttribute('position', new THREE.BufferAttribute(steamPositions, 3));
    steamGeo.setAttribute('size', new THREE.BufferAttribute(steamSizes, 1));
    steamGeo.userData.basePositions = steamPositions.slice();

    const steamMat = new THREE.PointsMaterial({
        color: 0xffffff,
        size: 0.08,
        transparent: true,
        opacity: 0.3,
        blending: THREE.NormalBlending,
        sizeAttenuation: true
    });
    const steam = new THREE.Points(steamGeo, steamMat);
    group.add(steam);

    // Crumb particles - falling from ball (quality-based count)
    const crumbCount = QualityManager.getParticleCount('falafelCrumbs', 15, 8, 5);
    const crumbGeo = new THREE.BufferGeometry();
    const crumbPositions = new Float32Array(crumbCount * 3);
    const crumbPhases = new Float32Array(crumbCount);

    for (let i = 0; i < crumbCount; i++) {
        const angle = Math.random() * Math.PI * 2;
        const r = radius * (0.4 + Math.random() * 0.6);
        crumbPositions[i * 3] = Math.cos(angle) * r;
        crumbPositions[i * 3 + 1] = (Math.random() - 0.5) * radius * 1.5;
        crumbPositions[i * 3 + 2] = Math.sin(angle) * r;
        crumbPhases[i] = Math.random() * Math.PI * 2;
    }

    crumbGeo.setAttribute('position', new THREE.BufferAttribute(crumbPositions, 3));
    crumbGeo.userData.phases = crumbPhases;
    crumbGeo.userData.basePositions = crumbPositions.slice();

    const crumbMat = new THREE.PointsMaterial({
        color: 0xc89850,
        size: 0.04,
        transparent: true,
        opacity: 0.85,
        sizeAttenuation: true
    });
    const crumbs = new THREE.Points(crumbGeo, crumbMat);
    group.add(crumbs);

    if (assignGlobals) {
        falafelBallGroup = group;
        falafelBallCore = core;
        falafelBallSesame = sesame;
        falafelBallSteam = steam;
        falafelBallCrumbs = crumbs;
        falafelBallInnerGlow = innerGlow;
        falafelBallOuterGlow = outerGlow;
    }

    return { group, core, sesame, steam, crumbs, innerGlow, outerGlow };
}

function createFalafelBallSkin() {
    return buildFalafelBall(0.45, true).group;
}

function applyFalafelBallSkin() {
    if (!player || !falafelBallGroup) return;
    const equipped = GameState.falafelBallOwned && GameState.falafelBallEquipped;
    falafelBallGroup.visible = equipped;
    // Only show default if no skin is equipped
    const anyEquipped = equipped ||
        (GameState.discoBallOwned && GameState.discoBallEquipped) ||
        (GameState.fireBallOwned && GameState.fireBallEquipped) ||
        (GameState.rainbowOrbOwned && GameState.rainbowOrbEquipped) ||
        (GameState.pokeballOwned && GameState.pokeballEquipped);
    if (playerCore) playerCore.visible = !anyEquipped;
    if (playerGlow) playerGlow.visible = !anyEquipped;
    if (playerRing) playerRing.visible = !anyEquipped;
}
