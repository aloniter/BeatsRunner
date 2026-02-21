// ========================================
// SOCCER BALL SKIN - Clean GLB Model
// ========================================

const SOCCER_BALL_GLB_URL = 'assets/skins/soccer_ball.glb';

function buildSoccerBallSkin(radius = 1, assignGlobals = false) {
    const group = new THREE.Group();

    group.userData.modelReady = false;
    group.userData.model = null;
    group.userData.mixer = null;

    _loadSoccerBallModel(group, radius);

    if (assignGlobals) {
        soccerBallGroup = group;
    }

    return { group };
}

function _loadSoccerBallModel(group, radius) {
    if (typeof GLBLoader === 'undefined') {
        console.error('Soccer Ball: GLBLoader not available');
        _attachSoccerBallFallback(group, radius);
        return;
    }

    if (GLBLoader.has(SOCCER_BALL_GLB_URL)) {
        const model = GLBLoader.clone(SOCCER_BALL_GLB_URL);
        const entry = GLBLoader._cache.get(SOCCER_BALL_GLB_URL);
        _attachSoccerBallModel(group, model, radius);
        _setupSoccerBallAnimations(group, model, entry.animations);
        return;
    }

    GLBLoader.load(SOCCER_BALL_GLB_URL)
        .then(entry => {
            const model = GLBLoader.clone(SOCCER_BALL_GLB_URL);
            _attachSoccerBallModel(group, model, radius);
            _setupSoccerBallAnimations(group, model, entry.animations);
        })
        .catch(err => {
            console.error('Soccer Ball: GLB load failed, showing fallback:', err);
            _attachSoccerBallFallback(group, radius);
        });
}

function _attachSoccerBallModel(group, model, radius) {
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
        GLBLoader.normalizeMaterial(child.material, typeof renderer !== 'undefined' ? renderer.capabilities.getMaxAnisotropy() : 1);
    });

    group.add(model);
    group.userData.model = model;
    group.userData.modelReady = true;
}

function _setupSoccerBallAnimations(group, model, animations) {
    if (!animations || animations.length === 0) return;
    const mixer = new THREE.AnimationMixer(model);
    animations.forEach(clip => mixer.clipAction(clip).play());
    group.userData.mixer = mixer;
}

function _attachSoccerBallFallback(group, radius) {
    const geo = new THREE.SphereGeometry(radius, 20, 14);
    const mat = new THREE.MeshStandardMaterial({
        color: 0xffffff,
        emissive: 0x1c1c1c,
        emissiveIntensity: 0.22,
        metalness: 0.18,
        roughness: 0.62
    });
    const fallback = new THREE.Mesh(geo, mat);
    fallback.castShadow = true;
    group.add(fallback);

    group.userData.model = fallback;
    group.userData.modelReady = true;
}

function _brightenSoccerBallMaterial(material) {
    if (!material) return;

    if (Array.isArray(material)) {
        material.forEach(_brightenSoccerBallMaterial);
        return;
    }

    if (!material.color || !material.emissive) return;

    const emissiveColor = material.color.clone().multiplyScalar(0.07);
    material.emissive.copy(emissiveColor);
    material.emissiveIntensity = Math.max(material.emissiveIntensity || 0, 0.22);

    if (typeof material.metalness === 'number') {
        material.metalness = Math.min(material.metalness, 0.3);
    }
    if (typeof material.roughness === 'number') {
        material.roughness = Math.max(material.roughness, 0.44);
    }

    material.needsUpdate = true;
}

function createSoccerBallSkin() {
    return buildSoccerBallSkin(0.45, true).group;
}

function applySoccerBallSkin() {
    if (!player || !soccerBallGroup) return;
    const equipped = GameState.soccerBallOwned && GameState.soccerBallEquipped;
    soccerBallGroup.visible = equipped;

    const anyEquipped = isAnySkinEquipped();
    if (playerCore) playerCore.visible = !anyEquipped;
    if (playerGlow) playerGlow.visible = !anyEquipped;
    if (playerRing) playerRing.visible = !anyEquipped;
}
