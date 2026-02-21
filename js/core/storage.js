// ========================================
// STORAGE - Centralized localStorage Abstraction
// ========================================

const Storage = {
    // ========================================
    // Key Constants
    // ========================================
    KEYS: {
        ORBS: 'beat-runner-coins',  // Legacy name for backwards compatibility
        TOP_DISTANCE: 'beat-runner-top-distance',
        QUALITY: 'beat-runner-quality',
        STAGE_PROGRESS: 'beat-runner-stage-mode-progress',
        DISCO_OWNED: 'beat-runner-disco-owned',
        DISCO_EQUIPPED: 'beat-runner-disco-equipped',
        FIREBALL_OWNED: 'beat-runner-fireball-owned',
        FIREBALL_EQUIPPED: 'beat-runner-fireball-equipped',
        RAINBOW_ORB_OWNED: 'beat-runner-rainbow-orb-owned',
        RAINBOW_ORB_EQUIPPED: 'beat-runner-rainbow-orb-equipped',
        FALAFEL_BALL_OWNED: 'beat-runner-falafel-ball-owned',
        FALAFEL_BALL_EQUIPPED: 'beat-runner-falafel-ball-equipped',
        POKEBALL_OWNED: 'beat-runner-pokeball-owned',
        POKEBALL_EQUIPPED: 'beat-runner-pokeball-equipped',
        EYE_BALL_OWNED: 'beat-runner-eye-ball-owned',
        EYE_BALL_EQUIPPED: 'beat-runner-eye-ball-equipped',
        SOCCER_BALL_OWNED: 'beat-runner-soccer-ball-owned',
        SOCCER_BALL_EQUIPPED: 'beat-runner-soccer-ball-equipped',
        BASKETBALL_OWNED: 'beat-runner-basketball-owned',
        BASKETBALL_EQUIPPED: 'beat-runner-basketball-equipped',
        FURRY_BALL_OWNED: 'beat-runner-furry-ball-owned',
        FURRY_BALL_EQUIPPED: 'beat-runner-furry-ball-equipped',
        EQUIPPED_SKIN: 'beat-runner-equipped-skin'
    },

    // ========================================
    // Core Methods
    // ========================================

    /**
     * Get a string value from localStorage
     * @param {string} key - Storage key
     * @returns {string|null} Value or null if not found
     */
    get(key) {
        try {
            return localStorage.getItem(key);
        } catch (error) {
            console.error('Storage.get error:', error);
            return null;
        }
    },

    /**
     * Set a string value in localStorage
     * @param {string} key - Storage key
     * @param {string} value - Value to store
     * @returns {boolean} True if successful
     */
    set(key, value) {
        try {
            localStorage.setItem(key, String(value));
            return true;
        } catch (error) {
            console.error('Storage.set error:', error);
            return false;
        }
    },

    /**
     * Get a number value from localStorage
     * @param {string} key - Storage key
     * @param {number} defaultValue - Default if not found or invalid
     * @returns {number} Parsed number or default
     */
    getNumber(key, defaultValue = 0) {
        const raw = this.get(key);
        if (raw === null) return defaultValue;
        const value = Number(raw);
        return Number.isFinite(value) ? value : defaultValue;
    },

    /**
     * Get a boolean value from localStorage
     * @param {string} key - Storage key
     * @param {boolean} defaultValue - Default if not found
     * @returns {boolean} Parsed boolean or default
     */
    getBoolean(key, defaultValue = false) {
        const raw = this.get(key);
        if (raw === null) return defaultValue;
        return raw === 'true';
    },

    /**
     * Get and parse JSON from localStorage
     * @param {string} key - Storage key
     * @param {*} defaultValue - Default if not found or parse fails
     * @returns {*} Parsed JSON or default
     */
    getJSON(key, defaultValue = null) {
        try {
            const raw = this.get(key);
            if (raw === null) return defaultValue;
            return JSON.parse(raw);
        } catch (error) {
            console.error('Storage.getJSON parse error:', error);
            return defaultValue;
        }
    },

    /**
     * Stringify and store JSON in localStorage
     * @param {string} key - Storage key
     * @param {*} value - Value to stringify and store
     * @returns {boolean} True if successful
     */
    setJSON(key, value) {
        try {
            return this.set(key, JSON.stringify(value));
        } catch (error) {
            console.error('Storage.setJSON stringify error:', error);
            return false;
        }
    },

    /**
     * Remove a key from localStorage
     * @param {string} key - Storage key
     * @returns {boolean} True if successful
     */
    remove(key) {
        try {
            localStorage.removeItem(key);
            return true;
        } catch (error) {
            console.error('Storage.remove error:', error);
            return false;
        }
    },

    /**
     * Check if a key exists in localStorage
     * @param {string} key - Storage key
     * @returns {boolean} True if key exists
     */
    has(key) {
        return this.get(key) !== null;
    },

    /**
     * Clear all beat-runner related keys (not entire localStorage)
     * @returns {boolean} True if successful
     */
    clearAll() {
        try {
            Object.values(this.KEYS).forEach(key => {
                localStorage.removeItem(key);
            });
            return true;
        } catch (error) {
            console.error('Storage.clearAll error:', error);
            return false;
        }
    }
};
