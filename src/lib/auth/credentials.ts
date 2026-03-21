import { z } from "zod";

export const allowedEmailDomains = ["smail.nju.edu.cn", "qq.com"] as const;
export const allowedEmailDomainsLabel = allowedEmailDomains.join(" 或 ");
export const minimumPasswordLength = 6;

export const emailSchema = z
  .string()
  .trim()
  .email("请输入有效邮箱")
  .refine(
    (value) =>
      allowedEmailDomains.some((domain) =>
        value.toLowerCase().endsWith(`@${domain}`),
      ),
    `当前仅支持 ${allowedEmailDomainsLabel} 邮箱`,
  )
  .transform((value) => value.toLowerCase());

export const passwordSchema = z
  .string()
  .trim()
  .min(minimumPasswordLength, `密码至少 ${minimumPasswordLength} 位`);

export const signInSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
});

export const signUpSchema = z
  .object({
    email: emailSchema,
    password: passwordSchema,
    confirmPassword: z.string().trim().min(1, "请再次输入密码"),
  })
  .superRefine((value, context) => {
    if (value.password !== value.confirmPassword) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "两次输入的密码不一致",
        path: ["confirmPassword"],
      });
    }
  });

export function getAuthErrorMessage(error: unknown, fallback: string) {
  if (error instanceof z.ZodError) {
    return error.issues[0]?.message ?? fallback;
  }

  if (
    error &&
    typeof error === "object" &&
    "message" in error &&
    typeof error.message === "string"
  ) {
    const message = error.message;

    if (message.includes("Invalid login credentials")) {
      return "邮箱或密码不正确。";
    }

    if (message.includes("Email not confirmed")) {
      return "请先完成邮箱确认。";
    }

    if (message.includes("User already registered")) {
      return "该邮箱已注册，请直接登录。";
    }

    if (
      message.includes("Password should be at least") ||
      message.includes("Signup requires a valid password")
    ) {
      return `密码至少 ${minimumPasswordLength} 位。`;
    }

    if (message.includes("For security purposes")) {
      return "请求过于频繁，请稍后再试。";
    }

    if (message.includes("Signup is disabled")) {
      return "当前暂未开放注册。";
    }
  }

  return fallback;
}
