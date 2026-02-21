// ========================================
// BOOSTER HUD — Pickup Announcements + Active Status Badges
// ========================================
/**
 * BoosterHUD manages two layers of booster feedback:
 *
 *  1. **Floating announcement** — a large, animated text that bursts onto the screen
 *     for ~1.2 s the moment a booster is collected.
 *
 *  2. **Persistent badges** — small glowing pills in the bottom-left corner that stay
 *     on screen for as long as the booster effect is active, with a live countdown
 *     for timed boosters (magnet, speed) and a "∞" symbol for the shield (until broken).
 *     Badges blink/pulse when ≤ 3 s remain.
 *
 * Public API:
 *   BoosterHUD.init()                    — wire up DOM references (call after DOM ready)
 *   BoosterHUD.announce(type)            — trigger floating pickup text
 *   BoosterHUD.activateBadge(type, dur)  — show a persistent badge; dur=null for infinite
 *   BoosterHUD.removeBadge(type)         — fade out + remove a badge
 *   BoosterHUD.update()                  — call every frame to tick countdown timers
 *   BoosterHUD.reset()                   — clear everything (restart / main menu)
 */
const BoosterHUD = {
    _announcementEl: null,
    _statusEl: null,
    _announcementTimeout: null,
    /** @type {{ [type: string]: { el: HTMLElement, endTime: number|null } }} */
    _badges: {},

    // ---- Per-type visual config ----------------------------------------
    _config: {
        shield: { icon: '🛡️', label: 'Shield',      color: '#66ccff', glowColor: 'rgba(102,204,255,0.7)' },
        magnet: { icon: '🧲', label: 'Magnet',      color: '#ff9900', glowColor: 'rgba(255,153,0,0.7)'   },
        speed:  { icon: '⚡', label: 'Speed Boost', color: '#ffdd55', glowColor: 'rgba(255,221,85,0.7)'  }
    },

    // --------------------------------------------------------------------
    /**
     * Cache DOM element references. Must be called once after the DOM is ready.
     * Safe to call multiple times (idempotent).
     */
    init() {
        this._announcementEl = document.getElementById('booster-announcement');
        this._statusEl       = document.getElementById('booster-status');
    },

    // --------------------------------------------------------------------
    /**
     * Show a large, animated pickup announcement in the centre of the screen.
     * Automatically dismisses after ~1.2 s.
     * @param {'shield'|'magnet'|'speed'} type
     */
    announce(type) {
        if (!this._announcementEl) return;
        const cfg = this._config[type];
        if (!cfg) return;

        const el = this._announcementEl;
        el.textContent = `${cfg.icon}  ${cfg.label.toUpperCase()}!`;
        el.style.color      = cfg.color;
        el.style.fontSize   = '30px';
        el.style.textShadow = `0 0 18px ${cfg.color}, 0 0 36px ${cfg.color}, 0 0 60px ${cfg.glowColor}`;

        // Restart animation via reflow trick (same as timing-feedback.js)
        el.classList.remove('show');
        void el.offsetWidth;
        el.classList.add('show');

        clearTimeout(this._announcementTimeout);
        this._announcementTimeout = setTimeout(() => {
            el.classList.remove('show');
        }, 1200);
    },

    // --------------------------------------------------------------------
    /**
     * Create and display a persistent HUD badge for an active booster.
     * If a badge of the same type already exists (re-activation), it is replaced.
     * @param {'shield'|'magnet'|'speed'} type
     * @param {number|null} duration - Seconds until expiry. Pass null for infinite (shield).
     */
    activateBadge(type, duration) {
        if (!this._statusEl) return;
        // Replace if already shown (e.g. magnet re-collected mid-effect)
        this.removeBadge(type);

        const cfg = this._config[type];
        if (!cfg) return;

        const timerText = duration != null ? Math.ceil(duration) + 's' : '∞';

        const badge = document.createElement('div');
        badge.className = `booster-badge ${type}`;
        badge.innerHTML =
            `<span class="badge-icon">${cfg.icon}</span>` +
            `<span class="badge-label">${cfg.label}</span>` +
            `<span class="badge-timer" id="badge-timer-${type}">${timerText}</span>`;

        this._statusEl.appendChild(badge);

        const endTime = duration != null ? (performance.now() / 1000 + duration) : null;
        this._badges[type] = { el: badge, endTime };
    },

    // --------------------------------------------------------------------
    /**
     * Fade out and remove a booster badge from the HUD.
     * Safe to call when the badge does not exist (no-op).
     * @param {'shield'|'magnet'|'speed'} type
     */
    removeBadge(type) {
        const entry = this._badges[type];
        if (!entry) return;

        entry.el.style.opacity = '0';
        const el = entry.el; // capture before delete
        setTimeout(() => {
            if (el.parentNode) el.parentNode.removeChild(el);
        }, 420); // matches CSS transition: opacity 0.4s

        delete this._badges[type];
    },

    // --------------------------------------------------------------------
    /**
     * Tick countdown timers for all active timed badges, add the 'expiring'
     * blink class when ≤ 3 s remain, and remove badges that have reached 0.
     * Call once per frame from the main game loop while playing.
     */
    update() {
        const now = performance.now() / 1000;
        for (const type in this._badges) {
            const entry = this._badges[type];
            if (entry.endTime == null) continue; // infinite (shield)

            const remaining = entry.endTime - now;

            // Update timer label
            const timerEl = entry.el.querySelector(`#badge-timer-${type}`);
            if (timerEl) {
                timerEl.textContent = remaining > 0 ? Math.ceil(remaining) + 's' : '0s';
            }

            // Blink when almost out
            if (remaining <= 3 && !entry.el.classList.contains('expiring')) {
                entry.el.classList.add('expiring');
            }

            // Remove when expired
            if (remaining <= 0) {
                this.removeBadge(type);
            }
        }
    },

    // --------------------------------------------------------------------
    /**
     * Remove all active badges and cancel any pending announcement.
     * Call on game restart and when returning to the main menu.
     */
    reset() {
        // Remove all badge elements immediately (no fade — screen is clearing anyway)
        for (const type in this._badges) {
            const entry = this._badges[type];
            if (entry.el.parentNode) entry.el.parentNode.removeChild(entry.el);
        }
        this._badges = {};

        // Cancel floating announcement
        if (this._announcementEl) this._announcementEl.classList.remove('show');
        clearTimeout(this._announcementTimeout);
    }
};

// Self-initialize once the DOM is ready (matches GameplayHUD / TutorialOverlay pattern)
if (typeof window !== 'undefined') {
    window.addEventListener('load', () => {
        BoosterHUD.init();
    });
}
