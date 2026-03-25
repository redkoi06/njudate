import type { MatchingPolicy } from "@/lib/matching/policy";

export type MatchingQuestion = {
  kind: "single" | "multiple" | "scale";
  options: { id: string; label: string }[];
  prompt: string;
  questionCode: string;
  scaleMax: number | null;
  scaleMin: number | null;
  weight: number;
};

export type MatchingProfileSnapshot = {
  birth_year?: number | null;
  campus?: string | null;
  department?: string | null;
  gender?: string | null;
  grade?: string | null;
  nickname?: string | null;
};

export type MatchingParticipant = {
  answers: Record<string, string | string[] | number>;
  participationId: string;
  profileSnapshot: MatchingProfileSnapshot;
  userId: string;
};

type CandidateReason = {
  reason: string;
  score: number;
  signal?: string;
};

export type PairCandidate = {
  comparableCount: number;
  left: MatchingParticipant;
  previewText: string;
  reasons: string[];
  right: MatchingParticipant;
  score: number;
  sharedSignals: string[];
};

type QuestionComparison = {
  reason?: string;
  score: number;
  signal?: string;
};

function getOptionMap(question: MatchingQuestion) {
  return new Map(question.options.map((option) => [option.id, option.label]));
}

function buildFallbackReasons(
  left: MatchingParticipant,
  right: MatchingParticipant,
) {
  return [
    "你们都认真完成了当前问卷，并进入了同一轮正式匹配。",
    "你们在多项关键偏好上具有可继续了解的基础。",
    `你们分别来自 ${String(left.profileSnapshot.department ?? "校内")} 与 ${String(right.profileSnapshot.department ?? "校内")} 的学习生活场景。`,
  ];
}

function compareSingleQuestion(
  question: MatchingQuestion,
  leftAnswer: string,
  rightAnswer: string,
) {
  if (leftAnswer !== rightAnswer) {
    return { score: 0 } satisfies QuestionComparison;
  }

  const label = getOptionMap(question).get(leftAnswer) ?? leftAnswer;

  return {
    score: 1,
    reason: `你们在“${question.prompt}”上的选择一致，都更偏向“${label}”。`,
    signal: label,
  } satisfies QuestionComparison;
}

function compareMultipleQuestion(
  question: MatchingQuestion,
  leftAnswer: string[],
  rightAnswer: string[],
) {
  const leftSet = new Set(leftAnswer);
  const rightSet = new Set(rightAnswer);
  const shared = [...leftSet].filter((item) => rightSet.has(item));
  const union = new Set([...leftSet, ...rightSet]);

  if (union.size === 0) {
    return null;
  }

  const score = shared.length / union.size;

  if (shared.length === 0) {
    return { score } satisfies QuestionComparison;
  }

  const optionMap = getOptionMap(question);
  const labels = shared.map((item) => optionMap.get(item) ?? item);

  return {
    score,
    reason: `你们在“${question.prompt}”里都提到了“${labels.join("、")}”这类偏好。`,
    signal: labels.join("、"),
  } satisfies QuestionComparison;
}

function compareScaleQuestion(
  question: MatchingQuestion,
  leftAnswer: number,
  rightAnswer: number,
) {
  const min = question.scaleMin ?? 1;
  const max = question.scaleMax ?? 5;
  const range = max - min;

  if (range <= 0) {
    return null;
  }

  const score = 1 - Math.abs(leftAnswer - rightAnswer) / range;

  if (score <= 0) {
    return { score } satisfies QuestionComparison;
  }

  return {
    score,
    reason:
      score >= 0.7
        ? `你们对“${question.prompt}”的判断非常接近。`
        : `你们对“${question.prompt}”的差异处于可协调范围内。`,
  } satisfies QuestionComparison;
}

function compareQuestion(
  question: MatchingQuestion,
  leftAnswer: string | string[] | number | undefined,
  rightAnswer: string | string[] | number | undefined,
) {
  if (leftAnswer === undefined || rightAnswer === undefined) {
    return null;
  }

  switch (question.kind) {
    case "single":
      return typeof leftAnswer === "string" && typeof rightAnswer === "string"
        ? compareSingleQuestion(question, leftAnswer, rightAnswer)
        : null;
    case "multiple":
      return Array.isArray(leftAnswer) && Array.isArray(rightAnswer)
        ? compareMultipleQuestion(question, leftAnswer, rightAnswer)
        : null;
    case "scale":
      return typeof leftAnswer === "number" && typeof rightAnswer === "number"
        ? compareScaleQuestion(question, leftAnswer, rightAnswer)
        : null;
  }
}

function evaluateProfileFilters(
  policy: MatchingPolicy,
  left: MatchingParticipant,
  right: MatchingParticipant,
) {
  return policy.profileFilters.every((rule) => {
    if (rule.field !== "gender") {
      return false;
    }

    const leftGender = left.profileSnapshot.gender;
    const rightGender = right.profileSnapshot.gender;

    return Boolean(
      leftGender &&
        rightGender &&
        leftGender !== rightGender,
    );
  });
}

function evaluateProfileRule(
  policy: MatchingPolicy,
  left: MatchingParticipant,
  right: MatchingParticipant,
  reasons: CandidateReason[],
) {
  let totalWeight = 0;
  let weightedScore = 0;

  policy.profileScoring.forEach((rule) => {
    totalWeight += rule.weight;

    if (rule.mode === "same_bonus") {
      const leftValue = left.profileSnapshot[rule.field];
      const rightValue = right.profileSnapshot[rule.field];
      const score = leftValue && rightValue && leftValue === rightValue ? 1 : 0;

      weightedScore += score * rule.weight;

      if (score > 0) {
        reasons.push({
          reason: `你们在${rule.field}上保持一致。`,
          score,
          signal: String(leftValue),
        });
      }

      return;
    }

    const leftBirthYear = left.profileSnapshot.birth_year;
    const rightBirthYear = right.profileSnapshot.birth_year;

    if (
      typeof leftBirthYear !== "number" ||
      typeof rightBirthYear !== "number"
    ) {
      return;
    }

    const score = Math.max(
      0,
      1 - Math.abs(leftBirthYear - rightBirthYear) / rule.maxGap,
    );

    weightedScore += score * rule.weight;

    if (score > 0) {
      reasons.push({
        reason: "你们的年龄差处于当前策略允许的范围内。",
        score,
      });
    }
  });

  return {
    totalWeight,
    weightedScore,
  };
}

export function buildPairCandidate(input: {
  left: MatchingParticipant;
  matchingPolicy: MatchingPolicy;
  questions: MatchingQuestion[];
  right: MatchingParticipant;
}) {
  const { left, matchingPolicy, questions, right } = input;

  if (!evaluateProfileFilters(matchingPolicy, left, right)) {
    return null;
  }

  let totalWeight = 0;
  let weightedScore = 0;
  let comparableCount = 0;
  const reasons: CandidateReason[] = [];

  const profileResult = evaluateProfileRule(matchingPolicy, left, right, reasons);
  totalWeight += profileResult.totalWeight;
  weightedScore += profileResult.weightedScore;

  questions.forEach((question) => {
    const comparison = compareQuestion(
      question,
      left.answers[question.questionCode],
      right.answers[question.questionCode],
    );

    if (!comparison) {
      return;
    }

    comparableCount += 1;
    totalWeight += question.weight;
    weightedScore += comparison.score * question.weight;

    if (comparison.reason) {
      const signal =
        "signal" in comparison && typeof comparison.signal === "string"
          ? comparison.signal
          : undefined;

      reasons.push({
        reason: comparison.reason,
        score: comparison.score,
        ...(signal ? { signal } : {}),
      });
    }
  });

  if (
    comparableCount < matchingPolicy.questionScoring.minimumComparableQuestions ||
    totalWeight <= 0
  ) {
    return null;
  }

  const score = Math.round((weightedScore / totalWeight) * 100);

  if (score < matchingPolicy.minimumPairScore) {
    return null;
  }

  const rankedReasons = reasons
    .sort((leftReason, rightReason) => rightReason.score - leftReason.score)
    .slice(0, 5);

  const reasonTexts = rankedReasons.map((item) => item.reason);
  const sharedSignals = rankedReasons.flatMap((item) =>
    item.signal ? [item.signal] : [],
  );

  while (reasonTexts.length < 3) {
    const fallback = buildFallbackReasons(left, right)[reasonTexts.length];

    if (!fallback) {
      break;
    }

    reasonTexts.push(fallback);
  }

  return {
    comparableCount,
    left,
    previewText:
      reasonTexts[0] ??
      "你们在多个关键问题上的回答接近，适合进一步了解。",
    reasons: reasonTexts,
    right,
    score,
    sharedSignals: sharedSignals.slice(0, 5),
  } satisfies PairCandidate;
}

export function buildPairCandidates(input: {
  matchingPolicy: MatchingPolicy;
  participants: MatchingParticipant[];
  questions: MatchingQuestion[];
}) {
  const candidates: PairCandidate[] = [];

  for (let leftIndex = 0; leftIndex < input.participants.length; leftIndex += 1) {
    for (
      let rightIndex = leftIndex + 1;
      rightIndex < input.participants.length;
      rightIndex += 1
    ) {
      const left = input.participants[leftIndex];
      const right = input.participants[rightIndex];

      if (!left || !right) {
        continue;
      }

      const candidate = buildPairCandidate({
        left,
        matchingPolicy: input.matchingPolicy,
        questions: input.questions,
        right,
      });

      if (candidate) {
        candidates.push(candidate);
      }
    }
  }

  return candidates;
}

export function selectGreedyPairs(candidates: PairCandidate[]) {
  const usedParticipationIds = new Set<string>();
  const selected: PairCandidate[] = [];

  candidates
    .sort((left, right) => {
      if (right.score !== left.score) {
        return right.score - left.score;
      }

      if (right.comparableCount !== left.comparableCount) {
        return right.comparableCount - left.comparableCount;
      }

      return `${left.left.participationId}-${left.right.participationId}`.localeCompare(
        `${right.left.participationId}-${right.right.participationId}`,
      );
    })
    .forEach((candidate) => {
      if (
        usedParticipationIds.has(candidate.left.participationId) ||
        usedParticipationIds.has(candidate.right.participationId)
      ) {
        return;
      }

      usedParticipationIds.add(candidate.left.participationId);
      usedParticipationIds.add(candidate.right.participationId);
      selected.push(candidate);
    });

  return {
    selected,
    usedParticipationIds,
  };
}
