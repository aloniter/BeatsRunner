// ========================================
// POKEBALL SKIN - GLB Model with Glow Effects
// ========================================

/**
 * Build the Pokéball skin group. Creates the group and glow layers immediately
 * (synchronous), then asynchronously loads pokeball.glb into the group via
 * THREE.GLTFLoader. This pattern keeps createPlayer() synchronous while still
 * supporting GLB models.
 *
 * @param {number} radius       - Ball radius (0.45 for player, same for preview)
 * @param {boolean} assignGlobals - Whether to assign to the `pokeballGroup` global
 * @returns {{ group: THREE.Group, innerGlow: THREE.Mesh, outerGlow: THREE.Mesh }}
 */
function buildPokeballSkin(radius = 1, assignGlobals = false) {
    const group = new THREE.Group();

    // Inner glow — red halo that pulses with the beat
    const innerGlowGeo = new THREE.SphereGeometry(radius * 1.1, 16, 12);
    const innerGlowMat = new THREE.MeshBasicMaterial({
        color: 0xff2222,
        transparent: true,
        opacity: 0.2,
        blending: THREE.AdditiveBlending
    });
    const innerGlow = new THREE.Mesh(innerGlowGeo, innerGlowMat);
    group.add(innerGlow);  // children[0]

    // Outer glow — wider, softer red aureole
    const outerGlowGeo = new THREE.SphereGeometry(radius * 1.3, 16, 12);
    const outerGlowMat = new THREE.MeshBasicMaterial({
        color: 0xff4444,
        transparent: true,
        opacity: 0.1,
        blending: THREE.AdditiveBlending
    });
    const outerGlow = new THREE.Mesh(outerGlowGeo, outerGlowMat);
    group.add(outerGlow);  // children[1]

    // Load the GLB model asynchronously — fills into the group once ready
    if (typeof THREE !== 'undefined' && typeof THREE.GLTFLoader !== 'undefined') {
        const loader = new THREE.GLTFLoader();
        loader.load(
            'pokeball.glb',
            (gltf) => {
                const model = gltf.scene;

                // Auto-detect model size and scale to desired radius
                const box = new THREE.Box3().setFromObject(model);
                const size = new THREE.Vector3();
                box.getSize(size);
                const modelRadius = Math.max(size.x, size.y, size.z) / 2;
                const scaleFactor = modelRadius > 0 ? radius / modelRadius : 1;
                model.scale.set(scaleFactor, scaleFactor, scaleFactor);

                // Center the model
                const center = new THREE.Vector3();
                box.getCenter(center);
                model.position.sub(center.multiplyScalar(scaleFactor));

                // Improve material appearance
                model.traverse(child => {
                    if (child.isMesh && child.material) {
                        child.material.roughness = Math.min(child.material.roughness ?? 0.5, 0.4);
                        child.material.metalness = Math.max(child.material.metalness ?? 0.1, 0.2);
                        child.castShadow = true;
                    }
                });

                group.add(model);
                group.userData.model = model;

                if (DEBUG) console.log('Pokeball GLB loaded. Scale factor:', scaleFactor.toFixed(3));
            },
            undefined,
            (err) => {
                if (typeof DEBUG !== 'undefined' && DEBUG) {
                    console.warn('Pokeball GLB load error:', err);
                }
            }
        );
    } else {
        if (typeof DEBUG !== 'undefined' && DEBUG) {
            console.warn('THREE.GLTFLoader not available — pokeball will show glow only');
        }
    }

    if (assignGlobals) {
        pokeballGroup = group;
    }

    return { group, innerGlow, outerGlow };
}

/**
 * Factory called once from createPlayer() to synchronously attach the skin group
 * to the player. The GLB fills in asynchronously after load.
 * @returns {THREE.Group}
 */
function createPokeballSkin() {
    return buildPokeballSkin(0.45, true).group;
}

/**
 * Show or hide the Pokéball skin and toggle the default player visuals based on
 * the current equipped state. Called by applySkins() whenever equipment changes.
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
