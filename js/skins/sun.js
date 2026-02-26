// ========================================
// SUN SKIN - Clean GLB Model
// ========================================

const SUN_GLB_URL = 'assets/skins/sun.glb';

function buildSunSkin(radius = 1, assignGlobals = false) {
    const group = new THREE.Group();

    group.userData.modelReady = false;
    group.userData.model = null;
    group.userData.mixer = null;

    _loadSunModel(group, radius);

    if (assignGlobals) {
        sunGroup = group;
    }

    return { group };
}

function _loadSunModel(group, radius) {
    if (typeof GLBLoader === 'undefined') {
        console.error('Sun: GLBLoader not available');
        _attachSunFallback(group, radius);
        return;
    }

    if (GLBLoader.has(SUN_GLB_URL)) {
        const model = GLBLoader.clone(SUN_GLB_URL);
        const entry = GLBLoader._cache.get(SUN_GLB_URL);
        _attachSunModel(group, model, radius);
        _setupSunAnimations(group, model, entry.animations);
        return;
    }

    GLBLoader.load(SUN_GLB_URL)
        .then(entry => {
            const model = GLBLoader.clone(SUN_GLB_URL);
            _attachSunModel(group, model, radius);
            _setupSunAnimations(group, model, entry.animations);
        })
        .catch(err => {
            console.error('Sun: GLB load failed, showing fallback:', err);
            _attachSunFallback(group, radius);
        });
}

function _attachSunModel(group, model, radius) {
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
        GLBLoader.normalizeMaterial(child.material, typeof renderer !== 'undefined' ? renderer.capabilities.getMaxAnisotropy() : 1, 'sun');
    });

    group.add(model);
    group.userData.model = model;
    group.userData.modelReady = true;
}

function _setupSunAnimations(group, model, animations) {
    if (!animations || animations.length === 0) return;
    const mixer = new THREE.AnimationMixer(model);
    animations.forEach(clip => mixer.clipAction(clip).play());
    group.userData.mixer = mixer;
}

function _attachSunFallback(group, radius) {
    const geo = new THREE.SphereGeometry(radius, 20, 14);
    const mat = new THREE.MeshStandardMaterial({
        color: 0xffcc00,
        emissive: 0xff8800,
        emissiveIntensity: 1.1,
        metalness: 0.0,
        roughness: 0.5
    });
    const fallback = new THREE.Mesh(geo, mat);
    fallback.castShadow = true;
    group.add(fallback);

    group.userData.model = fallback;
    group.userData.modelReady = true;
}

function createSunSkin() {
    return buildSunSkin(0.45, true).group;
}

function applySunSkin() {
    if (!player || !sunGroup) return;
    const equipped = GameState.sunOwned && GameState.sunEquipped;
    sunGroup.visible = equipped;

    const anyEquipped = isAnySkinEquipped();
    if (playerCore) playerCore.visible = !anyEquipped;
    if (playerGlow) playerGlow.visible = !anyEquipped;
    if (playerRing) playerRing.visible = !anyEquipped;
}
