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
