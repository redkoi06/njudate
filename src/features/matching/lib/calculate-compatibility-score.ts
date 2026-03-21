interface CompatibilityScoreInput {
  matchedWeight: number;
  totalWeight: number;
}

export function calculateCompatibilityScore({
  matchedWeight,
  totalWeight,
}: CompatibilityScoreInput) {
  if (totalWeight <= 0) {
    return 0;
  }

  const rawScore = (matchedWeight / totalWeight) * 100;

  return Math.max(0, Math.min(100, Math.round(rawScore)));
}
