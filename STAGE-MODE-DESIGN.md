# Beat Runner - Stage Mode MVP Design

**Status:** MVP SCOPE - 15 Stages, 1 World, Simplified Systems
**Timeline:** 3-4 Weeks
**Last Updated:** Dec 27, 2025

---

## 🔒 LOCKED DECISIONS (Do Not Change)

1. ✅ **Stage Mode is additive** - Free Run stays 100% untouched
2. ✅ **No failure state** - Player always reaches finish line, collisions reduce stars only
3. ✅ **Short levels** - Target 45-75 seconds per stage
4. ✅ **1-3 star rating system** - Clear, understandable performance tiers

---

## 📦 MVP SCOPE

### Content
- **15 stages** (World 1: Neon District only)
- **1 world** (Cyber Highway & Sunset Boulevard → FUTURE)
- **Simple linear progression** (no world gates in MVP)

### Star System
- **Rule-based only** (no complex scoring formula)
- **2 metrics:** crashes + orbs collected %
- **No "0 stars"** in MVP - finishing always gives ⭐

### Features CUT from MVP (Move to FUTURE)
- ❌ Ghost replay
- ❌ Daily challenges
- ❌ Bonus stages
- ❌ Weekly tournaments
- ❌ Achievements
- ❌ "Beat developer time" bonus
- ❌ "Perfect section" bonus
- ❌ Permanent upgrades (magnet duration, shield capacity)
- ❌ Unlock celebration popups
- ❌ Confetti/haptics (can add in Polish later)

---

# 1. What is Stage Mode?

## Overview
Stage Mode transforms Beat Runner's endless runner into **curated, bite-sized challenges**. Instead of running until you crash, you complete fixed-length levels (45-75 seconds) with clear star-based ratings.

**Think:** Subway Surfers meets Candy Crush's level progression.

## Key Differences from Free Run

| Free Run | Stage Mode (MVP) |
|----------|------------------|
| Endless until death | Fixed 1000-1500m |
| Random obstacles | Handcrafted patterns |
| High score chasing | Star collection (1-3⭐) |
| 2-10 minute sessions | 45-75 second levels |
| Single theme | Neon District (1 world in MVP) |

## Why Players Will Love It

- **Quick Wins:** Complete a level in 60 seconds
- **Clear Progress:** Always know what's next (15 stages to complete)
- **No Punishment:** Always finish, never "fail"
- **Skill Expression:** 3-starring levels = mastery
- **Simple Goals:** Easy to understand star requirements

---

# 2. Level Structure

## Duration & Distance
- **Length:** 45-75 seconds per stage
- **Distance:** 1,000-1,500 meters
- **Perfect for:** Mobile "waiting in line" sessions

## Completion Rules
**Win Condition:** Cross the finish line (glowing archway)

**Key Design:**
- **No failure:** Hitting obstacles slows you down but doesn't end the level
- **Always progress:** Even with 10 crashes, you reach the finish
- **Stars measure performance:** Crashes and orbs determine stars, not completion

## Progress Feedback (MVP)
- Progress bar (0% → 100%) at top of screen
- Crash counter (live)
- Orbs collected counter (e.g., "15/30")
- Star thresholds visible on progress bar (optional)

---

# 3. Star Rating System ⭐⭐⭐ (MVP SIMPLIFIED)

## Philosophy
**Stars measure clean execution, not just completion.**

## MVP Star Rules (SIMPLIFIED)

**No complex scoring formula.** Stars are determined by **2 simple metrics:**

1. **Crashes** (how many obstacles you hit)
2. **Orbs Collected %** (how many orbs you collected)

### Three Tiers

**⭐ 1 Star - "Completed"**
- Requirement: Reach the finish line
- No additional requirements
- Message: "Stage Complete!"

**⭐⭐ 2 Stars - "Great Run!"**
- Max crashes: 5 or fewer
- Min orbs: 40-50% collected
- Message: "Solid Performance!"

**⭐⭐⭐ 3 Stars - "Perfect!"**
- Max crashes: 1-2 (varies by stage difficulty)
- Min orbs: 60-80% collected (varies by stage difficulty)
- Message: "Flawless Victory!"

## MVP Star Thresholds Per Stage Tier

**Early Stages (1-5):**
- 3⭐: crashes ≤ 2, orbs ≥ 60%
- 2⭐: crashes ≤ 5, orbs ≥ 40%
- 1⭐: complete (always)

**Mid Stages (6-10):**
- 3⭐: crashes ≤ 2, orbs ≥ 70%
- 2⭐: crashes ≤ 5, orbs ≥ 50%
- 1⭐: complete (always)

**Late Stages (11-15):**
- 3⭐: crashes ≤ 1, orbs ≥ 75-80%
- 2⭐: crashes ≤ 4, orbs ≥ 50%
- 1⭐: complete (always)

**MVP Implementation:**
```javascript
function calculateStars(crashes, orbsCollected, totalOrbs, stageId) {
  const orbPercent = (orbsCollected / totalOrbs) * 100;
  const thresholds = STAGE_THRESHOLDS[stageId];

  if (crashes <= thresholds.star3Crashes && orbPercent >= thresholds.star3Orbs) {
    return 3;
  } else if (crashes <= thresholds.star2Crashes && orbPercent >= thresholds.star2Orbs) {
    return 2;
  } else {
    return 1; // Always at least 1 star for completing
  }
}
```

---

# 4. Progression & Unlocks (MVP)

## Stage Unlocking (Linear)
**Rule:** Complete previous stage (any stars) → unlock next

```
Stage 1 (auto-unlocked) → Stage 2 → Stage 3 → ... → Stage 15
```

**No world gates in MVP** (only 1 world)

## MVP Reward Distribution

**Keep it MINIMAL:**

| Total Stars | Reward | Type |
|-------------|--------|------|
| 5⭐ | Neon Trail | Cosmetic |
| 10⭐ | Crystal Ball Skin | Cosmetic |
| 15⭐ | Rainbow Particle Effect | Cosmetic |

**That's it.** 3 rewards only in MVP.

**No power-ups, no upgrades, no world unlocks** in MVP.

---

# 5. Difficulty Curve (MVP: 15 Stages)

## Progression: 1 World, 3 Tiers

| Stages | Tier | Speed | Gap | Patterns | Orbs |
|--------|------|-------|-----|----------|------|
| 1-5 | Easy | 28 u/s | 25m | Single lane | 15-20 |
| 6-10 | Medium | 30 u/s | 20m | 1-2 lane blocks | 20-25 |
| 11-15 | Hard | 32 u/s | 18m | 2-lane blocks + jumps | 25-30 |

## What NEVER Changes
- Lane switching speed (always 12 u/s)
- Jump physics (JUMP_FORCE: 8, GRAVITY: 22)
- Visual clarity (obstacles visible 3.6s ahead)
- Controls responsiveness
- Beat synchronization (128 BPM)

---

# 6. UI/UX Flow (MVP)

## Main Menu

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

## Level Select Screen (MVP: World 1 Only)

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
└────────────────────────────────────────┘
```

## Stage Info Card (MVP)

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

## In-Level HUD (MVP)

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

## Results Screen (MVP)

**3 Stars:**
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

**1 Star:**
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

---

# 7. Casual Design Principles (MVP)

**1. Players Win Often**
- 1 star guaranteed by finishing
- No failure state
- Stages 1-5 designed for 90%+ 3-star success

**2. Slow Difficulty Escalation**
- 5 stages per tier (Easy, Medium, Hard)
- Each stage adds ONE new challenge
- Speed increases gradually (28 → 32 over 15 stages)

**3. No Punishment Loops**
- Low stars don't block progress
- Can always move to next stage
- Replay is optional

**4. Positive Feedback**
- "Stage Complete!" not "You Failed"
- Helpful tips on lower stars
- Celebrate improvements

---

---

# Implementation Plan (MVP: 3-4 Weeks)

## Week 1: Foundation & Core System
- Define stage metadata structure
- Create stage-registry.js (15 stages)
- Implement stage progress storage (localStorage)
- Add finish line object
- Implement simple star calculation (rule-based)
- Test: Can load stage, complete, earn stars

## Week 2: Content Creation
- Design all 15 stage patterns
- Implement obstacle patterns
- Set star thresholds per stage
- Test: All 15 stages playable

## Week 3: UI & Progression
- Main menu: Add Stage Mode button
- Level select screen (15 stages)
- Stage info card
- In-game HUD (progress, crashes, orbs)
- Results screen
- Simple unlock system
- Test: Full gameplay loop functional

## Week 4: Balancing & Polish
- Playtest all 15 stages (5+ runs each)
- Tune star thresholds
- Adjust difficulty curve
- Add basic animations (star reveal)
- Sound effects (optional)
- Final testing
- MVP COMPLETE

---

# Documentation Files to Create

Create these in `/docs/stage-mode/`:

## 1. `00-overview.md` - MVP Summary
- MVP scope (15 stages, 1 world)
- Locked decisions
- Success criteria
- Timeline (3-4 weeks)

## 2. `01-core-system.md` - Foundation
- Stage metadata structure
- Stage registry (15 stages)
- Progress storage
- Star calculation (rule-based formula)
- Finish line detection

## 3. `02-level-design.md` - 15 Stages
- Stage 1-5: Easy (tutorial)
- Stage 6-10: Medium
- Stage 11-15: Hard
- Design process per stage

## 4. `03-stars-scoring.md` - Simplified System
- Rule-based stars (crashes + orbs %)
- Thresholds per stage
- No complex scoring formula in MVP

## 5. `04-progression-unlocks.md` - Minimal Rewards
- Linear unlock (complete previous)
- 3 rewards only (5⭐, 10⭐, 15⭐)
- No world gates in MVP

## 6. `05-ui-flow.md` - Essential Screens
- Main menu update
- Level select (15 stages)
- Stage info card
- In-game HUD
- Results screen
- No unlock popups in MVP

## 7. `06-balancing.md` - Playtest 15 Stages
- Designer testing
- Casual player testing
- Tune thresholds
- Verify difficulty curve

## 8. `progress.md` - Master Tracker
- Current phase
- Next 3 tasks
- Weekly goals
- Known risks (MVP scope)

---

# Summary

**MVP Stage Mode delivers:**
- ✅ 15 playable stages (World 1: Neon District)
- ✅ Simple star rating (crashes + orbs %)
- ✅ Linear progression (no gates)
- ✅ Minimal rewards (3 cosmetics)
- ✅ Essential UI (5 screens)
- ✅ 3-4 week timeline

**Post-MVP (FUTURE):**
- World 2 & 3 (15 more stages each)
- Ghost replay
- Daily challenges
- Achievements
- Permanent upgrades
- Polish (confetti, haptics, celebrations)

**This MVP is focused, executable, and gets Stage Mode in players' hands quickly.**

---

**Ready to split into individual markdown files and begin implementation.**
