# Stage Mode - MVP Overview

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

## What is Stage Mode?

### Overview
Stage Mode transforms Beat Runner's endless runner into **curated, bite-sized challenges**. Instead of running until you crash, you complete fixed-length levels (45-75 seconds) with clear star-based ratings.

**Think:** Subway Surfers meets Candy Crush's level progression.

### Key Differences from Free Run

| Free Run | Stage Mode (MVP) |
|----------|------------------|
| Endless until death | Fixed 1000-1500m |
| Random obstacles | Handcrafted patterns |
| High score chasing | Star collection (1-3⭐) |
| 2-10 minute sessions | 45-75 second levels |
| Single theme | Neon District (1 world in MVP) |

### Why Players Will Love It

- **Quick Wins:** Complete a level in 60 seconds
- **Clear Progress:** Always know what's next (15 stages to complete)
- **No Punishment:** Always finish, never "fail"
- **Skill Expression:** 3-starring levels = mastery
- **Simple Goals:** Easy to understand star requirements

---

## Success Criteria

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

---

## Timeline Summary

### Week 1: Foundation & Core System
- Define stage metadata structure
- Create stage-registry.js (15 stages)
- Implement stage progress storage (localStorage)
- Add finish line object
- Implement simple star calculation (rule-based)
- Test: Can load stage, complete, earn stars

### Week 2: Content Creation
- Design all 15 stage patterns
- Implement obstacle patterns
- Set star thresholds per stage
- Test: All 15 stages playable

### Week 3: UI & Progression
- Main menu: Add Stage Mode button
- Level select screen (15 stages)
- Stage info card
- In-game HUD (progress, crashes, orbs)
- Results screen
- Simple unlock system
- Test: Full gameplay loop functional

### Week 4: Balancing & Polish
- Playtest all 15 stages (5+ runs each)
- Tune star thresholds
- Adjust difficulty curve
- Add basic animations (star reveal)
- Sound effects (optional)
- Final testing
- MVP COMPLETE

---

**This MVP is focused, executable, and gets Stage Mode in players' hands quickly.**
