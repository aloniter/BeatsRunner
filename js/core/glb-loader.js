// ========================================
// GLB LOADER CACHE - Shared GLTFLoader with Model Caching
// ========================================
// Singleton loader: one THREE.GLTFLoader instance, one HTTP request per URL.
// Promise-based with deduplication so multiple callers share the same fetch.
// Deep-clone support so preview and player don't share material references.

const GLBLoader = {
    /** @type {THREE.GLTFLoader|null} */
    _loader: null,

    /** @type {Map<string, { scene: THREE.Group, animations: THREE.AnimationClip[] }>} */
    _cache: new Map(),

    /** @type {Map<string, Promise>} In-flight request promises (deduplication) */
    _pending: new Map(),

    // ── Internal ──────────────────────────────────────────

    /**
     * Get or lazily create the shared GLTFLoader instance.
     * @returns {THREE.GLTFLoader|null}
     */
    _getLoader() {
        if (this._loader) return this._loader;
        if (typeof THREE !== 'undefined' && typeof THREE.GLTFLoader !== 'undefined') {
            this._loader = new THREE.GLTFLoader();
            return this._loader;
        }
        console.error('GLBLoader: THREE.GLTFLoader is not available.');
        return null;
    },

    // ── Public API ────────────────────────────────────────

    /**
     * Load a GLB/GLTF file. Returns a Promise that resolves to the cached entry.
     * - If already cached: resolves immediately.
     * - If already loading: returns the existing in-flight Promise (no duplicate HTTP).
     * - Otherwise: starts a new load.
     *
     * @param {string} url - Path to the .glb file (e.g. 'assets/skins/pokeball.glb')
     * @param {function} [onProgress] - Optional progress callback (xhr) => {}
     * @returns {Promise<{ scene: THREE.Group, animations: THREE.AnimationClip[] }>}
     */
    load(url, onProgress) {
        // Already cached — instant resolve
        if (this._cache.has(url)) {
            return Promise.resolve(this._cache.get(url));
        }
        // Already in-flight — deduplicate
        if (this._pending.has(url)) {
            return this._pending.get(url);
        }

        const loader = this._getLoader();
        if (!loader) {
            return Promise.reject(new Error('GLTFLoader not available'));
        }

        const promise = new Promise((resolve, reject) => {
            loader.load(
                url,
                (gltf) => {
                    const entry = {
                        scene: gltf.scene,
                        animations: gltf.animations || []
                    };
                    this._cache.set(url, entry);
                    this._pending.delete(url);
                    resolve(entry);
                },
                onProgress || undefined,
                (error) => {
                    this._pending.delete(url);
                    console.error('GLBLoader: Failed to load "' + url + '":', error);
                    reject(error);
                }
            );
        });

        this._pending.set(url, promise);
        return promise;
    },

    /**
     * Check if a URL has been successfully loaded and cached.
     * @param {string} url
     * @returns {boolean}
     */
    has(url) {
        return this._cache.has(url);
    },

    /**
     * Check if a URL is currently being loaded.
     * @param {string} url
     * @returns {boolean}
     */
    isLoading(url) {
        return this._pending.has(url);
    },

    /**
     * Get a deep clone of the cached model's scene graph.
     * Materials are cloned so each instance can be modified independently.
     * Returns null if the URL is not yet cached.
     *
     * @param {string} url
     * @returns {THREE.Group|null}
     */
    clone(url) {
        const entry = this._cache.get(url);
        if (!entry) return null;

        const cloned = entry.scene.clone(true);
        // Deep-clone materials so instances don't share state
        cloned.traverse(child => {
            if (child.isMesh && child.material) {
                child.material = child.material.clone();
            }
        });
        return cloned;
    },

    /**
     * Fire-and-forget preload. Starts the HTTP request early so the model
     * is cached by the time it's actually needed.
     * @param {string} url
     */
    preload(url) {
        this.load(url).catch(() => {
            // Error already logged inside load()
        });
    },

    /**
     * Clear the entire cache. Only needed for full cleanup / hot-reload.
     */
    dispose() {
        this._cache.clear();
        this._pending.clear();
        this._loader = null;
    },

    /** Number of cached models. */
    get size() {
        return this._cache.size;
    },

    /**
     * Normalizes a material or an array of materials to ensure consistent
     * rendering for orbs across the game. Limits extreme roughness/metalness,
     * ensures proper color space, and injects a subtle emissive tint.
     * @param {THREE.Material|THREE.Material[]} material 
     * @param {number} maxAnisotropy 
     */
    normalizeMaterial(material, maxAnisotropy = 1) {
        if (!material) return;

        if (Array.isArray(material)) {
            material.forEach(m => this.normalizeMaterial(m, maxAnisotropy));
            return;
        }

        // If it's a basic material, we might consider upgrading it, but usually, 
        // models authoring basic materials intentionally lack lighting responses.
        // For GLB orbs, we should ideally work with Standard/Physical.
        if (material.isMeshBasicMaterial) {
            console.warn('GLBLoader: Normalizing a BasicMaterial. Consider upgrading to Standard if it needs lighting.');
        }

        const config = typeof CONFIG !== 'undefined' ? CONFIG.ORB_VISUALS : {
            roughnessRange: [0.15, 0.85],
            metalnessRange: [0.0, 0.6],
            emissiveTint: 0x222222,
            emissiveIntensity: 0.8
        };

        // Texture enhancements
        if (material.map) {
            material.map.colorSpace = THREE.SRGBColorSpace;
            material.map.anisotropy = maxAnisotropy;
        }
        if (material.emissiveMap) {
            material.emissiveMap.colorSpace = THREE.SRGBColorSpace;
        }

        // Clamp physical properties to avoid "washed out" or "pure black" looks
        if (typeof material.roughness === 'number') {
            material.roughness = THREE.MathUtils.clamp(material.roughness, config.roughnessRange[0], config.roughnessRange[1]);
        }
        if (typeof material.metalness === 'number') {
            material.metalness = THREE.MathUtils.clamp(material.metalness, config.metalnessRange[0], config.metalnessRange[1]);
        }

        // Inject subtle emissive glow if base color exists, so orbs pop in dark neon scenes
        if (material.color && material.emissive) {
            // Only add tint if there isn't already a strong emissive authored
            if (material.emissive.getHex() === 0x000000 && !material.emissiveMap) {
                material.emissive.setHex(config.emissiveTint);

                // If it has a color map or base color, tint the emissive slightly towards it
                const baseColorHex = material.map ? 0xffffff : material.color.getHex();
                const blendedEmissive = new THREE.Color(baseColorHex).lerp(new THREE.Color(config.emissiveTint), 0.5);
                material.emissive.copy(blendedEmissive);
            }
            material.emissiveIntensity = Math.max(material.emissiveIntensity || 0, config.emissiveIntensity);
        }

        material.envMapIntensity = 1.0;
        material.needsUpdate = true;
    }
};
