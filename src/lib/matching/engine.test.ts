import { describe, expect, it } from "vitest";

import {
  buildPairCandidate,
  selectStablePairs,
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

const longDistanceQuestion: MatchingQuestion = {
  kind: "single",
  options: [
    { id: "same-city-only", label: "Same city only" },
    { id: "short-term-ok", label: "Short-term ok" },
    { id: "long-term-ok", label: "Long-term ok" },
    { id: "depends-on-feelings", label: "Depends on feelings" },
  ],
  prompt: "Long distance acceptance",
  questionCode: "q-long-distance-acceptance",
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
        "q-long-distance-acceptance": "same-city-only",
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
        "q-long-distance-acceptance": "same-city-only",
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
    expect(candidate?.explain?.scoreBreakdown.totalWeight).toBeGreaterThan(0);
    expect(candidate?.explain?.topContributors.length).toBeGreaterThan(0);
  });

  it("includes structured explain data for weighted scoring and tie-break", () => {
    const left = createParticipant({
      answers: {
        "q-multiple": ["read", "walk"],
        "q-scale": 4,
        "q-single": "slow",
      },
      birthYear: 2001,
      gender: "female",
      id: "left-explain",
    });
    const right = createParticipant({
      answers: {
        "q-multiple": ["read", "walk"],
        "q-scale": 4,
        "q-single": "slow",
      },
      birthYear: 2002,
      gender: "male",
      id: "right-explain",
    });

    const candidate = buildPairCandidate({
      left,
      matchingPolicy: defaultMatchingPolicy,
      questions: standardQuestions,
      right,
    });

    expect(candidate).not.toBeNull();
    expect(candidate?.explain?.scoreBreakdown.profileWeight).toBe(1.1);
    expect(candidate?.explain?.scoreBreakdown.questionWeight).toBe(3.7);
    expect(candidate?.explain?.tieBreak.deterministicKey).toBe(
      "left-explain:right-explain",
    );
    expect(candidate?.explain?.tieBreak.strengthScore).toBeGreaterThan(0);
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


  it("treats long-distance acceptance as a regular single question", () => {
    const left = createParticipant({
      answers: {
        "q-long-distance-acceptance": "same-city-only",
      },
      birthYear: 2002,
      campus: "xianlin",
      gender: "female",
      id: "left",
    });
    const right = createParticipant({
      answers: {
        "q-long-distance-acceptance": "same-city-only",
      },
      birthYear: 2001,
      campus: "xianlin",
      gender: "male",
      id: "right",
    });

    const candidate = buildPairCandidate({
      left,
      matchingPolicy: ageOnlyPolicy,
      questions: [longDistanceQuestion],
      right,
    });

    expect(candidate).not.toBeNull();
    expect(candidate?.score).toBe(100);
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

  it("keeps only the highest-ranked non-overlapping pairs when only one edge is eligible", () => {
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

    const selected = selectStablePairs([strongCandidate!]);

    expect(selected.selected).toHaveLength(1);
    expect(selected.selected[0]?.right.userId).toBe("right-strong");
  });

  it("builds stable pairs under weighted preference ordering", () => {
    const femaleA = createParticipant({
      answers: {
        "q-single": "slow",
      },
      birthYear: 2001,
      gender: "female",
      id: "female-a",
    });
    const femaleB = createParticipant({
      answers: {
        "q-single": "slow",
      },
      birthYear: 2002,
      gender: "female",
      id: "female-b",
    });
    const maleA = createParticipant({
      answers: {
        "q-single": "slow",
      },
      birthYear: 2001,
      gender: "male",
      id: "male-a",
    });
    const maleB = createParticipant({
      answers: {
        "q-single": "slow",
      },
      birthYear: 2003,
      gender: "male",
      id: "male-b",
    });

    const candidates = [
      {
        comparableCount: 3,
        left: femaleA,
        previewText: "fa-ma",
        reasons: ["r"],
        right: maleA,
        score: 100,
        sharedSignals: [],
      },
      {
        comparableCount: 3,
        left: femaleA,
        previewText: "fa-mb",
        reasons: ["r"],
        right: maleB,
        score: 99,
        sharedSignals: [],
      },
      {
        comparableCount: 3,
        left: femaleB,
        previewText: "fb-ma",
        reasons: ["r"],
        right: maleA,
        score: 98,
        sharedSignals: [],
      },
      {
        comparableCount: 3,
        left: femaleB,
        previewText: "fb-mb",
        reasons: ["r"],
        right: maleB,
        score: 1,
        sharedSignals: [],
      },
    ];

    const result = selectStablePairs(candidates);
    const pairs = result.selected
      .map((candidate) =>
        [candidate.left.participationId, candidate.right.participationId]
          .sort()
          .join(":"),
      )
      .sort();

    expect(pairs).toEqual(["female-a:male-a", "female-b:male-b"]);
    expect(result.usedParticipationIds.size).toBe(4);
  });

  it("uses explain strength as deterministic tie-break when score ties", () => {
    const femaleA = createParticipant({
      answers: {
        "q-single": "slow",
      },
      birthYear: 2001,
      gender: "female",
      id: "female-a",
    });
    const maleA = createParticipant({
      answers: {
        "q-single": "slow",
      },
      birthYear: 2001,
      gender: "male",
      id: "male-a",
    });
    const maleB = createParticipant({
      answers: {
        "q-single": "slow",
      },
      birthYear: 2002,
      gender: "male",
      id: "male-b",
    });

    const result = selectStablePairs([
      {
        comparableCount: 2,
        explain: {
          scoreBreakdown: {
            profileWeight: 1,
            profileWeightedScore: 0.8,
            questionWeight: 1,
            questionWeightedScore: 1,
            totalWeight: 2,
            weightedScore: 1.8,
          },
          tieBreak: {
            deterministicKey: "female-a:male-a",
            signalCount: 1,
            strengthScore: 0.9,
          },
          topContributors: [
            {
              category: "question",
              reason: "q",
              score: 1,
              weightedContribution: 1,
            },
          ],
        },
        left: femaleA,
        previewText: "fa-ma",
        reasons: ["r"],
        right: maleA,
        score: 90,
        sharedSignals: ["signal-a"],
      },
      {
        comparableCount: 2,
        explain: {
          scoreBreakdown: {
            profileWeight: 1,
            profileWeightedScore: 0.7,
            questionWeight: 1,
            questionWeightedScore: 1,
            totalWeight: 2,
            weightedScore: 1.7,
          },
          tieBreak: {
            deterministicKey: "female-a:male-b",
            signalCount: 2,
            strengthScore: 0.95,
          },
          topContributors: [
            {
              category: "question",
              reason: "q",
              score: 1,
              weightedContribution: 1,
            },
          ],
        },
        left: femaleA,
        previewText: "fa-mb",
        reasons: ["r"],
        right: maleB,
        score: 90,
        sharedSignals: ["signal-b", "signal-c"],
      },
    ]);

    expect(result.selected).toHaveLength(1);
    expect(result.selected[0]?.right.participationId).toBe("male-b");
  });

});
