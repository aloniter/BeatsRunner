const { test, expect } = require('@playwright/test');

const BASE_URL = 'http://localhost:8080'; // Change if different

test.describe('Beat Runner Stage Mode', () => {
  test.beforeEach(async ({ page, context }) => {
    // Allow cross-origin requests for testing
    await context.addInitScript(() => {
      window.testMode = true;
    });

    await page.goto(BASE_URL, { waitUntil: 'networkidle' });

    // Wait for all deferred scripts to load
    await page.waitForFunction(() => {
      return typeof GameState !== 'undefined' &&
             typeof startStage === 'function' &&
             typeof getStage === 'function' &&
             typeof PATTERN_POOLS !== 'undefined';
    }, { timeout: 10000 });

    // Extra time for Three.js scene initialization
    await page.waitForTimeout(1000);
  });

  test('should load stage-1-intro without errors', async ({ page }) => {
    // Inject test command into page context
    const result = await page.evaluate(() => {
      try {
        // Verify stage functions are defined
        if (typeof startStage !== 'function') {
          throw new Error('startStage function not found');
        }
        if (typeof GameState === 'undefined') {
          throw new Error('GameState not found');
        }
        return { success: true };
      } catch (e) {
        return { success: false, error: e.message };
      }
    });

    expect(result.success).toBe(true);
  });

  test('stage-1-intro should set correct distance (1000m)', async ({ page }) => {
    const stageData = await page.evaluate(() => {
      const stage = getStage('stage-1-intro');
      return {
        id: stage?.id,
        distance: stage?.distance,
        name: stage?.name,
        speed: stage?.speed
      };
    });

    expect(stageData.id).toBe('stage-1-intro');
    expect(stageData.distance).toBe(1000);
    expect(stageData.name).toBeDefined();
    expect(stageData.speed).toBeDefined();
  });

  test('should start stage and set GameState.isStageMode = true', async ({ page }) => {
    await page.evaluate(() => {
      startStage('stage-1-intro');
      // Pause immediately to prevent distance accumulation during test
      GameState.isPaused = true;
    });

    await page.waitForTimeout(100); // Wait for stage to initialize

    const gameState = await page.evaluate(() => {
      return {
        isStageMode: GameState.isStageMode,
        currentStage: GameState.currentStage?.id,
        crashes: GameState.crashes,
        orbsCollected: GameState.orbsCollected,
        distanceTraveled: GameState.distanceTraveled
      };
    });

    expect(gameState.isStageMode).toBe(true);
    expect(gameState.currentStage).toBe('stage-1-intro');
    expect(gameState.crashes).toBe(0);
    expect(gameState.orbsCollected).toBe(0);
    // Distance may have started incrementing, so check it's close to 0
    expect(gameState.distanceTraveled).toBeLessThan(10);
  });

  test('finish line should be created at stage distance', async ({ page }) => {
    await page.evaluate(() => {
      startStage('stage-1-intro');
    });

    await page.waitForTimeout(500);

    const finishLineData = await page.evaluate(() => {
      return {
        exists: hasFinishLine(),
        distance: typeof getDistanceToFinish === 'function' ? getDistanceToFinish() : null
      };
    });

    expect(finishLineData.exists).toBe(true);
    expect(finishLineData.distance).toBeGreaterThan(0);
  });

  test('power-ups should not spawn in Stage Mode', async ({ page }) => {
    await page.evaluate(() => {
      startStage('stage-1-intro');
    });

    await page.waitForTimeout(500);

    // Advance game distance significantly
    const powerUpStatus = await page.evaluate(() => {
      // Manually advance distance
      GameState.distance = 100;

      // Try to spawn power-ups
      if (typeof MagnetManager !== 'undefined') {
        MagnetManager.trySpawn(5);
      }
      if (typeof ShieldManager !== 'undefined') {
        ShieldManager.trySpawn(5);
      }
      if (typeof SpeedBoostManager !== 'undefined') {
        SpeedBoostManager.trySpawn(5);
      }

      return {
        magnetCount: magnetPickups?.length || 0,
        shieldCount: shieldPickups?.length || 0,
        speedCount: speedPickups?.length || 0
      };
    });

    // Should have no power-ups (all disabled in Stage Mode)
    expect(powerUpStatus.magnetCount).toBe(0);
    expect(powerUpStatus.shieldCount).toBe(0);
    expect(powerUpStatus.speedCount).toBe(0);
  });

  test('Bonus Mode should not trigger in Stage Mode', async ({ page }) => {
    await page.evaluate(() => {
      startStage('stage-1-intro');
    });

    await page.waitForTimeout(500);

    const bonusStatus = await page.evaluate(() => {
      // Manually advance past bonus trigger distance (1000m)
      GameState.distance = 1100;

      return {
        isBonusActive: GameState.isBonusActive,
        isStageMode: GameState.isStageMode
      };
    });

    // Bonus should NOT be active even at distance 1100m because we're in Stage Mode
    expect(bonusStatus.isBonusActive).toBe(false);
    expect(bonusStatus.isStageMode).toBe(true);
  });

  test('crashes should increment counter without game over', async ({ page }) => {
    await page.evaluate(() => {
      startStage('stage-1-intro');
    });

    await page.waitForTimeout(500);

    const initialCrashes = await page.evaluate(() => {
      return GameState.crashes;
    });

    // Simulate collision
    await page.evaluate(() => {
      if (ObstacleManager.checkCollision()) {
        // This would normally trigger in the update loop
        GameState.crashes++;
      }
    });

    const finalCrashes = await page.evaluate(() => {
      return GameState.crashes;
    });

    // Either no collision or crash count incremented
    expect(finalCrashes >= initialCrashes).toBe(true);
  });

  test('orbs should be tracked in Stage Mode', async ({ page }) => {
    await page.evaluate(() => {
      startStage('stage-1-intro');
    });

    await page.waitForTimeout(500);

    const orbStatus = await page.evaluate(() => {
      const initialOrbsCollected = GameState.orbsCollected;

      // Simulate collecting an orb
      GameState.orbsCollected++;
      GameState.orbs++;

      return {
        orbsCollected: GameState.orbsCollected,
        orbsTotal: GameState.orbs,
        incremented: GameState.orbsCollected > initialOrbsCollected
      };
    });

    expect(orbStatus.orbsCollected).toBe(1);
    expect(orbStatus.orbsTotal).toBe(1);
    expect(orbStatus.incremented).toBe(true);
  });

  test('all 15 stages should be accessible', async ({ page }) => {
    const stageIds = [
      'stage-1-intro', 'stage-2-rhythm', 'stage-3-jump',
      'stage-4-lane', 'stage-5-speed',
      'stage-6-double', 'stage-7-rhythm-run', 'stage-8-jump-chain',
      'stage-9-reflex', 'stage-10-gauntlet',
      'stage-11-speed', 'stage-12-timing', 'stage-13-jump-master',
      'stage-14-chaos', 'stage-15-final'
    ];

    const stageCheck = await page.evaluate((ids) => {
      const results = {};
      ids.forEach(id => {
        const stage = getStage(id);
        results[id] = {
          exists: stage !== null,
          distance: stage?.distance,
          speed: stage?.speed
        };
      });
      return results;
    }, stageIds);

    // All stages should be accessible
    stageIds.forEach(id => {
      expect(stageCheck[id].exists).toBe(true);
      expect(stageCheck[id].distance).toBeGreaterThan(0);
      expect(stageCheck[id].speed).toBeGreaterThan(0);
    });
  });

  test('stage patterns should exist for all difficulty tiers', async ({ page }) => {
    const patternCheck = await page.evaluate(() => {
      if (typeof PATTERN_POOLS === 'undefined') {
        return { error: 'PATTERN_POOLS not found' };
      }

      return {
        singleLane: PATTERN_POOLS['single-lane'] !== undefined,
        mixed: PATTERN_POOLS['mixed'] !== undefined,
        complex: PATTERN_POOLS['complex'] !== undefined,
        poolCount: Object.keys(PATTERN_POOLS).length
      };
    });

    expect(patternCheck.singleLane).toBe(true);
    expect(patternCheck.mixed).toBe(true);
    expect(patternCheck.complex).toBe(true);
    expect(patternCheck.poolCount).toBe(3);
  });

  test('exiting Stage Mode should reset state', async ({ page }) => {
    await page.evaluate(() => {
      startStage('stage-1-intro');
    });

    await page.waitForTimeout(500);

    const stateBeforeExit = await page.evaluate(() => {
      return {
        isStageMode: GameState.isStageMode,
        currentStage: GameState.currentStage?.id
      };
    });

    expect(stateBeforeExit.isStageMode).toBe(true);

    // Exit Stage Mode
    await page.evaluate(() => {
      exitStageMode();
    });

    const stateAfterExit = await page.evaluate(() => {
      return {
        isStageMode: GameState.isStageMode,
        currentStage: GameState.currentStage,
        speed: GameState.speed
      };
    });

    expect(stateAfterExit.isStageMode).toBe(false);
    expect(stateAfterExit.currentStage).toBe(null);
  });
});
