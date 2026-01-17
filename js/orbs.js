function loadOrbs() {
    const value = Storage.getNumber(Storage.KEYS.ORBS, 0);
    GameState.totalOrbs = value >= 0 ? value : 0;
    if (menuOrbsValue) menuOrbsValue.textContent = GameState.totalOrbs;
}

function saveOrbs() {
    Storage.set(Storage.KEYS.ORBS, GameState.totalOrbs);
}

function spendOrbs(amount) {
    const safeAmount = Number.isFinite(amount) ? amount : 0;
    if (safeAmount <= 0 || GameState.totalOrbs < safeAmount) return false;
    GameState.totalOrbs -= safeAmount;
    saveOrbs();
    if (menuOrbsValue) menuOrbsValue.textContent = GameState.totalOrbs;
    if (typeof refreshStoreUI === 'function') refreshStoreUI();
    return true;
}

function addOrbs(amount = 1) {
    const safeAmount = Number.isFinite(amount) ? amount : 0;
    if (safeAmount <= 0) return;
    GameState.totalOrbs += safeAmount;
    saveOrbs();
    if (menuOrbsValue) menuOrbsValue.textContent = GameState.totalOrbs;
    if (typeof refreshStoreUI === 'function') refreshStoreUI();
}

function resetOrbs() {
    GameState.totalOrbs = 0;
    saveOrbs();
    if (menuOrbsValue) menuOrbsValue.textContent = GameState.totalOrbs;
    if (typeof refreshStoreUI === 'function') refreshStoreUI();
}
