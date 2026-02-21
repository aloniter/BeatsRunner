// ========================================
// TIMING FEEDBACK - Floating text & Combo HUD
// ========================================

/**
 * Show floating timing feedback text above the play area
 * @param {THREE.Vector3} position - (unused for 2D overlay, kept for compatibility)
 * @param {string} rating - PERFECT, GOOD, OK, or MISS
 * @param {number} points - Points earned
 * @param {string} color - CSS color for the text
 */
function showTimingFeedback(position, rating, points, color) {
    const el = document.getElementById('timing-feedback');
    if (!el) return;

    // Set content and color
    el.textContent = `+${points} ${rating}!`;
    el.style.color = color;
    el.style.textShadow = `0 0 12px ${color}, 0 0 24px ${color}`;

    // Restart animation
    el.classList.remove('show');
    // Force reflow to restart animation
    void el.offsetWidth;
    el.classList.add('show');

    // Remove class after animation
    clearTimeout(el._feedbackTimeout);
    el._feedbackTimeout = setTimeout(() => {
        el.classList.remove('show');
    }, 700);
}

/**
 * Update the combo display HUD element
 * Call this from the game loop or after each collection
 */
function updateComboDisplay() {
    const comboEl = document.getElementById('combo-display');
    const countEl = document.getElementById('combo-count');
    const multEl = document.getElementById('combo-multiplier');

    if (!comboEl || !countEl || !multEl) return;

    if (GameState.combo >= 2) {
        comboEl.classList.add('active');
        countEl.textContent = `${GameState.combo}x`;
        multEl.textContent = GameState.multiplier > 1 ? `${GameState.multiplier.toFixed(1)}x bonus` : '';

        // Pop animation
        countEl.classList.add('pop');
        setTimeout(() => countEl.classList.remove('pop'), 150);
    } else {
        comboEl.classList.remove('active');
    }
}

/**
 * Reset combo display (call on game over or restart)
 */
function resetComboDisplay() {
    const comboEl = document.getElementById('combo-display');
    if (comboEl) comboEl.classList.remove('active');
}
