# Beat Runner Stage Mode - Testing Setup

## Overview

Playwright MCP is now integrated into the project for automated testing of Stage Mode features. This allows us to test:

- ✅ Stage loading and initialization
- ✅ Finish line detection and triggering
- ✅ Crash counting (no game over in Stage Mode)
- ✅ Orb collection tracking
- ✅ Power-up disabling in Stage Mode
- ✅ Bonus Mode disabling in Stage Mode
- ✅ All 15 stages accessibility
- ✅ Pattern pool validation

---

## Quick Start

### 1. Start Development Server

```bash
npm run dev
```

This starts an HTTP server on `http://localhost:5000`

### 2. Run Tests

```bash
# Run all tests
npm test

# Run tests with UI (recommended for development)
npm run test:ui

# Run tests in debug mode
npm run test:debug

# View HTML report after tests
npm run test:report
```

---

## Test Files

### `tests/stage-mode.spec.js`

Main test suite covering:

| Test | Purpose |
|------|---------|
| `should load stage-1-intro without errors` | Verify stage functions exist |
| `stage-1-intro should set correct distance` | Verify stage metadata (300m) |
| `should start stage and set GameState.isStageMode = true` | Verify stage initialization |
| `finish line should be created at stage distance` | Verify finish line object creation |
| `power-ups should not spawn in Stage Mode` | Verify MagnetManager, ShieldManager, SpeedBoostManager disabled |
| `Bonus Mode should not trigger in Stage Mode` | Verify bonus mode disabled at 1000m+ |
| `crashes should increment counter without game over` | Verify crash tracking |
| `orbs should be tracked in Stage Mode` | Verify orbsCollected increments |
| `all 15 stages should be accessible` | Verify all stage registry entries |
| `stage patterns should exist for all difficulty tiers` | Verify PATTERN_POOLS defined |
| `exiting Stage Mode should reset state` | Verify exitStageMode() cleanup |

---

## Manual Testing in Browser Console

If you prefer to test manually in the browser:

```javascript
// Load a stage
startStage('stage-1-intro');

// Check game state
console.log(GameState);

// Check current stage
console.log(GameState.currentStage);

// Verify finish line exists
console.log(hasFinishLine());

// Check crash count
console.log(GameState.crashes);

// Exit Stage Mode
exitStageMode();
```

---

## Available Test Commands

### Run Specific Test
```bash
npx playwright test -g "should load stage-1-intro"
```

### Run Tests in Specific File
```bash
npx playwright test tests/stage-mode.spec.js
```

### Run Tests in Specific Browser
```bash
npx playwright test --project=chromium
npx playwright test --project=firefox
```

### Run with Headed Browser (visual)
```bash
npx playwright test --headed
```

---

## Test Coverage

### Week 2 Completion Verification

✅ **Pattern Pools**: Verifies `PATTERN_POOLS['single-lane']`, `['mixed']`, `['complex']` exist
✅ **Stage-Specific Spawning**: Tests that stages load with correct speed/distance
✅ **Power-ups Disabled**: Confirms MagnetManager, ShieldManager, SpeedBoostManager return early
✅ **Bonus Mode Disabled**: Confirms Stage Mode blocks bonus trigger at 1000m
✅ **Crash Counting**: Tests GameState.crashes increments (no game over)
✅ **Orb Tracking**: Tests GameState.orbsCollected increments
✅ **Distance Tracking**: Tests GameState.distanceTraveled syncs with GameState.distance
✅ **Finish Line**: Tests finish line creation and detection
✅ **All 15 Stages**: Verifies stage registry contains all stages
✅ **State Cleanup**: Tests exitStageMode() resets flags

---

## Debugging Failed Tests

If a test fails:

1. **Check console output** - Shows exact error
2. **Run with `--debug`** - Opens Playwright Inspector
3. **View traces** - `npx playwright show-report` shows screenshots/traces
4. **Check base URL** - Ensure `http://localhost:5000` is running

---

## Integration with MCP

The Playwright MCP server in `/Users/aloniter/playwright-mcp/` can be used with Claude Code for:

1. **Automated testing during development**
2. **Regression testing before commits**
3. **Performance profiling**
4. **Screenshot/video capture for documentation**

---

## Next Steps (Week 3)

After Stage Mode is verified, tests can be extended for:

- [ ] Level select screen UI
- [ ] Results screen display
- [ ] Star calculation verification
- [ ] Progress persistence (localStorage)
- [ ] Unlock system validation

