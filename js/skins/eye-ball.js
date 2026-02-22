// ========================================
// EYE BALL SKIN - Clean GLB Model
// ========================================
// Uses GLBLoader cache so the .glb file is fetched only once.
// Renders only the model itself.

const EYE_BALL_GLB_URL = 'assets/skins/anatomical_eye_ball.glb';

/**
 * Build the Eye Ball skin group.
 * The GLB model is loaded via GLBLoader (cached / deduplicated) and attached when ready.
 *
 * @param {number} radius
 * @param {boolean} assignGlobals
 * @returns {{ group: THREE.Group }}
 */
function buildEyeBallSkin(radius = 1, assignGlobals = false) {
    const group = new THREE.Group();

    group.userData.modelReady = false;
    group.userData.model = null;
    group.userData.mixer = null;

    _loadEyeBallModel(group, radius);

    if (assignGlobals) {
        eyeBallGroup = group;
    }

    return { group };
}

function _loadEyeBallModel(group, radius) {
    if (typeof GLBLoader === 'undefined') {
        console.error('Eye Ball: GLBLoader not available');
        _attachEyeBallFallback(group, radius);
        return;
    }

    if (GLBLoader.has(EYE_BALL_GLB_URL)) {
        const model = GLBLoader.clone(EYE_BALL_GLB_URL);
        _attachEyeBallModel(group, model, radius);
        const entry = GLBLoader._cache.get(EYE_BALL_GLB_URL);
        _setupEyeBallAnimations(group, model, entry.animations);
        return;
    }

    GLBLoader.load(EYE_BALL_GLB_URL)
        .then(entry => {
            const model = GLBLoader.clone(EYE_BALL_GLB_URL);
            _attachEyeBallModel(group, model, radius);
            _setupEyeBallAnimations(group, model, entry.animations);
        })
        .catch(err => {
            console.error('Eye Ball: GLB load failed, showing fallback:', err);
            _attachEyeBallFallback(group, radius);
        });
}

function _attachEyeBallModel(group, model, radius) {
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
        if (child.isMesh) {
            child.castShadow = true;
            GLBLoader.normalizeMaterial(child.material, typeof renderer !== 'undefined' ? renderer.capabilities.getMaxAnisotropy() : 1, 'eye-ball');
        }
    });

    group.add(model);
    group.userData.model = model;
    group.userData.modelReady = true;
}

function _setupEyeBallAnimations(group, model, animations) {
    if (!animations || animations.length === 0) return;
    const mixer = new THREE.AnimationMixer(model);
    animations.forEach(clip => {
        mixer.clipAction(clip).play();
    });
    group.userData.mixer = mixer;
}

function _attachEyeBallFallback(group, radius) {
    const geo = new THREE.SphereGeometry(radius, 20, 14);
    const mat = new THREE.MeshStandardMaterial({
        color: 0xb8b8b8,
        emissive: 0x131a22,
        emissiveIntensity: 0.22,
        metalness: 0.08,
        roughness: 0.74
    });
    const fallback = new THREE.Mesh(geo, mat);
    fallback.castShadow = true;
    group.add(fallback);
    group.userData.model = fallback;
    group.userData.modelReady = true;
}



function createEyeBallSkin() {
    return buildEyeBallSkin(0.45, true).group;
}

function applyEyeBallSkin() {
    if (!player || !eyeBallGroup) return;
    const equipped = GameState.eyeBallOwned && GameState.eyeBallEquipped;
    eyeBallGroup.visible = equipped;
    const anyEquipped = isAnySkinEquipped();
    if (playerCore) playerCore.visible = !anyEquipped;
    if (playerGlow) playerGlow.visible = !anyEquipped;
    if (playerRing) playerRing.visible = !anyEquipped;
}
