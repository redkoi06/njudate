"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useFormStatus } from "react-dom";

import { Button, Field, FieldErrorMessage } from "@/components/site-ui";
import {
  allowedEmailDomainsLabel,
  getAuthErrorMessage,
  signInEmailSchema,
} from "@/lib/auth/credentials";
import { getPublicEnv } from "@/lib/env/client";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";

import { UserAgreementDialog } from "./user-agreement-dialog";

type LoginFormProps = {
  action: (formData: FormData) => void | Promise<void>;
  initialEmail: string;
  registrationOpen: boolean;
};

function SubmitButton({ disabled }: { disabled: boolean }) {
  const { pending } = useFormStatus();

  return (
    <Button
      type="submit"
      className="mt-1 w-full justify-center py-4 text-base shadow-[0_18px_36px_rgba(139,74,82,0.2)] disabled:cursor-default"
      disabled={disabled || pending}
    >
      登录
    </Button>
  );
}

export function LoginForm({
  action,
  initialEmail,
  registrationOpen,
}: LoginFormProps) {
  const formRef = useRef<HTMLFormElement>(null);
  const [email, setEmail] = useState(initialEmail);
  const [password, setPassword] = useState("");
  const [forgotOpen, setForgotOpen] = useState(false);
  const [forgotPending, setForgotPending] = useState(false);
  const [forgotError, setForgotError] = useState<string | undefined>();
  const [forgotSuccess, setForgotSuccess] = useState(false);

  const normalizedEmail = useMemo(() => email.trim(), [email]);

  useEffect(() => {
    function syncAutofilledValues() {
      if (!formRef.current) {
        return;
      }

      const emailInput = formRef.current.elements.namedItem(
        "email",
      ) as HTMLInputElement | null;
      const passwordInput = formRef.current.elements.namedItem(
        "password",
      ) as HTMLInputElement | null;

      if (emailInput && emailInput.value !== email) {
        setEmail(emailInput.value);
      }

      if (passwordInput && passwordInput.value !== password) {
        setPassword(passwordInput.value);
      }
    }

    const frameId = window.requestAnimationFrame(syncAutofilledValues);
    const timeoutId = window.setTimeout(syncAutofilledValues, 300);

    window.addEventListener("pageshow", syncAutofilledValues);
    window.addEventListener("focus", syncAutofilledValues);

    return () => {
      window.cancelAnimationFrame(frameId);
      window.clearTimeout(timeoutId);
      window.removeEventListener("pageshow", syncAutofilledValues);
      window.removeEventListener("focus", syncAutofilledValues);
    };
  }, []);

  async function handleForgotPassword() {
    const payload = signInEmailSchema.safeParse(normalizedEmail);
    if (!payload.success) {
      setForgotSuccess(false);
      setForgotError(payload.error.issues[0]?.message ?? "请填写有效邮箱。");
      return;
    }

    setForgotPending(true);
    setForgotError(undefined);
    setForgotSuccess(false);

    try {
      const supabase = createBrowserSupabaseClient();
      const env = getPublicEnv();
      const { error } = await supabase.auth.resetPasswordForEmail(
        payload.data,
        {
          redirectTo: new URL("/reset-password", env.NEXT_PUBLIC_SITE_URL)
            .toString(),
        },
      );

      if (error) {
        setForgotError(
          getAuthErrorMessage(error, "发送重置邮件失败，请稍后再试。"),
        );
        return;
      }

      setForgotSuccess(true);
    } catch (error) {
      setForgotError(
        getAuthErrorMessage(error, "发送重置邮件失败，请稍后再试。"),
      );
    } finally {
      setForgotPending(false);
    }
  }

  return (
    <div className="mt-8 flex min-h-[300px] flex-col">
      <form ref={formRef} action={action} className="grid gap-5" noValidate>
        <Field
          name="email"
          label="邮箱"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(event) => {
            setEmail(event.target.value);
            if (forgotError) {
              setForgotError(undefined);
            }
          }}
          placeholder={`yourname@${allowedEmailDomainsLabel}`}
          className="rounded-[22px] border-[color:rgba(139,74,82,0.14)] bg-[color:rgba(245,241,239,0.84)] px-5 py-4 text-base"
          required
        />

        {forgotOpen ? (
          <div
            id="forgot-password-panel"
            className="rounded-[24px] border border-[color:rgba(139,74,82,0.12)] bg-[color:rgba(245,241,239,0.78)] px-5 py-5 shadow-[0_14px_28px_rgba(139,74,82,0.08)]"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[color:var(--wine-deep)] text-base leading-8">
                  将向您的邮箱发送密码重置邮件
                </p>
                <p className="text-secondary-foreground/78 mt-1 text-sm leading-7">
                  系统会向当前邮箱发送密码重置邮件，请查收并在打开的页面中设置新密码。
                </p>
              </div>
              <button
                type="button"
                className="text-primary shrink-0 text-sm font-medium transition hover:text-[color:var(--wine-deep)]"
                onClick={() => {
                  setForgotOpen(false);
                  setForgotError(undefined);
                }}
              >
                返回登录
              </button>
            </div>
            {forgotSuccess ? (
              <div className="mt-3 rounded-[18px] border border-[color:var(--status-success)]/18 bg-[color:var(--status-success-bg)] px-4 py-3 shadow-[0_10px_22px_rgba(96,144,103,0.08)]">
                <p className="text-sm leading-7 text-[color:var(--status-success)]">
                  如果账号存在，我们已发送重置邮件，请查收邮箱。
                </p>
              </div>
            ) : null}
            {forgotError ? (
              <FieldErrorMessage message={forgotError} />
            ) : null}
            {!forgotSuccess ? (
              <Button
                type="button"
                className="mt-4 w-full justify-center py-3.5 text-base"
                disabled={forgotPending}
                onClick={() => {
                  void handleForgotPassword();
                }}
              >
                {forgotPending ? "发送中..." : "发送密码重置邮件"}
              </Button>
            ) : null}
          </div>
        ) : (
          <>
            <div className="grid gap-2">
              <div className="flex items-center justify-between gap-4">
                <label
                  htmlFor="login-password"
                  className="text-muted-foreground text-xs tracking-[0.08em]"
                >
                  密码
                </label>
                <button
                  type="button"
                  className="text-primary text-sm font-medium transition hover:text-[color:var(--wine-deep)]"
                  aria-expanded={forgotOpen}
                  aria-controls="forgot-password-panel"
                  onClick={() => {
                    setForgotOpen(true);
                    setForgotError(undefined);
                  }}
                >
                  忘记密码？
                </button>
              </div>

              <input
                id="login-password"
                name="password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="请输入密码"
                className="border-border bg-background text-foreground focus:border-primary focus:ring-primary/15 w-full rounded-[22px] border border-[color:rgba(139,74,82,0.14)] bg-[color:rgba(245,241,239,0.84)] px-5 py-4 text-base transition outline-none focus:ring-2"
                required
              />
            </div>

            <div className="text-secondary-foreground/78 flex flex-wrap items-center gap-1 text-sm leading-7">
              <span>登录即代表您已阅读并同意</span>
              <UserAgreementDialog />
            </div>
            <SubmitButton
              disabled={normalizedEmail.length === 0 || password.length === 0}
            />
          </>
        )}
      </form>

      {!forgotOpen ? (
        <p className="text-secondary-foreground/78 mt-6 text-center text-sm">
          还没有账号？
          {registrationOpen ? (
            <Link
              href="/register"
              className="text-primary ml-1 font-medium transition hover:text-[color:var(--wine-deep)]"
            >
              立即注册
            </Link>
          ) : (
            <span
              aria-disabled="true"
              className="text-primary/55 ml-1 cursor-default font-medium"
            >
              立即注册
            </span>
          )}
        </p>
      ) : null}
    </div>
  );
}
