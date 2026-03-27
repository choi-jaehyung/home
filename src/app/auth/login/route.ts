import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase-server";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const provider = (searchParams.get("provider") ?? "google") as "google" | "github";
  const next = searchParams.get("next") ?? "/";

  const supabase = await createServerSupabaseClient();
  if (!supabase) return NextResponse.redirect(`${origin}/`);

  const { data } = await supabase.auth.signInWithOAuth({
    provider,
    options: { redirectTo: `${origin}/auth/callback` },
  });

  if (!data?.url) return NextResponse.redirect(`${origin}/`);

  // next URL을 쿠키에 저장 (10분 유효) — callback에서 읽어 복귀에 사용
  const response = NextResponse.redirect(data.url);
  response.cookies.set("auth_next", next, { path: "/", maxAge: 600, sameSite: "lax" });
  return response;
}
