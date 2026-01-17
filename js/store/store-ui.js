// ========================================
// STORE UI - Tabs, Items, and Setup
// ========================================

const STORE_CATEGORIES = [
    {
        id: 'skins',
        label: 'Skins',
        items: [
            { id: 'disco-ball', name: 'Disco Ball', price: DISCO_PRICE, preview: 'disco', description: 'Light up the rhythm. Pure party energy.' },
            { id: 'fire-ball', name: 'Fire Ball', price: FIREBALL_PRICE, preview: 'fire', description: 'Feel the heat. A ball of pure rhythmic power.' }
        ]
    }
];

let selectedCategoryId = 'skins';
const storeItemElements = new Map();

// ========================================
// Store UI Refresh
// ========================================

function refreshStoreUI() {
    storeItemElements.forEach((elements, itemId) => {
        const { status, price, actionBtn } = elements;

        if (itemId === 'disco-ball') {
            if (!GameState.discoBallOwned) {
                actionBtn.disabled = GameState.totalOrbs < DISCO_PRICE;
                actionBtn.textContent = 'Buy';
                status.textContent = GameState.totalOrbs < DISCO_PRICE ? 'Not enough orbs' : '';
                price.innerHTML = '<span class="orb-icon"></span> ' + DISCO_PRICE + ' Orbs';
                return;
            }
            status.textContent = GameState.discoBallEquipped ? 'Equipped' : 'Owned';
            price.textContent = GameState.discoBallEquipped ? 'Equipped' : 'Owned';
            actionBtn.disabled = GameState.discoBallEquipped;
            actionBtn.textContent = GameState.discoBallEquipped ? 'Equipped' : 'Equip';
        } else if (itemId === 'fire-ball') {
            if (!GameState.fireBallOwned) {
                actionBtn.disabled = GameState.totalOrbs < FIREBALL_PRICE;
                actionBtn.textContent = 'Buy';
                status.textContent = GameState.totalOrbs < FIREBALL_PRICE ? 'Not enough orbs' : '';
                price.innerHTML = '<span class="orb-icon"></span> ' + FIREBALL_PRICE + ' Orbs';
                return;
            }
            status.textContent = GameState.fireBallEquipped ? 'Equipped' : 'Owned';
            price.textContent = GameState.fireBallEquipped ? 'Equipped' : 'Owned';
            actionBtn.disabled = GameState.fireBallEquipped;
            actionBtn.textContent = GameState.fireBallEquipped ? 'Equipped' : 'Equip';
        }
    });
}

// ========================================
// Store Rendering
// ========================================

function renderStoreTabs() {
    if (!storeTabs) return;
    storeTabs.innerHTML = '';
    STORE_CATEGORIES.forEach((category) => {
        const button = document.createElement('button');
        button.className = 'store-tab';
        button.textContent = category.label;
        if (category.id === selectedCategoryId) {
            button.classList.add('is-active');
        }
        button.addEventListener('click', () => {
            selectedCategoryId = category.id;
            renderStoreTabs();
            renderStoreItems();
        });
        storeTabs.appendChild(button);
    });
}

function renderStoreItems() {
    if (!storeGrid) return;
    storeGrid.innerHTML = '';
    storeItemElements.clear();
    previewScenes.clear();

    const category = STORE_CATEGORIES.find((c) => c.id === selectedCategoryId);
    if (!category) return;
    if (storeSectionTitle) storeSectionTitle.textContent = category.label.toUpperCase();

    category.items.forEach((item) => {
        const card = document.createElement('div');
        card.className = 'store-card';

        const preview = document.createElement('div');
        preview.className = 'store-preview';
        const canvas = document.createElement('canvas');
        canvas.width = 120;
        canvas.height = 120;
        canvas.setAttribute('aria-label', `${item.name} preview`);
        preview.appendChild(canvas);

        const info = document.createElement('div');
        info.className = 'store-info';

        const title = document.createElement('div');
        title.className = 'store-title';
        title.textContent = item.name;

        // Description - always included for consistent card height
        const desc = document.createElement('div');
        desc.className = 'store-description';
        desc.textContent = item.description || '';

        const price = document.createElement('div');
        price.className = 'store-price';
        price.innerHTML = '<span class="orb-icon"></span> ' + item.price + ' Orbs';

        const status = document.createElement('div');
        status.className = 'store-status';

        const actions = document.createElement('div');
        actions.className = 'store-actions';
        const actionBtn = document.createElement('button');
        actionBtn.className = 'btn btn-secondary store-btn';
        actionBtn.textContent = 'Buy';
        actions.appendChild(actionBtn);

        // Build card in consistent order: title, description, price, status, actions
        info.appendChild(title);
        info.appendChild(desc);
        info.appendChild(price);
        info.appendChild(status);
        info.appendChild(actions);

        card.appendChild(preview);
        card.appendChild(info);
        storeGrid.appendChild(card);

        storeItemElements.set(item.id, { status, price, actionBtn });

        if (item.id === 'disco-ball') {
            actionBtn.addEventListener('click', () => {
                if (!GameState.discoBallOwned) {
                    purchaseDiscoBall();
                } else {
                    toggleDiscoBallEquip();
                }
            });
            setupDiscoPreview(canvas, item.id);
        } else if (item.id === 'fire-ball') {
            actionBtn.addEventListener('click', () => {
                if (!GameState.fireBallOwned) {
                    purchaseFireBall();
                } else {
                    toggleFireBallEquip();
                }
            });
            setupFirePreview(canvas, item.id);
        }
    });
}

function renderStore() {
    renderStoreTabs();
    renderStoreItems();
}

// ========================================
// Store Setup
// ========================================

function setupStore() {
    if (storeBtn && storeOverlay) {
        storeBtn.addEventListener('click', () => {
            storeOverlay.classList.add('is-open');
            storeOverlay.setAttribute('aria-hidden', 'false');
            if (typeof resizeDiscoPreview === 'function') resizeDiscoPreview();
        });
    }
    if (storeCloseBtn && storeOverlay) {
        storeCloseBtn.addEventListener('click', () => {
            storeOverlay.classList.remove('is-open');
            storeOverlay.setAttribute('aria-hidden', 'true');
        });
    }
    if (storeOverlay) {
        storeOverlay.addEventListener('click', (e) => {
            if (e.target === storeOverlay) {
                storeOverlay.classList.remove('is-open');
                storeOverlay.setAttribute('aria-hidden', 'true');
            }
        });
    }
    renderStore();
    refreshStoreUI();
}
