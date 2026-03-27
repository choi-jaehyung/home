import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase-server";

// 프로덕션 도메인을 환경변수로 고정 — request.url의 origin에 의존하면
// Supabase가 허용하지 않는 도메인이 redirectTo로 들어가 Site URL로 강제 이동됨
const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ??
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const provider = (searchParams.get("provider") ?? "google") as "google" | "github";

  const supabase = await createServerSupabaseClient();
  if (!supabase) return NextResponse.redirect(`${origin}/`);

  const { data } = await supabase.auth.signInWithOAuth({
    provider,
    options: { redirectTo: `${SITE_URL}/auth/callback` },
  });

  if (!data?.url) return NextResponse.redirect(`${origin}/`);

  return NextResponse.redirect(data.url);
}
