/**
 * ORB VISUALS DEBUGGER
 * Press 'O' to enter/exit debug mode.
 * Use Left/Right arrows to cycle through available skins.
 */

const OrbDebugger = (() => {
    let active = false;
    let savedCameraPos = new THREE.Vector3();
    let savedCameraRot = new THREE.Euler();
    let skinIds = [];
    let currentSkinIndex = 0;

    function init() {
        document.addEventListener('keydown', (e) => {
            if (e.code === 'KeyO') {
                toggle();
            } else if (active) {
                if (e.code === 'ArrowRight') cycle(1);
                if (e.code === 'ArrowLeft') cycle(-1);
            }
        });
    }

    function toggle() {
        if (!player || typeof GameState === 'undefined' || typeof isPlaying === 'undefined') return;

        active = !active;
        if (active) {
            console.log("Orb Debugger: ENABLED. Cycle skins with Arrow Keys.");

            // Pause game
            if (isPlaying) togglePause();

            // Collect all available skins from the registry
            if (skinIds.length === 0 && typeof window.SKINS !== 'undefined') {
                skinIds = Object.keys(window.SKINS);
                // Ensure default is first
                skinIds = skinIds.filter(id => id !== 'default');
                skinIds.unshift('default');
            }

            // Find currently equipped skin index
            const currentEquipped = GameState.equippedSkin || 'default';
            currentSkinIndex = skinIds.indexOf(currentEquipped);
            if (currentSkinIndex === -1) currentSkinIndex = 0;

            // Save camera state
            savedCameraPos.copy(camera.position);
            savedCameraRot.copy(camera.rotation);

            // Move camera to a close orbit around the player
            const targetPos = player.position.clone();
            camera.position.set(targetPos.x, targetPos.y + 0.5, targetPos.z - 2.5); // Move in front of it looking back
            camera.lookAt(targetPos);

            // Hide distracting scene elements if they exist
            if (typeof floorGroup !== 'undefined') floorGroup.visible = false;
            if (typeof pillarGroup !== 'undefined') pillarGroup.visible = false;
            if (typeof collectibleGroup !== 'undefined') collectibleGroup.visible = false;
            if (typeof obstacleGroup !== 'undefined') obstacleGroup.visible = false;
        } else {
            console.log("Orb Debugger: DISABLED.");

            // Restore camera state
            camera.position.copy(savedCameraPos);
            camera.rotation.copy(savedCameraRot);

            // Show scene elements
            if (typeof floorGroup !== 'undefined') floorGroup.visible = true;
            if (typeof pillarGroup !== 'undefined') pillarGroup.visible = true;
            if (typeof collectibleGroup !== 'undefined') collectibleGroup.visible = true;
            if (typeof obstacleGroup !== 'undefined') obstacleGroup.visible = true;

            // Resume game
            if (!isPlaying && !GameState.isDead) togglePause();
        }
    }

    function cycle(dir) {
        if (skinIds.length === 0) return;
        currentSkinIndex = (currentSkinIndex + dir + skinIds.length) % skinIds.length;
        const targetSkin = skinIds[currentSkinIndex];

        console.log(`Orb Debugger: Switched to ${targetSkin}`);

        // Temporarily modify game state and apply skin
        const previousSkin = GameState.equippedSkin;
        GameState.equippedSkin = targetSkin;

        // Force unequip old, equip new
        Object.keys(window.SKINS).forEach(key => {
            const skinData = window.SKINS[key];
            if (skinData && skinData.stateOwned && skinData.stateEquipped) {
                GameState[skinData.stateEquipped] = (key === targetSkin);
                GameState[skinData.stateOwned] = true; // Pretend we own it for debug
            }
        });

        if (typeof applySkins !== 'undefined') {
            applySkins();
        }
    }

    // Initialize when DOM is ready
    window.addEventListener('load', () => {
        setTimeout(init, 1000); // Give scene time to build
    });

    return { toggle, cycle };
})();
