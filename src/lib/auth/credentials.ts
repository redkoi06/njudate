import { z } from "zod";

export const registrationEmailDomains = ["smail.nju.edu.cn"] as const;
export const signInEmailDomains = ["smail.nju.edu.cn", "njudate.cn"] as const;
export const allowedEmailDomainsLabel = registrationEmailDomains.join(" 或 ");
export const minimumPasswordLength = 6;

function createEmailSchema(allowedDomains: readonly string[]) {
  return z
    .string()
    .trim()
    .email("请输入有效邮箱")
    .refine(
      (value) =>
        allowedDomains.some((domain) =>
          value.toLowerCase().endsWith(`@${domain}`),
        ),
      "请使用南大邮箱注册",
    )
    .transform((value) => value.toLowerCase());
}

export const signInEmailSchema = createEmailSchema(signInEmailDomains);
export const signUpEmailSchema = createEmailSchema(registrationEmailDomains);

export const passwordSchema = z
  .string()
  .trim()
  .min(minimumPasswordLength, `密码至少 ${minimumPasswordLength} 位`);

export const signInSchema = z.object({
  email: signInEmailSchema,
  password: passwordSchema,
});

export const signUpSchema = z
  .object({
    email: signUpEmailSchema,
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

const signUpFieldNames = ["email", "password", "confirmPassword"] as const;
const resetPasswordFieldNames = ["password", "confirmPassword"] as const;

type SignUpFieldName = (typeof signUpFieldNames)[number];
type ResetPasswordFieldName = (typeof resetPasswordFieldNames)[number];

export type SignUpFieldErrors = Partial<Record<SignUpFieldName, string>>;
export type ResetPasswordFieldErrors = Partial<
  Record<ResetPasswordFieldName, string>
>;

export const resetPasswordSchema = z
  .object({
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

function isSignUpFieldName(value: unknown): value is SignUpFieldName {
  return signUpFieldNames.some((fieldName) => fieldName === value);
}

function isResetPasswordFieldName(
  value: unknown,
): value is ResetPasswordFieldName {
  return resetPasswordFieldNames.some((fieldName) => fieldName === value);
}

export function getSignUpFieldErrors(input: {
  email: string;
  password: string;
  confirmPassword: string;
}): SignUpFieldErrors {
  const result = signUpSchema.safeParse(input);

  if (result.success) {
    return {};
  }

  const fieldErrors: SignUpFieldErrors = {};

  for (const issue of result.error.issues) {
    const [fieldName] = issue.path;

    if (!isSignUpFieldName(fieldName) || fieldErrors[fieldName]) {
      continue;
    }

    fieldErrors[fieldName] = issue.message;
  }

  return fieldErrors;
}

export function getResetPasswordFieldErrors(input: {
  password: string;
  confirmPassword: string;
}): ResetPasswordFieldErrors {
  const result = resetPasswordSchema.safeParse(input);

  if (result.success) {
    return {};
  }

  const fieldErrors: ResetPasswordFieldErrors = {};

  for (const issue of result.error.issues) {
    const [fieldName] = issue.path;

    if (!isResetPasswordFieldName(fieldName) || fieldErrors[fieldName]) {
      continue;
    }

    fieldErrors[fieldName] = issue.message;
  }

  return fieldErrors;
}

export function canSubmitSignUpForm(input: {
  email: string;
  password: string;
  confirmPassword: string;
}) {
  return Object.keys(getSignUpFieldErrors(input)).length === 0;
}

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
