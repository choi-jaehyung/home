import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase-server";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");

  // auth_next 쿠키 우선, 없으면 쿼리 파라미터, 없으면 홈
  const next =
    request.cookies.get("auth_next")?.value ??
    searchParams.get("next") ??
    "/";

  if (code) {
    const supabase = await createServerSupabaseClient();
    if (supabase) {
      await supabase.auth.exchangeCodeForSession(code);
    }
  }

  const response = NextResponse.redirect(`${origin}${next}`);
  response.cookies.delete("auth_next");
  return response;
}
