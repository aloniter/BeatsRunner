// ========================================
// SKIN MANAGER - State Management and Purchase Logic
// ========================================

// Price constants
const DISCO_PRICE = 50;
const FIREBALL_PRICE = 75;

// ========================================
// State Loading/Saving
// ========================================

function loadDiscoBallState() {
    GameState.discoBallOwned = Storage.getBoolean(Storage.KEYS.DISCO_OWNED, false);
    GameState.discoBallEquipped = Storage.getBoolean(Storage.KEYS.DISCO_EQUIPPED, false);
    if (!GameState.discoBallOwned) {
        GameState.discoBallEquipped = false;
    }
    normalizeEquippedSkins();
}

function saveDiscoBallState() {
    Storage.set(Storage.KEYS.DISCO_OWNED, GameState.discoBallOwned);
    Storage.set(Storage.KEYS.DISCO_EQUIPPED, GameState.discoBallEquipped);
}

function loadFireBallState() {
    GameState.fireBallOwned = Storage.getBoolean(Storage.KEYS.FIREBALL_OWNED, false);
    GameState.fireBallEquipped = Storage.getBoolean(Storage.KEYS.FIREBALL_EQUIPPED, false);
    if (!GameState.fireBallOwned) {
        GameState.fireBallEquipped = false;
    }
    normalizeEquippedSkins();
}

function saveFireBallState() {
    Storage.set(Storage.KEYS.FIREBALL_OWNED, GameState.fireBallOwned);
    Storage.set(Storage.KEYS.FIREBALL_EQUIPPED, GameState.fireBallEquipped);
}

function normalizeEquippedSkins() {
    const preferred = Storage.get(Storage.KEYS.EQUIPPED_SKIN);
    if (GameState.discoBallEquipped && GameState.fireBallEquipped) {
        if (preferred === 'fire') {
            GameState.discoBallEquipped = false;
            saveDiscoBallState();
        } else {
            GameState.fireBallEquipped = false;
            saveFireBallState();
        }
    }

    if (GameState.discoBallEquipped) {
        Storage.set(Storage.KEYS.EQUIPPED_SKIN, 'disco');
    } else if (GameState.fireBallEquipped) {
        Storage.set(Storage.KEYS.EQUIPPED_SKIN, 'fire');
    } else {
        Storage.set(Storage.KEYS.EQUIPPED_SKIN, 'none');
    }

    applySkins();
    refreshStoreUI();
}

// ========================================
// Skin Application
// ========================================

function applySkins() {
    applyDiscoBallSkin();
    applyFireBallSkin();
}

// ========================================
// Purchase Functions
// ========================================

function purchaseDiscoBall() {
    if (GameState.discoBallOwned) return;
    if (GameState.totalOrbs < DISCO_PRICE) return;
    if (!spendOrbs(DISCO_PRICE)) return;
    GameState.discoBallOwned = true;
    GameState.discoBallEquipped = true;
    GameState.fireBallEquipped = false;
    saveDiscoBallState();
    saveFireBallState();
    Storage.set(Storage.KEYS.EQUIPPED_SKIN, 'disco');
    applyDiscoBallSkin();
    refreshStoreUI();
}

function purchaseFireBall() {
    if (GameState.fireBallOwned) return;
    if (GameState.totalOrbs < FIREBALL_PRICE) return;
    if (!spendOrbs(FIREBALL_PRICE)) return;
    GameState.fireBallOwned = true;
    GameState.fireBallEquipped = true;
    GameState.discoBallEquipped = false;
    saveFireBallState();
    saveDiscoBallState();
    Storage.set(Storage.KEYS.EQUIPPED_SKIN, 'fire');
    applySkins();
    refreshStoreUI();
}

// ========================================
// Toggle Equip Functions
// ========================================

function toggleDiscoBallEquip() {
    if (!GameState.discoBallOwned) return;
    const willEquip = !GameState.discoBallEquipped;
    GameState.discoBallEquipped = willEquip;
    GameState.fireBallEquipped = false;
    saveDiscoBallState();
    saveFireBallState();
    Storage.set(Storage.KEYS.EQUIPPED_SKIN, willEquip ? 'disco' : 'none');
    applySkins();
    refreshStoreUI();
}

function toggleFireBallEquip() {
    if (!GameState.fireBallOwned) return;
    const willEquip = !GameState.fireBallEquipped;
    GameState.fireBallEquipped = willEquip;
    GameState.discoBallEquipped = false;
    saveFireBallState();
    saveDiscoBallState();
    Storage.set(Storage.KEYS.EQUIPPED_SKIN, willEquip ? 'fire' : 'none');
    applySkins();
    refreshStoreUI();
}
