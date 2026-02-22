// ========================================
// POKEBALL SKIN - Clean GLB Model
// ========================================
// Uses GLBLoader cache so the .glb file is fetched only once.
// Renders only the model itself (no glow shells or particle effects).

const POKEBALL_GLB_URL = 'assets/skins/pokeball.glb';
const POKEBALL_PITCH_OFFSET = -0.22;

/**
 * Build the Pokéball skin group.
 * The GLB model is loaded via GLBLoader (cached / deduplicated) and attached when ready.
 *
 * @param {number} radius       - Ball radius (0.45 for player, same for preview)
 * @param {boolean} assignGlobals - Whether to assign to the `pokeballGroup` global
 * @returns {{ group: THREE.Group, innerGlow: null, outerGlow: null, sparks: null }}
 */
function buildPokeballSkin(radius = 1, assignGlobals = false) {
    const group = new THREE.Group();

    // ── Loading state ──
    group.userData.modelReady = false;
    group.userData.model = null;
    group.userData.mixer = null;
    group.userData.innerGlow = null;
    group.userData.outerGlow = null;
    group.userData.sparks = null;

    // ── Load GLB via shared cache ──
    _loadPokeballModel(group, radius);

    if (assignGlobals) {
        pokeballGroup = group;
    }

    return { group, innerGlow: null, outerGlow: null, sparks: null };
}

/**
 * Load the pokeball GLB into the given group via GLBLoader cache.
 * - If already cached → instant clone (synchronous attach).
 * - If not cached → async load; first call triggers HTTP, second deduplicates.
 * - On error → fallback red sphere.
 * @param {THREE.Group} group
 * @param {number} radius
 */
function _loadPokeballModel(group, radius) {
    if (typeof GLBLoader === 'undefined') {
        console.error('Pokeball: GLBLoader not available');
        _attachFallbackSphere(group, radius);
        return;
    }

    // Instant path: cache already has the model (e.g. preview after player loaded it)
    if (GLBLoader.has(POKEBALL_GLB_URL)) {
        const model = GLBLoader.clone(POKEBALL_GLB_URL);
        _attachPokeballModel(group, model, radius);
        // Set up animations from cached entry
        const entry = GLBLoader._cache.get(POKEBALL_GLB_URL);
        _setupPokeballAnimations(group, model, entry.animations);
        return;
    }

    // Async path: load (or join in-flight request)
    GLBLoader.load(POKEBALL_GLB_URL)
        .then(entry => {
            // Clone the cached scene so each instance has its own materials
            const model = GLBLoader.clone(POKEBALL_GLB_URL);
            _attachPokeballModel(group, model, radius);
            _setupPokeballAnimations(group, model, entry.animations);
        })
        .catch(err => {
            console.error('Pokeball: GLB load failed, showing fallback:', err);
            _attachFallbackSphere(group, radius);
        });
}

/**
 * Scale, center, and add the loaded GLB model to the skin group.
 * FIXED: Box3 is recalculated AFTER scaling to avoid centering offset bug.
 * Materials are preserved and brightened for readability in gameplay.
 * @param {THREE.Group} group
 * @param {THREE.Group} model
 * @param {number} radius
 */
function _attachPokeballModel(group, model, radius) {
    // Step 1: measure and scale
    const box = new THREE.Box3().setFromObject(model);
    const size = new THREE.Vector3();
    box.getSize(size);
    const modelRadius = Math.max(size.x, size.y, size.z) / 2;
    const scaleFactor = modelRadius > 0 ? radius / modelRadius : 1;
    model.scale.set(scaleFactor, scaleFactor, scaleFactor);

    // Step 2: recalculate Box3 AFTER scaling, then center
    const scaledBox = new THREE.Box3().setFromObject(model);
    const center = new THREE.Vector3();
    scaledBox.getCenter(center);
    model.position.sub(center);
    model.rotation.x = POKEBALL_PITCH_OFFSET;

    // Step 3: preserve authored look but boost visibility in dark scenes.
    model.traverse(child => {
        if (child.isMesh) {
            child.castShadow = true;
            GLBLoader.normalizeMaterial(child.material, typeof renderer !== 'undefined' ? renderer.capabilities.getMaxAnisotropy() : 1, 'pokeball');
        }
    });

    group.add(model);
    group.userData.model = model;
    group.userData.modelReady = true;
}

/**
 * If the GLB has embedded AnimationClips, create a mixer and play them all.
 * @param {THREE.Group} group
 * @param {THREE.Group} model
 * @param {THREE.AnimationClip[]} animations
 */
function _setupPokeballAnimations(group, model, animations) {
    if (!animations || animations.length === 0) return;
    const mixer = new THREE.AnimationMixer(model);
    animations.forEach(clip => {
        mixer.clipAction(clip).play();
    });
    group.userData.mixer = mixer;
}

/**
 * Fallback if GLB fails to load: red metallic sphere so the slot isn't empty.
 * @param {THREE.Group} group
 * @param {number} radius
 */
function _attachFallbackSphere(group, radius) {
    const geo = new THREE.SphereGeometry(radius, 20, 14);
    const mat = new THREE.MeshStandardMaterial({
        color: 0xff2222,
        emissive: 0xff0000,
        emissiveIntensity: 0.8,
        metalness: 0.5,
        roughness: 0.3
    });
    const fallback = new THREE.Mesh(geo, mat);
    fallback.castShadow = true;
    group.add(fallback);
    group.userData.model = fallback;
    group.userData.modelReady = true;
}



// ── Public skin API (auto-wired by skin-registry naming conventions) ──

/**
 * Factory called once from createPlayer() to attach the skin group.
 * @returns {THREE.Group}
 */
function createPokeballSkin() {
    return buildPokeballSkin(0.45, true).group;
}

/**
 * Show or hide the Pokéball skin and toggle the default player visuals.
 * Called by applySkins() whenever equipment changes.
 */
function applyPokeballSkin() {
    if (!player || !pokeballGroup) return;
    const equipped = GameState.pokeballOwned && GameState.pokeballEquipped;
    pokeballGroup.visible = equipped;
    const anyEquipped = isAnySkinEquipped();
    if (playerCore) playerCore.visible = !anyEquipped;
    if (playerGlow) playerGlow.visible = !anyEquipped;
    if (playerRing) playerRing.visible = !anyEquipped;
}
