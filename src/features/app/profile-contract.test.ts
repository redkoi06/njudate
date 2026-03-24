import { describe, expect, it } from "vitest";

import {
  canAccessAppPath,
  getAppEntryPath,
  getBirthYearRange,
  getDepartmentOptionsForGrade,
  isProfileCompleted,
  normalizeDepartmentForGrade,
  parseCounterpartSnapshot,
  sanitizeDepartmentForGrade,
} from "@/features/app/profile-contract";

describe("profile-contract", () => {
  it("forces 新生学院 for first-year grade", () => {
    expect(normalizeDepartmentForGrade("大一", "法学院")).toBe("新生学院");
    expect(normalizeDepartmentForGrade("研一", "法学院")).toBe("法学院");
  });

  it("filters department options by grade", () => {
    expect(getDepartmentOptionsForGrade("大一")).toContain("新生学院");
    expect(getDepartmentOptionsForGrade("大二")).not.toContain("新生学院");
  });

  it("clears invalid department selections for non-first-year grades", () => {
    expect(sanitizeDepartmentForGrade("大一", "法学院")).toBe("新生学院");
    expect(sanitizeDepartmentForGrade("大二", "新生学院")).toBe("");
    expect(sanitizeDepartmentForGrade("大二", "软件学院")).toBe("软件学院");
  });

  it("recognizes a complete profile", () => {
    const { minBirthYear } = getBirthYearRange(2026);

    expect(
      isProfileCompleted({
        nickname: "小南",
        gender: "女",
        grade: "研一",
        department: "软件学院",
        campus: "仙林校区",
        birthYear: minBirthYear,
      }, 2026),
    ).toBe(true);
  });

  it("rejects invalid birth years", () => {
    expect(
      isProfileCompleted({
        nickname: "小北",
        gender: "男",
        grade: "大二",
        department: "计算机学院",
        campus: "鼓楼校区",
        birthYear: 1900,
      }, 2026),
    ).toBe(false);
  });

  it("calculates the required app entry path", () => {
    expect(
      getAppEntryPath({
        profileCompleted: false,
        questionnaireCompleted: false,
      }),
    ).toBe("/app/profile");
    expect(
      getAppEntryPath({
        profileCompleted: true,
        questionnaireCompleted: false,
      }),
    ).toBe("/app/questionnaire");
    expect(
      getAppEntryPath({
        profileCompleted: true,
        questionnaireCompleted: true,
      }),
    ).toBe("/app/dashboard");
  });

  it("restricts pre-onboarding access to the required path", () => {
    expect(
      canAccessAppPath("/app/profile", {
        profileCompleted: false,
        questionnaireCompleted: false,
      }),
    ).toBe(true);
    expect(
      canAccessAppPath("/app/dashboard", {
        profileCompleted: false,
        questionnaireCompleted: false,
      }),
    ).toBe(false);
    expect(
      canAccessAppPath("/app/questionnaire", {
        profileCompleted: true,
        questionnaireCompleted: false,
      }),
    ).toBe(true);
    expect(
      canAccessAppPath("/app/profile", {
        profileCompleted: true,
        questionnaireCompleted: false,
      }),
    ).toBe(false);
  });

  it("parses the new counterpart snapshot shape", () => {
    expect(
      parseCounterpartSnapshot({
        nickname: "小南",
        gender: "女",
        grade: "研一",
        department: "软件学院",
        campus: "仙林校区",
        birth_year: 2001,
      }),
    ).toEqual({
      nickname: "小南",
      gender: "女",
      grade: "研一",
      department: "软件学院",
      campus: "仙林校区",
      birthYear: 2001,
    });
  });
});
