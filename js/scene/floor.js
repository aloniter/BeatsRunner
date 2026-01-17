// ========================================
// FLOOR - Infinite Neon Track
// ========================================

function createFloor() {
    const tileLength = 25;
    const numTiles = 10;

    // Create normal track tiles
    for (let i = 0; i < numTiles; i++) {
        const tile = createFloorTile(tileLength);
        tile.position.z = i * tileLength;
        tile.userData.length = tileLength;
        scene.add(tile);
        floorTilesNormal.push(tile);
    }

    // Create rainbow track tiles (initially hidden)
    for (let i = 0; i < numTiles; i++) {
        const tile = createRainbowFloorTile(tileLength);
        tile.position.z = i * tileLength;
        tile.userData.length = tileLength;
        tile.visible = false;  // Hidden by default
        scene.add(tile);
        floorTilesRainbow.push(tile);
    }

    // Backward compatibility
    floorTiles = floorTilesNormal;
}

function createFloorTile(length) {
    const group = new THREE.Group();

    // Main floor - Segmented geometry for bonus mode curve effect
    const floorGeo = new THREE.PlaneGeometry(14, length, 14, 25);
    const floorMat = new THREE.MeshStandardMaterial({
        color: 0x0a0a1a,
        emissive: 0x110022,
        emissiveIntensity: 0.2,
        metalness: 0.7,
        roughness: 0.4
    });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    group.add(floor);

    // Lane dividers (shared geometry)
    const dividerGeo = new THREE.BoxGeometry(0.08, 0.08, length);
    const dividerMat = new THREE.MeshBasicMaterial({
        color: CONFIG.COLORS.PINK,
        transparent: true,
        opacity: 0.7
    });

    [-1.5, 1.5].forEach(x => {
        const divider = new THREE.Mesh(dividerGeo, dividerMat);
        divider.position.set(x, 0.04, 0);
        group.add(divider);
    });

    // Edge lines
    const edgeGeo = new THREE.BoxGeometry(0.15, 0.15, length);

    [-7, 7].forEach(x => {
        const edgeMat = new THREE.MeshBasicMaterial({
            color: CONFIG.COLORS.CYAN,
            transparent: true,
            opacity: 0.85
        });
        const edge = new THREE.Mesh(edgeGeo, edgeMat);
        edge.position.set(x, 0.08, 0);
        group.add(edge);
    });

    // Grid lines (reduced count for performance)
    const gridGeo = new THREE.BoxGeometry(14, 0.03, 0.06);

    for (let i = 0; i < length; i += 4) {
        const gridMat = new THREE.MeshBasicMaterial({
            color: CONFIG.COLORS.PURPLE,
            transparent: true,
            opacity: 0.25
        });
        const gridLine = new THREE.Mesh(gridGeo, gridMat);
        gridLine.position.set(0, 0.015, i - length / 2);
        group.add(gridLine);
    }

    return group;
}

function createRainbowFloorTile(length) {
    const group = new THREE.Group();

    // Offset slightly above normal track to prevent z-fighting during transition
    group.position.y = 0.01;

    // Rainbow floor - Vivid and emissive
    const floorGeo = new THREE.PlaneGeometry(14, length, 14, 25);
    const floorMat = new THREE.MeshStandardMaterial({
        color: 0xff00ff,          // Start with magenta
        emissive: 0xff00ff,       // Vivid emissive
        emissiveIntensity: 1.5,   // High intensity
        metalness: 0.7,
        roughness: 0.4,
        transparent: true,
        opacity: 0                // Start invisible
    });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    group.add(floor);

    // Store reference for rainbow animation
    if (!window.rainbowMaterials) {
        window.rainbowMaterials = { floors: [], edges: [], grids: [] };
    }
    window.rainbowMaterials.floors.push(floorMat);

    // Rainbow lane dividers
    const dividerGeo = new THREE.BoxGeometry(0.08, 0.08, length);
    [-1.5, 1.5].forEach(x => {
        const dividerMat = new THREE.MeshBasicMaterial({
            color: 0x00ffff,
            transparent: true,
            opacity: 0
        });
        const divider = new THREE.Mesh(dividerGeo, dividerMat);
        divider.position.set(x, 0.04, 0);
        group.add(divider);
        window.rainbowMaterials.edges.push(dividerMat);
    });

    // Rainbow edge lines
    const edgeGeo = new THREE.BoxGeometry(0.15, 0.15, length);
    [-7, 7].forEach(x => {
        const edgeMat = new THREE.MeshBasicMaterial({
            color: 0xff00aa,
            transparent: true,
            opacity: 0
        });
        const edge = new THREE.Mesh(edgeGeo, edgeMat);
        edge.position.set(x, 0.08, 0);
        group.add(edge);
        window.rainbowMaterials.edges.push(edgeMat);
    });

    // Rainbow grid lines
    const gridGeo = new THREE.BoxGeometry(14, 0.03, 0.06);
    for (let i = 0; i < length; i += 4) {
        const gridMat = new THREE.MeshBasicMaterial({
            color: 0xffff00,
            transparent: true,
            opacity: 0
        });
        const gridLine = new THREE.Mesh(gridGeo, gridMat);
        gridLine.position.set(0, 0.015, i - length / 2);
        group.add(gridLine);
        window.rainbowMaterials.grids.push(gridMat);
    }

    return group;
}
