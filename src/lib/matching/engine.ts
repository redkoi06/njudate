import type { MatchingPolicy } from "./policy.ts";

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

const AGE_PREFERENCE_QUESTION_CODE = "q-age-preference";
const LONG_DISTANCE_ACCEPTANCE_QUESTION_CODE = "q-long-distance-acceptance";

type AgePreferenceAnswer = "older" | "same-age" | "younger" | "soul-match";
type LongDistanceAcceptanceAnswer =
  | "same-city-only"
  | "short-term-ok"
  | "long-term-ok"
  | "depends-on-feelings";

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

function isAgePreferenceAnswer(value: string): value is AgePreferenceAnswer {
  return (
    value === "older" ||
    value === "same-age" ||
    value === "younger" ||
    value === "soul-match"
  );
}

function getAgePreferenceSatisfaction(input: {
  counterpartBirthYear: number;
  preference: AgePreferenceAnswer;
  selfBirthYear: number;
}) {
  switch (input.preference) {
    case "older":
      if (input.counterpartBirthYear < input.selfBirthYear) {
        return 1;
      }

      if (input.counterpartBirthYear === input.selfBirthYear) {
        return 0.25;
      }

      return 0;
    case "same-age": {
      const ageGap = Math.abs(input.selfBirthYear - input.counterpartBirthYear);

      if (ageGap === 0) {
        return 1;
      }

      if (ageGap === 1) {
        return 0.5;
      }

      return 0;
    }
    case "younger":
      if (input.counterpartBirthYear > input.selfBirthYear) {
        return 1;
      }

      if (input.counterpartBirthYear === input.selfBirthYear) {
        return 0.25;
      }

      return 0;
    case "soul-match":
      return 1;
  }
}

function isLongDistanceAcceptanceAnswer(
  value: string,
): value is LongDistanceAcceptanceAnswer {
  return (
    value === "same-city-only" ||
    value === "short-term-ok" ||
    value === "long-term-ok" ||
    value === "depends-on-feelings"
  );
}

function getLongDistanceAcceptanceLevel(answer: LongDistanceAcceptanceAnswer) {
  switch (answer) {
    case "same-city-only":
      return 0;
    case "short-term-ok":
      return 1;
    case "long-term-ok":
      return 2;
    case "depends-on-feelings":
      return 1.5;
  }
}

function isCrossCampusBlockedByLongDistance(
  left: MatchingParticipant,
  right: MatchingParticipant,
) {
  const leftCampus = left.profileSnapshot.campus;
  const rightCampus = right.profileSnapshot.campus;

  if (!leftCampus || !rightCampus || leftCampus === rightCampus) {
    return false;
  }

  const leftAnswer = left.answers[LONG_DISTANCE_ACCEPTANCE_QUESTION_CODE];
  const rightAnswer = right.answers[LONG_DISTANCE_ACCEPTANCE_QUESTION_CODE];

  return leftAnswer === "same-city-only" && rightAnswer === "same-city-only";
}

function compareSpecialQuestion(input: {
  left: MatchingParticipant;
  leftAnswer: string | string[] | number | undefined;
  question: MatchingQuestion;
  right: MatchingParticipant;
  rightAnswer: string | string[] | number | undefined;
}) {
  if (input.question.questionCode === AGE_PREFERENCE_QUESTION_CODE) {
    if (
      typeof input.leftAnswer !== "string" ||
      typeof input.rightAnswer !== "string" ||
      !isAgePreferenceAnswer(input.leftAnswer) ||
      !isAgePreferenceAnswer(input.rightAnswer)
    ) {
      return null;
    }

    const leftBirthYear = input.left.profileSnapshot.birth_year;
    const rightBirthYear = input.right.profileSnapshot.birth_year;

    if (
      typeof leftBirthYear !== "number" ||
      typeof rightBirthYear !== "number" ||
      !Number.isInteger(leftBirthYear) ||
      !Number.isInteger(rightBirthYear)
    ) {
      return null;
    }

    const leftSatisfaction = getAgePreferenceSatisfaction({
      counterpartBirthYear: rightBirthYear,
      preference: input.leftAnswer,
      selfBirthYear: leftBirthYear,
    });
    const rightSatisfaction = getAgePreferenceSatisfaction({
      counterpartBirthYear: leftBirthYear,
      preference: input.rightAnswer,
      selfBirthYear: rightBirthYear,
    });

    return {
      score: leftSatisfaction * rightSatisfaction,
    } satisfies QuestionComparison;
  }

  if (input.question.questionCode !== LONG_DISTANCE_ACCEPTANCE_QUESTION_CODE) {
    return null;
  }

  if (
    typeof input.leftAnswer !== "string" ||
    typeof input.rightAnswer !== "string" ||
    !isLongDistanceAcceptanceAnswer(input.leftAnswer) ||
    !isLongDistanceAcceptanceAnswer(input.rightAnswer)
  ) {
    return null;
  }

  const leftCampus = input.left.profileSnapshot.campus;
  const rightCampus = input.right.profileSnapshot.campus;
  const isCrossCampus =
    Boolean(leftCampus && rightCampus) && leftCampus !== rightCampus;
  const leftLevel = getLongDistanceAcceptanceLevel(input.leftAnswer);
  const rightLevel = getLongDistanceAcceptanceLevel(input.rightAnswer);

  const hardGateScore =
    isCrossCampus && leftLevel === 0 && rightLevel === 0 ? 0 : 1;
  const preferenceScore = 1 - Math.abs(leftLevel - rightLevel) / 2;

  return {
    score: hardGateScore * preferenceScore,
  } satisfies QuestionComparison;
}

function compareQuestion(
  input: {
    left: MatchingParticipant;
    question: MatchingQuestion;
    right: MatchingParticipant;
  },
): QuestionComparison | null {
  const leftAnswer = input.left.answers[input.question.questionCode];
  const rightAnswer = input.right.answers[input.question.questionCode];

  if (leftAnswer === undefined || rightAnswer === undefined) {
    return null;
  }

  const specialComparison = compareSpecialQuestion({
    left: input.left,
    leftAnswer,
    question: input.question,
    right: input.right,
    rightAnswer,
  });

  if (specialComparison) {
    return specialComparison;
  }

  switch (input.question.kind) {
    case "single":
      return typeof leftAnswer === "string" && typeof rightAnswer === "string"
        ? compareSingleQuestion(input.question, leftAnswer, rightAnswer)
        : null;
    case "multiple":
      return Array.isArray(leftAnswer) && Array.isArray(rightAnswer)
        ? compareMultipleQuestion(input.question, leftAnswer, rightAnswer)
        : null;
    case "scale":
      return typeof leftAnswer === "number" && typeof rightAnswer === "number"
        ? compareScaleQuestion(input.question, leftAnswer, rightAnswer)
        : null;
  }
}

function passesHardProfileConstraints(
  left: MatchingParticipant,
  right: MatchingParticipant,
) {
  const leftGender = left.profileSnapshot.gender;
  const rightGender = right.profileSnapshot.gender;

  if (!leftGender || !rightGender || leftGender === rightGender) {
    return false;
  }

  return true;
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

  if (!passesHardProfileConstraints(left, right)) {
    return null;
  }

  if (!evaluateProfileFilters(matchingPolicy, left, right)) {
    return null;
  }

  if (isCrossCampusBlockedByLongDistance(left, right)) {
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
    const comparison = compareQuestion({ left, question, right });

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

function getCounterpartParticipationId(
  candidate: PairCandidate,
  participationId: string,
) {
  return candidate.left.participationId === participationId
    ? candidate.right.participationId
    : candidate.left.participationId;
}

function compareCandidateForParticipant(
  left: PairCandidate,
  right: PairCandidate,
  participationId: string,
) {
  if (right.score !== left.score) {
    return right.score - left.score;
  }

  if (right.comparableCount !== left.comparableCount) {
    return right.comparableCount - left.comparableCount;
  }

  return getCounterpartParticipationId(left, participationId).localeCompare(
    getCounterpartParticipationId(right, participationId),
  );
}

export function selectStablePairs(candidates: PairCandidate[]) {
  const usedParticipationIds = new Set<string>();
  const selected: PairCandidate[] = [];

  if (candidates.length === 0) {
    return {
      selected,
      usedParticipationIds,
    };
  }

  const participantById = new Map<
    string,
    { gender: string; participationId: string }
  >();

  candidates.forEach((candidate) => {
    const leftGender = candidate.left.profileSnapshot.gender;
    const rightGender = candidate.right.profileSnapshot.gender;

    if (typeof leftGender === "string") {
      participantById.set(candidate.left.participationId, {
        gender: leftGender,
        participationId: candidate.left.participationId,
      });
    }

    if (typeof rightGender === "string") {
      participantById.set(candidate.right.participationId, {
        gender: rightGender,
        participationId: candidate.right.participationId,
      });
    }
  });

  const groups = new Map<string, string[]>();
  participantById.forEach((participant) => {
    const current = groups.get(participant.gender);

    if (current) {
      current.push(participant.participationId);
      return;
    }

    groups.set(participant.gender, [participant.participationId]);
  });

  if (groups.size < 2) {
    return {
      selected,
      usedParticipationIds,
    };
  }

  const sortedGroups = [...groups.entries()].sort((left, right) =>
    left[0].localeCompare(right[0]),
  );
  const firstGroup = sortedGroups[0]?.[1] ?? [];
  const secondGroup = sortedGroups[1]?.[1] ?? [];
  const proposerIds =
    firstGroup.length <= secondGroup.length ? firstGroup : secondGroup;
  const receiverIds = proposerIds === firstGroup ? secondGroup : firstGroup;
  const receiverIdSet = new Set(receiverIds);

  const candidateByPair = new Map<string, PairCandidate>();
  const proposerPreferences = new Map<string, string[]>();
  const receiverRank = new Map<string, Map<string, number>>();

  const buildPairKey = (leftId: string, rightId: string) =>
    leftId < rightId ? `${leftId}:${rightId}` : `${rightId}:${leftId}`;

  const appendPreference = (
    map: Map<string, PairCandidate[]>,
    ownerId: string,
    candidate: PairCandidate,
  ) => {
    const current = map.get(ownerId);

    if (current) {
      current.push(candidate);
      return;
    }

    map.set(ownerId, [candidate]);
  };

  const proposerCandidateMap = new Map<string, PairCandidate[]>();
  const receiverCandidateMap = new Map<string, PairCandidate[]>();

  candidates.forEach((candidate) => {
    const leftId = candidate.left.participationId;
    const rightId = candidate.right.participationId;
    const key = buildPairKey(leftId, rightId);

    candidateByPair.set(key, candidate);

    if (receiverIdSet.has(rightId) && !receiverIdSet.has(leftId)) {
      appendPreference(proposerCandidateMap, leftId, candidate);
      appendPreference(receiverCandidateMap, rightId, candidate);
      return;
    }

    if (receiverIdSet.has(leftId) && !receiverIdSet.has(rightId)) {
      appendPreference(proposerCandidateMap, rightId, candidate);
      appendPreference(receiverCandidateMap, leftId, candidate);
    }
  });

  proposerCandidateMap.forEach((candidateList, proposerId) => {
    candidateList.sort((left, right) =>
      compareCandidateForParticipant(left, right, proposerId),
    );

    proposerPreferences.set(
      proposerId,
      candidateList.map((candidate) =>
        getCounterpartParticipationId(candidate, proposerId),
      ),
    );
  });

  receiverCandidateMap.forEach((candidateList, receiverId) => {
    candidateList.sort((left, right) =>
      compareCandidateForParticipant(left, right, receiverId),
    );

    const rankMap = new Map<string, number>();

    candidateList.forEach((candidate, index) => {
      rankMap.set(getCounterpartParticipationId(candidate, receiverId), index);
    });

    receiverRank.set(receiverId, rankMap);
  });

  const freeProposers = proposerIds.filter((proposerId) =>
    proposerPreferences.has(proposerId),
  );
  const nextProposalIndex = new Map<string, number>();
  const engagedByReceiver = new Map<string, string>();

  while (freeProposers.length > 0) {
    const proposerId = freeProposers.shift();

    if (!proposerId) {
      continue;
    }

    const preferenceList = proposerPreferences.get(proposerId) ?? [];
    const startIndex = nextProposalIndex.get(proposerId) ?? 0;
    let accepted = false;

    for (
      let preferenceIndex = startIndex;
      preferenceIndex < preferenceList.length;
      preferenceIndex += 1
    ) {
      nextProposalIndex.set(proposerId, preferenceIndex + 1);
      const receiverId = preferenceList[preferenceIndex];

      if (!receiverId) {
        continue;
      }

      const currentProposer = engagedByReceiver.get(receiverId);

      if (!currentProposer) {
        engagedByReceiver.set(receiverId, proposerId);
        accepted = true;
        break;
      }

      const rankMap = receiverRank.get(receiverId);
      const incomingRank = rankMap?.get(proposerId) ?? Number.POSITIVE_INFINITY;
      const currentRank =
        rankMap?.get(currentProposer) ?? Number.POSITIVE_INFINITY;

      if (incomingRank < currentRank) {
        engagedByReceiver.set(receiverId, proposerId);
        freeProposers.push(currentProposer);
        accepted = true;
        break;
      }
    }

    if (!accepted) {
      nextProposalIndex.set(proposerId, preferenceList.length);
    }
  }

  engagedByReceiver.forEach((proposerId, receiverId) => {
    const key = buildPairKey(proposerId, receiverId);
    const candidate = candidateByPair.get(key);

    if (!candidate) {
      return;
    }

    selected.push(candidate);
    usedParticipationIds.add(candidate.left.participationId);
    usedParticipationIds.add(candidate.right.participationId);
  });

  selected.sort((left, right) => {
    if (right.score !== left.score) {
      return right.score - left.score;
    }

    if (right.comparableCount !== left.comparableCount) {
      return right.comparableCount - left.comparableCount;
    }

    const leftKey = `${left.left.participationId}-${left.right.participationId}`;
    const rightKey = `${right.left.participationId}-${right.right.participationId}`;

    return leftKey.localeCompare(rightKey);
  });

  return {
    selected,
    usedParticipationIds,
  };
}
