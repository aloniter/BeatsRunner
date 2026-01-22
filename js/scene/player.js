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

    const fireSkin = createFireBallSkin();
    fireSkin.visible = false;
    group.add(fireSkin);

    const rainbowOrbSkin = createRainbowOrbSkin();
    rainbowOrbSkin.visible = false;
    group.add(rainbowOrbSkin);

    group.position.set(0, CONFIG.GROUND_Y, 0);
    scene.add(group);
    player = group;
    applySkins();
}
