// ========================================
// SKIN MANAGER - State Management and Purchase Logic
// ========================================

// ========================================
// State Loading/Saving (Generic)
// ========================================

/**
 * Load state for a specific skin from storage
 * @param {string} skinId - Skin ID (kebab-case)
 */
function loadSkinState(skinId) {
    const ownedKey = getOwnedKey(skinId);
    const equippedKey = getEquippedKey(skinId);
    const storageOwnedKey = getStorageOwnedKey(skinId);
    const storageEquippedKey = getStorageEquippedKey(skinId);

    GameState[ownedKey] = Storage.getBoolean(Storage.KEYS[storageOwnedKey], false);
    GameState[equippedKey] = Storage.getBoolean(Storage.KEYS[storageEquippedKey], false);

    if (!GameState[ownedKey]) {
        GameState[equippedKey] = false;
    }
}

/**
 * Save state for a specific skin to storage
 * @param {string} skinId - Skin ID (kebab-case)
 */
function saveSkinState(skinId) {
    const ownedKey = getOwnedKey(skinId);
    const equippedKey = getEquippedKey(skinId);
    const storageOwnedKey = getStorageOwnedKey(skinId);
    const storageEquippedKey = getStorageEquippedKey(skinId);

    Storage.set(Storage.KEYS[storageOwnedKey], GameState[ownedKey]);
    Storage.set(Storage.KEYS[storageEquippedKey], GameState[equippedKey]);
}

/**
 * Load all skin states from storage
 */
function loadAllSkinStates() {
    getAllSkins().forEach(skin => {
        loadSkinState(skin.id);
    });
    normalizeEquippedSkins();
}

// Legacy compatibility functions
function loadDiscoBallState() {
    loadSkinState('disco-ball');
}

function saveDiscoBallState() {
    saveSkinState('disco-ball');
}

function loadFireBallState() {
    loadSkinState('fire-ball');
}

function saveFireBallState() {
    saveSkinState('fire-ball');
}

/**
 * Ensure only one skin is equipped at a time
 */
function normalizeEquippedSkins() {
    const preferred = Storage.get(Storage.KEYS.EQUIPPED_SKIN);
    let equippedCount = 0;
    let lastEquipped = null;

    // Count how many skins are equipped
    getAllSkins().forEach(skin => {
        const equippedKey = getEquippedKey(skin.id);
        if (GameState[equippedKey]) {
            equippedCount++;
            lastEquipped = skin.id;
        }
    });

    // If multiple skins are equipped, keep only the preferred one
    if (equippedCount > 1) {
        getAllSkins().forEach(skin => {
            const equippedKey = getEquippedKey(skin.id);
            if (preferred === skin.id) {
                GameState[equippedKey] = true;
            } else {
                GameState[equippedKey] = false;
            }
        });
    }

    // Update equipped skin in storage
    const equipped = getAllSkins().find(skin => GameState[getEquippedKey(skin.id)]);
    Storage.set(Storage.KEYS.EQUIPPED_SKIN, equipped ? equipped.id : 'none');

    applySkins();
    refreshStoreUI();
}

// ========================================
// Skin Application
// ========================================

/**
 * Apply all skins based on current equipped state
 */
function applySkins() {
    getAllSkins().forEach(skin => {
        const applyFn = getApplyFunctionName(skin.id);
        if (typeof window[applyFn] === 'function') {
            window[applyFn]();
        }
    });
}

// ========================================
// Purchase Functions (Generic)
// ========================================

/**
 * Purchase a skin by ID
 * @param {string} skinId - Skin ID (kebab-case)
 */
function purchaseSkin(skinId) {
    const skin = getSkin(skinId);
    if (!skin) return;

    const ownedKey = getOwnedKey(skinId);
    const equippedKey = getEquippedKey(skinId);

    if (GameState[ownedKey]) return;
    if (GameState.totalOrbs < skin.price) return;
    if (!spendOrbs(skin.price)) return;

    // Set owned and equipped
    GameState[ownedKey] = true;
    GameState[equippedKey] = true;

    // Unequip all other skins
    getAllSkins().forEach(s => {
        if (s.id !== skinId) {
            const key = getEquippedKey(s.id);
            GameState[key] = false;
            saveSkinState(s.id);
        }
    });

    saveSkinState(skinId);
    Storage.set(Storage.KEYS.EQUIPPED_SKIN, skinId);
    applySkins();
    refreshStoreUI();
}

// Legacy compatibility functions
function purchaseDiscoBall() {
    purchaseSkin('disco-ball');
}

function purchaseFireBall() {
    purchaseSkin('fire-ball');
}

// ========================================
// Toggle Equip Functions (Generic)
// ========================================

/**
 * Toggle equipped state for a skin
 * @param {string} skinId - Skin ID (kebab-case)
 */
function toggleSkinEquip(skinId) {
    const ownedKey = getOwnedKey(skinId);
    const equippedKey = getEquippedKey(skinId);

    if (!GameState[ownedKey]) return;

    const willEquip = !GameState[equippedKey];
    GameState[equippedKey] = willEquip;

    // Unequip all other skins
    getAllSkins().forEach(s => {
        if (s.id !== skinId) {
            const key = getEquippedKey(s.id);
            GameState[key] = false;
            saveSkinState(s.id);
        }
    });

    saveSkinState(skinId);
    Storage.set(Storage.KEYS.EQUIPPED_SKIN, willEquip ? skinId : 'none');
    applySkins();
    refreshStoreUI();
}

// Legacy compatibility functions
function toggleDiscoBallEquip() {
    toggleSkinEquip('disco-ball');
}

function toggleFireBallEquip() {
    toggleSkinEquip('fire-ball');
}
