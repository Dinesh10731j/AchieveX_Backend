import { calculateGoalConfidence } from '../../common/utils/algorithm';

describe('Goal Confidence Algorithm', () => {
  it('calculates weighted score correctly', () => {
    const score = calculateGoalConfidence({
      successRate: 0.8,
      activityScore: 0.5,
      timeFactor: 0.25
    });

    expect(score).toBe(0.6);
  });

  it('clamps invalid inputs between 0 and 1', () => {
    const score = calculateGoalConfidence({
      successRate: 2,
      activityScore: -1,
      timeFactor: 0.5
    });

    expect(score).toBe(0.6);
  });
});
