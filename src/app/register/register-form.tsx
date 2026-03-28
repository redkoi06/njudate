"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";

import { Button, Field } from "@/components/site-ui";
import {
  getSignUpFieldErrors,
  minimumPasswordLength,
} from "@/lib/auth/credentials";

function SubmitButton({ disabled }: { disabled: boolean }) {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" disabled={disabled || pending}>
      注册并发送确认邮件
    </Button>
  );
}

export function RegisterForm({
  action,
  initialEmail,
}: {
  action: (formData: FormData) => void | Promise<void>;
  initialEmail: string;
}) {
  const [email, setEmail] = useState(initialEmail);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const fieldErrors = getSignUpFieldErrors({
    email,
    password,
    confirmPassword,
  });
  const canSubmit = Object.keys(fieldErrors).length === 0;
  const emailError = email.length > 0 ? fieldErrors.email : undefined;
  const passwordError = password.length > 0 ? fieldErrors.password : undefined;
  const confirmPasswordError =
    password.length > 0 && confirmPassword.length > 0
      ? fieldErrors.confirmPassword
      : undefined;

  return (
    <form
      action={action}
      className="mt-8 grid gap-5"
      noValidate
    >
      <Field
        name="email"
        label="学校邮箱"
        type="email"
        autoComplete="email"
        value={email}
        onChange={(event) => setEmail(event.target.value)}
        {...(emailError ? { error: emailError } : {})}
        required
      />
      <Field
        name="password"
        label="密码"
        type="password"
        autoComplete="new-password"
        minLength={minimumPasswordLength}
        value={password}
        onChange={(event) => setPassword(event.target.value)}
        hint={`密码至少 ${minimumPasswordLength} 位`}
        {...(passwordError ? { error: passwordError } : {})}
        required
      />
      <Field
        name="confirmPassword"
        label="确认密码"
        type="password"
        autoComplete="new-password"
        value={confirmPassword}
        onChange={(event) => setConfirmPassword(event.target.value)}
        {...(confirmPasswordError ? { error: confirmPasswordError } : {})}
        required
      />
      <div className="flex justify-end">
        <SubmitButton disabled={!canSubmit} />
      </div>
    </form>
  );
}
