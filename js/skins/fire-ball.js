// ========================================
// FIRE BALL SKIN - 3D Model and Effects
// ========================================

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

    // Flame particles rising upward (quality-based count)
    const flameCount = QualityManager.getParticleCount('flame');
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

    // Ember particles - smaller, more scattered (quality-based count)
    const emberCount = QualityManager.getParticleCount('ember');
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

function createFireBallSkin() {
    return buildFireBall(0.45, true).group;
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
