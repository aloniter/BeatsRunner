// ========================================
// DISCO BALL SKIN - Clean GLB Model
// ========================================
// Uses GLBLoader cache so the .glb file is fetched only once.

const DISCO_BALL_GLB_URL = 'assets/skins/disco_ball.glb';

/**
 * Build the Disco Ball skin group.
 * The GLB model is loaded via GLBLoader (cached / deduplicated) and attached when ready.
 *
 * @param {number} radius
 * @param {boolean} assignGlobals
 * @returns {{ group: THREE.Group, core: THREE.Mesh|null, tiles: null, innerGlow: null, outerGlow: null, beams: null }}
 */
function buildDiscoBall(radius = 1, assignGlobals = false) {
    const group = new THREE.Group();

    group.userData.modelReady = false;
    group.userData.model = null;
    group.userData.primaryMesh = null;
    group.userData.mixer = null;

    _loadDiscoBallModel(group, radius);

    if (assignGlobals) {
        discoBallGroup = group;
        discoBallCore = null;
        discoBallTiles = null;
        discoBallSparkles = null;
        discoBallInnerGlow = null;
        discoBallOuterGlow = null;
        discoBallBeams = null;
    }

    return {
        group,
        core: group.userData.primaryMesh || null,
        tiles: null,
        innerGlow: null,
        outerGlow: null,
        beams: null
    };
}

function _loadDiscoBallModel(group, radius) {
    if (typeof GLBLoader === 'undefined') {
        console.error('Disco Ball: GLBLoader not available');
        _attachDiscoBallFallback(group, radius);
        return;
    }

    if (GLBLoader.has(DISCO_BALL_GLB_URL)) {
        const model = GLBLoader.clone(DISCO_BALL_GLB_URL);
        const entry = GLBLoader._cache.get(DISCO_BALL_GLB_URL);
        _attachDiscoBallModel(group, model, radius);
        _setupDiscoBallAnimations(group, model, entry.animations);
        return;
    }

    GLBLoader.load(DISCO_BALL_GLB_URL)
        .then(entry => {
            const model = GLBLoader.clone(DISCO_BALL_GLB_URL);
            _attachDiscoBallModel(group, model, radius);
            _setupDiscoBallAnimations(group, model, entry.animations);
        })
        .catch(err => {
            console.error('Disco Ball: GLB load failed, showing fallback:', err);
            _attachDiscoBallFallback(group, radius);
        });
}

function _attachDiscoBallModel(group, model, radius) {
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

    let primaryMesh = null;
    model.traverse(child => {
        if (!child.isMesh) return;
        if (!primaryMesh) primaryMesh = child;
        child.castShadow = true;
        GLBLoader.normalizeMaterial(child.material, typeof renderer !== 'undefined' ? renderer.capabilities.getMaxAnisotropy() : 1, 'disco-ball');
    });

    group.add(model);
    group.userData.model = model;
    group.userData.primaryMesh = primaryMesh;
    group.userData.modelReady = true;

    if (group === discoBallGroup) {
        discoBallCore = primaryMesh;
    }
}

function _setupDiscoBallAnimations(group, model, animations) {
    if (!animations || animations.length === 0) return;
    const mixer = new THREE.AnimationMixer(model);
    animations.forEach(clip => mixer.clipAction(clip).play());
    group.userData.mixer = mixer;
}

function _attachDiscoBallFallback(group, radius) {
    const geo = new THREE.SphereGeometry(radius, 20, 14);
    const mat = new THREE.MeshStandardMaterial({
        color: 0xd0d0d0,
        emissive: 0x252525,
        emissiveIntensity: 0.24,
        metalness: 0.9,
        roughness: 0.2
    });
    const fallback = new THREE.Mesh(geo, mat);
    fallback.castShadow = true;
    group.add(fallback);

    group.userData.model = fallback;
    group.userData.primaryMesh = fallback;
    group.userData.modelReady = true;

    if (group === discoBallGroup) {
        discoBallCore = fallback;
    }
}



function createDiscoBallSkin() {
    return buildDiscoBall(0.45, true).group;
}

function applyDiscoBallSkin() {
    if (!player || !discoBallGroup) return;
    const equipped = GameState.discoBallOwned && GameState.discoBallEquipped;
    discoBallGroup.visible = equipped;

    const anyEquipped = isAnySkinEquipped();
    if (playerCore) playerCore.visible = !anyEquipped;
    if (playerGlow) playerGlow.visible = !anyEquipped;
    if (playerRing) playerRing.visible = !anyEquipped;
}
