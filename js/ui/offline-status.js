// ========================================
// OFFLINE STATUS - Dev Tools readout for PWA / airplane-mode readiness
// ========================================
const OfflineStatus = {
    _busy: false,

    /** Ask the active service worker a question and wait for its reply. */
    _ask(type, timeoutMs) {
        return new Promise((resolve) => {
            const sw = navigator.serviceWorker && navigator.serviceWorker.controller;
            if (!sw) return resolve(null);
            const channel = new MessageChannel();
            const timer = setTimeout(() => resolve(null), timeoutMs);
            channel.port1.onmessage = (e) => { clearTimeout(timer); resolve(e.data); };
            sw.postMessage({ type }, [channel.port2]);
        });
    },

    _render(checks, summary, ready) {
        const list = document.getElementById('offline-list');
        const summaryEl = document.getElementById('offline-summary');
        if (!list || !summaryEl) return;
        list.innerHTML = '';
        checks.forEach(({ ok, label, detail }) => {
            const li = document.createElement('li');
            li.className = ok ? 'is-ok' : 'is-bad';
            li.textContent = (ok ? '✓ ' : '✗ ') + label + (detail ? ' — ' + detail : '');
            list.appendChild(li);
        });
        summaryEl.textContent = summary;
        summaryEl.className = 'offline-status-summary ' + (ready ? 'is-ok' : 'is-bad');
    },

    async refresh(recache) {
        if (this._busy) return;
        this._busy = true;
        const summaryEl = document.getElementById('offline-summary');
        if (summaryEl) summaryEl.textContent = recache ? 'Downloading…' : 'Checking…';

        const checks = [];
        const supported = 'serviceWorker' in navigator && 'caches' in window;
        checks.push({ ok: supported, label: 'Service worker supported' });

        let registered = false;
        let controlled = false;
        let status = null;
        if (supported) {
            const reg = await navigator.serviceWorker.getRegistration();
            registered = !!(reg && reg.active);
            controlled = !!navigator.serviceWorker.controller;
            if (controlled) status = await this._ask(recache ? 'RECACHE' : 'GET_STATUS', recache ? 120000 : 10000);
        }
        checks.push({ ok: registered, label: 'Service worker active' });
        checks.push({
            ok: controlled,
            label: 'Page served by service worker',
            detail: controlled ? '' : 'reload the app once'
        });

        const filesOk = !!status && status.cached === status.total;
        checks.push({
            ok: filesOk,
            label: 'Game files saved locally',
            detail: status ? `${status.cached}/${status.total} (${status.version})` : 'unknown'
        });

        const installed = window.matchMedia('(display-mode: standalone)').matches ||
            window.matchMedia('(display-mode: fullscreen)').matches ||
            navigator.standalone === true;
        checks.push({
            ok: installed,
            label: 'Installed on home screen',
            detail: installed ? '' : 'Share → Add to Home Screen'
        });

        checks.push({ ok: true, label: navigator.onLine ? 'Online now' : 'Offline now' });

        const ready = registered && controlled && filesOk;
        let summary;
        if (ready) {
            summary = installed ? '✈ Ready for airplane mode' : '✈ Ready offline (install for best results)';
        } else if (!navigator.onLine) {
            summary = 'Not ready — connect to the internet and reopen';
        } else {
            summary = 'Not ready — press Re-download, then reopen the app';
        }
        if (status && status.missing && status.missing.length && !filesOk) {
            checks.push({ ok: false, label: 'Missing', detail: status.missing.slice(0, 3).join(', ') + (status.missing.length > 3 ? '…' : '') });
        }

        if (status && status.failed && status.failed.length) {
            checks.push({ ok: false, label: 'Re-download failed', detail: `${status.failed.length} files (no internet?) — kept saved copies` });
        }

        this._render(checks, summary, ready);
        this._busy = false;
    },

    init() {
        const refreshBtn = document.getElementById('offline-refresh-btn');
        const recacheBtn = document.getElementById('offline-recache-btn');
        const toggle = document.getElementById('dev-tools-toggle');
        if (refreshBtn) refreshBtn.addEventListener('click', () => this.refresh(false));
        if (recacheBtn) recacheBtn.addEventListener('click', () => this.refresh(true));
        if (toggle) toggle.addEventListener('click', () => this.refresh(false));
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.addEventListener('controllerchange', () => this.refresh(false));
        }
        window.addEventListener('online', () => this.refresh(false));
        window.addEventListener('offline', () => this.refresh(false));
    }
};

document.addEventListener('DOMContentLoaded', () => OfflineStatus.init());
