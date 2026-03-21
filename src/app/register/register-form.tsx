"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";

import { Button, Field } from "@/components/site-ui";
import { canSubmitSignUpForm } from "@/lib/auth/credentials";

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

  const canSubmit = canSubmitSignUpForm({
    email,
    password,
    confirmPassword,
  });

  return (
    <form
      action={action}
      className="mt-8 grid gap-5"
      data-page-transition="route"
    >
      <Field
        name="email"
        label="学校邮箱"
        type="email"
        autoComplete="email"
        value={email}
        onChange={(event) => setEmail(event.target.value)}
        required
      />
      <Field
        name="password"
        label="密码"
        type="password"
        autoComplete="new-password"
        value={password}
        onChange={(event) => setPassword(event.target.value)}
        required
      />
      <Field
        name="confirmPassword"
        label="确认密码"
        type="password"
        autoComplete="new-password"
        value={confirmPassword}
        onChange={(event) => setConfirmPassword(event.target.value)}
        required
      />
      <div className="flex justify-end">
        <SubmitButton disabled={!canSubmit} />
      </div>
    </form>
  );
}
