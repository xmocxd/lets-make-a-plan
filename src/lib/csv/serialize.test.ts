import { describe, it, expect } from 'vitest';
import { serializePlan, deserializePlan } from '../csv/serialize';
import { createDefaultPlan } from '../../types/plan';

describe('csv serialize', () => {
  it('roundtrips plan data', () => {
    const plan = createDefaultPlan();
    plan.meta.onboarded = true;
    plan.dailyLogs.push({
      date: '2026-06-16',
      calories: 1800,
      fat: 0,
      sugar: 0,
      isCheatDay: false,
      fatOverGoal: false,
      sugarOverGoal: false,
      fatSugarCheat: false,
      destressDone: true,
      isRestDay: false,
      exerciseActivityIds: ['ea1'],
    });
    const csv = serializePlan(plan);
    const restored = deserializePlan(csv);
    expect(restored.meta.onboarded).toBe(true);
    expect(restored.dailyLogs).toHaveLength(1);
    expect(restored.dailyLogs[0].calories).toBe(1800);
  });
});
