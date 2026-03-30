import {
  buildPairCandidates,
  selectStablePairs,
  type MatchingParticipant,
  type MatchingQuestion,
  type PairCandidate,
} from "./engine";
import type { MatchingPolicy } from "./policy";

export type MatchingEvalMetrics = {
  avgPairScore: number;
  explainCoverage: number;
  matchRate: number;
  matchedPairs: number;
  matchedParticipants: number;
  stabilityViolations: number;
  totalParticipants: number;
};

export type PolicyEvalResult = {
  candidates: PairCandidate[];
  metrics: MatchingEvalMetrics;
  selected: PairCandidate[];
};

export type PolicyEvalDelta = {
  avgPairScoreDelta: number;
  explainCoverageDelta: number;
  matchRateDelta: number;
  matchedPairsDelta: number;
  matchedParticipantsDelta: number;
  stabilityViolationsDelta: number;
};

function getCounterpartParticipationId(
  candidate: PairCandidate,
  participationId: string,
) {
  return candidate.left.participationId === participationId
    ? candidate.right.participationId
    : candidate.left.participationId;
}

function getExplainStrengthScore(candidate: PairCandidate) {
  return candidate.explain?.tieBreak.strengthScore ?? candidate.score / 100;
}

function getExplainSignalCount(candidate: PairCandidate) {
  return candidate.explain?.tieBreak.signalCount ?? candidate.sharedSignals.length;
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

  const rightStrength = getExplainStrengthScore(right);
  const leftStrength = getExplainStrengthScore(left);

  if (rightStrength !== leftStrength) {
    return rightStrength - leftStrength;
  }

  const rightSignalCount = getExplainSignalCount(right);
  const leftSignalCount = getExplainSignalCount(left);

  if (rightSignalCount !== leftSignalCount) {
    return rightSignalCount - leftSignalCount;
  }

  return getCounterpartParticipationId(left, participationId).localeCompare(
    getCounterpartParticipationId(right, participationId),
  );
}

function buildRankingMap(candidates: PairCandidate[]) {
  const candidateMap = new Map<string, PairCandidate[]>();

  candidates.forEach((candidate) => {
    [candidate.left.participationId, candidate.right.participationId].forEach(
      (participationId) => {
        const current = candidateMap.get(participationId);

        if (current) {
          current.push(candidate);
          return;
        }

        candidateMap.set(participationId, [candidate]);
      },
    );
  });

  const rankMap = new Map<string, Map<string, number>>();

  candidateMap.forEach((candidateList, participationId) => {
    const sorted = [...candidateList].sort((left, right) =>
      compareCandidateForParticipant(left, right, participationId),
    );
    const counterpartRank = new Map<string, number>();

    sorted.forEach((candidate, index) => {
      counterpartRank.set(
        getCounterpartParticipationId(candidate, participationId),
        index,
      );
    });

    rankMap.set(participationId, counterpartRank);
  });

  return rankMap;
}

function countStabilityViolations(
  candidates: PairCandidate[],
  selected: PairCandidate[],
) {
  const rankMap = buildRankingMap(candidates);
  const matchedPartner = new Map<string, string>();
  const selectedPairKeys = new Set<string>();

  selected.forEach((candidate) => {
    const leftId = candidate.left.participationId;
    const rightId = candidate.right.participationId;
    const pairKey = leftId < rightId ? `${leftId}:${rightId}` : `${rightId}:${leftId}`;

    matchedPartner.set(leftId, rightId);
    matchedPartner.set(rightId, leftId);
    selectedPairKeys.add(pairKey);
  });

  let blockingPairCount = 0;

  candidates.forEach((candidate) => {
    const leftId = candidate.left.participationId;
    const rightId = candidate.right.participationId;
    const pairKey = leftId < rightId ? `${leftId}:${rightId}` : `${rightId}:${leftId}`;

    if (selectedPairKeys.has(pairKey)) {
      return;
    }

    const leftRanks = rankMap.get(leftId);
    const rightRanks = rankMap.get(rightId);

    if (!leftRanks || !rightRanks) {
      return;
    }

    const leftCurrent = matchedPartner.get(leftId);
    const rightCurrent = matchedPartner.get(rightId);
    const leftIncomingRank = leftRanks.get(rightId) ?? Number.POSITIVE_INFINITY;
    const rightIncomingRank = rightRanks.get(leftId) ?? Number.POSITIVE_INFINITY;
    const leftCurrentRank = leftCurrent
      ? (leftRanks.get(leftCurrent) ?? Number.POSITIVE_INFINITY)
      : Number.POSITIVE_INFINITY;
    const rightCurrentRank = rightCurrent
      ? (rightRanks.get(rightCurrent) ?? Number.POSITIVE_INFINITY)
      : Number.POSITIVE_INFINITY;

    if (leftIncomingRank < leftCurrentRank && rightIncomingRank < rightCurrentRank) {
      blockingPairCount += 1;
    }
  });

  return blockingPairCount;
}

export function evaluatePolicyOnDataset(input: {
  matchingPolicy: MatchingPolicy;
  participants: MatchingParticipant[];
  questions: MatchingQuestion[];
}): PolicyEvalResult {
  const candidates = buildPairCandidates({
    matchingPolicy: input.matchingPolicy,
    participants: input.participants,
    questions: input.questions,
  });
  const { selected, usedParticipationIds } = selectStablePairs(candidates);

  const matchedPairs = selected.length;
  const matchedParticipants = usedParticipationIds.size;
  const totalParticipants = input.participants.length;
  const totalScore = selected.reduce((sum, candidate) => sum + candidate.score, 0);
  const explainCount = selected.filter((candidate) =>
    Boolean(candidate.explain?.topContributors.length),
  ).length;
  const stabilityViolations = countStabilityViolations(candidates, selected);

  return {
    candidates,
    selected,
    metrics: {
      avgPairScore: matchedPairs === 0 ? 0 : Math.round((totalScore / matchedPairs) * 100) / 100,
      explainCoverage:
        matchedPairs === 0 ? 0 : Math.round((explainCount / matchedPairs) * 1000) / 1000,
      matchRate:
        totalParticipants === 0
          ? 0
          : Math.round((matchedParticipants / totalParticipants) * 1000) / 1000,
      matchedPairs,
      matchedParticipants,
      stabilityViolations,
      totalParticipants,
    },
  };
}

export function comparePolicies(input: {
  baselinePolicy: MatchingPolicy;
  challengerPolicy: MatchingPolicy;
  participants: MatchingParticipant[];
  questions: MatchingQuestion[];
}) {
  const baseline = evaluatePolicyOnDataset({
    matchingPolicy: input.baselinePolicy,
    participants: input.participants,
    questions: input.questions,
  });
  const challenger = evaluatePolicyOnDataset({
    matchingPolicy: input.challengerPolicy,
    participants: input.participants,
    questions: input.questions,
  });

  const delta: PolicyEvalDelta = {
    avgPairScoreDelta:
      Math.round((challenger.metrics.avgPairScore - baseline.metrics.avgPairScore) * 100) / 100,
    explainCoverageDelta:
      Math.round((challenger.metrics.explainCoverage - baseline.metrics.explainCoverage) * 1000) /
      1000,
    matchRateDelta:
      Math.round((challenger.metrics.matchRate - baseline.metrics.matchRate) * 1000) / 1000,
    matchedPairsDelta: challenger.metrics.matchedPairs - baseline.metrics.matchedPairs,
    matchedParticipantsDelta:
      challenger.metrics.matchedParticipants - baseline.metrics.matchedParticipants,
    stabilityViolationsDelta:
      challenger.metrics.stabilityViolations - baseline.metrics.stabilityViolations,
  };

  return {
    baseline,
    challenger,
    delta,
  };
}
