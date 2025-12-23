const COINS_STORAGE_KEY = 'beat-runner-coins';

function loadCoins() {
    const raw = localStorage.getItem(COINS_STORAGE_KEY);
    const value = Number(raw);
    GameState.coins = Number.isFinite(value) && value >= 0 ? value : 0;
    if (menuCoinsValue) menuCoinsValue.textContent = GameState.coins;
}

function saveCoins() {
    localStorage.setItem(COINS_STORAGE_KEY, String(GameState.coins));
}

function spendCoins(amount) {
    const safeAmount = Number.isFinite(amount) ? amount : 0;
    if (safeAmount <= 0 || GameState.coins < safeAmount) return false;
    GameState.coins -= safeAmount;
    saveCoins();
    if (menuCoinsValue) menuCoinsValue.textContent = GameState.coins;
    if (typeof refreshStoreUI === 'function') refreshStoreUI();
    return true;
}

function addCoin(amount = 1) {
    const safeAmount = Number.isFinite(amount) ? amount : 0;
    if (safeAmount <= 0) return;
    GameState.coins += safeAmount;
    saveCoins();
    if (menuCoinsValue) menuCoinsValue.textContent = GameState.coins;
    if (typeof refreshStoreUI === 'function') refreshStoreUI();
}

function resetCoins() {
    GameState.coins = 0;
    saveCoins();
    if (menuCoinsValue) menuCoinsValue.textContent = GameState.coins;
    if (typeof refreshStoreUI === 'function') refreshStoreUI();
}
