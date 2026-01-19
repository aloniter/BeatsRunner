/* ========================================
   BEAT RUNNER - Finish Line System
   Stage Mode: Glowing archway + detection
   ======================================== */

/**
 * Finish Line System
 * Creates a glowing archway at stage.distance and triggers completion
 *
 * CRITICAL: Only active when GameState.isStageMode === true
 * Free Run mode completely bypasses this system
 */

// Finish line state
let finishLineGroup = null;
let finishLineDistance = 0;
let finishLineCrossed = false;

/**
 * Create finish line archway
 * @param {number} distance - Distance in meters where finish line appears
 * @returns {THREE.Group} Finish line group
 */
function createFinishLine(distance) {
  // Clean up existing finish line if any
  destroyFinishLine();

  finishLineDistance = distance;
  finishLineCrossed = false;

  // Create group for finish line
  const group = new THREE.Group();
  group.position.z = distance;
  group.position.y = 0;

  // Create archway structure
  const archWidth = 10; // Spans all 3 lanes
  const archHeight = 8;
  const archThickness = 0.3;

  // Finale Effect: Gold/Orange instead of Pink/Cyan
  const isFinale = GameState.currentStage && GameState.currentStage.isFinale;
  const finishColor = isFinale ? 0xFFD700 : 0xff00ff; // Gold or Magenta
  const glowColor = isFinale ? 0xFFAA00 : 0x00ffff;   // Orange or Cyan

  // Material: Glowing neon
  const glowMaterial = new THREE.MeshBasicMaterial({
    color: finishColor,
    transparent: true,
    opacity: 0.9
  });

  // Left pillar
  const leftPillar = new THREE.Mesh(
    new THREE.BoxGeometry(archThickness, archHeight, archThickness),
    glowMaterial
  );
  leftPillar.position.set(-archWidth / 2, archHeight / 2, 0);
  group.add(leftPillar);

  // Right pillar
  const rightPillar = new THREE.Mesh(
    new THREE.BoxGeometry(archThickness, archHeight, archThickness),
    glowMaterial
  );
  rightPillar.position.set(archWidth / 2, archHeight / 2, 0);
  group.add(rightPillar);

  // Top beam
  const topBeam = new THREE.Mesh(
    new THREE.BoxGeometry(archWidth, archThickness, archThickness),
    glowMaterial
  );
  topBeam.position.set(0, archHeight, 0);
  group.add(topBeam);

  // Create glow effect (larger transparent boxes)
  const glowGeometry = new THREE.BoxGeometry(archThickness * 3, archHeight, archThickness * 3);
  const glowMat = new THREE.MeshBasicMaterial({
    color: glowColor,
    transparent: true,
    opacity: 0.3,
    blending: THREE.AdditiveBlending
  });

  const leftGlow = new THREE.Mesh(glowGeometry, glowMat);
  leftGlow.position.copy(leftPillar.position);
  group.add(leftGlow);

  const rightGlow = new THREE.Mesh(glowGeometry, glowMat);
  rightGlow.position.copy(rightPillar.position);
  group.add(rightGlow);

  // Add particles/sparkles (optional visual flair)
  createFinishLineParticles(group);

  // Store reference
  finishLineGroup = group;

  // Add to scene
  if (typeof scene !== 'undefined') {
    scene.add(group);
  }

  return group;
}

/**
 * Create particle effects around finish line
 * @param {THREE.Group} parent - Parent group to add particles to
 */
function createFinishLineParticles(parent) {
  const particleCount = 50;
  const geometry = new THREE.BufferGeometry();
  const positions = new Float32Array(particleCount * 3);

  for (let i = 0; i < particleCount; i++) {
    // Random positions around archway
    positions[i * 3] = (Math.random() - 0.5) * 12; // x
    positions[i * 3 + 1] = Math.random() * 8; // y
    positions[i * 3 + 2] = (Math.random() - 0.5) * 2; // z
  }

  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

  const material = new THREE.PointsMaterial({
    color: 0xffffff,
    size: 0.2,
    transparent: true,
    opacity: 0.8,
    blending: THREE.AdditiveBlending
  });

  const particles = new THREE.Points(geometry, material);
  parent.add(particles);

  // Store for animation (optional)
  parent.userData.particles = particles;
}

/**
 * Update finish line (called each frame in Stage Mode)
 * Checks for player crossing the finish line
 */
function updateFinishLine() {
  // Only run in Stage Mode
  if (!GameState.isStageMode) return;

  // Check if finish line exists
  if (!finishLineGroup) return;

  // Animate glow (pulsing effect)
  animateFinishLineGlow();

  // Check if player crossed finish line
  if (!finishLineCrossed && GameState.distanceTraveled >= finishLineDistance) {
    onFinishLineCrossed();
  }
}

/**
 * Animate finish line glow (pulsing effect)
 */
function animateFinishLineGlow() {
  if (!finishLineGroup) return;

  const time = performance.now() / 1000;
  const pulse = Math.sin(time * 3) * 0.2 + 0.8; // Oscillate between 0.6 and 1.0

  // Pulse glow opacity
  finishLineGroup.children.forEach((child) => {
    if (child.material && child.material.transparent) {
      // Only affect glow materials (not main structure)
      if (child.material.opacity < 0.5) {
        child.material.opacity = 0.3 * pulse;
      }
    }
  });

  // Rotate particles (if they exist)
  if (finishLineGroup.userData.particles) {
    finishLineGroup.userData.particles.rotation.y += 0.01;
  }
}

/**
 * Trigger when player crosses finish line
 */
function onFinishLineCrossed() {
  finishLineCrossed = true;

  // Stop game
  GameState.isPlaying = false;

  // Stop tutorial if active
  if (typeof TutorialOverlay !== 'undefined' && GameState.currentStage) {
    TutorialOverlay.stop(GameState.currentStage.id);
  }

  // Calculate stars
  const currentStage = GameState.currentStage;
  if (!currentStage) {
    console.error('No current stage set!');
    return;
  }

  // Play victory fanfare for Stage 15 finale
  if (currentStage.isFinale && typeof playVictoryFanfare === 'function') {
    playVictoryFanfare();
    flashScreen(0.3, '#FFD700'); // Gold flash
  }

  // Import star calculator (assumes it's loaded)
  const stars = typeof calculateStars === 'function'
    ? calculateStars(
      GameState.crashes,
      GameState.orbsCollected,
      currentStage.totalOrbs,
      currentStage
    )
    : 1;

  // Save progress (assumes stage-progress.js is loaded)
  let newReward = null;
  if (typeof saveProgress === 'function') {
    newReward = saveProgress(
      currentStage.id,
      stars,
      GameState.crashes,
      GameState.orbsCollected,
      currentStage.totalOrbs
    );
  }

  // Show results screen (assumes results screen exists)
  if (typeof showStageResults === 'function') {
    showStageResults(stars, newReward);
  } else {
    // Fallback: Log to console if Results screen not implemented yet
    console.log('STAGE COMPLETE!');
    console.log('Stars:', stars);
    console.log('Crashes:', GameState.crashes);
    console.log('Orbs:', GameState.orbsCollected, '/', currentStage.totalOrbs);
    if (newReward) {
      console.log('NEW REWARD UNLOCKED:', newReward.name);
    }

    // For Week 1 testing: Show alert (will be replaced by Results screen in Week 3)
    setTimeout(() => {
      alert(
        `STAGE COMPLETE!\n\n` +
        `⭐ ${stars} Star${stars > 1 ? 's' : ''}!\n\n` +
        `Crashes: ${GameState.crashes}\n` +
        `Orbs: ${GameState.orbsCollected}/${currentStage.totalOrbs}\n\n` +
        (newReward ? `🎉 NEW REWARD: ${newReward.name}!` : '')
      );
    }, 500);
  }
}

/**
 * Destroy finish line (cleanup)
 */
function destroyFinishLine() {
  if (finishLineGroup) {
    if (typeof scene !== 'undefined') {
      scene.remove(finishLineGroup);
    }

    // Dispose geometries and materials
    finishLineGroup.traverse((child) => {
      if (child.geometry) child.geometry.dispose();
      if (child.material) {
        if (Array.isArray(child.material)) {
          child.material.forEach((mat) => mat.dispose());
        } else {
          child.material.dispose();
        }
      }
    });

    finishLineGroup = null;
  }

  finishLineCrossed = false;
}

/**
 * Reset finish line state (for replaying stage)
 */
function resetFinishLine() {
  finishLineCrossed = false;
  // Finish line group stays in scene, just reset crossed flag
}

/**
 * Check if finish line exists
 * @returns {boolean} True if finish line is created
 */
function hasFinishLine() {
  return finishLineGroup !== null;
}

/**
 * Get distance to finish line
 * @returns {number} Distance remaining (negative if crossed)
 */
function getDistanceToFinish() {
  if (!GameState.isStageMode || !finishLineGroup) return -1;
  return finishLineDistance - GameState.distanceTraveled;
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    createFinishLine,
    updateFinishLine,
    destroyFinishLine,
    resetFinishLine,
    hasFinishLine,
    getDistanceToFinish
  };
}
