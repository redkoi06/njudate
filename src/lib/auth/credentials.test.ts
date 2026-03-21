import { describe, expect, it } from "vitest";

import {
  canSubmitSignUpForm,
  getAuthErrorMessage,
  signInSchema,
  signUpSchema,
} from "@/lib/auth/credentials";

describe("signInSchema", () => {
  it("normalizes a valid school email", () => {
    const result = signInSchema.safeParse({
      email: "Student@smail.nju.edu.cn",
      password: "secret1",
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.email).toBe("student@smail.nju.edu.cn");
    }
  });

  it("rejects an unsupported email domain", () => {
    const result = signInSchema.safeParse({
      email: "student@qq.com",
      password: "secret1",
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toContain("当前仅支持");
    }
  });
});

describe("signUpSchema", () => {
  it("rejects mismatched confirmation passwords", () => {
    const result = signUpSchema.safeParse({
      email: "student@smail.nju.edu.cn",
      password: "secret1",
      confirmPassword: "secret2",
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe("两次输入的密码不一致");
    }
  });
});

describe("canSubmitSignUpForm", () => {
  it("returns false for unsupported email domains", () => {
    expect(
      canSubmitSignUpForm({
        email: "student@qq.com",
        password: "secret1",
        confirmPassword: "secret1",
      }),
    ).toBe(false);
  });

  it("returns true for a valid school email and matching passwords", () => {
    expect(
      canSubmitSignUpForm({
        email: "student@smail.nju.edu.cn",
        password: "secret1",
        confirmPassword: "secret1",
      }),
    ).toBe(true);
  });
});

describe("getAuthErrorMessage", () => {
  it("maps invalid credential errors to a friendly message", () => {
    expect(
      getAuthErrorMessage(
        { message: "Invalid login credentials" },
        "登录失败，请稍后再试。",
      ),
    ).toBe("邮箱或密码不正确。");
  });

  it("falls back when the message is unknown", () => {
    expect(
      getAuthErrorMessage(
        { message: "Unexpected issue" },
        "注册失败，请稍后再试。",
      ),
    ).toBe("注册失败，请稍后再试。");
  });
});
