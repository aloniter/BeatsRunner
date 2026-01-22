// ========================================
// DISCO BALL SKIN - 3D Model and Effects
// ========================================

// Traditional disco ball color palette: silver/grey/white (no cycling)
const DISCO_COLORS = [
    { hex: 0xc0c0c0, name: 'silver' },      // Primary silver
    { hex: 0xe8e8e8, name: 'light-silver' }, // Light silver
    { hex: 0xa8a8a8, name: 'grey' }         // Darker grey
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
        emissiveIntensity: 1.2
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
        roughness: 0.03,
        emissive: 0xffffff,
        emissiveIntensity: 0.9
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
        opacity: 0.35,
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

    // Enhanced sparkles with quality-based particle count
    const sparkleGeo = new THREE.BufferGeometry();
    const sparkleCount = QualityManager.getParticleCount('sparkle');
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
        size: 0.09,
        transparent: true,
        opacity: 0.9,
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

function createDiscoBallSkin() {
    return buildDiscoBall(0.45, true).group;
}

function applyDiscoBallSkin() {
    if (!player || !discoBallGroup) return;
    const equipped = GameState.discoBallOwned && GameState.discoBallEquipped;
    discoBallGroup.visible = equipped;
    // Only show default if no skin is equipped
    const anyEquipped = equipped ||
        (GameState.fireBallOwned && GameState.fireBallEquipped) ||
        (GameState.rainbowOrbOwned && GameState.rainbowOrbEquipped);
    if (playerCore) playerCore.visible = !anyEquipped;
    if (playerGlow) playerGlow.visible = !anyEquipped;
    if (playerRing) playerRing.visible = !anyEquipped;
}
