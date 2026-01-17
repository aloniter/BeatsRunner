// ========================================
// EXIT BOOSTER MANAGER - Bonus Mode Reward Selection
// ========================================
const ExitBoosterManager = {
    boosters: [],
    spawned: false,
    selectedBooster: null,
    speedBoostActive: false,
    speedBoostEndTime: 0,
    originalSpeed: 0,

    spawn() {
        if (this.spawned) return;
        this.spawned = true;

        const spawnZ = player.position.z + CONFIG.SPAWN_DISTANCE;
        const boosterTypes = ['speed', 'shield', 'magnet'];

        CONFIG.LANE_POSITIONS.forEach((x, laneIndex) => {
            const type = boosterTypes[laneIndex];
            const booster = this.createBooster(type, x, spawnZ, laneIndex);
            scene.add(booster);
            this.boosters.push(booster);
        });
    },

    createBooster(type, x, z, lane) {
        let group = null;
        let glowMeshes = [];
        let fadeMeshes = [];
        let flashColor = '#ffffff';

        if (type === 'magnet') {
            group = MagnetManager.createPickup();
            glowMeshes = [group.children[3]];
            fadeMeshes = [group.children[0], group.children[1], group.children[2], group.children[3]];
            flashColor = '#ff9900';
        } else if (type === 'shield') {
            group = ShieldManager.createPickup();
            glowMeshes = [group.children[1], group.children[2]];
            fadeMeshes = [group.children[0], group.children[1], group.children[2], group.children[3]];
            flashColor = '#66ccff';
        } else {
            const speedModel = createSpeedBoosterModel();
            group = speedModel.group;
            glowMeshes = speedModel.glowMeshes;
            fadeMeshes = speedModel.fadeMeshes;
            flashColor = speedModel.flashColor;
        }

        group.position.set(x, 1.8, z);
        group.userData.type = type;
        group.userData.lane = lane;
        group.userData.checked = false;
        group.userData.glowMeshes = glowMeshes.filter(Boolean);
        group.userData.fadeMeshes = fadeMeshes.filter(Boolean);
        group.userData.flashColor = flashColor;
        group.userData.baseScale = 2;
        group.scale.set(2, 2, 2);  // 2x larger than normal pickups

        return group;
    },

    update(delta, elapsed) {
        const moveAmount = GameState.speed * delta;

        // Update boosters
        for (let i = this.boosters.length - 1; i >= 0; i--) {
            const booster = this.boosters[i];

            // Move toward player
            booster.position.z -= moveAmount;

            // Rotate and pulse
            booster.rotation.y += delta * 2;
            const pulse = 1 + Math.sin(elapsed * 4) * 0.1;
            const baseScale = booster.userData.baseScale || 2;
            booster.scale.set(baseScale * pulse, baseScale * pulse, baseScale * pulse);

            // Pulse glow meshes
            if (booster.userData.glowMeshes) {
                const glowOpacity = 0.35 + Math.sin(elapsed * 5) * 0.2;
                booster.userData.glowMeshes.forEach(mesh => {
                    if (mesh && mesh.material) {
                        mesh.material.opacity = glowOpacity;
                        mesh.material.transparent = true;
                    }
                });
            }

            // Check if player passed through
            if (!booster.userData.checked && booster.position.z < player.position.z) {
                booster.userData.checked = true;

                if (booster.userData.lane === GameState.currentLane) {
                    // Player selected this booster!
                    this.activateBooster(booster.userData.type);
                    flashScreen(0.15, booster.userData.flashColor || '#ffffff');
                    playCollectSound();

                    // Visual: selected booster explodes
                    if (booster.userData.glowMeshes) {
                        booster.userData.glowMeshes.forEach(mesh => {
                            if (mesh && mesh.material) {
                                mesh.material.opacity = 1.0;
                                mesh.material.transparent = true;
                            }
                        });
                    }
                    booster.scale.set(4, 4, 4);
                } else {
                    // Fade out unselected boosters
                    if (booster.userData.fadeMeshes) {
                        booster.userData.fadeMeshes.forEach(mesh => {
                            if (mesh && mesh.material) {
                                mesh.material.opacity = 0.2;
                                mesh.material.transparent = true;
                            }
                        });
                    }
                }
            }

            // Remove if far behind player
            if (booster.position.z < player.position.z - 20) {
                scene.remove(booster);
                this.boosters.splice(i, 1);
            }
        }

        // Handle active speed boost
        if (this.speedBoostActive) {
            const currentTime = performance.now() / 1000;
            if (currentTime >= this.speedBoostEndTime) {
                // End speed boost
                GameState.speed = this.originalSpeed;
                this.speedBoostActive = false;
            }
        }
    },

    activateBooster(type) {
        this.selectedBooster = type;

        switch (type) {
            case 'speed':
                this.originalSpeed = GameState.speed;
                GameState.speed = Math.min(GameState.speed + 15, CONFIG.MAX_SPEED);
                this.speedBoostActive = true;
                this.speedBoostEndTime = (performance.now() / 1000) + 8;  // 8 second boost
                console.log('SPEED BOOST activated!');
                break;

            case 'shield':
                ShieldManager.activate();
                console.log('SHIELD activated!');
                break;

            case 'magnet':
                MagnetManager.activate();
                console.log('MAGNET activated!');
                break;
        }
    },

    reset() {
        this.boosters.forEach(booster => scene.remove(booster));
        this.boosters.length = 0;
        this.spawned = false;
        this.selectedBooster = null;
        if (this.speedBoostActive) {
            GameState.speed = this.originalSpeed;
            this.speedBoostActive = false;
        }
    }
};
