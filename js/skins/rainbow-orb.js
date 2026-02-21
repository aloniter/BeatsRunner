// ========================================
// RAINBOW ORB SKIN - 3D Model and Effects
// ========================================

// Rainbow Orb color palette: 7-color spectrum
const RAINBOW_COLORS = [
    { hex: 0xff0000, name: 'red' },      // Red
    { hex: 0xff7f00, name: 'orange' },   // Orange
    { hex: 0xffff00, name: 'yellow' },   // Yellow
    { hex: 0x00ff00, name: 'green' },    // Green
    { hex: 0x0000ff, name: 'blue' },     // Blue
    { hex: 0x4b0082, name: 'indigo' },   // Indigo
    { hex: 0x9400d3, name: 'violet' }    // Violet
];

function buildRainbowOrb(radius = 1, assignGlobals = false) {
    const group = new THREE.Group();

    // Iridescent core with medium metalness
    const coreGeo = new THREE.SphereGeometry(radius, 20, 14);
    const coreMat = new THREE.MeshStandardMaterial({
        color: 0xffffff,
        metalness: 0.5,
        roughness: 0.3,
        emissive: 0xffffff,
        emissiveIntensity: 1.2
    });
    const core = new THREE.Mesh(coreGeo, coreMat);
    group.add(core);

    // Inner glow - vibrant rainbow
    const innerGlowGeo = new THREE.SphereGeometry(radius * 1.15, 16, 12);
    const innerGlowMat = new THREE.MeshBasicMaterial({
        color: 0xff0000,
        transparent: true,
        opacity: 0.45,
        blending: THREE.AdditiveBlending
    });
    const innerGlow = new THREE.Mesh(innerGlowGeo, innerGlowMat);
    group.add(innerGlow);

    // Outer glow - soft rainbow haze
    const outerGlowGeo = new THREE.SphereGeometry(radius * 1.35, 16, 12);
    const outerGlowMat = new THREE.MeshBasicMaterial({
        color: 0xff7f00,
        transparent: true,
        opacity: 0.25,
        blending: THREE.AdditiveBlending
    });
    const outerGlow = new THREE.Mesh(outerGlowGeo, outerGlowMat);
    group.add(outerGlow);

    // Rainbow trail particles (quality-based count)
    const trailCount = QualityManager.getParticleCount('rainbow-trail');
    const trailGeo = new THREE.BufferGeometry();
    const trailPositions = new Float32Array(trailCount * 3);
    const trailSizes = new Float32Array(trailCount);
    const trailPhases = new Float32Array(trailCount);
    const trailColorIndices = new Float32Array(trailCount);

    for (let i = 0; i < trailCount; i++) {
        const angle = Math.random() * Math.PI * 2;
        const r = radius * (0.4 + Math.random() * 0.8);
        trailPositions[i * 3] = Math.cos(angle) * r;
        trailPositions[i * 3 + 1] = (Math.random() - 0.5) * radius * 1.8;
        trailPositions[i * 3 + 2] = Math.sin(angle) * r;
        trailSizes[i] = 0.08 + Math.random() * 0.12;
        trailPhases[i] = Math.random() * Math.PI * 2;
        trailColorIndices[i] = Math.floor(Math.random() * RAINBOW_COLORS.length);
    }

    trailGeo.setAttribute('position', new THREE.BufferAttribute(trailPositions, 3));
    trailGeo.setAttribute('size', new THREE.BufferAttribute(trailSizes, 1));
    trailGeo.userData.phases = trailPhases;
    trailGeo.userData.basePositions = trailPositions.slice();
    trailGeo.userData.colorIndices = trailColorIndices;

    const trailMat = new THREE.PointsMaterial({
        color: 0xff0000,
        size: 0.12,
        transparent: true,
        opacity: 0.9,
        blending: THREE.AdditiveBlending,
        sizeAttenuation: true
    });
    const trails = new THREE.Points(trailGeo, trailMat);
    group.add(trails);

    if (assignGlobals) {
        rainbowOrbGroup = group;
        rainbowOrbCore = core;
        rainbowOrbTrails = trails;
        rainbowOrbInnerGlow = innerGlow;
        rainbowOrbOuterGlow = outerGlow;
    }

    return { group, core, trails, innerGlow, outerGlow };
}

function createRainbowOrbSkin() {
    return buildRainbowOrb(0.45, true).group;
}

function applyRainbowOrbSkin() {
    if (!player || !rainbowOrbGroup) return;
    const equipped = GameState.rainbowOrbOwned && GameState.rainbowOrbEquipped;
    rainbowOrbGroup.visible = equipped;
    const anyEquipped = isAnySkinEquipped();
    if (playerCore) playerCore.visible = !anyEquipped;
    if (playerGlow) playerGlow.visible = !anyEquipped;
    if (playerRing) playerRing.visible = !anyEquipped;
}
