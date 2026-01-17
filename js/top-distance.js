const TOP_DISTANCE_STORAGE_KEY = 'beat-runner-top-distance';

function loadTopDistance() {
    const raw = localStorage.getItem(TOP_DISTANCE_STORAGE_KEY);
    const value = Number(raw);
    GameState.topDistance = Number.isFinite(value) && value >= 0 ? Math.floor(value) : 0;
    if (menuTopDistanceValue) menuTopDistanceValue.textContent = GameState.topDistance;
    if (finalTopDistance) finalTopDistance.textContent = GameState.topDistance;
}

function saveTopDistance() {
    localStorage.setItem(TOP_DISTANCE_STORAGE_KEY, String(GameState.topDistance));
}

function updateTopDistance(currentDistance) {
    const distance = Math.floor(currentDistance);
    if (distance > GameState.topDistance) {
        GameState.topDistance = distance;
        saveTopDistance();
        if (menuTopDistanceValue) menuTopDistanceValue.textContent = GameState.topDistance;
        if (finalTopDistance) finalTopDistance.textContent = GameState.topDistance;
    }
}

function resetTopDistance() {
    GameState.topDistance = 0;
    saveTopDistance();
    if (menuTopDistanceValue) menuTopDistanceValue.textContent = GameState.topDistance;
    if (finalTopDistance) finalTopDistance.textContent = GameState.topDistance;
}
