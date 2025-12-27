# UI/UX Flow - MVP

**Status:** 5 Essential Screens Only
**Last Updated:** Dec 27, 2025

---

## Screen Architecture

**MVP includes 5 screens:**

1. **Main Menu** (updated) - Entry point, mode selection
2. **Level Select** - Choose which stage to play
3. **Stage Info Card** - Preview stage details and star goals
4. **In-Game HUD** - Progress tracking during play
5. **Results Screen** - Post-stage performance summary

**NO unlock popups, NO celebration animations in MVP** (can add in polish)

---

## 1. Main Menu (Updated)

### Layout

```
┌─────────────────────────────────────┐
│       BEAT RUNNER                   │
│                                     │
│   ┌─────────────────┐               │
│   │  FREE RUN       │ ← Existing    │
│   │  [Play Now]     │               │
│   └─────────────────┘               │
│                                     │
│   ┌─────────────────┐               │
│   │  STAGE MODE     │ ← NEW (MVP)   │
│   │  [Select Level] │               │
│   │  ⭐ 12/45       │ (total stars) │
│   └─────────────────┘               │
│                                     │
│   [Store] [Settings]                │
└─────────────────────────────────────┘
```

### Implementation Notes

- **Add "Stage Mode" button** below "Free Run"
- **Show total stars** under Stage Mode button (e.g., "⭐ 12/45")
- **Click behavior:** Navigate to Level Select screen
- **Free Run untouched:** Existing functionality unchanged

---

## 2. Level Select Screen

### Layout (MVP: World 1 Only)

```
WORLD 1: NEON DISTRICT
┌────────────────────────────────────────┐
│                                        │
│  🟢─1─🟢─2─🟢─3─🟢─4─🟢─5            │
│  ⭐⭐⭐ ⭐⭐⭐ ⭐⭐  ⭐   🔒           │
│                                        │
│       🟢─6─🟢─7─🟢─8─🟢─9─🟢─10      │
│       ⭐⭐⭐ ⭐⭐  ⭐⭐  🔒  🔒        │
│                                        │
│           🟢─11─🟢─12─🟢─13           │
│           ⭐⭐   🔒   🔒              │
│                                        │
│               🟢─14─🟢─15             │
│               🔒   🔒                 │
│                                        │
│  Total Stars: 18/45                   │
│                                        │
│  [BACK TO MENU]                        │
└────────────────────────────────────────┘
```

### Visual Elements

**Stage Node (Unlocked):**
- Green circle with stage number
- Stars below (⭐⭐⭐ = 3, ⭐⭐ = 2, ⭐ = 1, empty = not completed)
- Clickable → opens Stage Info Card

**Stage Node (Locked):**
- Gray circle with lock icon 🔒
- No stars
- Not clickable
- Tooltip: "Complete Stage X to unlock"

**Connecting Lines:**
- Show progression path
- Highlight unlocked path in color
- Locked path in gray

### Interaction

```javascript
function onStageNodeClick(stageId) {
  const progress = loadProgress().stageProgress[stageId];

  if (progress.unlocked) {
    showStageInfoCard(stageId);
  } else {
    // Show lock message
    showTooltip(`Complete ${getPreviousStageName(stageId)} to unlock`);
  }
}
```

---

## 3. Stage Info Card

### Layout

```
┌─────────────────────────────┐
│  Stage 5: Speed Boost       │
│  Best: ⭐⭐ (5 crashes)     │
│                             │
│  Distance: 1,200m           │
│                             │
│  🎯 Star Goals:             │
│  ⭐   Complete              │
│  ⭐⭐  ≤5 crashes, 40% orbs│
│  ⭐⭐⭐ ≤2 crashes, 60% orbs│
│                             │
│  [PLAY]  [BACK]             │
└─────────────────────────────┘
```

### Information Shown

- **Stage name** (e.g., "Stage 5: Speed Boost")
- **Best performance** (e.g., "Best: ⭐⭐ (5 crashes)")
- **Distance** (e.g., "1,200m")
- **Star goals** with exact thresholds
- **Play button** (starts stage)
- **Back button** (returns to Level Select)

### Implementation

```javascript
function showStageInfoCard(stageId) {
  const stage = STAGES[stageId];
  const progress = loadProgress().stageProgress[stageId];

  // Populate card
  document.getElementById('stage-name').textContent = stage.name;
  document.getElementById('stage-distance').textContent = `${stage.distance}m`;

  if (progress.completed) {
    document.getElementById('best-performance').textContent =
      `Best: ${'⭐'.repeat(progress.bestStars)} (${progress.bestCrashes} crashes)`;
  } else {
    document.getElementById('best-performance').textContent = 'Not completed yet';
  }

  // Star goals
  showStarGoals(stage.stars);

  // Show card
  document.getElementById('stage-info-card').style.display = 'block';
}
```

---

## 4. In-Level HUD (MVP)

### Layout

```
┌─────────────────────────────────────┐
│ Stage 7: Rhythm Run               │
│                                     │
│ ████████████░░░░ 75%                │
│                                     │
│ Orbs: 15/25   Crashes: 2            │
│                                     │
│        [Gameplay Canvas]            │
└─────────────────────────────────────┘
```

### Elements

**Top Bar:**
- **Stage name** (e.g., "Stage 7: Rhythm Run")
- **Progress bar** (0% → 100% based on distance)
  - Formula: `(distanceTraveled / stage.distance) * 100`
- **Orb counter** (e.g., "15/25")
- **Crash counter** (e.g., "Crashes: 2")

**Optional (can add in polish):**
- Star threshold markers on progress bar
- Current star prediction (⭐⭐⭐ if on pace for 3 stars)
- Live timer

### Implementation

```javascript
function updateHUD() {
  // Progress bar
  const progressPercent = (GAME_STATE.distanceTraveled / currentStage.distance) * 100;
  document.getElementById('progress-bar').style.width = `${progressPercent}%`;
  document.getElementById('progress-text').textContent = `${Math.floor(progressPercent)}%`;

  // Orbs
  document.getElementById('orb-counter').textContent =
    `Orbs: ${GAME_STATE.orbsCollected}/${currentStage.totalOrbs}`;

  // Crashes
  document.getElementById('crash-counter').textContent =
    `Crashes: ${GAME_STATE.crashes}`;
}
```

---

## 5. Results Screen (MVP)

### Layout: 3 Stars

```
┌─────────────────────────────┐
│      PERFECT RUN! ⭐⭐⭐     │
│                             │
│  Orbs: 23/25   (92%)        │
│  Crashes: 1                 │
│                             │
│  Total Stars: 15/45         │
│                             │
│  [NEXT STAGE]               │
│  [REPLAY]  [MENU]           │
└─────────────────────────────┘
```

### Layout: 1 Star

```
┌─────────────────────────────┐
│      STAGE COMPLETE! ⭐      │
│                             │
│  Orbs: 12/25   (48%)        │
│  Crashes: 8                 │
│                             │
│  💡 Avoid obstacles to earn │
│     more stars!             │
│                             │
│  Total Stars: 8/45          │
│                             │
│  [NEXT STAGE]               │
│  [RETRY FOR 3⭐]  [MENU]    │
└─────────────────────────────┘
```

### Information Shown

- **Star count** (⭐, ⭐⭐, or ⭐⭐⭐)
- **Message** based on stars:
  - 3⭐: "PERFECT RUN!" / "FLAWLESS VICTORY!"
  - 2⭐: "GREAT RUN!" / "SOLID PERFORMANCE!"
  - 1⭐: "STAGE COMPLETE!" / "YOU DID IT!"
- **Performance stats:**
  - Orbs collected (count and %)
  - Crashes
- **Improvement tip** (if not 3⭐)
- **Total stars** (updated count)
- **Buttons:**
  - **Next Stage** (if unlocked)
  - **Replay** (retry current stage)
  - **Menu** (back to Level Select)

### Implementation

```javascript
function showResultsScreen(stars) {
  const progress = loadProgress();

  // Star count
  document.getElementById('stars').textContent = '⭐'.repeat(stars);

  // Message
  const messages = {
    3: ['PERFECT RUN!', 'FLAWLESS VICTORY!', 'MASTERED!'],
    2: ['GREAT RUN!', 'SOLID PERFORMANCE!', 'NICE WORK!'],
    1: ['STAGE COMPLETE!', 'YOU DID IT!', 'FINISHED!']
  };
  document.getElementById('result-message').textContent =
    messages[stars][Math.floor(Math.random() * messages[stars].length)];

  // Stats
  const orbPercent = Math.floor((GAME_STATE.orbsCollected / currentStage.totalOrbs) * 100);
  document.getElementById('orbs-stat').textContent =
    `Orbs: ${GAME_STATE.orbsCollected}/${currentStage.totalOrbs} (${orbPercent}%)`;
  document.getElementById('crashes-stat').textContent =
    `Crashes: ${GAME_STATE.crashes}`;

  // Improvement tip (if not 3⭐)
  if (stars < 3) {
    const tips = [
      'Avoid obstacles to earn more stars!',
      'Collect more orbs for a perfect score!',
      'Try jumping over obstacles!',
      'Watch for 2-lane blocks - find the safe path!'
    ];
    document.getElementById('tip').textContent =
      '💡 ' + tips[Math.floor(Math.random() * tips.length)];
    document.getElementById('tip').style.display = 'block';
  } else {
    document.getElementById('tip').style.display = 'none';
  }

  // Total stars
  document.getElementById('total-stars').textContent =
    `Total Stars: ${progress.totalStars}/45`;

  // Buttons
  const nextStageId = getNextStageId(currentStage.id);
  const nextStageUnlocked = nextStageId && progress.stageProgress[nextStageId].unlocked;

  if (nextStageUnlocked) {
    document.getElementById('next-stage-btn').style.display = 'block';
  } else {
    document.getElementById('next-stage-btn').style.display = 'none';
  }

  // Show screen
  document.getElementById('results-screen').style.display = 'block';
}
```

---

## Screen Navigation Flow

```
Main Menu
    │
    ├─→ [Free Run] → (existing gameplay)
    │
    └─→ [Stage Mode] → Level Select
                           │
                           └─→ Click Stage → Stage Info Card
                                                 │
                                                 └─→ [Play] → In-Game HUD
                                                                   │
                                                                   └─→ Complete → Results Screen
                                                                                        │
                                                                                        ├─→ [Next Stage] → Stage Info Card
                                                                                        ├─→ [Replay] → In-Game HUD
                                                                                        └─→ [Menu] → Level Select
```

---

## Features CUT from MVP

**NO unlock popups:**
- ❌ "Stage 2 Unlocked!" popup
- ❌ "Reward Unlocked!" popup with animation
- ❌ Confetti/particle effects on unlock

**NO celebration animations:**
- ❌ Star reveal animation (stars appear one by one)
- ❌ Progress bar fill animation
- ❌ Haptic feedback

**Reason:** Focus on functional UI first. Can add polish in Week 4 or post-MVP.

---

## Responsive Design (Mobile)

**All screens optimized for portrait mode:**
- Touch-friendly button sizes (min 44×44px)
- Large text (readable at arm's length)
- Single column layouts
- No hover states (tap to interact)

**Stage nodes:**
- Large enough to tap easily (60×60px minimum)
- Clear visual feedback on tap

---

## Casual Design Principles

### 1. Positive Feedback
- "Stage Complete!" not "You Failed"
- Always show improvement tips, never punish
- Celebrate all achievements (1⭐ is still a win)

### 2. Clear Communication
- Star goals visible before playing
- Live progress tracking during play
- Exact performance stats after play

### 3. No Dead Ends
- Always have "Next Stage" or "Replay" option
- Can return to menu anytime
- Can replay stages anytime (no energy system)

### 4. Minimal Friction
- 2 taps to start playing (Menu → Select Stage → Play)
- No forced tutorials
- Skip directly to next stage after completing

---

## Testing Checklist (Week 3)

- [ ] Main menu shows Stage Mode button
- [ ] Total stars display on main menu
- [ ] Level Select shows all 15 stages
- [ ] Stage nodes show correct lock/unlock state
- [ ] Stage nodes show correct star count
- [ ] Clicking stage opens Stage Info Card
- [ ] Stage Info Card shows correct data
- [ ] Play button starts gameplay
- [ ] In-game HUD displays correctly
- [ ] Progress bar updates in real-time
- [ ] Orb/crash counters update in real-time
- [ ] Results screen shows correct stars
- [ ] Results screen shows correct stats
- [ ] Improvement tips display (1-2⭐ only)
- [ ] Next Stage button works
- [ ] Replay button works
- [ ] Menu button works
- [ ] All navigation flows work correctly
- [ ] UI responsive on mobile devices
