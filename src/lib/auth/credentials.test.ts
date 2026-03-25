import { describe, expect, it } from "vitest";

import {
  canSubmitSignUpForm,
  getAuthErrorMessage,
  getSignUpFieldErrors,
  signInSchema,
  signUpSchema,
} from "@/lib/auth/credentials";

describe("signInSchema", () => {
  it("normalizes a valid student email", () => {
    const result = signInSchema.safeParse({
      email: "Student@smail.nju.edu.cn",
      password: "secret1",
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.email).toBe("student@smail.nju.edu.cn");
    }
  });

  it("accepts a valid staff email", () => {
    const result = signInSchema.safeParse({
      email: "Admin@NJUDate.cn",
      password: "secret1",
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.email).toBe("admin@njudate.cn");
    }
  });

  it("rejects an unsupported email domain", () => {
    const result = signInSchema.safeParse({
      email: "student@qq.com",
      password: "secret1",
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe("请使用南大邮箱注册");
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

  it("rejects a staff domain for public registration", () => {
    const result = signUpSchema.safeParse({
      email: "admin@njudate.cn",
      password: "secret1",
      confirmPassword: "secret1",
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe("请使用南大邮箱注册");
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

  it("returns false for a staff domain", () => {
    expect(
      canSubmitSignUpForm({
        email: "admin@njudate.cn",
        password: "secret1",
        confirmPassword: "secret1",
      }),
    ).toBe(false);
  });

  it("returns true for a valid student email and matching passwords", () => {
    expect(
      canSubmitSignUpForm({
        email: "student@smail.nju.edu.cn",
        password: "secret1",
        confirmPassword: "secret1",
      }),
    ).toBe(true);
  });
});

describe("getSignUpFieldErrors", () => {
  it("returns an email error when the email is not a supported student address", () => {
    expect(
      getSignUpFieldErrors({
        email: "student@qq.com",
        password: "secret1",
        confirmPassword: "secret1",
      }),
    ).toMatchObject({
      email: "请使用南大邮箱注册",
    });
  });

  it("returns a password error when the password is shorter than 6 characters", () => {
    expect(
      getSignUpFieldErrors({
        email: "student@smail.nju.edu.cn",
        password: "12345",
        confirmPassword: "12345",
      }),
    ).toMatchObject({
      password: "密码至少 6 位",
    });
  });

  it("returns a confirmation error when the passwords do not match", () => {
    expect(
      getSignUpFieldErrors({
        email: "student@smail.nju.edu.cn",
        password: "secret1",
        confirmPassword: "secret2",
      }),
    ).toMatchObject({
      confirmPassword: "两次输入的密码不一致",
    });
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
