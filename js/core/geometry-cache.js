// Geometry Cache - avoids allocating identical geometries repeatedly
// Usage: GeometryCache.get('box', 2.2, 2.2, 0.8) -> cached BoxGeometry
const GeometryCache = {
    _cache: new Map(),

    /**
     * Get or create a cached geometry.
     * @param {string} type - Geometry type: 'box', 'sphere', 'torus', 'cylinder', 'cone'
     * @param {...number} args - Constructor arguments for the geometry
     * @returns {THREE.BufferGeometry}
     */
    get(type, ...args) {
        const key = type + ':' + args.join(',');
        if (this._cache.has(key)) {
            return this._cache.get(key);
        }

        let geo;
        switch (type) {
            case 'box':
                geo = new THREE.BoxGeometry(...args);
                break;
            case 'sphere':
                geo = new THREE.SphereGeometry(...args);
                break;
            case 'torus':
                geo = new THREE.TorusGeometry(...args);
                break;
            case 'cylinder':
                geo = new THREE.CylinderGeometry(...args);
                break;
            case 'cone':
                geo = new THREE.ConeGeometry(...args);
                break;
            default:
                console.warn('GeometryCache: unknown type', type);
                return null;
        }

        this._cache.set(key, geo);
        return geo;
    },

    /**
     * Get a cached EdgesGeometry derived from another geometry.
     * @param {THREE.BufferGeometry} sourceGeo - The source geometry
     * @returns {THREE.EdgesGeometry}
     */
    getEdges(sourceGeo) {
        const key = 'edges:' + sourceGeo.uuid;
        if (this._cache.has(key)) {
            return this._cache.get(key);
        }
        const edges = new THREE.EdgesGeometry(sourceGeo);
        this._cache.set(key, edges);
        return edges;
    },

    /**
     * Clear all cached geometries (call on full cleanup only)
     */
    dispose() {
        this._cache.forEach(geo => geo.dispose());
        this._cache.clear();
    },

    get size() {
        return this._cache.size;
    }
};
