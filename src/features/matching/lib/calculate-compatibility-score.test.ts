import { describe, expect, it } from "vitest";

import { calculateCompatibilityScore } from "@/features/matching/lib/calculate-compatibility-score";

describe("calculateCompatibilityScore", () => {
  it("returns 0 when there is no valid denominator", () => {
    expect(
      calculateCompatibilityScore({
        matchedWeight: 10,
        totalWeight: 0,
      }),
    ).toBe(0);
  });

  it("returns a rounded percentage for standard inputs", () => {
    expect(
      calculateCompatibilityScore({
        matchedWeight: 7,
        totalWeight: 9,
      }),
    ).toBe(78);
  });

  it("clamps overflow values to 100", () => {
    expect(
      calculateCompatibilityScore({
        matchedWeight: 12,
        totalWeight: 10,
      }),
    ).toBe(100);
  });
});
