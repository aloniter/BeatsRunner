// UPDATE LOOP
// ========================================
function updateGame(delta, elapsed) {
    if (!GameState.isPlaying || GameState.isPaused) return;
    
    // Update beat system
    BeatManager.update(elapsed);
    
    // Update player
    PlayerController.update(delta, elapsed);
    if (discoBallGroup && discoBallGroup.visible) {
        discoBallGroup.rotation.y += delta * 0.9;
        // Rotate light beams independently for dynamic effect
        if (discoBallBeams) {
            discoBallBeams.rotation.y += delta * 1.5;
        }
    }

    // Animate Fire Ball skin
    if (fireBallGroup && fireBallGroup.visible) {
        fireBallGroup.rotation.y += delta * 0.6;

        // Animate flames
        if (fireBallFlames && fireBallFlames.geometry) {
            const positions = fireBallFlames.geometry.attributes.position.array;
            const basePositions = fireBallFlames.geometry.userData.basePositions;
            const phases = fireBallFlames.geometry.userData.phases;

            if (basePositions && phases) {
                for (let i = 0; i < positions.length / 3; i++) {
                    const phase = phases[i];
                    // Flames rise and flicker
                    positions[i * 3 + 1] = basePositions[i * 3 + 1] +
                        Math.sin(elapsed * 5 + phase) * 0.12 +
                        (elapsed * 0.8 + phase) % 0.6;
                    // Horizontal wobble
                    positions[i * 3] = basePositions[i * 3] + Math.sin(elapsed * 4 + phase) * 0.04;
                    positions[i * 3 + 2] = basePositions[i * 3 + 2] + Math.cos(elapsed * 4 + phase) * 0.04;
                }
                fireBallFlames.geometry.attributes.position.needsUpdate = true;
            }
        }

        // Animate embers
        if (fireBallEmbers && fireBallEmbers.geometry) {
            const positions = fireBallEmbers.geometry.attributes.position.array;
            const basePositions = fireBallEmbers.geometry.userData.basePositions;
            const phases = fireBallEmbers.geometry.userData.phases;

            if (basePositions && phases) {
                for (let i = 0; i < positions.length / 3; i++) {
                    const phase = phases[i];
                    // Embers float upward
                    positions[i * 3 + 1] = basePositions[i * 3 + 1] +
                        Math.sin(elapsed * 2.5 + phase) * 0.15 +
                        (elapsed * 0.4 + phase) % 1.0;
                    positions[i * 3] = basePositions[i * 3] + Math.sin(elapsed * 2 + phase) * 0.08;
                    positions[i * 3 + 2] = basePositions[i * 3 + 2] + Math.cos(elapsed * 2 + phase) * 0.08;
                }
                fireBallEmbers.geometry.attributes.position.needsUpdate = true;
            }
        }

        // Pulse the fire ball intensity with beat
        const beatPulse = Math.abs(Math.sin(elapsed * 3));
        if (fireBallCore && fireBallCore.material) {
            fireBallCore.material.emissiveIntensity = 1.5 + beatPulse * 0.5;
        }
        if (fireBallInnerGlow && fireBallInnerGlow.material) {
            fireBallInnerGlow.material.opacity = 0.4 + beatPulse * 0.15;
        }
    }
    
    // Update distance/score
    GameState.distance += GameState.speed * delta * 0.5;
    GameState.score = GameState.orbs * 100 + Math.floor(GameState.distance);
    
    // Update obstacles
    ObstacleManager.update(delta);
    
    // Update magnet power-up
    MagnetManager.update(delta, elapsed);
    MagnetManager.checkCollection();
    
    // Update shield power-up
    ShieldManager.update(delta, elapsed);
    ShieldManager.checkCollection();
    
    // Update collectibles
    CollectibleManager.update(delta, elapsed);
    CollectibleManager.checkCollection();
    
    // Check collision
    if (ObstacleManager.checkCollision()) {
        gameOver();
        return;
    }
    
    // Update floor (infinite scroll)
    const moveAmount = GameState.speed * delta;
    const tileLength = floorTiles[0].userData.length;
    const totalLength = floorTiles.length * tileLength;
    
    floorTiles.forEach(tile => {
        tile.position.z -= moveAmount;
        if (tile.position.z < -tileLength) {
            tile.position.z += totalLength;
        }
    });
    
    // Update pillars
    const pillarSpacing = sidePillars[0]?.userData.spacing || 20;
    const totalPillarLength = (sidePillars.length / 2) * pillarSpacing;
    
    sidePillars.forEach(pillar => {
        pillar.position.z -= moveAmount;
        if (pillar.position.z < -pillarSpacing) {
            pillar.position.z += totalPillarLength;
        }
    });
    
    // Update particles
    if (particleSystem) {
        const positions = particleSystem.geometry.attributes.position.array;
        const velocities = particleSystem.geometry.userData.velocities;
        
        for (let i = 0; i < positions.length / 3; i++) {
            positions[i * 3 + 2] -= moveAmount * velocities[i];
            if (positions[i * 3 + 2] < -10) {
                positions[i * 3 + 2] += 160;
                positions[i * 3] = (Math.random() - 0.5) * 40;
                positions[i * 3 + 1] = Math.random() * 25;
            }
        }
        particleSystem.geometry.attributes.position.needsUpdate = true;
    }
    
    // Update HUD
    distanceValue.textContent = Math.floor(GameState.distance);
    orbsValue.textContent = GameState.orbs;
    scoreValue.textContent = GameState.score;
}

// ========================================
// RENDER LOOP - Smooth animation
// ========================================
function animate(currentTime = 0) {
    animationFrameId = requestAnimationFrame(animate);
    
    // Calculate delta with cap to prevent huge jumps after tab switch
    const delta = Math.min((currentTime - lastTime) / 1000, 0.05);
    lastTime = currentTime;
    
    // Skip if delta is too small
    if (delta < 0.001) return;
    
    // Calculate elapsed time for animations
    const elapsed = (currentTime - GameState.gameStartTime) / 1000;
    
    // Update game logic
    updateGame(delta, elapsed);
    
    // Render
    renderer.render(scene, camera);
    if (typeof renderDiscoPreview === 'function') {
        renderDiscoPreview(delta, elapsed);
    }
}

// ========================================
// RESIZE HANDLER
// ========================================
function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    if (typeof resizeDiscoPreview === 'function') {
        resizeDiscoPreview();
    }
    
    // Show/hide mobile controls based on device
    if (GameState.isPlaying) {
        const isMobile = window.innerWidth <= 768 || 'ontouchstart' in window;
        mobileControls.style.display = isMobile ? 'flex' : 'none';
    }
}
