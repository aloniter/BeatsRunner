// ========================================
// SETTINGS SCREEN - Volume & Controls
// Extends the existing dev-tools panel with audio settings
// ========================================
const SettingsManager = {
    initialized: false,

    init() {
        if (this.initialized) return;
        this.initialized = true;

        // Add volume controls to existing dev-tools panel
        const devTools = document.getElementById('dev-tools');
        if (!devTools) return;

        // Create Music Volume row
        const musicRow = document.createElement('div');
        musicRow.className = 'dev-tools-row';
        musicRow.innerHTML = `
            <div class="dev-tools-label">Music Volume</div>
            <div class="dev-tools-actions">
                <input type="range" class="settings-slider" id="music-volume-slider"
                       min="0" max="100" value="${Math.round((typeof AudioState !== 'undefined' ? AudioState.musicVolume : 0.4) * 100)}">
                <span class="settings-slider-value" id="music-volume-value">${Math.round((typeof AudioState !== 'undefined' ? AudioState.musicVolume : 0.4) * 100)}%</span>
            </div>
        `;

        // Create SFX Volume row
        const sfxRow = document.createElement('div');
        sfxRow.className = 'dev-tools-row';
        sfxRow.innerHTML = `
            <div class="dev-tools-label">SFX Volume</div>
            <div class="dev-tools-actions">
                <input type="range" class="settings-slider" id="sfx-volume-slider"
                       min="0" max="100" value="${Math.round((typeof AudioState !== 'undefined' ? AudioState.sfxVolume : 0.25) * 100)}">
                <span class="settings-slider-value" id="sfx-volume-value">${Math.round((typeof AudioState !== 'undefined' ? AudioState.sfxVolume : 0.25) * 100)}%</span>
            </div>
        `;

        // Create Haptics toggle row
        const hapticsRow = document.createElement('div');
        hapticsRow.className = 'dev-tools-row';
        hapticsRow.innerHTML = `
            <div class="dev-tools-label">Haptics</div>
            <div class="dev-tools-actions">
                <label class="dev-tools-toggle">
                    <input type="checkbox" id="haptics-toggle" checked>
                    On
                </label>
            </div>
        `;

        // Insert after the quality row (first dev-tools-row)
        const qualityRow = devTools.querySelector('.dev-tools-row');
        if (qualityRow && qualityRow.nextSibling) {
            qualityRow.after(musicRow, sfxRow, hapticsRow);
        } else {
            devTools.appendChild(musicRow);
            devTools.appendChild(sfxRow);
            devTools.appendChild(hapticsRow);
        }

        // Wire up event listeners
        const musicSlider = document.getElementById('music-volume-slider');
        const sfxSlider = document.getElementById('sfx-volume-slider');
        const musicValueEl = document.getElementById('music-volume-value');
        const sfxValueEl = document.getElementById('sfx-volume-value');
        const hapticsToggle = document.getElementById('haptics-toggle');

        if (musicSlider) {
            musicSlider.addEventListener('input', (e) => {
                const vol = parseInt(e.target.value) / 100;
                if (typeof setMusicVolume === 'function') setMusicVolume(vol);
                if (musicValueEl) musicValueEl.textContent = e.target.value + '%';
            });
        }

        if (sfxSlider) {
            sfxSlider.addEventListener('input', (e) => {
                const vol = parseInt(e.target.value) / 100;
                if (typeof setSfxVolume === 'function') setSfxVolume(vol);
                if (sfxValueEl) sfxValueEl.textContent = e.target.value + '%';
            });
        }

        if (hapticsToggle) {
            // Load saved preference
            const savedHaptics = Storage.get('beat-runner-haptics');
            if (savedHaptics === 'off') {
                hapticsToggle.checked = false;
                if (typeof hapticFeedback !== 'undefined') hapticFeedback.setEnabled(false);
            }

            hapticsToggle.addEventListener('change', (e) => {
                const enabled = e.target.checked;
                if (typeof hapticFeedback !== 'undefined') hapticFeedback.setEnabled(enabled);
                Storage.set('beat-runner-haptics', enabled ? 'on' : 'off');
            });
        }

        // Restore saved music volume to bgMusic element
        if (typeof bgMusic !== 'undefined' && bgMusic && typeof AudioState !== 'undefined') {
            bgMusic.volume = AudioState.musicVolume;
        }
    }
};

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => SettingsManager.init());
} else {
    // Small delay to ensure dev-tools panel is rendered
    setTimeout(() => SettingsManager.init(), 100);
}
