// ========================================
// BASKETBALL SKIN - Clean GLB Model
// ========================================

const BASKETBALL_GLB_URL = 'assets/skins/basketball.glb';

function buildBasketballSkin(radius = 1, assignGlobals = false) {
    const group = new THREE.Group();

    group.userData.modelReady = false;
    group.userData.model = null;
    group.userData.mixer = null;

    _loadBasketballModel(group, radius);

    if (assignGlobals) {
        basketballGroup = group;
    }

    return { group };
}

function _loadBasketballModel(group, radius) {
    if (typeof GLBLoader === 'undefined') {
        console.error('Basketball: GLBLoader not available');
        _attachBasketballFallback(group, radius);
        return;
    }

    if (GLBLoader.has(BASKETBALL_GLB_URL)) {
        const model = GLBLoader.clone(BASKETBALL_GLB_URL);
        const entry = GLBLoader._cache.get(BASKETBALL_GLB_URL);
        _attachBasketballModel(group, model, radius);
        _setupBasketballAnimations(group, model, entry.animations);
        return;
    }

    GLBLoader.load(BASKETBALL_GLB_URL)
        .then(entry => {
            const model = GLBLoader.clone(BASKETBALL_GLB_URL);
            _attachBasketballModel(group, model, radius);
            _setupBasketballAnimations(group, model, entry.animations);
        })
        .catch(err => {
            console.error('Basketball: GLB load failed, showing fallback:', err);
            _attachBasketballFallback(group, radius);
        });
}

function _attachBasketballModel(group, model, radius) {
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
        GLBLoader.normalizeMaterial(child.material, typeof renderer !== 'undefined' ? renderer.capabilities.getMaxAnisotropy() : 1, 'basketball');
    });

    group.add(model);
    group.userData.model = model;
    group.userData.modelReady = true;
}

function _setupBasketballAnimations(group, model, animations) {
    if (!animations || animations.length === 0) return;
    const mixer = new THREE.AnimationMixer(model);
    animations.forEach(clip => mixer.clipAction(clip).play());
    group.userData.mixer = mixer;
}

function _attachBasketballFallback(group, radius) {
    const geo = new THREE.SphereGeometry(radius, 20, 14);
    const mat = new THREE.MeshStandardMaterial({
        color: 0xd96c1d,
        emissive: 0x9b3a00,
        emissiveIntensity: 0.95,
        metalness: 0.22,
        roughness: 0.62
    });
    const fallback = new THREE.Mesh(geo, mat);
    fallback.castShadow = true;
    group.add(fallback);

    group.userData.model = fallback;
    group.userData.modelReady = true;
}

function _brightenBasketballMaterial(material) {
    if (!material) return;

    if (Array.isArray(material)) {
        material.forEach(_brightenBasketballMaterial);
        return;
    }

    if (!material.color || !material.emissive) return;

    const emissiveColor = material.color.clone().multiplyScalar(0.4);
    material.emissive.copy(emissiveColor);
    material.emissiveIntensity = Math.max(material.emissiveIntensity || 0, 0.9);

    if (typeof material.roughness === 'number') {
        material.roughness = Math.max(material.roughness, 0.25);
    }

    material.needsUpdate = true;
}

function createBasketballSkin() {
    return buildBasketballSkin(0.45, true).group;
}

function applyBasketballSkin() {
    if (!player || !basketballGroup) return;
    const equipped = GameState.basketballOwned && GameState.basketballEquipped;
    basketballGroup.visible = equipped;

    const anyEquipped = isAnySkinEquipped();
    if (playerCore) playerCore.visible = !anyEquipped;
    if (playerGlow) playerGlow.visible = !anyEquipped;
    if (playerRing) playerRing.visible = !anyEquipped;
}
