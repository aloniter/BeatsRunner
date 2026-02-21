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
     * @param {string} url - Path to the .glb file (e.g. 'pokeball.glb')
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
    }
};
