# Level Design - 15 Stages

**World:** Neon District
**Stages:** 1-15
**Last Updated:** Dec 27, 2025

---

## Difficulty Curve

### Progression: 1 World, 3 Tiers

| Stages | Tier | Speed | Gap | Patterns | Orbs |
|--------|------|-------|-----|----------|------|
| 1-5 | Easy | 28 u/s | 25m | Single lane | 15-20 |
| 6-10 | Medium | 30 u/s | 20m | 1-2 lane blocks | 20-25 |
| 11-15 | Hard | 32 u/s | 18m | 2-lane blocks + jumps | 25-30 |

### What NEVER Changes
- Lane switching speed (always 12 u/s)
- Jump physics (JUMP_FORCE: 8, GRAVITY: 22)
- Visual clarity (obstacles visible 3.6s ahead)
- Controls responsiveness
- Beat synchronization (128 BPM)

---

## Stage 1-5: Easy Tier (Tutorial)

**Goal:** Introduce mechanics one at a time, 90%+ players get 3 stars

### Stage 1: Neon Intro
- **Distance:** 1,000m
- **Speed:** 28 u/s
- **Target Time:** 45s
- **Orbs:** 15 (placed in straight lines)
- **Obstacles:** Single lane only, large gaps (30m)
- **New Mechanic:** Lane switching
- **Stars:** 3⭐ = ≤2 crashes + 60% orbs

### Stage 2: Rhythm Basics
- **Distance:** 1,100m
- **Speed:** 28 u/s
- **Target Time:** 50s
- **Orbs:** 18
- **Obstacles:** Single lane, on-beat placement (every 4 beats)
- **New Mechanic:** Beat synchronization
- **Stars:** 3⭐ = ≤2 crashes + 60% orbs

### Stage 3: Jump Practice
- **Distance:** 1,100m
- **Speed:** 28 u/s
- **Target Time:** 50s
- **Orbs:** 18 (some require jumps)
- **Obstacles:** Single lane + occasional jump-only paths
- **New Mechanic:** Jumping
- **Stars:** 3⭐ = ≤2 crashes + 60% orbs

### Stage 4: Lane Switching
- **Distance:** 1,200m
- **Speed:** 28 u/s
- **Target Time:** 55s
- **Orbs:** 20
- **Obstacles:** Alternating single lanes (forces switching)
- **New Mechanic:** Quick lane changes
- **Stars:** 3⭐ = ≤2 crashes + 60% orbs

### Stage 5: Speed Boost
- **Distance:** 1,200m
- **Speed:** 29 u/s (slight increase)
- **Target Time:** 55s
- **Orbs:** 20
- **Obstacles:** Mixed single lanes
- **New Mechanic:** Slightly faster speed
- **Stars:** 3⭐ = ≤2 crashes + 60% orbs

---

## Stage 6-10: Medium Tier

**Goal:** Combine mechanics, introduce double obstacles, 60% players get 3 stars

### Stage 6: Double Trouble
- **Distance:** 1,250m
- **Speed:** 30 u/s
- **Target Time:** 60s
- **Orbs:** 22
- **Obstacles:** First 2-lane blocks appear (leaves 1 safe lane)
- **New Mechanic:** 2-lane obstacles
- **Stars:** 3⭐ = ≤2 crashes + 70% orbs

### Stage 7: Rhythm Run
- **Distance:** 1,300m
- **Speed:** 30 u/s
- **Target Time:** 62s
- **Orbs:** 23
- **Obstacles:** 2-lane blocks on beat, orbs off-beat
- **New Mechanic:** Beat-based decision making
- **Stars:** 3⭐ = ≤2 crashes + 70% orbs

### Stage 8: Jump Chains
- **Distance:** 1,300m
- **Speed:** 30 u/s
- **Target Time:** 62s
- **Orbs:** 24 (requires multiple jumps)
- **Obstacles:** Jump-over patterns + 2-lane blocks
- **New Mechanic:** Consecutive jumps
- **Stars:** 3⭐ = ≤2 crashes + 70% orbs

### Stage 9: Quick Reflexes
- **Distance:** 1,350m
- **Speed:** 31 u/s
- **Target Time:** 65s
- **Orbs:** 24
- **Obstacles:** Faster obstacle sequences, smaller gaps (20m)
- **New Mechanic:** Reaction time challenge
- **Stars:** 3⭐ = ≤2 crashes + 70% orbs

### Stage 10: Neon Gauntlet
- **Distance:** 1,400m
- **Speed:** 31 u/s
- **Target Time:** 68s
- **Orbs:** 25
- **Obstacles:** All medium-tier mechanics combined
- **New Mechanic:** Endurance test
- **Stars:** 3⭐ = ≤2 crashes + 70% orbs

---

## Stage 11-15: Hard Tier

**Goal:** Test mastery, 30% players get 3 stars on first try

### Stage 11: Speed Demon
- **Distance:** 1,450m
- **Speed:** 32 u/s
- **Target Time:** 70s
- **Orbs:** 26
- **Obstacles:** Fast 2-lane blocks, tight gaps (18m)
- **New Mechanic:** High-speed obstacle avoidance
- **Stars:** 3⭐ = ≤1 crash + 75% orbs

### Stage 12: Perfect Timing
- **Distance:** 1,450m
- **Speed:** 32 u/s
- **Target Time:** 70s
- **Orbs:** 27
- **Obstacles:** On-beat 2-lane blocks + off-beat orbs
- **New Mechanic:** Precision beat timing
- **Stars:** 3⭐ = ≤1 crash + 75% orbs

### Stage 13: Jump Master
- **Distance:** 1,500m
- **Speed:** 32 u/s
- **Target Time:** 72s
- **Orbs:** 28 (many aerial)
- **Obstacles:** Complex jump patterns + 2-lane blocks
- **New Mechanic:** Advanced jump sequences
- **Stars:** 3⭐ = ≤1 crash + 80% orbs

### Stage 14: Neon Chaos
- **Distance:** 1,500m
- **Speed:** 32 u/s
- **Target Time:** 72s
- **Orbs:** 29
- **Obstacles:** Rapid 2-lane switches, mixed jumps
- **New Mechanic:** Multi-tasking under pressure
- **Stars:** 3⭐ = ≤1 crash + 80% orbs

### Stage 15: Final Challenge
- **Distance:** 1,500m
- **Speed:** 32 u/s
- **Target Time:** 75s
- **Orbs:** 30
- **Obstacles:** All mechanics at maximum difficulty
- **New Mechanic:** Ultimate test
- **Stars:** 3⭐ = ≤1 crash + 80% orbs

---

## Obstacle Pattern Library

### Pattern Types

**Single Lane (Stages 1-5):**
```javascript
[0]  // Left lane blocked
[1]  // Center lane blocked
[2]  // Right lane blocked
```

**Double Lane (Stages 6-15):**
```javascript
[0, 1]  // Left + center blocked (right safe)
[1, 2]  // Center + right blocked (left safe)
[0, 2]  // Left + right blocked (center safe)
```

**Jump Paths (Stages 3+):**
```javascript
{
  type: 'jump-required',
  lanes: [0, 1, 2],  // All lanes blocked on ground
  orbsInAir: true    // Orbs placed at jump height
}
```

### Spawn Timing Rules

- **Minimum gap:** 18-25m (based on tier)
- **Beat sync:** Obstacles spawn on beat (every 0.46875s at 128 BPM)
- **Visibility:** Always 3.6s ahead (SPAWN_DISTANCE: 180m at speed 28-32)

---

## Design Process Per Stage

**For each stage:**

1. **Define goal:** What skill/mechanic to teach?
2. **Set difficulty:** Easy/Medium/Hard tier
3. **Place obstacles:** Create pattern sequence
4. **Place orbs:** Balance between safe paths and risk/reward
5. **Playtest:** 5+ runs, measure crash rate and orb %
6. **Tune thresholds:** Adjust star requirements based on playtest
7. **Verify time:** Ensure 45-75s target time at given speed

**Testing Criteria:**
- Easy: 90% playtesters get 3⭐
- Medium: 60% playtesters get 3⭐
- Hard: 30% playtesters get 3⭐

---

## Testing Checklist (Week 2)

- [ ] All 15 stages have metadata defined
- [ ] Obstacle patterns implemented for each stage
- [ ] Orb placement complete for each stage
- [ ] Finish line appears at correct distance
- [ ] Stage loads correctly from registry
- [ ] Difficulty curve feels smooth (1 → 5 → 10 → 15)
- [ ] All stages completable (no impossible sections)
- [ ] Target times achievable (45-75s)
- [ ] Designer can complete all stages with 3⭐
