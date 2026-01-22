// ========================================
// SKIN PREVIEW - Store Preview Canvas Rendering
// ========================================

const previewScenes = new Map();

function setupDiscoPreview(canvas, itemId) {
    if (!canvas) return;
    const renderer = new THREE.WebGLRenderer({
        canvas,
        alpha: true,
        antialias: true,
        powerPreference: 'low-power'
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 20);
    camera.position.set(0, 0.1, 2.2);
    camera.lookAt(0, 0, 0);

    const { group, core, tiles, innerGlow, outerGlow, beams } = buildDiscoBall(0.45, false);
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

    previewScenes.set(itemId, {
        renderer, scene, camera, group, core, tiles, innerGlow, outerGlow, beams, canvas,
        colorIndex: 0, colorTransition: 0, type: 'disco'
    });
    resizeDiscoPreview();
}

function setupFirePreview(canvas, itemId) {
    if (!canvas) return;
    const renderer = new THREE.WebGLRenderer({
        canvas,
        alpha: true,
        antialias: true,
        powerPreference: 'low-power'
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 20);
    camera.position.set(0, 0.1, 2.2);
    camera.lookAt(0, 0, 0);

    const { group, core, flames, embers, innerGlow, outerGlow } = buildFireBall(0.45, false);
    group.scale.set(0.85, 0.85, 0.85);
    scene.add(group);

    const ambient = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambient);
    const orangeLight = new THREE.PointLight(0xff6600, 1.6, 6);
    orangeLight.position.set(-1, 1.2, 2);
    scene.add(orangeLight);
    const redLight = new THREE.PointLight(0xff2200, 1.4, 6);
    redLight.position.set(1, -1, 2);
    scene.add(redLight);

    previewScenes.set(itemId, {
        renderer, scene, camera, group, core, flames, embers, innerGlow, outerGlow, canvas,
        colorIndex: 0, colorTransition: 0, type: 'fire'
    });
    resizeDiscoPreview();
}

function setupRainbowPreview(canvas, itemId) {
    if (!canvas) return;
    const renderer = new THREE.WebGLRenderer({
        canvas,
        alpha: true,
        antialias: true,
        powerPreference: 'low-power'
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 20);
    camera.position.set(0, 0.1, 2.2);
    camera.lookAt(0, 0, 0);

    const { group, core, trails, innerGlow, outerGlow } = buildRainbowOrb(0.45, false);
    group.scale.set(0.85, 0.85, 0.85);
    scene.add(group);

    const ambient = new THREE.AmbientLight(0xffffff, 0.8);
    scene.add(ambient);
    const rainbowLight1 = new THREE.PointLight(0xff0000, 1.2, 6);
    rainbowLight1.position.set(-1, 1.2, 2);
    scene.add(rainbowLight1);
    const rainbowLight2 = new THREE.PointLight(0x0000ff, 1.2, 6);
    rainbowLight2.position.set(1, -1, 2);
    scene.add(rainbowLight2);

    previewScenes.set(itemId, {
        renderer, scene, camera, group, core, trails, innerGlow, outerGlow, canvas,
        colorIndex: 0, colorTransition: 0, type: 'rainbow',
        light1: rainbowLight1, light2: rainbowLight2
    });
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
        if (preview.type === 'fire') {
            renderFirePreviewItem(preview, delta, elapsed);
        } else if (preview.type === 'rainbow') {
            renderRainbowOrbPreviewItem(preview, delta, elapsed);
        } else {
            renderDiscoPreviewItem(preview, delta, elapsed);
        }
        preview.renderer.render(preview.scene, preview.camera);
    });
}

function renderDiscoPreviewItem(preview, delta, elapsed) {
    // Rotation
    preview.group.rotation.y += delta * 0.55;

    // Pulse effect
    const pulse = 1 + Math.sin(elapsed * 2.2) * 0.025;
    preview.group.scale.set(0.85 * pulse, 0.85 * pulse, 0.85 * pulse);

    // Static silver colors (traditional disco ball)
    const SILVER_COLOR = new THREE.Color(0xc0c0c0);
    const LIGHT_SILVER = new THREE.Color(0xe8e8e8);
    const WHITE = new THREE.Color(0xffffff);

    // Apply colors and intensity with subtle beat response
    const beatPhase = Math.abs(Math.sin(elapsed * 2.2));
    if (preview.core && preview.core.material) {
        preview.core.material.emissive.copy(SILVER_COLOR);
        preview.core.material.emissiveIntensity = 0.8 + beatPhase * 0.4;
    }
    if (preview.tiles && preview.tiles.material) {
        preview.tiles.material.emissive.copy(SILVER_COLOR);
        preview.tiles.material.emissiveIntensity = 0.6 + beatPhase * 0.3;
    }
    if (preview.innerGlow && preview.innerGlow.material) {
        preview.innerGlow.material.color.copy(LIGHT_SILVER);
        preview.innerGlow.material.opacity = 0.2 + beatPhase * 0.15;
    }
    if (preview.outerGlow && preview.outerGlow.material) {
        preview.outerGlow.material.color.copy(WHITE);
        preview.outerGlow.material.opacity = 0.12 + beatPhase * 0.1;
    }
    if (preview.beams && preview.beams.material) {
        preview.beams.material.color.copy(LIGHT_SILVER);
        // Rotate beams
        preview.beams.rotation.y = elapsed * 1.2;
    }
}

function renderFirePreviewItem(preview, delta, elapsed) {
    // Slow rotation
    preview.group.rotation.y += delta * 0.4;

    // Fire pulse effect - more intense and erratic
    const pulse = 1 + Math.sin(elapsed * 3.5) * 0.04 + Math.sin(elapsed * 7) * 0.02;
    preview.group.scale.set(0.85 * pulse, 0.85 * pulse, 0.85 * pulse);

    // Color cycling through fire colors
    preview.colorTransition += delta;
    if (preview.colorTransition >= 1.5) {
        preview.colorTransition = 0;
        preview.colorIndex = (preview.colorIndex + 1) % FIRE_COLORS.length;
    }

    const currentColor = FIRE_COLORS[preview.colorIndex];
    const nextColor = FIRE_COLORS[(preview.colorIndex + 1) % FIRE_COLORS.length];
    const t = Math.min(preview.colorTransition / 0.4, 1);
    const lerpedColor = new THREE.Color(currentColor.hex).lerp(
        new THREE.Color(nextColor.hex),
        t
    );

    // Intensity flicker for fire effect
    const flicker = 0.8 + Math.random() * 0.2;
    const beatPhase = Math.abs(Math.sin(elapsed * 3.5));

    if (preview.core && preview.core.material) {
        preview.core.material.emissive.copy(lerpedColor);
        preview.core.material.emissiveIntensity = (1.5 + beatPhase * 0.5) * flicker;
    }
    if (preview.innerGlow && preview.innerGlow.material) {
        preview.innerGlow.material.color.copy(lerpedColor);
        preview.innerGlow.material.opacity = (0.4 + beatPhase * 0.2) * flicker;
    }
    if (preview.outerGlow && preview.outerGlow.material) {
        preview.outerGlow.material.color.lerp(new THREE.Color(0xffaa00), 0.3);
        preview.outerGlow.material.opacity = (0.2 + beatPhase * 0.1) * flicker;
    }

    // Animate flame particles
    if (preview.flames && preview.flames.geometry) {
        const positions = preview.flames.geometry.attributes.position.array;
        const basePositions = preview.flames.geometry.userData.basePositions;
        const phases = preview.flames.geometry.userData.phases;

        if (basePositions && phases) {
            for (let i = 0; i < positions.length / 3; i++) {
                const phase = phases[i];
                // Flames rise and flicker
                positions[i * 3 + 1] = basePositions[i * 3 + 1] +
                    Math.sin(elapsed * 4 + phase) * 0.15 +
                    (elapsed * 0.5 + phase) % 0.8;
                // Slight horizontal wobble
                positions[i * 3] = basePositions[i * 3] + Math.sin(elapsed * 3 + phase) * 0.05;
                positions[i * 3 + 2] = basePositions[i * 3 + 2] + Math.cos(elapsed * 3 + phase) * 0.05;
            }
            preview.flames.geometry.attributes.position.needsUpdate = true;
        }
        preview.flames.material.color.copy(lerpedColor);
    }

    // Animate ember particles
    if (preview.embers && preview.embers.geometry) {
        const positions = preview.embers.geometry.attributes.position.array;
        const basePositions = preview.embers.geometry.userData.basePositions;
        const phases = preview.embers.geometry.userData.phases;

        if (basePositions && phases) {
            for (let i = 0; i < positions.length / 3; i++) {
                const phase = phases[i];
                // Embers float and drift
                positions[i * 3 + 1] = basePositions[i * 3 + 1] +
                    Math.sin(elapsed * 2 + phase) * 0.2 +
                    (elapsed * 0.3 + phase) % 1.2;
                positions[i * 3] = basePositions[i * 3] + Math.sin(elapsed * 1.5 + phase) * 0.1;
                positions[i * 3 + 2] = basePositions[i * 3 + 2] + Math.cos(elapsed * 1.5 + phase) * 0.1;
            }
            preview.embers.geometry.attributes.position.needsUpdate = true;
        }
    }
}

function renderRainbowOrbPreviewItem(preview, delta, elapsed) {
    // Smooth rotation
    preview.group.rotation.y += delta * 0.5;

    // Gentle pulse effect
    const pulse = 1 + Math.sin(elapsed * 2.5) * 0.04;
    preview.group.scale.set(0.85 * pulse, 0.85 * pulse, 0.85 * pulse);

    // Color cycling through rainbow spectrum (change every 1.8 seconds)
    preview.colorTransition += delta;
    if (preview.colorTransition >= 1.8) {
        preview.colorTransition = 0;
        preview.colorIndex = (preview.colorIndex + 1) % RAINBOW_COLORS.length;
    }

    const currentColor = RAINBOW_COLORS[preview.colorIndex];
    const nextColor = RAINBOW_COLORS[(preview.colorIndex + 1) % RAINBOW_COLORS.length];
    const t = Math.min(preview.colorTransition / 0.5, 1);
    const lerpedColor = new THREE.Color(currentColor.hex).lerp(
        new THREE.Color(nextColor.hex),
        t
    );

    // Smooth beatPhase for consistent pulsing
    const beatPhase = Math.abs(Math.sin(elapsed * 2.5));

    if (preview.core && preview.core.material) {
        preview.core.material.emissive.copy(lerpedColor);
        preview.core.material.emissiveIntensity = 1.2 + beatPhase * 0.4;
    }
    if (preview.innerGlow && preview.innerGlow.material) {
        preview.innerGlow.material.color.copy(lerpedColor);
        preview.innerGlow.material.opacity = 0.45 + beatPhase * 0.15;
    }
    if (preview.outerGlow && preview.outerGlow.material) {
        preview.outerGlow.material.color.copy(lerpedColor);
        preview.outerGlow.material.opacity = 0.25 + beatPhase * 0.1;
    }

    // Animate trail particles with flowing motion
    if (preview.trails && preview.trails.geometry) {
        const positions = preview.trails.geometry.attributes.position.array;
        const basePositions = preview.trails.geometry.userData.basePositions;
        const phases = preview.trails.geometry.userData.phases;
        const colorIndices = preview.trails.geometry.userData.colorIndices;

        if (basePositions && phases) {
            for (let i = 0; i < positions.length / 3; i++) {
                const phase = phases[i];
                // Particles flow in circular trails
                positions[i * 3 + 1] = basePositions[i * 3 + 1] +
                    Math.sin(elapsed * 2 + phase) * 0.18;
                positions[i * 3] = basePositions[i * 3] + Math.sin(elapsed * 2.5 + phase) * 0.08;
                positions[i * 3 + 2] = basePositions[i * 3 + 2] + Math.cos(elapsed * 2.5 + phase) * 0.08;
            }
            preview.trails.geometry.attributes.position.needsUpdate = true;
        }
        preview.trails.material.color.copy(lerpedColor);
    }

    // Update dynamic lighting colors
    if (preview.light1) {
        preview.light1.color.copy(lerpedColor);
    }
    if (preview.light2) {
        const nextNextColor = RAINBOW_COLORS[(preview.colorIndex + 3) % RAINBOW_COLORS.length];
        preview.light2.color.copy(new THREE.Color(nextNextColor.hex));
    }
}
