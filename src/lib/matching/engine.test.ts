import { describe, expect, it } from "vitest";

import {
  buildPairCandidate,
  selectGreedyPairs,
  type MatchingParticipant,
  type MatchingQuestion,
} from "@/lib/matching/engine";
import type { MatchingPolicy } from "@/lib/matching/policy";

const matchingPolicy: MatchingPolicy = {
  minimumPairScore: 60,
  profileFilters: [
    {
      field: "gender",
      mode: "opposite_required",
    },
  ],
  profileScoring: [
    {
      field: "grade",
      mode: "same_bonus",
      weight: 0.6,
    },
    {
      field: "birth_year",
      mode: "distance_penalty",
      maxGap: 4,
      weight: 0.5,
    },
  ],
  questionScoring: {
    singleDefaultWeight: 1,
    multipleDefaultWeight: 1.2,
    scaleDefaultWeight: 1.5,
    minimumComparableQuestions: 2,
  },
};

const questions: MatchingQuestion[] = [
  {
    kind: "single",
    options: [
      { id: "slow", label: "慢节奏" },
      { id: "fast", label: "快节奏" },
    ],
    prompt: "生活节奏",
    questionCode: "q-single",
    scaleMax: null,
    scaleMin: null,
    weight: 1,
  },
  {
    kind: "multiple",
    options: [
      { id: "read", label: "阅读" },
      { id: "walk", label: "散步" },
      { id: "sports", label: "运动" },
    ],
    prompt: "周末偏好",
    questionCode: "q-multiple",
    scaleMax: null,
    scaleMin: null,
    weight: 1.2,
  },
  {
    kind: "scale",
    options: [],
    prompt: "见面频率",
    questionCode: "q-scale",
    scaleMax: 5,
    scaleMin: 1,
    weight: 1.5,
  },
];

function createParticipant(input: {
  answers: MatchingParticipant["answers"];
  birthYear: number;
  gender: string;
  id: string;
}) {
  return {
    answers: input.answers,
    participationId: input.id,
    profileSnapshot: {
      birth_year: input.birthYear,
      department: "软件学院",
      gender: input.gender,
      grade: "研一",
      nickname: input.id,
    },
    userId: input.id,
  } satisfies MatchingParticipant;
}

describe("matching engine", () => {
  it("rejects same-gender pairs because of the fixed profile filter", () => {
    const left = createParticipant({
      answers: {
        "q-multiple": ["read", "walk"],
        "q-scale": 4,
        "q-single": "slow",
      },
      birthYear: 2001,
      gender: "女",
      id: "left",
    });
    const right = createParticipant({
      answers: {
        "q-multiple": ["read", "walk"],
        "q-scale": 4,
        "q-single": "slow",
      },
      birthYear: 2002,
      gender: "女",
      id: "right",
    });

    expect(
      buildPairCandidate({
        left,
        matchingPolicy,
        questions,
        right,
      }),
    ).toBeNull();
  });

  it("rejects pairs that do not satisfy the minimum comparable question count", () => {
    const left = createParticipant({
      answers: {
        "q-single": "slow",
      },
      birthYear: 2001,
      gender: "女",
      id: "left",
    });
    const right = createParticipant({
      answers: {
        "q-single": "slow",
      },
      birthYear: 2002,
      gender: "男",
      id: "right",
    });

    expect(
      buildPairCandidate({
        left,
        matchingPolicy,
        questions,
        right,
      }),
    ).toBeNull();
  });

  it("builds a candidate only when the final score reaches the configured threshold", () => {
    const left = createParticipant({
      answers: {
        "q-multiple": ["read", "walk"],
        "q-scale": 4,
        "q-single": "slow",
      },
      birthYear: 2001,
      gender: "女",
      id: "left",
    });
    const right = createParticipant({
      answers: {
        "q-multiple": ["read", "walk"],
        "q-scale": 5,
        "q-single": "slow",
      },
      birthYear: 2002,
      gender: "男",
      id: "right",
    });

    const candidate = buildPairCandidate({
      left,
      matchingPolicy,
      questions,
      right,
    });

    expect(candidate).not.toBeNull();
    expect(candidate?.score).toBeGreaterThanOrEqual(60);
    expect(candidate?.reasons.length).toBeGreaterThan(0);
  });

  it("keeps only the highest-ranked non-overlapping pairs", () => {
    const left = createParticipant({
      answers: {
        "q-multiple": ["read", "walk"],
        "q-scale": 4,
        "q-single": "slow",
      },
      birthYear: 2001,
      gender: "女",
      id: "left",
    });
    const rightStrong = createParticipant({
      answers: {
        "q-multiple": ["read", "walk"],
        "q-scale": 4,
        "q-single": "slow",
      },
      birthYear: 2002,
      gender: "男",
      id: "right-strong",
    });
    const rightWeak = createParticipant({
      answers: {
        "q-multiple": ["sports"],
        "q-scale": 1,
        "q-single": "fast",
      },
      birthYear: 2005,
      gender: "男",
      id: "right-weak",
    });

    const strongCandidate = buildPairCandidate({
      left,
      matchingPolicy,
      questions,
      right: rightStrong,
    });
    const weakCandidate = buildPairCandidate({
      left,
      matchingPolicy,
      questions,
      right: rightWeak,
    });

    expect(strongCandidate).not.toBeNull();
    expect(weakCandidate).toBeNull();

    const selected = selectGreedyPairs([strongCandidate!]);

    expect(selected.selected).toHaveLength(1);
    expect(selected.selected[0]?.right.userId).toBe("right-strong");
  });
});
