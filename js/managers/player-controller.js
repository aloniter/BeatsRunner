// Player Movement Controller
// ========================================
const PlayerController = {
    targetX: 0,
    currentX: 0,
    laneChangeSpeed: 12,
    bobOffset: 0,

    // direction: +1 = move RIGHT (higher X), -1 = move LEFT (lower X)
    switchLane(direction) {
        if (!GameState.isPlaying) return;

        const newLane = GameState.currentLane + direction;
        if (newLane >= 0 && newLane <= 2) {
            GameState.currentLane = newLane;
            this.targetX = CONFIG.LANE_POSITIONS[newLane];
            playLaneChangeSound();
        }
    },

    beginJump() {
        GameState.isJumping = true;
        GameState.jumpVelocity = CONFIG.JUMP_FORCE;
        GameState.jumpQueued = false;
        if (player) {
            player.position.y = Math.max(player.position.y, CONFIG.GROUND_Y + 0.02);
        }
        playJumpSound();
    },

    jump() {
        if (!GameState.isPlaying || GameState.isPaused) return;
        if (!GameState.isJumping) {
            this.beginJump();
            return;
        }
        GameState.jumpQueued = true;
    },

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
