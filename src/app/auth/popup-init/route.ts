import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase-server";

// 팝업 창에서 직접 Google OAuth를 시작하는 서버 라우트.
// 서버 사이드에서 PKCE verifier를 쿠키에 Set-Cookie로 저장하므로
// 팝업의 후속 요청에서도 verifier가 안정적으로 전달됩니다.
export async function GET(request: NextRequest) {
  const { origin } = new URL(request.url);
  const supabase = await createServerSupabaseClient();

  if (!supabase) {
    return NextResponse.redirect(`${origin}/`);
  }

  const provider = (new URL(request.url).searchParams.get("provider") ?? "google") as "google" | "github";

  const { data } = await supabase.auth.signInWithOAuth({
    provider,
    options: { redirectTo: `${origin}/auth/popup-callback` },
  });

  if (!data?.url) {
    return NextResponse.redirect(`${origin}/`);
  }

  return NextResponse.redirect(data.url);
}
