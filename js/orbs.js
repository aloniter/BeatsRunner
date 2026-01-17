// Keep old storage key for backwards compatibility with existing saves
const ORBS_STORAGE_KEY = 'beat-runner-coins';

function loadOrbs() {
    const raw = localStorage.getItem(ORBS_STORAGE_KEY);
    const value = Number(raw);
    GameState.totalOrbs = Number.isFinite(value) && value >= 0 ? value : 0;
    if (menuOrbsValue) menuOrbsValue.textContent = GameState.totalOrbs;
}

function saveOrbs() {
    localStorage.setItem(ORBS_STORAGE_KEY, String(GameState.totalOrbs));
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
