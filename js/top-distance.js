function loadTopDistance() {
    const value = Storage.getNumber(Storage.KEYS.TOP_DISTANCE, 0);
    GameState.topDistance = value >= 0 ? Math.floor(value) : 0;
    if (menuTopDistanceValue) menuTopDistanceValue.textContent = GameState.topDistance;
    if (finalTopDistance) finalTopDistance.textContent = GameState.topDistance;
}

function saveTopDistance() {
    Storage.set(Storage.KEYS.TOP_DISTANCE, GameState.topDistance);
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
