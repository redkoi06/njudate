"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { Button, Field, FieldErrorMessage } from "@/components/site-ui";
import {
  getAuthErrorMessage,
  getResetPasswordFieldErrors,
  minimumPasswordLength,
} from "@/lib/auth/credentials";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";

type RecoveryState = "loading" | "ready" | "invalid" | "submitting";

const INVALID_RECOVERY_MESSAGE = "重置链接无效或已过期，请返回登录页重新发送。";

export function ResetPasswordForm() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [recoveryState, setRecoveryState] = useState<RecoveryState>("loading");
  const [submitError, setSubmitError] = useState<string | undefined>();

  const fieldErrors = useMemo(
    () => getResetPasswordFieldErrors({ password, confirmPassword }),
    [confirmPassword, password],
  );

  useEffect(() => {
    const supabase = createBrowserSupabaseClient();
    let active = true;

    const failRecovery = () => {
      if (!active) {
        return;
      }

      setRecoveryState("invalid");
      setSubmitError(INVALID_RECOVERY_MESSAGE);
    };

    const readyRecovery = () => {
      if (!active) {
        return;
      }

      setRecoveryState("ready");
      setSubmitError(undefined);
    };

    const validateSession = async () => {
      const { data, error } = await supabase.auth.getSession();

      if (!active) {
        return;
      }

      if (error) {
        failRecovery();
        return;
      }

      if (data.session) {
        readyRecovery();
      }
    };

    void validateSession();

    const invalidTimeoutId = window.setTimeout(async () => {
      const { data } = await supabase.auth.getSession();

      if (!active || data.session) {
        return;
      }

      failRecovery();
    }, 1200);

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (!active) {
        return;
      }

      if (
        session &&
        (event === "PASSWORD_RECOVERY" ||
          event === "SIGNED_IN" ||
          event === "INITIAL_SESSION")
      ) {
        window.clearTimeout(invalidTimeoutId);
        readyRecovery();
      }

      if (event === "SIGNED_OUT") {
        window.clearTimeout(invalidTimeoutId);
        failRecovery();
      }
    });

    return () => {
      active = false;
      window.clearTimeout(invalidTimeoutId);
      subscription.unsubscribe();
    };
  }, []);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const nextFieldErrors = getResetPasswordFieldErrors({
      password,
      confirmPassword,
    });

    if (Object.keys(nextFieldErrors).length > 0) {
      setSubmitError(undefined);
      return;
    }

    setRecoveryState("submitting");
    setSubmitError(undefined);

    const supabase = createBrowserSupabaseClient();
    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      setRecoveryState("ready");
      setSubmitError(
        getAuthErrorMessage(error, "重置密码失败，请稍后再试。"),
      );
      return;
    }

    router.replace("/app");
  }

  if (recoveryState === "loading") {
    return (
      <div className="rounded-[24px] border border-[color:rgba(139,74,82,0.12)] bg-[color:rgba(245,241,239,0.74)] px-5 py-5">
        <p className="text-[color:var(--wine-deep)] text-base leading-8">
          正在验证重置链接...
        </p>
        <p className="text-secondary-foreground/78 mt-1 text-sm leading-7">
          请稍候，系统正在确认当前恢复会话。
        </p>
      </div>
    );
  }

  if (recoveryState === "invalid") {
    return (
      <div className="rounded-[24px] border border-[color:rgba(139,74,82,0.12)] bg-[color:rgba(245,241,239,0.74)] px-5 py-5">
        <p className="text-[color:var(--wine-deep)] text-base leading-8">
          无法重置密码
        </p>
        {submitError ? (
          <div className="mt-3">
            <FieldErrorMessage message={submitError} />
          </div>
        ) : null}
        <Link
          href="/login"
          className="text-primary mt-4 inline-flex text-sm font-medium transition hover:text-[color:var(--wine-deep)]"
        >
          返回登录页
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="mt-8 grid gap-5" noValidate>
      <Field
        name="password"
        label="新密码"
        type="password"
        autoComplete="new-password"
        value={password}
        onChange={(event) => setPassword(event.target.value)}
        hint={`密码至少 ${minimumPasswordLength} 位`}
        error={password.length > 0 ? fieldErrors.password : undefined}
        className="rounded-[22px] border-[color:rgba(139,74,82,0.14)] bg-[color:rgba(245,241,239,0.84)] px-5 py-4 text-base"
        required
      />

      <Field
        name="confirmPassword"
        label="确认新密码"
        type="password"
        autoComplete="new-password"
        value={confirmPassword}
        onChange={(event) => setConfirmPassword(event.target.value)}
        error={
          password.length > 0 && confirmPassword.length > 0
            ? fieldErrors.confirmPassword
            : undefined
        }
        className="rounded-[22px] border-[color:rgba(139,74,82,0.14)] bg-[color:rgba(245,241,239,0.84)] px-5 py-4 text-base"
        required
      />

      {submitError ? <FieldErrorMessage message={submitError} /> : null}

      <Button
        type="submit"
        className="mt-1 w-full justify-center py-4 text-base shadow-[0_18px_36px_rgba(139,74,82,0.2)]"
        disabled={
          recoveryState === "submitting" ||
          Object.keys(fieldErrors).length > 0 ||
          password.length === 0 ||
          confirmPassword.length === 0
        }
      >
        {recoveryState === "submitting" ? "提交中..." : "更新密码"}
      </Button>
    </form>
  );
}
