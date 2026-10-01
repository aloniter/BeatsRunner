/* ========================================
   BEAT RUNNER - Finish Line System
   Stage Mode: neon finish gate, crossing celebration
   and a short outro before the results screen
   ======================================== */

/**
 * Finish Line System
 *
 * The world scrolls toward the player (who stays near z = 0), so the gate is
 * placed (metersRemaining * WORLD_PER_METER) ahead and slides in with the track.
 * GameState.distance grows at speed * 0.5 while the world moves at speed,
 * hence 2 world units per meter.
 *
 * Crossing the gate saves progress immediately, then plays an outro
 * (GameState.isFinishing): the ball rolls on and slows down, the camera pulls
 * back and a STAGE CLEAR banner shows the stars, then the results screen opens.
 *
 * CRITICAL: Only active when GameState.isStageMode === true
 * Free Run mode completely bypasses this system
 */

const FINISH = {
  WORLD_PER_METER: 2,
  HIDE_BEYOND_Z: 200,      // don't draw the gate until it is near the fog line
  CLEAR_BEFORE_Z: 26,      // no obstacles/orbs in the last stretch before the gate
  CALLOUT_METERS: 70,      // "FINAL STRETCH" callout
  HALF_WIDTH: 7.3,         // pillars sit just outside the 14-wide track
  HEIGHT: 8,
  OUTRO_SECONDS: 2.4,      // crossing -> results
  SLOWDOWN_SECONDS: 1.5,
  END_SPEED_FACTOR: 0.22,
  STAR_TIMES: [0.45, 0.7, 0.95],  // banner star pops (match CSS delays)
  CAMERA_RISE: new THREE.Vector3(0, 2.2, -3.2),
};

// Finish line state
let finishLineGroup = null;
let finishLineDistance = 0;
let finishLineCrossed = false;
let finishCalloutShown = false;

// Outro state (null when no outro is running)
let finishOutro = null;

const _finishCamPos = new THREE.Vector3();
const _finishCamLook = new THREE.Vector3();

function finishPrefersReducedMotion() {
  return window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

// ---------- Textures (drawn once per gate on small canvases) ----------

function makeFinishSignTexture(isFinale) {
  const c = document.createElement('canvas');
  c.width = 1024;
  c.height = 256;
  const g = c.getContext('2d');
  const main = isFinale ? '#ffd23f' : '#ff3fd6';
  const edge = isFinale ? '#ffb000' : '#3ee8ff';

  // Panel
  g.fillStyle = 'rgba(12, 4, 28, 0.82)';
  g.beginPath();
  if (g.roundRect) g.roundRect(24, 24, 976, 208, 36);
  else g.rect(24, 24, 976, 208);
  g.fill();

  // Neon frame
  g.lineWidth = 10;
  g.strokeStyle = edge;
  g.shadowColor = edge;
  g.shadowBlur = 28;
  g.stroke();

  // Text
  g.font = '900 150px "Arial Rounded MT Bold", "Segoe UI", Roboto, Arial, sans-serif';
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  g.shadowColor = main;
  g.shadowBlur = 40;
  g.fillStyle = main;
  g.fillText(isFinale ? 'FINALE' : 'FINISH', 512, 136);
  g.shadowBlur = 12;
  g.fillStyle = '#fff4fd';
  g.fillText(isFinale ? 'FINALE' : 'FINISH', 512, 136);

  const tex = new THREE.CanvasTexture(c);
  tex.anisotropy = 4;
  return tex;
}

function makeFinishCurtainTexture(colorHex) {
  const c = document.createElement('canvas');
  c.width = 4;
  c.height = 256;
  const g = c.getContext('2d');
  const grad = g.createLinearGradient(0, 0, 0, 256);
  grad.addColorStop(0, 'rgba(255,255,255,0)');
  grad.addColorStop(0.55, 'rgba(255,255,255,0.35)');
  grad.addColorStop(1, 'rgba(255,255,255,0.9)');
  g.fillStyle = grad;
  g.fillRect(0, 0, 4, 256);
  // scanlines
  g.fillStyle = 'rgba(0,0,0,0.55)';
  for (let y = 0; y < 256; y += 8) g.fillRect(0, y, 4, 3);
  const tex = new THREE.CanvasTexture(c);
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(1, 3);
  return tex;
}

function makeFinishCheckerTexture(isFinale) {
  const cell = 64;
  const cols = 12;
  const rows = 2;
  const c = document.createElement('canvas');
  c.width = cols * cell;
  c.height = rows * cell;
  const g = c.getContext('2d');
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      g.fillStyle = (x + y) % 2 === 0 ? '#f4fbff' : '#0b0720';
      g.fillRect(x * cell, y * cell, cell, cell);
    }
  }
  const edge = isFinale ? '#ffb000' : '#ff3fd6';
  g.fillStyle = edge;
  g.fillRect(0, 0, c.width, 6);
  g.fillRect(0, c.height - 6, c.width, 6);
  return new THREE.CanvasTexture(c);
}

/**
 * Create finish line gate
 * @param {number} distance - Distance in meters where finish line appears
 * @returns {THREE.Group} Finish line group
 */
function createFinishLine(distance) {
  // Clean up existing finish line (and any outro) if any
  destroyFinishLine();

  finishLineDistance = distance;
  finishLineCrossed = false;
  finishCalloutShown = false;

  const isFinale = !!(GameState.currentStage && GameState.currentStage.isFinale);
  const coreColor = isFinale ? 0xffd700 : 0xff2fd0;   // Gold or Magenta
  const glowColor = isFinale ? 0xffaa00 : 0x3ee8ff;   // Orange or Cyan

  const group = new THREE.Group();
  group.visible = false;
  const W = FINISH.HALF_WIDTH;
  const H = FINISH.HEIGHT;

  const coreMat = new THREE.MeshBasicMaterial({ color: coreColor });
  const glowMat = new THREE.MeshBasicMaterial({
    color: glowColor,
    transparent: true,
    opacity: 0.28,
    blending: THREE.AdditiveBlending,
    depthWrite: false
  });
  const baseMat = new THREE.MeshBasicMaterial({ color: 0x150a2a });

  // Pillars: dark base, bright core, soft additive glow
  [-W, W].forEach(x => {
    const base = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.7, 1.4), baseMat);
    base.position.set(x, 0.35, 0);
    group.add(base);

    const core = new THREE.Mesh(new THREE.BoxGeometry(0.45, H, 0.45), coreMat);
    core.position.set(x, H / 2, 0);
    group.add(core);

    const glow = new THREE.Mesh(new THREE.BoxGeometry(1.3, H + 0.4, 1.3), glowMat);
    glow.position.set(x, H / 2, 0);
    glow.userData.pulse = true;
    group.add(glow);
  });

  // Top beam
  const beam = new THREE.Mesh(new THREE.BoxGeometry(W * 2 + 0.45, 0.45, 0.45), coreMat);
  beam.position.set(0, H, 0);
  group.add(beam);
  const beamGlow = new THREE.Mesh(new THREE.BoxGeometry(W * 2 + 1.3, 1.3, 1.3), glowMat);
  beamGlow.position.set(0, H, 0);
  beamGlow.userData.pulse = true;
  group.add(beamGlow);

  // FINISH sign sitting on the beam
  const signMat = new THREE.MeshBasicMaterial({
    map: makeFinishSignTexture(isFinale),
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide
  });
  const sign = new THREE.Mesh(new THREE.PlaneGeometry(9, 2.25), signMat);
  sign.position.set(0, H + 1.5, 0);
  sign.rotation.y = Math.PI; // planes face +z; the camera looks down +z from behind
  group.add(sign);

  // Light curtain between the pillars (scrolling scanlines)
  const curtainMat = new THREE.MeshBasicMaterial({
    map: makeFinishCurtainTexture(glowColor),
    color: glowColor,
    transparent: true,
    opacity: 0.3,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    side: THREE.DoubleSide
  });
  const curtain = new THREE.Mesh(new THREE.PlaneGeometry(W * 2, H), curtainMat);
  curtain.position.set(0, H / 2, 0);
  group.add(curtain);

  // Checkered strip across the track
  const checkerMat = new THREE.MeshBasicMaterial({ map: makeFinishCheckerTexture(isFinale) });
  const checker = new THREE.Mesh(new THREE.PlaneGeometry(14, 2.4), checkerMat);
  checker.rotation.x = -Math.PI / 2;
  checker.position.set(0, 0.03, 0);
  group.add(checker);

  // Shockwave ring (hidden until the crossing)
  const ringMat = new THREE.MeshBasicMaterial({
    color: glowColor,
    transparent: true,
    opacity: 0,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    side: THREE.DoubleSide
  });
  const ring = new THREE.Mesh(new THREE.RingGeometry(5.2, 5.7, 64), ringMat);
  ring.position.set(0, H / 2, 0);
  group.add(ring);

  createFinishLineParticles(group);

  group.userData = { ...group.userData, curtain, ring, sign, glowMat, curtainMat };
  finishLineGroup = group;
  positionFinishLine();

  if (typeof scene !== 'undefined') {
    scene.add(group);
  }

  return group;
}

/**
 * Create sparkle particles around the gate
 * @param {THREE.Group} parent - Parent group to add particles to
 */
function createFinishLineParticles(parent) {
  const particleCount = 70;
  const geometry = new THREE.BufferGeometry();
  const positions = new Float32Array(particleCount * 3);

  for (let i = 0; i < particleCount; i++) {
    positions[i * 3] = (Math.random() - 0.5) * 17;
    positions[i * 3 + 1] = Math.random() * 11;
    positions[i * 3 + 2] = (Math.random() - 0.5) * 3;
  }

  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

  const material = new THREE.PointsMaterial({
    color: 0xffffff,
    size: 0.25,
    transparent: true,
    opacity: 0.85,
    blending: THREE.AdditiveBlending,
    depthWrite: false
  });

  const particles = new THREE.Points(geometry, material);
  parent.add(particles);
  parent.userData.particles = particles;
}

/** World z of the gate relative to the player (who stays near z = 0) */
function getFinishLineZ() {
  if (!finishLineGroup) return null;
  return (finishLineDistance - GameState.distance) * FINISH.WORLD_PER_METER;
}

/**
 * True when a spawn at world z would land in the final stretch or past the gate.
 * ObstacleManager uses this to keep the finish approach clear.
 */
function isInFinishClearZone(z) {
  if (!GameState.isStageMode || !finishLineGroup) return false;
  return z > getFinishLineZ() - FINISH.CLEAR_BEFORE_Z;
}

function positionFinishLine() {
  if (!finishLineGroup) return;
  const z = getFinishLineZ();
  finishLineGroup.position.z = z;
  finishLineGroup.visible = z < FINISH.HIDE_BEYOND_Z && z > -40;
}

/**
 * Update finish line (called each frame in Stage Mode)
 * Moves the gate with the world and checks for crossing
 */
function updateFinishLine() {
  // Only run in Stage Mode
  if (!GameState.isStageMode) return;

  // Check if finish line exists
  if (!finishLineGroup) return;

  positionFinishLine();
  animateFinishLineGlow();

  const remaining = finishLineDistance - GameState.distanceTraveled;
  if (!finishCalloutShown && remaining <= FINISH.CALLOUT_METERS && remaining > 5) {
    finishCalloutShown = true;
    showFinishCallout();
  }

  // Check if player crossed finish line
  if (!finishLineCrossed && GameState.distanceTraveled >= finishLineDistance) {
    onFinishLineCrossed();
  }
}

/**
 * Animate finish line glow (pulsing effect, scrolling curtain, sparkles)
 */
function animateFinishLineGlow() {
  if (!finishLineGroup || !finishLineGroup.visible) return;

  const time = performance.now() / 1000;
  const pulse = Math.sin(time * 3) * 0.2 + 0.8; // 0.6 .. 1.0
  const ud = finishLineGroup.userData;

  if (ud.glowMat) ud.glowMat.opacity = 0.28 * pulse;
  if (ud.curtainMat && ud.curtainMat.map) ud.curtainMat.map.offset.y = (time * 0.6) % 1;
  if (ud.particles) ud.particles.rotation.y += 0.01;
}

// ---------- HUD callouts ----------

function showFinishCallout() {
  const el = document.getElementById('finish-callout');
  if (!el) return;
  el.classList.remove('is-visible');
  void el.offsetWidth;
  el.classList.add('is-visible');
  clearTimeout(el._hideTimer);
  el._hideTimer = setTimeout(() => el.classList.remove('is-visible'), 1600);
}

function showStageClearBanner(stage, stars) {
  const el = document.getElementById('stage-clear-banner');
  if (!el) return;
  const starsEl = document.getElementById('stage-clear-stars');
  const subEl = document.getElementById('stage-clear-sub');
  const titleEl = document.getElementById('stage-clear-title');
  if (titleEl) titleEl.textContent = stage.isFinale ? 'DISTRICT CLEAR!' : 'STAGE CLEAR!';
  if (subEl) subEl.textContent = `Stage ${stage.order} · ${stage.name}`;
  if (starsEl) {
    let html = '';
    for (let i = 0; i < 3; i++) {
      html += `<span class="stage-clear__star${i < stars ? ' is-earned' : ''}" style="--i:${i}">★</span>`;
    }
    starsEl.innerHTML = html;
  }
  el.classList.toggle('is-finale', !!stage.isFinale);
  el.classList.remove('is-visible');
  void el.offsetWidth;
  el.classList.add('is-visible');
  el.setAttribute('aria-hidden', 'false');
}

function hideStageClearBanner() {
  const el = document.getElementById('stage-clear-banner');
  if (el) {
    el.classList.remove('is-visible');
    el.setAttribute('aria-hidden', 'true');
  }
  const callout = document.getElementById('finish-callout');
  if (callout) callout.classList.remove('is-visible');
}

// ---------- Sound ----------

/** Short bright arpeggio for regular stages (the finale keeps playVictoryFanfare) */
function playStageClearSound() {
  if (typeof audioContext === 'undefined' || !audioContext) return;
  try {
    const out = (typeof gainNode !== 'undefined' && gainNode) ? gainNode : audioContext.destination;
    const now = audioContext.currentTime;
    [[784, 0], [988, 0.09], [1175, 0.18], [1568, 0.3]].forEach(([freq, t]) => {
      const osc = audioContext.createOscillator();
      const g = audioContext.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + t);
      g.gain.setValueAtTime(0, now + t);
      g.gain.linearRampToValueAtTime(0.18, now + t + 0.02);
      g.gain.exponentialRampToValueAtTime(0.001, now + t + 0.45);
      osc.connect(g);
      g.connect(out);
      osc.start(now + t);
      osc.stop(now + t + 0.5);
    });
  } catch (e) {
    if (typeof DEBUG !== 'undefined' && DEBUG) console.warn('Audio: playStageClearSound failed:', e.message);
  }
}

function playStarPopSound(index) {
  if (typeof playTimingSound === 'function') {
    playTimingSound(index === 2 ? 'PERFECT' : 'GOOD');
  }
}

// ---------- Crossing ----------

/**
 * Trigger when player crosses finish line
 * Saves progress right away, then starts the outro (results open when it ends)
 */
function onFinishLineCrossed() {
  finishLineCrossed = true;

  // Calculate stars
  const currentStage = GameState.currentStage;
  if (!currentStage) {
    GameState.isPlaying = false;
    console.error('No current stage set!');
    return;
  }

  // Stop tutorial if active
  if (typeof TutorialOverlay !== 'undefined') {
    TutorialOverlay.stop(currentStage.id);
  }

  const stars = typeof calculateStars === 'function'
    ? calculateStars(
      GameState.crashes,
      GameState.orbsCollected,
      currentStage.totalOrbs,
      currentStage
    )
    : 1;

  // Does finishing this stage open the next one? (read before saving; drives the map transition)
  const nextStage = typeof getNextStage === 'function' ? getNextStage(currentStage.id) : null;
  const unlockedNext = !!nextStage && typeof isStageUnlocked === 'function' && !isStageUnlocked(nextStage.id);

  // Save progress now, so closing the app during the outro never loses the result
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

  startFinishOutro({ stage: currentStage, stars, newReward, unlockedNext });
}

function startFinishOutro({ stage, stars, newReward, unlockedNext }) {
  const reduced = finishPrefersReducedMotion();
  const gatePos = finishLineGroup ? finishLineGroup.position.clone() : new THREE.Vector3(0, 0, 0);

  // No pausing / steering UI during the celebration
  if (typeof pauseBtn !== 'undefined' && pauseBtn) pauseBtn.style.display = 'none';
  if (typeof pauseHomeBtn !== 'undefined' && pauseHomeBtn) pauseHomeBtn.classList.remove('is-visible');
  if (typeof mobileControls !== 'undefined' && mobileControls) mobileControls.style.display = 'none';

  // Camera: remember the gameplay framing so it can be restored exactly
  let camBase = null;
  let camLook = null;
  if (typeof camera !== 'undefined' && camera && typeof cameraShake !== 'undefined' && cameraShake) {
    camBase = cameraShake.originalPosition.clone();
    const dir = new THREE.Vector3();
    camera.getWorldDirection(dir);
    camLook = camBase.clone().add(dir.multiplyScalar(35));
  }

  finishOutro = {
    t: 0,
    stage,
    stars,
    newReward,
    unlockedNext,
    reduced,
    startSpeed: GameState.speed,
    starsPlayed: 0,
    camBase,
    camLook,
    musicStartVolume: (typeof bgMusic !== 'undefined' && bgMusic) ? bgMusic.volume : null
  };
  GameState.isFinishing = true;

  // Big moment: flash, shockwave, bursts, sound, haptics, hop
  flashScreen(0.45, stage.isFinale ? '#FFD700' : '#bff9ff');
  if (stage.isFinale && typeof playVictoryFanfare === 'function') {
    playVictoryFanfare();
  } else {
    playStageClearSound();
  }
  if (!reduced && cameraShake) cameraShake.addTrauma(stage.isFinale ? 0.8 : 0.45);
  if (typeof hapticFeedback !== 'undefined') hapticFeedback.victory();

  if (typeof createParticleBurst === 'function') {
    const base = qualitySettings?.effects?.particleBurstCounts?.victory || 50;
    const colors = stage.isFinale ? [0xffdd00, 0xffaa00, 0xffffff] : [0xff3fd6, 0x3ee8ff, 0xffdd00];
    [-4.5, 0, 4.5].forEach((x, i) => {
      createParticleBurst(new THREE.Vector3(x, 3 + (i === 1 ? 2 : 0), gatePos.z + 1), {
        count: Math.round(base * (stage.isFinale ? 0.8 : 0.55)),
        color: colors[i],
        spread: 2.2,
        duration: 1.4
      });
    });
  }

  if (typeof PlayerController !== 'undefined' && !GameState.isJumping) {
    PlayerController.jump();
  }

  showStageClearBanner(stage, stars);
}

/**
 * One frame of the outro (called by updateGame instead of normal gameplay)
 */
function updateFinishOutro(delta, elapsed) {
  const o = finishOutro;
  if (!o) {
    GameState.isFinishing = false;
    return;
  }
  o.t += delta;

  // Ease the run down instead of stopping dead
  const k = Math.min(1, o.t / FINISH.SLOWDOWN_SECONDS);
  const ease = 1 - Math.pow(1 - k, 3);
  GameState.speed = o.startSpeed * (1 - ease * (1 - FINISH.END_SPEED_FACTOR));
  const moveAmount = GameState.speed * delta;

  // Keep the world rolling (no spawning, no collisions, no distance/HUD changes)
  if (typeof scrollTrack === 'function') scrollTrack(moveAmount);
  for (let i = 0; i < obstacles.length; i++) obstacles[i].position.z -= moveAmount;
  for (let i = 0; i < collectibles.length; i++) collectibles[i].position.z -= moveAmount;
  if (finishLineGroup) {
    finishLineGroup.position.z -= moveAmount;
    finishLineGroup.visible = finishLineGroup.position.z > -40;
    animateFinishLineGlow();

    // Shockwave ring + curtain flash
    const ud = finishLineGroup.userData;
    const r = Math.min(1, o.t / 0.7);
    if (ud.ring) {
      ud.ring.scale.setScalar(1 + r * 1.8);
      ud.ring.material.opacity = 0.9 * (1 - r);
    }
    if (ud.curtainMat) ud.curtainMat.opacity = 0.3 + 0.7 * Math.max(0, 1 - o.t / 0.5);
  }

  BeatManager.update(elapsed);
  PlayerController.update(delta, elapsed);
  if (typeof SkinAnimator !== 'undefined') SkinAnimator.update(delta, elapsed);

  // Camera pulls back and up a little
  if (!o.reduced && o.camBase && o.camLook) {
    const c = 1 - Math.pow(1 - Math.min(1, o.t / 1.6), 3);
    _finishCamPos.copy(o.camBase).addScaledVector(FINISH.CAMERA_RISE, c);
    cameraShake.setBasePosition(_finishCamPos);
    if (cameraShake.trauma <= 0) camera.position.copy(_finishCamPos);
    _finishCamLook.copy(o.camLook);
    _finishCamLook.y -= 1.2 * c;
    camera.lookAt(_finishCamLook);
  }

  // Music fades under the celebration
  if (o.musicStartVolume !== null && bgMusic) {
    bgMusic.volume = o.musicStartVolume * Math.max(0.3, 1 - o.t / FINISH.OUTRO_SECONDS);
  }

  // Banner stars pop one by one (sounds only for earned stars)
  while (o.starsPlayed < 3 && o.t >= FINISH.STAR_TIMES[o.starsPlayed]) {
    if (o.starsPlayed < o.stars) playStarPopSound(o.starsPlayed);
    o.starsPlayed++;
  }

  if (o.t >= FINISH.OUTRO_SECONDS) {
    endFinishOutro();
  }
}

/**
 * Outro finished: stop the run and open the results screen
 */
function endFinishOutro() {
  const o = finishOutro;
  if (!o) return;

  GameState.isPlaying = false;
  stopFinishOutro();

  // Results pauses the music; restore the player's volume for next time
  if (typeof showStageResults === 'function') {
    showStageResults(o.stars, o.newReward, o.unlockedNext);
  } else {
    console.log('STAGE COMPLETE!', o.stars);
  }
  if (o.musicStartVolume !== null && bgMusic) bgMusic.volume = o.musicStartVolume;
}

/**
 * Clear outro state and put the camera back (safe to call any time)
 */
function stopFinishOutro() {
  const o = finishOutro;
  finishOutro = null;
  GameState.isFinishing = false;
  hideStageClearBanner();
  if (o && o.camBase && typeof camera !== 'undefined' && camera) {
    cameraShake.setBasePosition(o.camBase);
    camera.position.copy(o.camBase);
    if (o.camLook) camera.lookAt(o.camLook);
  }
  if (o && o.musicStartVolume !== null && typeof bgMusic !== 'undefined' && bgMusic) {
    bgMusic.volume = o.musicStartVolume;
  }
}

/**
 * Destroy finish line (cleanup)
 */
function destroyFinishLine() {
  stopFinishOutro();

  if (finishLineGroup) {
    if (typeof scene !== 'undefined') {
      scene.remove(finishLineGroup);
    }

    // Dispose geometries, materials and canvas textures
    finishLineGroup.traverse((child) => {
      if (child.geometry) child.geometry.dispose();
      if (child.material) {
        const mats = Array.isArray(child.material) ? child.material : [child.material];
        mats.forEach((mat) => {
          if (mat.map) mat.map.dispose();
          mat.dispose();
        });
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
  stopFinishOutro();
  finishLineCrossed = false;
  finishCalloutShown = false;
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
    getDistanceToFinish,
    getFinishLineZ,
    isInFinishClearZone,
    updateFinishOutro
  };
}
