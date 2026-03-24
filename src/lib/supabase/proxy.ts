import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import { getAppEntryPath, isProfileCompleted } from "@/features/app/profile-contract";
import { getPublicEnv } from "@/lib/env/client";
import type { Database } from "@/types/database.generated";

function isAppPath(pathname: string) {
  return pathname === "/app" || pathname.startsWith("/app/");
}

function redirectWithCookies(
  request: NextRequest,
  response: NextResponse,
  pathname: string,
) {
  const redirectResponse = NextResponse.redirect(new URL(pathname, request.url));

  response.cookies.getAll().forEach((cookie) => {
    redirectResponse.cookies.set(cookie);
  });

  return redirectResponse;
}

export async function updateSession(request: NextRequest) {
  const env = getPublicEnv();
  const pathname = request.nextUrl.pathname;

  let response = NextResponse.next({
    request,
  });

  const supabase = createServerClient<Database>(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => {
            request.cookies.set(name, value);
          });

          response = NextResponse.next({
            request,
          });

          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || !isAppPath(pathname)) {
    return response;
  }

  const profileResult = await supabase
    .from("app_users")
    .select("nickname, gender, grade, department, campus, birth_year")
    .eq("id", user.id)
    .maybeSingle();

  if (profileResult.error) {
    return response;
  }

  const profileCompleted = profileResult.data
    ? isProfileCompleted({
        nickname: profileResult.data.nickname ?? "",
        gender: profileResult.data.gender ?? "",
        grade: profileResult.data.grade ?? "",
        department: profileResult.data.department ?? "",
        campus: profileResult.data.campus ?? "",
        birthYear: profileResult.data.birth_year,
      })
    : false;

  let questionnaireCompleted = true;

  if (profileCompleted) {
    const publishedVersionResult = await supabase
      .from("questionnaire_versions")
      .select("id")
      .eq("status", "published")
      .maybeSingle();

    if (publishedVersionResult.error) {
      return response;
    }

    if (publishedVersionResult.data) {
      const submissionResult = await supabase
        .from("questionnaire_submissions")
        .select("id")
        .eq("user_id", user.id)
        .eq("questionnaire_version_id", publishedVersionResult.data.id)
        .eq("status", "submitted")
        .maybeSingle();

      if (submissionResult.error) {
        return response;
      }

      questionnaireCompleted = Boolean(submissionResult.data?.id);
    }
  }

  const entryPath = getAppEntryPath({
    profileCompleted,
    questionnaireCompleted,
  });

  if (!profileCompleted && pathname !== entryPath) {
    return redirectWithCookies(request, response, entryPath);
  }

  if (profileCompleted && !questionnaireCompleted && pathname !== entryPath) {
    return redirectWithCookies(request, response, entryPath);
  }

  if (profileCompleted && questionnaireCompleted && pathname === "/app") {
    return redirectWithCookies(request, response, "/app/dashboard");
  }

  return response;
}
