import { describe, expect, it } from "vitest";

import { type MatchingParticipant, type MatchingQuestion } from "./engine";
import { comparePolicies, evaluatePolicyOnDataset } from "./ab-eval";
import type { MatchingPolicy } from "./policy";

const questions: MatchingQuestion[] = [
  {
    kind: "single",
    options: [
      { id: "slow", label: "Slow" },
      { id: "fast", label: "Fast" },
    ],
    prompt: "Life pace",
    questionCode: "q-single",
    scaleMax: null,
    scaleMin: null,
    weight: 1,
  },
  {
    kind: "multiple",
    options: [
      { id: "read", label: "Read" },
      { id: "walk", label: "Walk" },
      { id: "sports", label: "Sports" },
    ],
    prompt: "Weekend preference",
    questionCode: "q-multiple",
    scaleMax: null,
    scaleMin: null,
    weight: 1.2,
  },
];

const baselinePolicy: MatchingPolicy = {
  minimumPairScore: 70,
  profileFilters: [{ field: "gender", mode: "opposite_required" }],
  profileScoring: [
    {
      field: "grade",
      mode: "same_bonus",
      weight: 0.6,
    },
  ],
  questionScoring: {
    singleDefaultWeight: 1,
    multipleDefaultWeight: 1.2,
    scaleDefaultWeight: 1.5,
    minimumComparableQuestions: 1,
  },
};

const challengerPolicy: MatchingPolicy = {
  ...baselinePolicy,
  minimumPairScore: 60,
};

function createParticipant(input: {
  answers: MatchingParticipant["answers"];
  birthYear: number;
  gender: string;
  grade: string;
  id: string;
}) {
  return {
    answers: input.answers,
    participationId: input.id,
    profileSnapshot: {
      birth_year: input.birthYear,
      campus: "xianlin",
      department: "software",
      gender: input.gender,
      grade: input.grade,
      nickname: input.id,
    },
    userId: input.id,
  } satisfies MatchingParticipant;
}

const participants: MatchingParticipant[] = [
  createParticipant({
    answers: {
      "q-multiple": ["read", "walk"],
      "q-single": "slow",
    },
    birthYear: 2001,
    gender: "female",
    grade: "year-1",
    id: "f1",
  }),
  createParticipant({
    answers: {
      "q-multiple": ["sports"],
      "q-single": "fast",
    },
    birthYear: 2002,
    gender: "female",
    grade: "year-2",
    id: "f2",
  }),
  createParticipant({
    answers: {
      "q-multiple": ["read", "walk"],
      "q-single": "slow",
    },
    birthYear: 2001,
    gender: "male",
    grade: "year-1",
    id: "m1",
  }),
  createParticipant({
    answers: {
      "q-multiple": ["read"],
      "q-single": "slow",
    },
    birthYear: 2003,
    gender: "male",
    grade: "year-2",
    id: "m2",
  }),
];

describe("ab-eval", () => {
  it("evaluates one policy and returns metrics", () => {
    const result = evaluatePolicyOnDataset({
      matchingPolicy: baselinePolicy,
      participants,
      questions,
    });

    expect(result.metrics.totalParticipants).toBe(4);
    expect(result.metrics.matchedPairs).toBeGreaterThanOrEqual(1);
    expect(result.metrics.matchRate).toBeGreaterThan(0);
    expect(result.metrics.stabilityViolations).toBe(0);
  });

  it("compares baseline and challenger with deltas", () => {
    const result = comparePolicies({
      baselinePolicy,
      challengerPolicy,
      participants,
      questions,
    });

    expect(result.baseline.metrics.totalParticipants).toBe(4);
    expect(result.challenger.metrics.totalParticipants).toBe(4);
    expect(result.delta.matchedParticipantsDelta).toBeGreaterThanOrEqual(0);
    expect(result.delta.stabilityViolationsDelta).toBeLessThanOrEqual(0);
  });
});
