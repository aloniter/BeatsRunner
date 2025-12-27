# Core System - Stage Mode Foundation

**Status:** Design Complete - Ready for Implementation
**Last Updated:** Dec 27, 2025

---

## Level Structure

### Duration & Distance
- **Length:** 45-75 seconds per stage
- **Distance:** 1,000-1,500 meters
- **Perfect for:** Mobile "waiting in line" sessions

### Completion Rules

**Win Condition:** Cross the finish line (glowing archway)

**Key Design:**
- **No failure:** Hitting obstacles slows you down but doesn't end the level
- **Always progress:** Even with 10 crashes, you reach the finish
- **Stars measure performance:** Crashes and orbs determine stars, not completion

### Progress Feedback (MVP)
- Progress bar (0% → 100%) at top of screen
- Crash counter (live)
- Orbs collected counter (e.g., "15/30")
- Star thresholds visible on progress bar (optional)

---

## Stage Metadata Structure

### Stage Registry Schema

Each stage needs:

```javascript
{
  id: string,              // e.g., 'stage-1-intro'
  name: string,            // e.g., 'Neon Intro'
  order: number,           // 1-15
  world: 'neon-district',  // World 1 only in MVP

  // Gameplay settings
  distance: number,        // 1000-1500m
  targetTime: number,      // 45-75s
  speed: number,           // 28-32 units/s

  // Collectibles
  totalOrbs: number,       // 15-30 orbs

  // Star thresholds (see 03-stars-scoring.md)
  stars: {
    star3: { crashes: number, orbs: number },  // percent
    star2: { crashes: number, orbs: number }
  },

  // Obstacle pattern (see 02-level-design.md)
  pattern: 'single-lane' | 'mixed' | 'complex',

  // Unlock requirements
  unlock: {
    type: 'default' | 'complete-previous',
    requiredStageId?: string  // Previous stage ID
  }
}
```

### Example Stage Definition

```javascript
const STAGE_1 = {
  id: 'stage-1-intro',
  name: 'Neon Intro',
  order: 1,
  world: 'neon-district',

  distance: 1000,
  targetTime: 45,
  speed: 28,

  totalOrbs: 15,

  stars: {
    star3: { crashes: 2, orbs: 60 },
    star2: { crashes: 5, orbs: 40 }
  },

  pattern: 'single-lane',

  unlock: { type: 'default' }
};
```

---

## Star Calculation Implementation

### MVP Rule-Based Formula

**No complex scoring.** Stars determined by 2 simple metrics:

```javascript
function calculateStars(crashes, orbsCollected, totalOrbs, stage) {
  const orbPercent = (orbsCollected / totalOrbs) * 100;

  // Access thresholds directly from stage object
  if (crashes <= stage.stars.star3.crashes && orbPercent >= stage.stars.star3.orbs) {
    return 3;
  } else if (crashes <= stage.stars.star2.crashes && orbPercent >= stage.stars.star2.orbs) {
    return 2;
  } else {
    return 1; // Always at least 1 star for completing
  }
}
```

**Note:** No separate `STAGE_THRESHOLDS` lookup table needed. Thresholds are stored directly in each stage's metadata (`stage.stars`).

### Thresholds Per Stage Tier

Thresholds are defined in each stage object's `stars` property:

**Early Stages (1-5):**
```javascript
stars: { star3: { crashes: 2, orbs: 60 }, star2: { crashes: 5, orbs: 40 } }
```

**Mid Stages (6-10):**
```javascript
stars: { star3: { crashes: 2, orbs: 70 }, star2: { crashes: 5, orbs: 50 } }
```

**Late Stages (11-15):**
```javascript
stars: { star3: { crashes: 1, orbs: 75 }, star2: { crashes: 4, orbs: 50 } }
```

---

## Progress Storage (localStorage)

### Data Structure

```javascript
{
  // Stage completion data
  stageProgress: {
    'stage-1-intro': {
      unlocked: true,
      completed: true,
      bestStars: 3,
      bestCrashes: 1,
      bestOrbs: 14,
      totalOrbs: 15,
      playCount: 5
    },
    'stage-2-speed': {
      unlocked: true,
      completed: false,
      bestStars: 0
    }
    // ... all 15 stages
  },

  // Overall progress
  totalStars: 12,  // Sum of bestStars across all stages
  stagesCompleted: 4,

  // Rewards unlocked
  unlockedRewards: ['neon-trail']  // IDs of cosmetics earned
}
```

### localStorage Key

```javascript
const STORAGE_KEY = 'beat-runner-stage-mode-progress';
```

### Save/Load Functions

```javascript
function saveProgress(stageId, stars, crashes, orbsCollected, totalOrbs) {
  const progress = loadProgress();
  const stage = progress.stageProgress[stageId];

  // Update if new best
  if (!stage.completed || stars > stage.bestStars) {
    stage.bestStars = stars;
    stage.bestCrashes = crashes;
    stage.bestOrbs = orbsCollected;
  }

  stage.completed = true;
  stage.playCount++;

  // Unlock next stage
  const nextStageId = getNextStageId(stageId);
  if (nextStageId) {
    progress.stageProgress[nextStageId].unlocked = true;
  }

  // Recalculate total stars
  progress.totalStars = calculateTotalStars(progress.stageProgress);
  progress.stagesCompleted = countCompletedStages(progress.stageProgress);

  localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
}

function loadProgress() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved) {
    return JSON.parse(saved);
  }

  // Initialize with Stage 1 unlocked
  return initializeProgress();
}
```

---

## Finish Line Object

### Visual Design
- **Model:** Glowing archway/checkpoint gate
- **Color:** Pink/cyan neon (matching game theme)
- **Size:** Spans all 3 lanes
- **Position:** Exactly at stage.distance meters

### Detection Logic

```javascript
function checkFinishLine() {
  if (GAME_STATE.distanceTraveled >= currentStage.distance) {
    // Player crossed finish line
    completeStage();
  }
}

function completeStage() {
  GAME_STATE.isGameActive = false;

  const stars = calculateStars(
    GAME_STATE.crashes,
    GAME_STATE.orbsCollected,
    currentStage.totalOrbs,
    currentStage.id
  );

  saveProgress(
    currentStage.id,
    stars,
    GAME_STATE.crashes,
    GAME_STATE.orbsCollected,
    currentStage.totalOrbs
  );

  showResultsScreen(stars);
}
```

---

## Testing Checklist (Week 1)

- [ ] Can load stage from registry
- [ ] Stage metadata correctly applied (speed, distance, orbs)
- [ ] Finish line spawns at correct position
- [ ] Finish line detection triggers completion
- [ ] Star calculation works correctly
- [ ] Progress saves to localStorage
- [ ] Progress loads on page refresh
- [ ] Next stage unlocks after completion
- [ ] Can replay completed stage
- [ ] Total stars count updates correctly
