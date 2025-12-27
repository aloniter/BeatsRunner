# Balancing - Playtest & Tuning Process

**Status:** Week 4 - Final Polish
**Last Updated:** Dec 27, 2025

---

## Balancing Goals

### Casual-Friendly Difficulty

1. **Players Win Often**
   - 1 star guaranteed by finishing
   - No failure state
   - Stages 1-5 designed for 90%+ 3-star success

2. **Slow Difficulty Escalation**
   - 5 stages per tier (Easy, Medium, Hard)
   - Each stage adds ONE new challenge
   - Speed increases gradually (28 → 32 over 15 stages)

3. **No Punishment Loops**
   - Low stars don't block progress
   - Can always move to next stage
   - Replay is optional

4. **Positive Feedback**
   - "Stage Complete!" not "You Failed"
   - Helpful tips on lower stars
   - Celebrate improvements

---

## Playtest Process (Week 4)

### Step 1: Designer Testing (5+ Runs Per Stage)

**For each stage:**

1. **Play 5 times** (back-to-back, no breaks)
2. **Record data:**
   - Crashes (each run)
   - Orbs collected (each run)
   - Stars earned (each run)
   - Subjective difficulty (1-10)
3. **Calculate averages:**
   - Average crashes
   - Average orb %
   - 3⭐ success rate

**Example Data Sheet:**

```
STAGE 7: RHYTHM RUN

Run 1: 1 crash, 18/23 orbs (78%) → ⭐⭐⭐
Run 2: 3 crashes, 20/23 orbs (87%) → ⭐⭐ (crashes too high)
Run 3: 0 crashes, 22/23 orbs (96%) → ⭐⭐⭐
Run 4: 2 crashes, 16/23 orbs (70%) → ⭐⭐⭐
Run 5: 4 crashes, 19/23 orbs (83%) → ⭐⭐

Averages:
- Crashes: 2.0
- Orbs: 82.6%
- 3⭐ rate: 60%

Target: Medium tier = 50-70% 3⭐ rate ✓
Verdict: Balanced correctly
```

### Step 2: Casual Player Testing (Optional)

**If possible, recruit 1-2 casual players:**

- Must NOT be game designers
- Unfamiliar with Beat Runner
- Casual mobile game experience

**Test protocol:**
1. No instructions (let them figure it out)
2. Play stages 1-5 in order
3. Observe:
   - Do they understand star goals?
   - Do they get frustrated? (red flag)
   - Do they retry for 3⭐? (good sign)

**Key question:** "Did you have fun?"

### Step 3: Tune Thresholds

**If too easy:**
- 100% 3⭐ rate → **increase difficulty**
- Lower crash threshold (e.g., 2 → 1)
- Raise orb threshold (e.g., 60% → 70%)

**If too hard:**
- 0% 3⭐ rate → **decrease difficulty**
- Raise crash threshold (e.g., 1 → 2)
- Lower orb threshold (e.g., 80% → 70%)

**Example tuning:**

```
STAGE 13: JUMP MASTER

Initial thresholds:
- 3⭐: crashes ≤1, orbs ≥80%

Playtest results:
- 3⭐ rate: 0% (too hard!)

Tuning:
- Change to: crashes ≤2, orbs ≥75%

Re-test:
- 3⭐ rate: 40% ✓ (good for hard tier)
```

---

## Target Success Rates

### Easy Tier (Stages 1-5)

**Goal:** Build confidence

- **3⭐ rate:** 80-90%
- **2⭐ rate:** 95%+
- **1⭐ rate:** 100%

**If below target:**
- Make obstacles more visible
- Increase gaps between obstacles
- Reduce speed slightly
- Lower star thresholds

### Medium Tier (Stages 6-10)

**Goal:** Skill building

- **3⭐ rate:** 50-70%
- **2⭐ rate:** 85-90%
- **1⭐ rate:** 100%

**If below target:**
- Adjust star thresholds (not obstacle difficulty)
- Ensure patterns are learnable

### Hard Tier (Stages 11-15)

**Goal:** Mastery showcase

- **3⭐ rate:** 20-40%
- **2⭐ rate:** 60-75%
- **1⭐ rate:** 100%

**If below target:**
- Hard is MEANT to be challenging
- Only adjust if 1⭐ rate drops below 100%

---

## What NEVER Changes

**Core mechanics locked:**

1. **Lane switching speed:** 12 units/s
2. **Jump physics:** JUMP_FORCE: 8, GRAVITY: 22
3. **Visual clarity:** Obstacles visible 3.6s ahead
4. **Controls:** Swipe/tap responsiveness
5. **Beat sync:** 128 BPM

**Do NOT adjust these in balancing.** Only adjust:
- Stage-specific speed (28-32 u/s)
- Obstacle placement
- Gap distances
- Star thresholds

---

## Difficulty Curve Verification

### Expected Progression

**Play all 15 stages in order, record subjective difficulty:**

```
Stage 1: ●○○○○○○○○○ (1/10 difficulty) ✓
Stage 2: ●○○○○○○○○○ (1/10)
Stage 3: ●●○○○○○○○○ (2/10)
Stage 4: ●●○○○○○○○○ (2/10)
Stage 5: ●●●○○○○○○○ (3/10)
Stage 6: ●●●●○○○○○○ (4/10) ✓
Stage 7: ●●●●○○○○○○ (4/10)
Stage 8: ●●●●●○○○○○ (5/10)
Stage 9: ●●●●●●○○○○ (6/10)
Stage 10: ●●●●●●○○○○ (6/10)
Stage 11: ●●●●●●●○○○ (7/10) ✓
Stage 12: ●●●●●●●●○○ (8/10)
Stage 13: ●●●●●●●●○○ (8/10)
Stage 14: ●●●●●●●●●○ (9/10)
Stage 15: ●●●●●●●●●● (10/10) ✓
```

**Good curve:** Smooth increase, no sudden spikes

**Bad curve:**
```
Stage 1: ●○○○○○○○○○
Stage 2: ●●●●●●●●○○ ← TOO BIG JUMP! Fix this.
```

---

## Common Balancing Issues

### Issue 1: Invisible Obstacles

**Symptom:** Players crash into obstacles they "didn't see"

**Cause:** Obstacles spawn too close (< 3.6s visibility)

**Fix:** Verify SPAWN_DISTANCE and stage speed:
```javascript
const visibilityTime = CONFIG.SPAWN_DISTANCE / stage.speed;
// Should be ≥3.6s
```

### Issue 2: Impossible Patterns

**Symptom:** Cannot avoid obstacle even with perfect play

**Cause:** Two obstacles too close together

**Fix:** Ensure minimum gap (18-25m depending on tier)

### Issue 3: Unfair Orb Placement

**Symptom:** Collecting orb forces player into obstacle

**Cause:** Orb placed directly before obstacle

**Fix:** Place orbs in safe paths, or require jump to collect

### Issue 4: RNG Frustration

**Symptom:** "I got unlucky with obstacle spawns"

**Cause:** Stage Mode should have ZERO RNG

**Fix:** All stages use fixed patterns (no randomness)

---

## Star Threshold Tuning Table

### Initial Thresholds (Week 2)

| Stage | Tier | 3⭐ Crashes | 3⭐ Orbs | 2⭐ Crashes | 2⭐ Orbs |
|-------|------|------------|---------|------------|---------|
| 1-5 | Easy | ≤2 | ≥60% | ≤5 | ≥40% |
| 6-10 | Medium | ≤2 | ≥70% | ≤5 | ≥50% |
| 11-12 | Hard | ≤1 | ≥75% | ≤4 | ≥50% |
| 13-15 | Hard+ | ≤1 | ≥80% | ≤4 | ≥50% |

### After Playtesting (Week 4)

**Adjust individual stages as needed:**

Example:
```
Stage 8 (Jump Chains):
- Initial: ≤2 crashes, ≥70% orbs
- Playtest: 30% 3⭐ rate (too hard for medium tier)
- Adjusted: ≤3 crashes, ≥65% orbs
- Re-test: 55% 3⭐ rate ✓
```

---

## Final Verification Checklist

### Completion Verification

- [ ] All 15 stages are completable (designer can reach finish line)
- [ ] All 15 stages can be 3⭐'d (designer can achieve perfect run)
- [ ] No impossible obstacle patterns
- [ ] No invisible obstacles
- [ ] All orbs are collectible

### Difficulty Curve Verification

- [ ] Stage 1 is easiest (90%+ 3⭐ rate)
- [ ] Stage 15 is hardest (20-40% 3⭐ rate)
- [ ] Smooth progression (no sudden spikes)
- [ ] Each tier feels distinct (Easy < Medium < Hard)

### Star Threshold Verification

- [ ] Easy tier: 80-90% 3⭐ rate
- [ ] Medium tier: 50-70% 3⭐ rate
- [ ] Hard tier: 20-40% 3⭐ rate
- [ ] All tiers: 100% 1⭐ rate (always completable)

### Player Experience Verification

- [ ] Players understand star goals (no confusion)
- [ ] Players feel progress (each stage feels like improvement)
- [ ] Players don't rage quit (frustration is minimal)
- [ ] Players retry for 3⭐ (challenge is engaging)
- [ ] Players feel satisfied (completing stage feels good)

---

## Optional: Analytics (Post-Launch)

**If you add analytics later, track:**

- **Completion rate** per stage
- **3⭐ rate** per stage
- **Average crashes** per stage
- **Retry rate** (how many players replay for better stars)
- **Drop-off points** (where players stop progressing)

**Use data to fine-tune:**
- If Stage 7 has 10% completion rate → too hard, adjust
- If Stage 3 has 5% retry rate → too easy, adjust

---

## MVP Complete Criteria

**Stage Mode MVP is done when:**

1. ✅ All 15 stages playable
2. ✅ Designer can 3⭐ all stages
3. ✅ Difficulty curve verified (smooth 1→15)
4. ✅ Star thresholds tuned (meet target success rates)
5. ✅ No crashes/bugs in gameplay
6. ✅ Casual player testing passed (if applicable)
7. ✅ All UI screens functional
8. ✅ Progress saves/loads correctly

**Then:** Ship it! 🚀
