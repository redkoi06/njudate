"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";

import {
  AdminOverviewPage,
  AdminShell,
  AdminUsersPage,
  ContactConsultPage,
  MatchBatchesPage,
  QuestionBankPage,
} from "@/features/mock-front/admin-pages";
import {
  AboutPage,
  ContactPage,
  HomePage,
  LoginPage,
  PrivacyPage,
  PublicShell,
  VerifyPage,
} from "@/features/mock-front/public-pages";
import { useDemoApp } from "@/features/mock-front/provider";
import {
  DashboardPage,
  MatchDetailPage,
  MatchRecordsPage,
  ParticipationPage,
  ProfilePage,
  QuestionnairePage,
  SettingsPage,
  UserShell,
} from "@/features/mock-front/user-pages";
import { EmptyState } from "@/features/mock-front/ui";

function PublicNotFound() {
  return (
    <PublicShell>
      <div className="mx-auto w-full max-w-4xl px-5 py-24 md:px-8">
        <EmptyState
          title="这个页面不存在"
          description="当前前端只实现了需求文档第一阶段要求的关键页面。"
        />
      </div>
    </PublicShell>
  );
}

export function FrontRouter() {
  const pathname = usePathname();
  const router = useRouter();
  const { state, ready } = useDemoApp();
  const segments = pathname.split("/").filter(Boolean);

  useEffect(() => {
    if (!ready) {
      return;
    }

    if (segments[0] === "app" && state.role === "guest") {
      router.replace("/login");
      return;
    }

    if (segments[0] === "admin" && state.role !== "admin") {
      router.replace(state.role === "guest" ? "/login" : "/app/dashboard");
    }
  }, [ready, router, segments, state.role]);

  if (!ready) {
    return null;
  }

  if (segments[0] === "admin") {
    const adminPage = (() => {
      if (segments.length <= 1) return <AdminOverviewPage />;
      if (segments[1] === "users") return <AdminUsersPage />;
      if (segments[1] === "questions") return <QuestionBankPage />;
      if (segments[1] === "batches") return <MatchBatchesPage />;
      if (segments[1] === "consult") return <ContactConsultPage />;
      return (
        <EmptyState
          title="后台页面不存在"
          description="当前只实现了概览、用户、题库、批次和联系咨询。"
        />
      );
    })();

    return <AdminShell>{adminPage}</AdminShell>;
  }

  if (segments[0] === "app") {
    const userPage = (() => {
      if (segments.length <= 1 || segments[1] === "dashboard") {
        return <DashboardPage />;
      }
      if (segments[1] === "profile") {
        return (
          <ProfilePage
            key={`${state.profile.nickname}:${state.profile.department}:${state.profile.grade}:${state.profileCompleted}`}
          />
        );
      }
      if (segments[1] === "questionnaire") {
        return (
          <QuestionnairePage
            key={`${state.questionnaireStatus}:${Object.keys(state.questionnaireAnswers).length}`}
          />
        );
      }
      if (segments[1] === "participation") return <ParticipationPage />;
      if (segments[1] === "matches" && segments[2]) {
        return <MatchDetailPage matchId={segments[2]} />;
      }
      if (segments[1] === "matches") return <MatchRecordsPage />;
      if (segments[1] === "settings") return <SettingsPage />;
      return (
        <EmptyState
          title="用户区页面不存在"
          description="当前只实现了主页、资料、问卷、参与、匹配和设置。"
        />
      );
    })();

    return <UserShell>{userPage}</UserShell>;
  }

  if (pathname === "/" || pathname === "") {
    return (
      <PublicShell>
        <HomePage />
      </PublicShell>
    );
  }

  if (pathname === "/about") {
    return (
      <PublicShell>
        <AboutPage />
      </PublicShell>
    );
  }

  if (pathname === "/privacy") {
    return (
      <PublicShell>
        <PrivacyPage />
      </PublicShell>
    );
  }

  if (pathname === "/contact") {
    return (
      <PublicShell>
        <ContactPage />
      </PublicShell>
    );
  }

  if (pathname === "/login") {
    return (
      <PublicShell>
        <LoginPage />
      </PublicShell>
    );
  }

  if (pathname === "/verify") {
    return (
      <PublicShell>
        <VerifyPage />
      </PublicShell>
    );
  }

  return <PublicNotFound />;
}
