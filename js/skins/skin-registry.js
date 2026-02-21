// ========================================
// SKIN REGISTRY - Central Registry for All Skins
// ========================================

const SKIN_REGISTRY = {
    'disco-ball': {
        id: 'disco-ball',
        name: 'Disco Ball',
        price: 50,
        description: 'Light up the rhythm. Pure party energy.',
        category: 'skins',
        order: 1
    },
    'fire-ball': {
        id: 'fire-ball',
        name: 'Fire Ball',
        price: 75,
        description: 'Feel the heat. A ball of pure rhythmic power.',
        category: 'skins',
        order: 2
    },
    'rainbow-orb': {
        id: 'rainbow-orb',
        name: 'Rainbow Orb',
        price: 200,
        description: 'Leave the trails of a rainbow wherever you roll',
        category: 'skins',
        order: 3
    },
    'falafel-ball': {
        id: 'falafel-ball',
        name: 'Falafel Ball',
        price: 75,
        description: 'Crispy, golden, and surprisingly rhythmic. Fresh from the fryer.',
        category: 'skins',
        order: 4
    }
};

// ========================================
// Helper Functions
// ========================================

/**
 * Get a single skin by ID
 * @param {string} id - Skin ID (kebab-case)
 * @returns {object|null} Skin object or null if not found
 */
function getSkin(id) {
    return SKIN_REGISTRY[id] || null;
}

/**
 * Get all skins as an array
 * @returns {Array} Array of all skin objects
 */
function getAllSkins() {
    return Object.values(SKIN_REGISTRY);
}

/**
 * Get all skins in a specific category
 * @param {string} category - Category name
 * @returns {Array} Array of skins in the category
 */
function getSkinsByCategory(category) {
    return getAllSkins().filter(s => s.category === category);
}

/**
 * Convert kebab-case to camelCase
 * @param {string} str - Kebab-case string (e.g., "disco-ball")
 * @returns {string} CamelCase string (e.g., "discoBall")
 */
function toCamelCase(str) {
    return str.replace(/-([a-z])/g, (match, letter) => letter.toUpperCase());
}

/**
 * Convert kebab-case to PascalCase
 * @param {string} str - Kebab-case string (e.g., "disco-ball")
 * @returns {string} PascalCase string (e.g., "DiscoBall")
 */
function toPascalCase(str) {
    const camel = toCamelCase(str);
    return camel.charAt(0).toUpperCase() + camel.slice(1);
}

/**
 * Convert kebab-case to UPPER_SNAKE_CASE
 * @param {string} str - Kebab-case string (e.g., "disco-ball")
 * @returns {string} Upper snake case string (e.g., "DISCO_BALL")
 */
function toUpperSnakeCase(str) {
    return str.replace(/-/g, '_').toUpperCase();
}

/**
 * Get the GameState property name for ownership
 * @param {string} skinId - Skin ID (kebab-case)
 * @returns {string} GameState property name (e.g., "discoBallOwned")
 */
function getOwnedKey(skinId) {
    return toCamelCase(skinId) + 'Owned';
}

/**
 * Get the GameState property name for equipped status
 * @param {string} skinId - Skin ID (kebab-case)
 * @returns {string} GameState property name (e.g., "discoBallEquipped")
 */
function getEquippedKey(skinId) {
    return toCamelCase(skinId) + 'Equipped';
}

/**
 * Get the Storage.KEYS property name for ownership
 * @param {string} skinId - Skin ID (kebab-case)
 * @returns {string} Storage key name (e.g., "DISCO_BALL_OWNED")
 */
function getStorageOwnedKey(skinId) {
    return toUpperSnakeCase(skinId) + '_OWNED';
}

/**
 * Get the Storage.KEYS property name for equipped status
 * @param {string} skinId - Skin ID (kebab-case)
 * @returns {string} Storage key name (e.g., "DISCO_BALL_EQUIPPED")
 */
function getStorageEquippedKey(skinId) {
    return toUpperSnakeCase(skinId) + '_EQUIPPED';
}

/**
 * Get the function name for creating a skin
 * @param {string} skinId - Skin ID (kebab-case)
 * @returns {string} Function name (e.g., "createDiscoBallSkin")
 */
function getCreateFunctionName(skinId) {
    return 'create' + toPascalCase(skinId) + 'Skin';
}

/**
 * Get the function name for applying a skin
 * @param {string} skinId - Skin ID (kebab-case)
 * @returns {string} Function name (e.g., "applyDiscoBallSkin")
 */
function getApplyFunctionName(skinId) {
    return 'apply' + toPascalCase(skinId) + 'Skin';
}

/**
 * Get the function name for setting up a preview
 * @param {string} skinId - Skin ID (kebab-case)
 * @returns {string} Function name (e.g., "setupDiscoPreview")
 */
function getPreviewFunctionName(skinId) {
    const parts = skinId.split('-');
    const firstName = toPascalCase(parts[0]);
    return 'setup' + firstName + 'Preview';
}
