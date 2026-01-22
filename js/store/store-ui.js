// ========================================
// STORE UI - Tabs, Items, and Setup
// ========================================

const STORE_CATEGORIES = [
    {
        id: 'skins',
        label: 'Skins',
        items: getSkinsByCategory('skins').sort((a, b) => a.order - b.order)
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

        const skin = getSkin(itemId);
        if (!skin) return;

        const ownedKey = getOwnedKey(itemId);
        const equippedKey = getEquippedKey(itemId);

        if (!GameState[ownedKey]) {
            actionBtn.disabled = GameState.totalOrbs < skin.price;
            actionBtn.textContent = 'Buy';
            status.textContent = GameState.totalOrbs < skin.price ? 'Not enough orbs' : '';
            price.innerHTML = '<span class="orb-icon"></span> ' + skin.price + ' Orbs';
            return;
        }

        const equipped = GameState[equippedKey];
        status.textContent = equipped ? 'Equipped' : 'Owned';
        price.textContent = equipped ? 'Equipped' : 'Owned';
        actionBtn.disabled = equipped;
        actionBtn.textContent = equipped ? 'Equipped' : 'Equip';
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

        // Generic event listener for all skins
        const ownedKey = getOwnedKey(item.id);
        actionBtn.addEventListener('click', () => {
            if (!GameState[ownedKey]) {
                purchaseSkin(item.id);
            } else {
                toggleSkinEquip(item.id);
            }
        });

        // Call preview setup dynamically
        const previewFn = getPreviewFunctionName(item.id);
        if (typeof window[previewFn] === 'function') {
            window[previewFn](canvas, item.id);
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
