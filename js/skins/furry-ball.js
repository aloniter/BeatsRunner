// ========================================
// FURRY BALL SKIN - Clean GLB Model
// ========================================

const FURRY_BALL_GLB_URL = 'assets/skins/furry_ball.glb';

function buildFurryBallSkin(radius = 1, assignGlobals = false) {
    const group = new THREE.Group();

    group.userData.modelReady = false;
    group.userData.model = null;
    group.userData.mixer = null;

    _loadFurryBallModel(group, radius);

    if (assignGlobals) {
        furryBallGroup = group;
    }

    return { group };
}

function _loadFurryBallModel(group, radius) {
    if (typeof GLBLoader === 'undefined') {
        console.error('Furry Ball: GLBLoader not available');
        _attachFurryBallFallback(group, radius);
        return;
    }

    // Ownership guard: furry_ball.glb is ~35MB. Skip the load at startup unless
    // the skin is already owned (loaded from localStorage). applyFurryBallSkin()
    // will re-call this function the first time the skin is actually equipped.
    const isOwned = typeof GameState !== 'undefined' && GameState.furryBallOwned;
    if (!isOwned && !GLBLoader.has(FURRY_BALL_GLB_URL)) {
        return; // Leave modelReady = false; group is invisible until owned
    }

    if (GLBLoader.has(FURRY_BALL_GLB_URL)) {
        const model = GLBLoader.clone(FURRY_BALL_GLB_URL);
        const entry = GLBLoader._cache.get(FURRY_BALL_GLB_URL);
        _attachFurryBallModel(group, model, radius);
        _setupFurryBallAnimations(group, model, entry.animations);
        return;
    }

    GLBLoader.load(FURRY_BALL_GLB_URL)
        .then(entry => {
            const model = GLBLoader.clone(FURRY_BALL_GLB_URL);
            _attachFurryBallModel(group, model, radius);
            _setupFurryBallAnimations(group, model, entry.animations);
        })
        .catch(err => {
            console.error('Furry Ball: GLB load failed, showing fallback:', err);
            _attachFurryBallFallback(group, radius);
        });
}

function _attachFurryBallModel(group, model, radius) {
    const box = new THREE.Box3().setFromObject(model);
    const size = new THREE.Vector3();
    box.getSize(size);
    const modelRadius = Math.max(size.x, size.y, size.z) / 2;
    const scaleFactor = modelRadius > 0 ? radius / modelRadius : 1;
    model.scale.set(scaleFactor, scaleFactor, scaleFactor);

    const scaledBox = new THREE.Box3().setFromObject(model);
    const center = new THREE.Vector3();
    scaledBox.getCenter(center);
    model.position.sub(center);

    model.traverse(child => {
        if (!child.isMesh) return;
        child.castShadow = true;
        GLBLoader.normalizeMaterial(child.material, typeof renderer !== 'undefined' ? renderer.capabilities.getMaxAnisotropy() : 1, 'furry-ball');
    });

    group.add(model);
    group.userData.model = model;
    group.userData.modelReady = true;
}

function _setupFurryBallAnimations(group, model, animations) {
    if (!animations || animations.length === 0) return;
    const mixer = new THREE.AnimationMixer(model);
    animations.forEach(clip => mixer.clipAction(clip).play());
    group.userData.mixer = mixer;
}

function _attachFurryBallFallback(group, radius) {
    const geo = new THREE.SphereGeometry(radius, 20, 14);
    const mat = new THREE.MeshStandardMaterial({
        color: 0xc9b18b,
        emissive: 0x1f1811,
        emissiveIntensity: 0.2,
        metalness: 0.06,
        roughness: 0.86
    });
    const fallback = new THREE.Mesh(geo, mat);
    fallback.castShadow = true;
    group.add(fallback);

    group.userData.model = fallback;
    group.userData.modelReady = true;
}

function _brightenFurryBallMaterial(material) {
    if (!material) return;

    if (Array.isArray(material)) {
        material.forEach(_brightenFurryBallMaterial);
        return;
    }

    if (!material.color || !material.emissive) return;

    const emissiveColor = material.color.clone().multiplyScalar(0.06);
    material.emissive.copy(emissiveColor);
    material.emissiveIntensity = Math.max(material.emissiveIntensity || 0, 0.2);

    if (typeof material.metalness === 'number') {
        material.metalness = Math.min(material.metalness, 0.12);
    }

    if (typeof material.roughness === 'number') {
        material.roughness = Math.max(material.roughness, 0.62);
    }

    material.needsUpdate = true;
}

function createFurryBallSkin() {
    return buildFurryBallSkin(0.45, true).group;
}

function applyFurryBallSkin() {
    if (!player || !furryBallGroup) return;
    const equipped = GameState.furryBallOwned && GameState.furryBallEquipped;

    // Lazy-load: trigger the 35MB download the first time the skin is equipped after purchase
    if (equipped && !furryBallGroup.userData.modelReady) {
        _loadFurryBallModel(furryBallGroup, 0.45);
    }

    furryBallGroup.visible = equipped;

    const anyEquipped = isAnySkinEquipped();
    if (playerCore) playerCore.visible = !anyEquipped;
    if (playerGlow) playerGlow.visible = !anyEquipped;
    if (playerRing) playerRing.visible = !anyEquipped;
}
