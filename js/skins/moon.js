// ========================================
// MOON SKIN - Clean GLB Model
// ========================================

const MOON_GLB_URL = 'assets/skins/moon.glb';

function buildMoonSkin(radius = 1, assignGlobals = false) {
    const group = new THREE.Group();

    group.userData.modelReady = false;
    group.userData.model = null;
    group.userData.mixer = null;

    _loadMoonModel(group, radius);

    if (assignGlobals) {
        moonGroup = group;
    }

    return { group };
}

function _loadMoonModel(group, radius) {
    if (typeof GLBLoader === 'undefined') {
        console.error('Moon: GLBLoader not available');
        _attachMoonFallback(group, radius);
        return;
    }

    if (GLBLoader.has(MOON_GLB_URL)) {
        const model = GLBLoader.clone(MOON_GLB_URL);
        const entry = GLBLoader._cache.get(MOON_GLB_URL);
        _attachMoonModel(group, model, radius);
        _setupMoonAnimations(group, model, entry.animations);
        return;
    }

    GLBLoader.load(MOON_GLB_URL)
        .then(entry => {
            const model = GLBLoader.clone(MOON_GLB_URL);
            _attachMoonModel(group, model, radius);
            _setupMoonAnimations(group, model, entry.animations);
        })
        .catch(err => {
            console.error('Moon: GLB load failed, showing fallback:', err);
            _attachMoonFallback(group, radius);
        });
}

function _attachMoonModel(group, model, radius) {
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
        GLBLoader.normalizeMaterial(child.material, typeof renderer !== 'undefined' ? renderer.capabilities.getMaxAnisotropy() : 1, 'moon');
    });

    group.add(model);
    group.userData.model = model;
    group.userData.modelReady = true;
}

function _setupMoonAnimations(group, model, animations) {
    if (!animations || animations.length === 0) return;
    const mixer = new THREE.AnimationMixer(model);
    animations.forEach(clip => mixer.clipAction(clip).play());
    group.userData.mixer = mixer;
}

function _attachMoonFallback(group, radius) {
    const geo = new THREE.SphereGeometry(radius, 20, 14);
    const mat = new THREE.MeshStandardMaterial({
        color: 0xb8c6de,
        emissive: 0x5e6b80,
        emissiveIntensity: 0.5,
        metalness: 0.08,
        roughness: 0.78
    });
    const fallback = new THREE.Mesh(geo, mat);
    fallback.castShadow = true;
    group.add(fallback);

    group.userData.model = fallback;
    group.userData.modelReady = true;
}

function createMoonSkin() {
    return buildMoonSkin(0.45, true).group;
}

function applyMoonSkin() {
    if (!player || !moonGroup) return;
    const equipped = GameState.moonOwned && GameState.moonEquipped;
    moonGroup.visible = equipped;

    const anyEquipped = isAnySkinEquipped();
    if (playerCore) playerCore.visible = !anyEquipped;
    if (playerGlow) playerGlow.visible = !anyEquipped;
    if (playerRing) playerRing.visible = !anyEquipped;
}
