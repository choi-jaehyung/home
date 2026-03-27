import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase-server";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");

  // auth_next 쿠키에서 복귀 URL 읽기 (CommentSection에서 클라이언트 쪽에 설정)
  const rawNext = request.cookies.get("auth_next")?.value;
  const next = rawNext ? decodeURIComponent(rawNext) : "/";

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
