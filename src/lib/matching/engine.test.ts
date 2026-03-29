import { describe, expect, it } from "vitest";

import {
  buildPairCandidate,
  selectGreedyPairs,
  type MatchingParticipant,
  type MatchingQuestion,
} from "@/lib/matching/engine";
import type { MatchingPolicy } from "@/lib/matching/policy";

const defaultMatchingPolicy: MatchingPolicy = {
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

const ageOnlyPolicy: MatchingPolicy = {
  minimumPairScore: 0,
  profileFilters: [
    {
      field: "gender",
      mode: "opposite_required",
    },
  ],
  profileScoring: [],
  questionScoring: {
    singleDefaultWeight: 1,
    multipleDefaultWeight: 1.2,
    scaleDefaultWeight: 1.5,
    minimumComparableQuestions: 1,
  },
};

const campusScoringPolicy: MatchingPolicy = {
  minimumPairScore: 0,
  profileFilters: [
    {
      field: "gender",
      mode: "opposite_required",
    },
  ],
  profileScoring: [
    {
      field: "campus",
      mode: "same_bonus",
      weight: 10,
    },
  ],
  questionScoring: {
    singleDefaultWeight: 1,
    multipleDefaultWeight: 1.2,
    scaleDefaultWeight: 1.5,
    minimumComparableQuestions: 1,
  },
};

const standardQuestions: MatchingQuestion[] = [
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
  {
    kind: "scale",
    options: [],
    prompt: "Meet frequency",
    questionCode: "q-scale",
    scaleMax: 5,
    scaleMin: 1,
    weight: 1.5,
  },
];

const agePreferenceQuestion: MatchingQuestion = {
  kind: "single",
  options: [
    { id: "older", label: "Older" },
    { id: "same-age", label: "Same age" },
    { id: "younger", label: "Younger" },
    { id: "soul-match", label: "Soul match" },
  ],
  prompt: "Age preference",
  questionCode: "q-age-preference",
  scaleMax: null,
  scaleMin: null,
  weight: 1,
};

function createParticipant(input: {
  answers: MatchingParticipant["answers"];
  birthYear: number;
  campus?: string;
  gender: string;
  id: string;
}) {
  return {
    answers: input.answers,
    participationId: input.id,
    profileSnapshot: {
      birth_year: input.birthYear,
      campus: input.campus ?? "xianlin",
      department: "software",
      gender: input.gender,
      grade: "year-1",
      nickname: input.id,
    },
    userId: input.id,
  } satisfies MatchingParticipant;
}

describe("matching engine", () => {
  it("rejects same-gender pairs before scoring", () => {
    const left = createParticipant({
      answers: {
        "q-multiple": ["read", "walk"],
        "q-scale": 4,
        "q-single": "slow",
      },
      birthYear: 2001,
      gender: "female",
      id: "left",
    });
    const right = createParticipant({
      answers: {
        "q-multiple": ["read", "walk"],
        "q-scale": 4,
        "q-single": "slow",
      },
      birthYear: 2002,
      gender: "female",
      id: "right",
    });

    expect(
      buildPairCandidate({
        left,
        matchingPolicy: defaultMatchingPolicy,
        questions: standardQuestions,
        right,
      }),
    ).toBeNull();
  });

  it("rejects different-campus pairs before scoring", () => {
    const left = createParticipant({
      answers: {
        "q-multiple": ["read", "walk"],
        "q-scale": 4,
        "q-single": "slow",
      },
      birthYear: 2001,
      campus: "xianlin",
      gender: "female",
      id: "left",
    });
    const right = createParticipant({
      answers: {
        "q-multiple": ["read", "walk"],
        "q-scale": 4,
        "q-single": "slow",
      },
      birthYear: 2002,
      campus: "gulou",
      gender: "male",
      id: "right",
    });

    expect(
      buildPairCandidate({
        left,
        matchingPolicy: defaultMatchingPolicy,
        questions: standardQuestions,
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
      gender: "female",
      id: "left",
    });
    const right = createParticipant({
      answers: {
        "q-single": "slow",
      },
      birthYear: 2002,
      gender: "male",
      id: "right",
    });

    expect(
      buildPairCandidate({
        left,
        matchingPolicy: defaultMatchingPolicy,
        questions: standardQuestions,
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
      gender: "female",
      id: "left",
    });
    const right = createParticipant({
      answers: {
        "q-multiple": ["read", "walk"],
        "q-scale": 5,
        "q-single": "slow",
      },
      birthYear: 2002,
      gender: "male",
      id: "right",
    });

    const candidate = buildPairCandidate({
      left,
      matchingPolicy: defaultMatchingPolicy,
      questions: standardQuestions,
      right,
    });

    expect(candidate).not.toBeNull();
    expect(candidate?.score).toBeGreaterThanOrEqual(60);
    expect(candidate?.previewText).toBeTruthy();
    expect(candidate?.reasons.length).toBeGreaterThanOrEqual(3);
  });

  it("applies the special age-preference score when preferences align with actual ages", () => {
    const left = createParticipant({
      answers: {
        "q-age-preference": "older",
      },
      birthYear: 2002,
      gender: "female",
      id: "left",
    });
    const right = createParticipant({
      answers: {
        "q-age-preference": "younger",
      },
      birthYear: 2001,
      gender: "male",
      id: "right",
    });

    const candidate = buildPairCandidate({
      left,
      matchingPolicy: ageOnlyPolicy,
      questions: [agePreferenceQuestion],
      right,
    });

    expect(candidate).not.toBeNull();
    expect(candidate?.comparableCount).toBe(1);
    expect(candidate?.score).toBe(100);
  });

  it("keeps q-age-preference comparable even when the final score is zero", () => {
    const left = createParticipant({
      answers: {
        "q-age-preference": "older",
      },
      birthYear: 2002,
      gender: "female",
      id: "left",
    });
    const right = createParticipant({
      answers: {
        "q-age-preference": "older",
      },
      birthYear: 2001,
      gender: "male",
      id: "right",
    });

    const candidate = buildPairCandidate({
      left,
      matchingPolicy: ageOnlyPolicy,
      questions: [agePreferenceQuestion],
      right,
    });

    expect(candidate).not.toBeNull();
    expect(candidate?.comparableCount).toBe(1);
    expect(candidate?.score).toBe(0);
    expect(candidate?.previewText).toBeTruthy();
    expect(candidate?.reasons.length).toBeGreaterThanOrEqual(3);
  });

  it("scores same-age preference with a one-year gap at 25", () => {
    const left = createParticipant({
      answers: {
        "q-age-preference": "same-age",
      },
      birthYear: 2002,
      gender: "female",
      id: "left",
    });
    const right = createParticipant({
      answers: {
        "q-age-preference": "same-age",
      },
      birthYear: 2001,
      gender: "male",
      id: "right",
    });

    const candidate = buildPairCandidate({
      left,
      matchingPolicy: ageOnlyPolicy,
      questions: [agePreferenceQuestion],
      right,
    });

    expect(candidate).not.toBeNull();
    expect(candidate?.score).toBe(25);
  });

  it("does not let campus same_bonus raise the score after campus becomes a hard filter", () => {
    const scaleOnlyQuestion: MatchingQuestion = {
      kind: "scale",
      options: [],
      prompt: "Meet frequency",
      questionCode: "q-scale",
      scaleMax: 5,
      scaleMin: 1,
      weight: 1,
    };
    const left = createParticipant({
      answers: {
        "q-scale": 4,
      },
      birthYear: 2002,
      gender: "female",
      id: "left",
    });
    const right = createParticipant({
      answers: {
        "q-scale": 5,
      },
      birthYear: 2001,
      gender: "male",
      id: "right",
    });

    const candidate = buildPairCandidate({
      left,
      matchingPolicy: campusScoringPolicy,
      questions: [scaleOnlyQuestion],
      right,
    });

    expect(candidate).not.toBeNull();
    expect(candidate?.score).toBe(75);
  });

  it("keeps only the highest-ranked non-overlapping pairs", () => {
    const left = createParticipant({
      answers: {
        "q-multiple": ["read", "walk"],
        "q-scale": 4,
        "q-single": "slow",
      },
      birthYear: 2001,
      gender: "female",
      id: "left",
    });
    const rightStrong = createParticipant({
      answers: {
        "q-multiple": ["read", "walk"],
        "q-scale": 4,
        "q-single": "slow",
      },
      birthYear: 2002,
      gender: "male",
      id: "right-strong",
    });
    const rightWeak = createParticipant({
      answers: {
        "q-multiple": ["sports"],
        "q-scale": 1,
        "q-single": "fast",
      },
      birthYear: 2005,
      gender: "male",
      id: "right-weak",
    });

    const strongCandidate = buildPairCandidate({
      left,
      matchingPolicy: defaultMatchingPolicy,
      questions: standardQuestions,
      right: rightStrong,
    });
    const weakCandidate = buildPairCandidate({
      left,
      matchingPolicy: defaultMatchingPolicy,
      questions: standardQuestions,
      right: rightWeak,
    });

    expect(strongCandidate).not.toBeNull();
    expect(weakCandidate).toBeNull();

    const selected = selectGreedyPairs([strongCandidate!]);

    expect(selected.selected).toHaveLength(1);
    expect(selected.selected[0]?.right.userId).toBe("right-strong");
  });
});
