// ========================================
// POKEBALL SKIN - GLB Model with Epic Effects
// ========================================
// Uses GLBLoader cache so the .glb file is fetched only once.
// Creates glow layers + energy sparks synchronously (instant visual),
// then loads the GLB model via the shared cache. If the cache already
// has the model (e.g. preview after player), it clones instantly.

const POKEBALL_GLB_URL = 'pokeball.glb';

/**
 * Build the Pokéball skin group. Glow layers and spark particles are created
 * synchronously so there's always something to render. The GLB model is loaded
 * via GLBLoader (cached / deduplicated) and attached when ready.
 *
 * @param {number} radius       - Ball radius (0.45 for player, same for preview)
 * @param {boolean} assignGlobals - Whether to assign to the `pokeballGroup` global
 * @returns {{ group: THREE.Group, innerGlow: THREE.Mesh, outerGlow: THREE.Mesh, sparks: THREE.Points }}
 */
function buildPokeballSkin(radius = 1, assignGlobals = false) {
    const group = new THREE.Group();

    // ── children[0]: Inner glow — red halo that pulses with the beat ──
    const innerGlowGeo = new THREE.SphereGeometry(radius * 1.1, 16, 12);
    const innerGlowMat = new THREE.MeshBasicMaterial({
        color: 0xff2222,
        transparent: true,
        opacity: 0.22,
        blending: THREE.AdditiveBlending
    });
    const innerGlow = new THREE.Mesh(innerGlowGeo, innerGlowMat);
    group.add(innerGlow);

    // ── children[1]: Outer glow — wider, softer red aureole ──
    const outerGlowGeo = new THREE.SphereGeometry(radius * 1.3, 16, 12);
    const outerGlowMat = new THREE.MeshBasicMaterial({
        color: 0xff4444,
        transparent: true,
        opacity: 0.12,
        blending: THREE.AdditiveBlending
    });
    const outerGlow = new THREE.Mesh(outerGlowGeo, outerGlowMat);
    group.add(outerGlow);

    // ── children[2]: Energy sparks — orbiting particle system ──
    const sparkCount = QualityManager.getParticleCount('pokeball-spark');
    const sparkGeo = new THREE.BufferGeometry();
    const sparkPositions = new Float32Array(sparkCount * 3);
    const sparkBasePositions = new Float32Array(sparkCount * 3);
    const sparkPhases = new Float32Array(sparkCount);

    for (let i = 0; i < sparkCount; i++) {
        const angle = Math.random() * Math.PI * 2;
        const height = (Math.random() - 0.5) * 2;
        const r = radius + 0.15 + Math.random() * 0.3;
        sparkPositions[i * 3]     = Math.cos(angle) * r;
        sparkPositions[i * 3 + 1] = height * 0.6;
        sparkPositions[i * 3 + 2] = Math.sin(angle) * r;
        sparkBasePositions[i * 3]     = sparkPositions[i * 3];
        sparkBasePositions[i * 3 + 1] = sparkPositions[i * 3 + 1];
        sparkBasePositions[i * 3 + 2] = sparkPositions[i * 3 + 2];
        sparkPhases[i] = Math.random() * Math.PI * 2;
    }

    sparkGeo.setAttribute('position', new THREE.BufferAttribute(sparkPositions, 3));
    sparkGeo.userData.basePositions = sparkBasePositions;
    sparkGeo.userData.phases = sparkPhases;

    const sparkMat = new THREE.PointsMaterial({
        color: 0xff4444,
        size: 0.07,
        transparent: true,
        opacity: 0.85,
        blending: THREE.AdditiveBlending
    });
    const sparks = new THREE.Points(sparkGeo, sparkMat);
    group.add(sparks);

    // ── Loading state ──
    group.userData.modelReady = false;
    group.userData.model = null;
    group.userData.mixer = null;

    // ── Load GLB via shared cache ──
    _loadPokeballModel(group, radius);

    if (assignGlobals) {
        pokeballGroup = group;
    }

    return { group, innerGlow, outerGlow, sparks };
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
 * Materials are preserved — only castShadow + subtle emissive for bloom.
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

    // Step 3: minimal material enhancement — preserve artist intent
    model.traverse(child => {
        if (child.isMesh) {
            child.castShadow = true;
            if (child.material) {
                // Subtle emissive hint so bloom picks it up
                if (!child.material.emissive) {
                    child.material.emissive = new THREE.Color(0x000000);
                }
                child.material.emissiveIntensity = Math.max(
                    child.material.emissiveIntensity || 0, 0.1
                );
            }
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

    // Hide the default cyan sphere/glow/ring if ANY skin is equipped
    const anyEquipped = equipped ||
        (GameState.discoBallOwned && GameState.discoBallEquipped) ||
        (GameState.fireBallOwned && GameState.fireBallEquipped) ||
        (GameState.rainbowOrbOwned && GameState.rainbowOrbEquipped) ||
        (GameState.falafelBallOwned && GameState.falafelBallEquipped);
    if (playerCore) playerCore.visible = !anyEquipped;
    if (playerGlow) playerGlow.visible = !anyEquipped;
    if (playerRing) playerRing.visible = !anyEquipped;
}
