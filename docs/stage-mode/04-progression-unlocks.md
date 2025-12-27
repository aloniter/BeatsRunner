# Progression & Unlocks - MVP

**Status:** Minimal Rewards, Linear Unlocking
**Last Updated:** Dec 27, 2025

---

## Stage Unlocking (Linear)

### Unlock Rule

**Simple:** Complete previous stage (any stars) → unlock next

```
Stage 1 (auto-unlocked) → Stage 2 → Stage 3 → ... → Stage 15
```

**No world gates in MVP** (only 1 world)

### Implementation

```javascript
function unlockNextStage(currentStageId) {
  const progress = loadProgress();
  const currentOrder = STAGES[currentStageId].order;

  // Find next stage in sequence
  const nextStage = Object.values(STAGES).find(s => s.order === currentOrder + 1);

  if (nextStage) {
    progress.stageProgress[nextStage.id].unlocked = true;
    saveProgress();
  }
}
```

### Initial State

```javascript
// On first load
{
  stageProgress: {
    'stage-1-intro': { unlocked: true, completed: false, bestStars: 0 },
    'stage-2-rhythm': { unlocked: false, completed: false, bestStars: 0 },
    'stage-3-jump': { unlocked: false, completed: false, bestStars: 0 },
    // ... all 15 stages, only Stage 1 unlocked
  }
}
```

---

## MVP Reward Distribution

**Keep it MINIMAL:** Only 3 rewards in MVP

| Total Stars | Reward | Type | Description |
|-------------|--------|------|-------------|
| 5⭐ | Neon Trail | Cosmetic | Particle trail effect |
| 10⭐ | Crystal Ball Skin | Cosmetic | Player ball skin |
| 15⭐ | Rainbow Particle Effect | Cosmetic | Ambient particles |

**That's it.** 3 rewards only in MVP.

**No power-ups, no upgrades, no world unlocks** in MVP.

---

## Reward Unlock Logic

### Check Total Stars

```javascript
function checkRewardUnlocks() {
  const progress = loadProgress();
  const totalStars = progress.totalStars;
  const unlocked = progress.unlockedRewards;

  const rewards = [
    { threshold: 5, id: 'neon-trail', name: 'Neon Trail' },
    { threshold: 10, id: 'crystal-ball', name: 'Crystal Ball Skin' },
    { threshold: 15, id: 'rainbow-particles', name: 'Rainbow Particle Effect' }
  ];

  rewards.forEach(reward => {
    if (totalStars >= reward.threshold && !unlocked.includes(reward.id)) {
      unlockReward(reward);
    }
  });
}
```

### Unlock Reward

```javascript
function unlockReward(reward) {
  const progress = loadProgress();

  // Add to unlocked list
  progress.unlockedRewards.push(reward.id);
  saveProgress();

  // Show notification (simple alert in MVP, can be popup in polish)
  showRewardNotification(reward.name);

  // Make available in store/customization
  addToInventory(reward.id);
}
```

---

## Reward Definitions

### 1. Neon Trail (5⭐)

**Type:** Particle trail
**Visual:** Pink/cyan particles behind player ball
**Implementation:**
- Particle emitter attached to player
- Trails fade after 1 second
- Matches game's neon theme

### 2. Crystal Ball Skin (10⭐)

**Type:** Player skin
**Visual:** Transparent sphere with crystalline interior
**Implementation:**
- Replace default ball material
- Semi-transparent with refraction
- Internal geometric pattern

### 3. Rainbow Particle Effect (15⭐)

**Type:** Ambient effect
**Visual:** Rainbow particles around player
**Implementation:**
- Particle ring orbiting player
- Cycles through colors (ROYGBIV)
- Subtle, not distracting

---

## No Feature Creep (MVP Cuts)

**DO NOT add in MVP:**

- ❌ Power-ups (magnet boost, shield, double orbs)
- ❌ Permanent upgrades (magnet duration, shield capacity)
- ❌ Multiple currencies (gems, tokens)
- ❌ World unlocks (only 1 world in MVP)
- ❌ Achievement system
- ❌ Daily login rewards
- ❌ Milestone rewards (100 total orbs, 10 games played)
- ❌ Social features (share score, invite friends)

**Reason:** Focus on core loop. Can add in post-MVP.

---

## Total Stars Calculation

### Sum of Best Stars

```javascript
function calculateTotalStars(stageProgress) {
  let total = 0;

  Object.values(stageProgress).forEach(stage => {
    total += stage.bestStars;
  });

  return total;
}
```

**Maximum possible:** 45 stars (15 stages × 3⭐)

### Display Everywhere

- Main menu: "Stage Mode - ⭐ 12/45"
- Level select: "Total Stars: 12/45"
- Results screen: "Total Stars: 13/45" (updates after each stage)

---

## UI: Reward Notifications

### Non-Blocking UI Message (MVP)

**No blocking popups** - MVP principle: "❌ Unlock celebration popups"

```javascript
function unlockReward(reward) {
  const progress = loadProgress();
  progress.unlockedRewards.push(reward.id);
  progress.newRewardsAvailable = true; // Flag for UI badge
  saveProgress();
  addToInventory(reward.id);

  // NO alert() - return for Results screen to display
  return reward;
}
```

**Display on Results Screen:**
- Show "🎉 New Reward Unlocked: [Reward Name]!" as banner at top
- Add "(NEW)" badge next to Store button
- Optional: Small notification icon on main menu Store button

**Example Results Screen with Reward:**
```
┌─────────────────────────────┐
│ 🎉 New Reward Unlocked!     │
│    Neon Trail               │
│ Check the Store! (NEW) →    │
├─────────────────────────────┤
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

**Post-MVP (Future):**
- Animated reward card reveal
- Confetti/particles
- Preview of reward visual
- "Equip Now" button

---

## UI: Locked Stages

### Level Select Visual

**Unlocked stage:**
```
┌───────────┐
│  Stage 3  │
│  ⭐⭐     │  ← Shows best stars
│  [PLAY]   │
└───────────┘
```

**Locked stage:**
```
┌───────────┐
│  Stage 4  │
│    🔒     │  ← Lock icon
│  Complete │
│  Stage 3  │
└───────────┘
```

### Lock Overlay

```javascript
function renderStageCard(stage) {
  const progress = loadProgress().stageProgress[stage.id];

  if (!progress.unlocked) {
    // Show lock icon
    // Disable click
    // Show unlock requirement text
  } else {
    // Show play button
    // Show best stars
  }
}
```

---

## Progression Pacing

### Expected Player Journey

**Casual player (1-2 stages per day):**
- Week 1: Complete stages 1-5 (easy tier)
- Week 2: Complete stages 6-10 (medium tier)
- Week 3: Complete stages 11-15 (hard tier)
- **Result:** 15-25 total stars (most stages 1-2⭐)
- **Rewards unlocked:** Neon Trail (5⭐), Crystal Ball (10⭐)

**Skilled player (3-5 stages per day):**
- Week 1: Complete stages 1-15, replay for 3⭐
- **Result:** 35-45 total stars (most stages 3⭐)
- **Rewards unlocked:** All 3 rewards

**Completionist (replay until 3⭐):**
- Goal: 45/45 stars
- **Rewards unlocked:** All 3 rewards
- **Time:** 2-4 weeks depending on skill

---

## No Grinding Required

**Key principle:** Can always progress with 1⭐

- 1⭐ on Stage 1 → unlocks Stage 2
- 1⭐ on Stage 2 → unlocks Stage 3
- ...
- 1⭐ on Stage 15 → MVP complete

**Rewards are bonuses:**
- Missing rewards? Replay stages for more stars
- Can complete all 15 stages without any rewards
- Rewards don't affect gameplay (cosmetic only)

---

## Post-MVP Progression (FUTURE)

**Can add later:**

### World Unlocks
- World 2: Cyber Highway (unlocks at 30⭐)
- World 3: Sunset Boulevard (unlocks at 60⭐)

### Star-Based Rewards (More Tiers)
- 20⭐, 25⭐, 30⭐, 35⭐, 40⭐, 45⭐ milestones
- 10+ cosmetic rewards

### Achievement System
- Complete all stages
- Get 45/45 stars
- Complete stage without hitting obstacles
- Collect all orbs in a stage
- Complete 3 stages in a row

### Upgrade System
- Permanent upgrades (magnet duration, orb value)
- Purchased with stars or secondary currency
- Unlock new abilities

---

## Testing Checklist (Week 3)

- [ ] Stage 1 auto-unlocked on first load
- [ ] All other stages locked initially
- [ ] Completing stage unlocks next stage
- [ ] Total stars count updates correctly
- [ ] Reward unlocks trigger at 5⭐, 10⭐, 15⭐
- [ ] Reward notification shows
- [ ] Rewards added to inventory
- [ ] Can equip rewards in store
- [ ] Locked stages show lock icon
- [ ] Locked stages display unlock requirement
- [ ] Can replay completed stages
- [ ] Replaying updates best stars if improved
