export const toMs = (value: string): number => {
  const match = value.match(/^(\d+)([smhd])$/);
  if (!match) {
    return 0;
  }

  const amount = Number(match[1]);
  const unit = match[2];

  const multiplier: Record<string, number> = {
    s: 1000,
    m: 60 * 1000,
    h: 60 * 60 * 1000,
    d: 24 * 60 * 60 * 1000
  };

  return amount * multiplier[unit];
};
