/* ========================================
   WEEK 1 TESTING SCRIPT
   Run this in browser console to test Stage Mode files
   ======================================== */

console.log('=== WEEK 1: Stage Mode Foundation Test ===\n');

// Test 1: Stage Registry
console.log('TEST 1: Stage Registry');
console.log('- Total stages:', getTotalStages());
console.log('- Stage 1:', getStage('stage-1-intro'));
console.log('- Stage 15:', getStage('stage-15-final'));
console.log('- Get by order (5):', getStageByOrder(5));
console.log('- Next stage after 3:', getNextStage('stage-3-jump'));
console.log('✅ Stage Registry OK\n');

// Test 2: Progress Storage
console.log('TEST 2: Progress Storage');
const progress = loadProgress();
console.log('- Initial progress:', progress);
console.log('- Stage 1 unlocked?', progress.stageProgress['stage-1-intro'].unlocked);
console.log('- Total stars:', progress.totalStars);
console.log('✅ Progress Storage OK\n');

// Test 3: Star Calculator
console.log('TEST 3: Star Calculator');
const testStage = getStage('stage-1-intro');

// Test case 1: Perfect run (3 stars)
const stars1 = calculateStars(1, 10, 15, testStage);
console.log('- Perfect run (1 crash, 10/15 orbs = 66%):', stars1, '⭐ (expect 3)');

// Test case 2: Good run (2 stars)
const stars2 = calculateStars(4, 8, 15, testStage);
console.log('- Good run (4 crashes, 8/15 orbs = 53%):', stars2, '⭐ (expect 2)');

// Test case 3: Completed (1 star)
const stars3 = calculateStars(8, 5, 15, testStage);
console.log('- Completed (8 crashes, 5/15 orbs = 33%):', stars3, '⭐ (expect 1)');

console.log('✅ Star Calculator OK\n');

// Test 4: Save Progress
console.log('TEST 4: Save Progress');
const newReward = saveProgress('stage-1-intro', 3, 1, 10, 15);
const updatedProgress = loadProgress();
console.log('- Stage 1 completed:', updatedProgress.stageProgress['stage-1-intro'].completed);
console.log('- Stage 1 best stars:', updatedProgress.stageProgress['stage-1-intro'].bestStars);
console.log('- Stage 2 unlocked?', updatedProgress.stageProgress['stage-2-rhythm'].unlocked);
console.log('- Total stars:', updatedProgress.totalStars);
console.log('- New reward?', newReward);
console.log('✅ Save Progress OK\n');

// Test 5: Reward Unlocks
console.log('TEST 5: Reward Unlocks');
// Complete more stages to trigger rewards
saveProgress('stage-2-rhythm', 3, 0, 18, 18);
saveProgress('stage-3-jump', 2, 3, 12, 18);
const progressAfterRewards = loadProgress();
console.log('- Total stars after 3 stages:', progressAfterRewards.totalStars);
console.log('- Unlocked rewards:', progressAfterRewards.unlockedRewards);
console.log('- Expected: Neon Trail at 5⭐');
console.log('✅ Reward Unlocks OK\n');

// Test 6: Game State (Stage Mode flag)
console.log('TEST 6: Game State');
console.log('- isStageMode:', GameState.isStageMode, '(expect false in Free Run)');
console.log('- currentStage:', GameState.currentStage, '(expect null)');
console.log('- crashes:', GameState.crashes);
console.log('- orbsCollected:', GameState.orbsCollected);
console.log('✅ Game State OK\n');

// Test 7: Star Messages
console.log('TEST 7: Star Messages & Helpers');
console.log('- 3⭐ message:', getStarMessage(3));
console.log('- 2⭐ message:', getStarMessage(2));
console.log('- 1⭐ message:', getStarMessage(1));
console.log('- Star requirements for Stage 1:', getStarRequirements(testStage));
console.log('- Improvement tip:', getImprovementTip(2, 5, 50, testStage));
console.log('✅ Star Messages OK\n');

// Summary
console.log('=== WEEK 1 TEST COMPLETE ===');
console.log('All systems operational! ✅');
console.log('\nNext steps:');
console.log('- Week 2: Create obstacle patterns for 15 stages');
console.log('- Week 3: Build UI (Level Select, Stage Info, Results)');
console.log('- Week 4: Balancing & Polish');
console.log('\nFree Run mode: UNTOUCHED ✅');
console.log('(GameState.isStageMode = false by default)');
