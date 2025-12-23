const DISCO_PRICE = 50;
const DISCO_OWNED_KEY = 'beat-runner-disco-owned';
const DISCO_EQUIPPED_KEY = 'beat-runner-disco-equipped';

const STORE_CATEGORIES = [
    {
        id: 'skins',
        label: 'Skins',
        items: [
            { id: 'disco-ball', name: 'Disco Ball', price: DISCO_PRICE, preview: 'disco' }
        ]
    }
];

let selectedCategoryId = 'skins';
const storeItemElements = new Map();
const previewScenes = new Map();

function loadDiscoBallState() {
    GameState.discoBallOwned = localStorage.getItem(DISCO_OWNED_KEY) === 'true';
    GameState.discoBallEquipped = localStorage.getItem(DISCO_EQUIPPED_KEY) === 'true';
    if (!GameState.discoBallOwned) {
        GameState.discoBallEquipped = false;
    }
    refreshStoreUI();
}

function saveDiscoBallState() {
    localStorage.setItem(DISCO_OWNED_KEY, String(GameState.discoBallOwned));
    localStorage.setItem(DISCO_EQUIPPED_KEY, String(GameState.discoBallEquipped));
}

function buildDiscoBall(radius = 1, assignGlobals = false) {
    const group = new THREE.Group();
    const coreGeo = new THREE.SphereGeometry(radius, 20, 14);
    const coreMat = new THREE.MeshStandardMaterial({
        color: 0xf5f7ff,
        metalness: 0.95,
        roughness: 0.08,
        emissive: 0xffffff,
        emissiveIntensity: 0.7
    });
    const core = new THREE.Mesh(coreGeo, coreMat);
    group.add(core);

    const tileSize = radius * 0.24;
    const tileDepth = radius * 0.08;
    const tileGeo = new THREE.BoxGeometry(tileSize, tileSize, tileDepth);
    const tileMat = new THREE.MeshStandardMaterial({
        color: 0xffffff,
        metalness: 1,
        roughness: 0.04,
        emissive: 0xffffff,
        emissiveIntensity: 0.5
    });

    const latSteps = 8;
    const lonSteps = 12;
    const total = latSteps * lonSteps;
    const tiles = new THREE.InstancedMesh(tileGeo, tileMat, total);
    let i = 0;

    for (let lat = 0; lat < latSteps; lat++) {
        const v = (lat + 0.5) / latSteps;
        const theta = v * Math.PI;
        const sinTheta = Math.sin(theta);
        const cosTheta = Math.cos(theta);

        for (let lon = 0; lon < lonSteps; lon++) {
            const u = (lon + 0.5) / lonSteps;
            const phi = u * Math.PI * 2;
            const sinPhi = Math.sin(phi);
            const cosPhi = Math.cos(phi);

            const normal = new THREE.Vector3(
                sinTheta * cosPhi,
                cosTheta,
                sinTheta * sinPhi
            );

            const position = normal.clone().multiplyScalar(radius + 0.05);
            const matrix = new THREE.Matrix4();
            const quaternion = new THREE.Quaternion().setFromUnitVectors(
                new THREE.Vector3(0, 0, 1),
                normal
            );
            matrix.compose(position, quaternion, new THREE.Vector3(1, 1, 1));
            tiles.setMatrixAt(i, matrix);
            i++;
        }
    }

    tiles.instanceMatrix.needsUpdate = true;
    group.add(tiles);

    const glowGeo = new THREE.SphereGeometry(radius * 1.15, 16, 12);
    const glowMat = new THREE.MeshBasicMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0.28
    });
    const glow = new THREE.Mesh(glowGeo, glowMat);
    group.add(glow);

    const sparkleGeo = new THREE.BufferGeometry();
    const sparkleCount = 30;
    const sparklePositions = new Float32Array(sparkleCount * 3);
    for (let s = 0; s < sparkleCount; s++) {
        const angle = Math.random() * Math.PI * 2;
        const height = (Math.random() - 0.5) * 2;
        const radiusOffset = radius + 0.2 + Math.random() * 0.25;
        sparklePositions[s * 3] = Math.cos(angle) * radiusOffset;
        sparklePositions[s * 3 + 1] = height * 0.6;
        sparklePositions[s * 3 + 2] = Math.sin(angle) * radiusOffset;
    }
    sparkleGeo.setAttribute('position', new THREE.BufferAttribute(sparklePositions, 3));
    const sparkleMat = new THREE.PointsMaterial({
        color: 0xffffff,
        size: 0.07,
        transparent: true,
        opacity: 0.8,
        blending: THREE.AdditiveBlending
    });
    const sparkles = new THREE.Points(sparkleGeo, sparkleMat);
    group.add(sparkles);

    if (assignGlobals) {
        discoBallGroup = group;
        discoBallCore = core;
        discoBallTiles = tiles;
        discoBallSparkles = sparkles;
    }

    return { group, core, tiles };
}

function createDiscoBallSkin() {
    return buildDiscoBall(0.45, true).group;
}

function applyDiscoBallSkin() {
    if (!player || !discoBallGroup) return;
    const equipped = GameState.discoBallOwned && GameState.discoBallEquipped;
    discoBallGroup.visible = equipped;
    if (playerCore) playerCore.visible = !equipped;
    if (playerGlow) playerGlow.visible = !equipped;
    if (playerRing) playerRing.visible = !equipped;
}

function purchaseDiscoBall() {
    if (GameState.discoBallOwned) return;
    if (GameState.coins < DISCO_PRICE) return;
    if (!spendCoins(DISCO_PRICE)) return;
    GameState.discoBallOwned = true;
    GameState.discoBallEquipped = true;
    saveDiscoBallState();
    applyDiscoBallSkin();
    refreshStoreUI();
}

function toggleDiscoBallEquip() {
    if (!GameState.discoBallOwned) return;
    GameState.discoBallEquipped = !GameState.discoBallEquipped;
    saveDiscoBallState();
    applyDiscoBallSkin();
    refreshStoreUI();
}

function refreshStoreUI() {
    storeItemElements.forEach((elements, itemId) => {
        if (itemId !== 'disco-ball') return;
        const { status, price, actionBtn } = elements;
        if (!GameState.discoBallOwned) {
            actionBtn.disabled = GameState.coins < DISCO_PRICE;
            actionBtn.textContent = 'Buy';
            status.textContent = GameState.coins < DISCO_PRICE ? 'Not enough coins' : '';
            price.innerHTML = '<span class="coin-icon"></span> ' + DISCO_PRICE + ' Coins';
            return;
        }

        status.textContent = GameState.discoBallEquipped ? 'Equipped' : 'Owned';
        price.textContent = GameState.discoBallEquipped ? 'Equipped' : 'Owned';
        actionBtn.disabled = false;
        actionBtn.textContent = GameState.discoBallEquipped ? 'Equipped' : 'Equip';
    });
}

function setupDiscoPreview(canvas, itemId) {
    if (!canvas) return;
    const renderer = new THREE.WebGLRenderer({
        canvas,
        alpha: true,
        antialias: true,
        powerPreference: 'low-power'
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 20);
    camera.position.set(0, 0.1, 2.2);
    camera.lookAt(0, 0, 0);

    const { group, core, tiles } = buildDiscoBall(0.45, false);
    group.scale.set(0.85, 0.85, 0.85);
    scene.add(group);

    const ambient = new THREE.AmbientLight(0xffffff, 1.0);
    scene.add(ambient);
    const pinkLight = new THREE.PointLight(0xff66ff, 1.4, 6);
    pinkLight.position.set(-1, 1.2, 2);
    scene.add(pinkLight);
    const cyanLight = new THREE.PointLight(0x66ffff, 1.4, 6);
    cyanLight.position.set(1, -1, 2);
    scene.add(cyanLight);

    previewScenes.set(itemId, { renderer, scene, camera, group, core, tiles, canvas });
    resizeDiscoPreview();
}

function resizeDiscoPreview() {
    previewScenes.forEach((preview) => {
        const rect = preview.canvas.getBoundingClientRect();
        if (rect.width === 0 || rect.height === 0) return;
        preview.renderer.setSize(rect.width, rect.height, false);
    });
}

function renderDiscoPreview(delta, elapsed) {
    previewScenes.forEach((preview) => {
        preview.group.rotation.y += delta * 0.55;
        const pulse = 1 + Math.sin(elapsed * 2.2) * 0.02;
        preview.group.scale.set(0.85 * pulse, 0.85 * pulse, 0.85 * pulse);
        if (preview.core && preview.core.material) {
            preview.core.material.emissiveIntensity = 0.7 + Math.abs(Math.sin(elapsed * 2.2)) * 0.35;
        }
        if (preview.tiles && preview.tiles.material) {
            preview.tiles.material.emissiveIntensity = 0.5 + Math.abs(Math.sin(elapsed * 2.2)) * 0.25;
        }
        preview.renderer.render(preview.scene, preview.camera);
    });
}

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

        const price = document.createElement('div');
        price.className = 'store-price';
        price.innerHTML = '<span class="coin-icon"></span> ' + item.price + ' Coins';

        const status = document.createElement('div');
        status.className = 'store-status';

        const actions = document.createElement('div');
        actions.className = 'store-actions';
        const actionBtn = document.createElement('button');
        actionBtn.className = 'btn btn-secondary store-btn';
        actionBtn.textContent = 'Buy';
        actions.appendChild(actionBtn);
        info.appendChild(title);
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
        }
    });
}

function renderStore() {
    renderStoreTabs();
    renderStoreItems();
}

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
