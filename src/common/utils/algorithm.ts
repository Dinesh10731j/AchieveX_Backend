export interface ConfidenceInput {
  successRate: number;
  activityScore: number;
  timeFactor: number;
}

const clamp = (value: number): number => Math.max(0, Math.min(1, value));

export const calculateGoalConfidence = (input: ConfidenceInput): number => {
  const successRate = clamp(input.successRate);
  const activityScore = clamp(input.activityScore);
  const timeFactor = clamp(input.timeFactor);

  const score = successRate * 0.5 + activityScore * 0.3 + timeFactor * 0.2;
  return Number(score.toFixed(4));
};

export const calculateTimeFactor = (deadline: Date, createdAt: Date): number => {
  const now = Date.now();
  const total = deadline.getTime() - createdAt.getTime();
  const remaining = deadline.getTime() - now;

  if (total <= 0 || remaining <= 0) {
    return 0;
  }

  return Math.max(0, Math.min(1, remaining / total));
};

export const normalizeActivityScore = (commentsCount: number, reactionsCount: number, hasProof: boolean): number => {
  const weighted = commentsCount * 0.5 + reactionsCount * 0.3 + (hasProof ? 3 : 0.2);
  return Math.max(0, Math.min(1, weighted / 10));
};
