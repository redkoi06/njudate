import { describe, expect, it } from "vitest";

import {
  getQuestionnaireParticipationRequirement,
  getQuestionnaireStatusHint,
  getQuestionnaireStatusLabel,
} from "@/lib/site";

describe("questionnaire status copy", () => {
  const openInput = {
    resultPublishAt: "2026-03-27T12:00:00.000Z",
    signupEndAt: "2026-03-26T12:00:00.000Z",
    windowStatus: "open" as const,
  };

  it("distinguishes not_started, draft, submitted and updated labels", () => {
    expect(
      getQuestionnaireStatusLabel({
        ...openInput,
        status: "not_started",
      }),
    ).toBe("当前版本未开始");
    expect(
      getQuestionnaireStatusLabel({
        ...openInput,
        status: "draft",
      }),
    ).toBe("当前版本草稿未提交");
    expect(
      getQuestionnaireStatusLabel({
        ...openInput,
        status: "submitted",
      }),
    ).toBe("当前版本已提交");
    expect(
      getQuestionnaireStatusLabel({
        ...openInput,
        status: "updated",
      }),
    ).toBe("当前版本已提交，另有未提交草稿");
  });

  it("returns the closed-window wording when the questionnaire channel is closed", () => {
    expect(
      getQuestionnaireStatusLabel({
        ...openInput,
        status: "submitted",
        windowStatus: "closed",
      }),
    ).toBe("当前轮问卷通道已关闭");
    expect(
      getQuestionnaireStatusHint({
        ...openInput,
        status: "draft",
        windowStatus: "closed",
      }),
    ).toContain("结果公布前仅支持查看，不允许保存或提交");
  });

  it("uses precise participation requirements for unfinished questionnaire states", () => {
    expect(
      getQuestionnaireParticipationRequirement({
        status: "not_started",
        windowStatus: "open",
      }),
    ).toBe("当前版本未开始，请先正式提交当前问卷。");
    expect(
      getQuestionnaireParticipationRequirement({
        status: "draft",
        windowStatus: "open",
      }),
    ).toBe("当前版本草稿未提交，请先正式提交当前问卷。");
    expect(
      getQuestionnaireParticipationRequirement({
        status: "draft",
        windowStatus: "closed",
      }),
    ).toBe("当前轮问卷通道已关闭，结果公布前不再开放新的提交或报名。");
  });
});
