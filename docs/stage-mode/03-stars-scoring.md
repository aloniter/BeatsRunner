# Star Rating System - Simplified MVP

**Status:** Rule-Based Only (No Complex Formula)
**Last Updated:** Dec 27, 2025

---

## Philosophy

**Stars measure clean execution, not just completion.**

- Completing the stage = ⭐ guaranteed
- Avoiding crashes + collecting orbs = ⭐⭐ or ⭐⭐⭐
- Simple, understandable rules players can predict

---

## MVP Star Rules (SIMPLIFIED)

**No complex scoring formula.** Stars are determined by **2 simple metrics:**

1. **Crashes** (how many obstacles you hit)
2. **Orbs Collected %** (how many orbs you collected)

### Three Tiers

#### ⭐ 1 Star - "Completed"
- **Requirement:** Reach the finish line
- **No additional requirements**
- **Message:** "Stage Complete!"

#### ⭐⭐ 2 Stars - "Great Run!"
- **Max crashes:** 5 or fewer
- **Min orbs:** 40-50% collected
- **Message:** "Solid Performance!"

#### ⭐⭐⭐ 3 Stars - "Perfect!"
- **Max crashes:** 1-2 (varies by stage difficulty)
- **Min orbs:** 60-80% collected (varies by stage difficulty)
- **Message:** "Flawless Victory!"

---

## MVP Star Thresholds Per Stage Tier

### Early Stages (1-5):
```javascript
{
  star3: { crashes: 2, orbs: 60 },  // ≤2 crashes AND ≥60% orbs
  star2: { crashes: 5, orbs: 40 }   // ≤5 crashes AND ≥40% orbs
}
// 1 star: always (for completing)
```

**Example:**
- Completed with 1 crash, 10/15 orbs (66%) → ⭐⭐⭐ (under both thresholds)
- Completed with 4 crashes, 8/15 orbs (53%) → ⭐⭐ (under 2⭐ thresholds)
- Completed with 8 crashes, 5/15 orbs (33%) → ⭐ (completed only)

### Mid Stages (6-10):
```javascript
{
  star3: { crashes: 2, orbs: 70 },  // ≤2 crashes AND ≥70% orbs
  star2: { crashes: 5, orbs: 50 }   // ≤5 crashes AND ≥50% orbs
}
```

**Reasoning:** Increased orb requirement to account for more orbs placed (22-25)

### Late Stages (11-15):
```javascript
{
  star3: { crashes: 1, orbs: 75 },  // ≤1 crash AND ≥75% orbs (stricter!)
  star2: { crashes: 4, orbs: 50 }   // ≤4 crashes AND ≥50% orbs
}
// Stage 13-15 use 80% for 3⭐ (hardest stages)
```

**Reasoning:** Final stages test mastery, 3⭐ should be challenging

---

## Star Calculation Implementation

### Core Function

```javascript
function calculateStars(crashes, orbsCollected, totalOrbs, stage) {
  const orbPercent = (orbsCollected / totalOrbs) * 100;

  // Must meet BOTH crash AND orb requirements for each tier
  // Access thresholds directly from stage.stars object
  if (crashes <= stage.stars.star3.crashes && orbPercent >= stage.stars.star3.orbs) {
    return 3;
  } else if (crashes <= stage.stars.star2.crashes && orbPercent >= stage.stars.star2.orbs) {
    return 2;
  } else {
    return 1; // Always at least 1 star for completing
  }
}
```

**Key change:** Function now accepts `stage` object instead of `stageId`. Thresholds are accessed directly from `stage.stars` property.

### Threshold Storage

**No separate lookup table.** Thresholds are stored in each stage's metadata:

```javascript
// Example stage object
const STAGE_1 = {
  id: 'stage-1-intro',
  name: 'Neon Intro',
  // ... other properties
  stars: {
    star3: { crashes: 2, orbs: 60 },
    star2: { crashes: 5, orbs: 40 }
  }
};
```

### Threshold Values Per Tier

**Easy tier (Stages 1-5):**
```javascript
stars: { star3: { crashes: 2, orbs: 60 }, star2: { crashes: 5, orbs: 40 } }
```

**Medium tier (Stages 6-10):**
```javascript
stars: { star3: { crashes: 2, orbs: 70 }, star2: { crashes: 5, orbs: 50 } }
```

**Hard tier (Stages 11-12):**
```javascript
stars: { star3: { crashes: 1, orbs: 75 }, star2: { crashes: 4, orbs: 50 } }
```

**Hard+ tier (Stages 13-15):**
```javascript
stars: { star3: { crashes: 1, orbs: 80 }, star2: { crashes: 4, orbs: 50 } }
```

---

## Why This System Works (Casual Design)

### 1. Always Achievable
- **No 0 stars** - completing always gives ⭐
- Players never feel like they "failed"
- Encourages replaying for better performance

### 2. Clear Communication
- Players can see exact requirements before playing
- "Get 3 stars: hit 2 or fewer obstacles, collect 60% of orbs"
- No hidden formulas or complex math

### 3. Skill Expression
- 1⭐ = "I completed it"
- 2⭐ = "I'm getting better"
- 3⭐ = "I mastered this stage"

### 4. Natural Progression
- Early stages: Easy 3⭐ (builds confidence)
- Mid stages: Moderate 3⭐ (skill building)
- Late stages: Hard 3⭐ (mastery showcase)

### 5. No Grinding Required
- Can always proceed with 1⭐
- 3⭐ is optional challenge, not gate
- Rewards total stars, not individual 3⭐s

---

## Star Messages

### Results Screen Text

**3 Stars:**
- "FLAWLESS VICTORY! ⭐⭐⭐"
- "PERFECT RUN! ⭐⭐⭐"
- "MASTERED! ⭐⭐⭐"

**2 Stars:**
- "GREAT RUN! ⭐⭐"
- "SOLID PERFORMANCE! ⭐⭐"
- "NICE WORK! ⭐⭐"

**1 Star:**
- "STAGE COMPLETE! ⭐"
- "YOU DID IT! ⭐"
- "FINISHED! ⭐"

### Improvement Tips (1-2 Stars)

**Show on results screen when not 3⭐:**

- "Avoid obstacles to earn more stars!"
- "Collect more orbs for a perfect score!"
- "Try jumping over obstacles!"
- "Watch for 2-lane blocks - find the safe path!"

---

## Star Display (In-Game)

### Stage Info Card

**Before playing:**
```
🎯 Star Goals:
⭐   Complete the stage
⭐⭐  ≤5 crashes, 40% orbs
⭐⭐⭐ ≤2 crashes, 60% orbs
```

### HUD (During play)

**Show current progress toward stars:**
```
Crashes: 1 / 2 for 3⭐
Orbs: 12/20 (60% ✓)
```

### Results Screen

**Show what you got:**
```
GREAT RUN! ⭐⭐

Orbs: 18/25 (72%) ✓
Crashes: 3 ✗ (need ≤2 for 3⭐)

Total Stars: 18/45
```

---

## Features CUT from MVP

**NO complex scoring in MVP:**

- ❌ Base score calculation
- ❌ Crash penalties (-50 points each)
- ❌ Time bonuses (+100 for fast completion)
- ❌ Perfect section bonuses (+50 per section)
- ❌ Orb multipliers (2x, 3x combos)
- ❌ "Beat developer time" bonus
- ❌ Difficulty multipliers

**Reason:** Players don't need points. They need clear goals ("hit ≤2 obstacles").

---

## Balancing Process

### Initial Thresholds (Week 2)
Set based on stage tier (easy/medium/hard)

### Playtesting (Week 4)
1. Designer plays each stage 5 times
2. Record: crash count, orb %, stars earned
3. Adjust thresholds if:
   - Too easy: 100% of runs get 3⭐ → increase difficulty
   - Too hard: 0% of runs get 3⭐ → decrease difficulty

### Target Success Rates
- **Easy (1-5):** 80-90% of runs should get 3⭐
- **Medium (6-10):** 50-70% of runs should get 3⭐
- **Hard (11-15):** 20-40% of runs should get 3⭐

### Example Tuning

**Stage 7 playtest results:**
- Run 1: 1 crash, 18/23 orbs (78%) → ⭐⭐⭐
- Run 2: 3 crashes, 20/23 orbs (87%) → ⭐⭐ (crashes too high)
- Run 3: 0 crashes, 22/23 orbs (96%) → ⭐⭐⭐
- Run 4: 2 crashes, 16/23 orbs (70%) → ⭐⭐⭐
- Run 5: 4 crashes, 19/23 orbs (83%) → ⭐⭐

**Result:** 60% 3⭐ rate → thresholds are good for medium tier ✓

---

## Testing Checklist (Week 4)

- [ ] Star calculation function works correctly
- [ ] All 15 stages have thresholds defined
- [ ] Thresholds displayed on stage info card
- [ ] HUD shows live progress toward stars
- [ ] Results screen shows stars earned
- [ ] Results screen shows improvement tips (1-2⭐ only)
- [ ] Total stars count updates correctly
- [ ] Playtest data collected for all stages
- [ ] Thresholds tuned based on playtest results
- [ ] Final verification: difficulty curve feels good
