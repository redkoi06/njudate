import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import { getRegistrationOpen } from "@/lib/auth/registration";
import { getDefaultHomePathForRole } from "@/lib/auth/permissions";
import { getPublicEnv } from "@/lib/env/client";
import type { Database } from "@/types/database.generated";

const emailConfirmationType = "email";

function createRegisterErrorUrl(message: string, siteUrl: string) {
  const url = new URL("/register", siteUrl);
  url.searchParams.set("error", message);
  return url;
}

export async function GET(request: NextRequest) {
  const tokenHash = request.nextUrl.searchParams.get("token_hash");
  const type = request.nextUrl.searchParams.get("type");
  const env = getPublicEnv();

  if (!tokenHash || type !== emailConfirmationType) {
    return NextResponse.redirect(
      createRegisterErrorUrl(
        "确认链接无效或类型不正确，请重新注册。",
        env.NEXT_PUBLIC_SITE_URL,
      ),
    );
  }

  if (!(await getRegistrationOpen())) {
    return NextResponse.redirect(new URL("/login", env.NEXT_PUBLIC_SITE_URL));
  }

  let response = NextResponse.redirect(new URL("/app", env.NEXT_PUBLIC_SITE_URL));

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

          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        },
      },
    },
  );

  const { error } = await supabase.auth.verifyOtp({
    token_hash: tokenHash,
    type: emailConfirmationType,
  });

  if (error) {
    return NextResponse.redirect(
      createRegisterErrorUrl(
        "确认链接无效或已过期，请重新注册。",
        env.NEXT_PUBLIC_SITE_URL,
      ),
    );
  }

  const { error: provisionError } = await supabase.rpc(
    "provision_current_app_user",
  );

  if (provisionError) {
    response = NextResponse.redirect(
      createRegisterErrorUrl(
        "邮箱已确认，但初始化账号失败，请重新登录或联系管理员。",
        env.NEXT_PUBLIC_SITE_URL,
      ),
    );
    await supabase.auth.signOut();
    return response;
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user?.id) {
    const roleResult = await supabase
      .from("app_users")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();

    if (!roleResult.error && roleResult.data?.role) {
      response = NextResponse.redirect(
        new URL(
          getDefaultHomePathForRole(roleResult.data.role),
          env.NEXT_PUBLIC_SITE_URL,
        ),
      );
    }
  }

  return response;
}
