// Player Movement Controller
// ========================================
const PlayerController = {
    targetX: 0,
    currentX: 0,
    laneChangeSpeed: 12,
    bobOffset: 0,

    /**
     * Move the player to the adjacent lane in the given direction.
     * Clamps to valid lanes (0-2), plays lane-change sound, and triggers
     * a subtle camera shake and haptic feedback.
     * @param {number} direction - +1 to move RIGHT (higher lane index), -1 to move LEFT
     */
    switchLane(direction) {
        if (!GameState.isPlaying) return;

        const newLane = GameState.currentLane + direction;
        if (newLane >= 0 && newLane <= 2) {
            GameState.currentLane = newLane;
            this.targetX = CONFIG.LANE_POSITIONS[newLane];
            playLaneChangeSound();

            // Add subtle lane change feedback
            if (cameraShake) cameraShake.addTrauma(0.1);
            if (typeof hapticFeedback !== 'undefined') {
                hapticFeedback.laneChange();
            }
        }
    },

    /**
     * Immediately start a jump by setting jump velocity and clamping to ground.
     * Plays the jump sound. Only called when the player is already grounded.
     */
    beginJump() {
        GameState.isJumping = true;
        GameState.jumpVelocity = CONFIG.JUMP_FORCE;
        GameState.jumpQueued = false;
        if (player) {
            player.position.y = Math.max(player.position.y, CONFIG.GROUND_Y + 0.02);
        }
        playJumpSound();
    },

    /**
     * Public jump entry point. Starts a jump if grounded, or queues a second jump
     * to fire the moment the player lands. Ignores input when paused.
     */
    jump() {
        if (!GameState.isPlaying || GameState.isPaused) return;
        if (!GameState.isJumping) {
            this.beginJump();
            return;
        }
        GameState.jumpQueued = true;
    },

    /**
     * Per-frame update: smooth lane transitions, apply tilt during movement,
     * process jump physics, and bob the player when grounded.
     * Also rotates playerGlow and playerRing continuously.
     * @param {number} delta - Seconds since last frame
     * @param {number} elapsed - Total seconds elapsed since game start
     */
    update(delta, elapsed) {
        // Smooth lane transition
        const diff = this.targetX - this.currentX;
        this.currentX += diff * Math.min(this.laneChangeSpeed * delta, 0.35);
        player.position.x = this.currentX;

        // Tilt effect during movement (tilt in direction of movement)
        const targetTilt = -diff * 0.3;
        player.rotation.z += (targetTilt - player.rotation.z) * 6 * delta;

        if (!GameState.isJumping && GameState.jumpQueued) {
            this.beginJump();
        }

        // Jump physics
        if (GameState.isJumping) {
            GameState.jumpVelocity -= CONFIG.GRAVITY * delta;
            player.position.y += GameState.jumpVelocity * delta;

            // Land
            if (player.position.y <= CONFIG.GROUND_Y + 0.001) {
                player.position.y = CONFIG.GROUND_Y;
                GameState.isJumping = false;
                GameState.jumpVelocity = 0;
                if (GameState.jumpQueued) {
                    this.beginJump();
                }
            }
        } else {
            // Smooth bobbing animation when not jumping
            this.bobOffset = Math.sin(elapsed * 6) * 0.08;
            player.position.y = CONFIG.GROUND_Y + this.bobOffset;
        }

        // Rotate effects
        if (playerGlow) {
            playerGlow.rotation.y += delta * 1.5;
        }
        if (playerRing) {
            playerRing.rotation.z += delta * 2;
        }
    },

    /**
     * Reset player position to center lane and clear all movement/jump state.
     * Called on game restart and when returning to main menu.
     */
    reset() {
        this.targetX = 0;
        this.currentX = 0;
        this.bobOffset = 0;
        GameState.currentLane = 1;
        GameState.isJumping = false;
        GameState.jumpVelocity = 0;
        GameState.jumpQueued = false;
        if (player) {
            player.position.set(0, CONFIG.GROUND_Y, 0);
            player.rotation.set(0, 0, 0);
        }
    }
};
