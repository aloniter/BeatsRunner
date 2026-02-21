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
    MagnetManager.aura = new THREE.Mesh(auraGeo, auraMat);
    MagnetManager.aura.rotation.x = -Math.PI / 2;
    MagnetManager.aura.position.y = 0.05;
    MagnetManager.aura.visible = false;
    group.add(MagnetManager.aura);

    // Shield aura (hidden by default)
    ShieldManager.aura = new THREE.Group();
    ShieldManager.aura.visible = false;

    const shieldGeo = new THREE.SphereGeometry(0.8, 18, 18);
    const shieldMat = new THREE.MeshBasicMaterial({
        color: 0x66ccff,
        transparent: true,
        opacity: 0.28,
        side: THREE.BackSide
    });
    const shieldShell = new THREE.Mesh(shieldGeo, shieldMat);
    ShieldManager.aura.add(shieldShell);

    const shieldPlateGeo = new THREE.CircleGeometry(0.55, 24);
    const shieldPlateMat = new THREE.MeshBasicMaterial({
        color: CONFIG.COLORS.CYAN,
        transparent: true,
        opacity: 0.12
    });
    const shieldPlate = new THREE.Mesh(shieldPlateGeo, shieldPlateMat);
    shieldPlate.position.z = 0.6;
    ShieldManager.aura.add(shieldPlate);

    const shieldOutlineGeo = new THREE.RingGeometry(0.6, 0.66, 6);
    const shieldOutlineMat = new THREE.MeshBasicMaterial({
        color: CONFIG.COLORS.WHITE,
        transparent: true,
        opacity: 0.5,
        side: THREE.DoubleSide
    });
    const shieldOutline = new THREE.Mesh(shieldOutlineGeo, shieldOutlineMat);
    shieldOutline.position.z = 0.61;
    ShieldManager.aura.add(shieldOutline);

    group.add(ShieldManager.aura);

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

    const falafelSkin = createFalafelBallSkin();
    falafelSkin.visible = false;
    group.add(falafelSkin);

    const pokeballSkin = createPokeballSkin();
    pokeballSkin.visible = false;
    group.add(pokeballSkin);

    const eyeBallSkin = createEyeBallSkin();
    eyeBallSkin.visible = false;
    group.add(eyeBallSkin);

    const soccerBallSkin = createSoccerBallSkin();
    soccerBallSkin.visible = false;
    group.add(soccerBallSkin);

    const basketballSkin = createBasketballSkin();
    basketballSkin.visible = false;
    group.add(basketballSkin);

    const furryBallSkin = createFurryBallSkin();
    furryBallSkin.visible = false;
    group.add(furryBallSkin);

    group.position.set(0, CONFIG.GROUND_Y, 0);
    scene.add(group);
    player = group;
    applySkins();
}
