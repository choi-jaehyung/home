import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { randomUUID } from "crypto";
import { createServerSupabaseClient } from "@/lib/supabase-server";

async function getSessionId(): Promise<string> {
  const cookieStore = await cookies();
  return cookieStore.get("session_id")?.value ?? randomUUID();
}

function withSessionCookie(response: NextResponse, sessionId: string): NextResponse {
  response.cookies.set("session_id", sessionId, {
    httpOnly: true,
    maxAge: 60 * 60 * 24 * 365,
    path: "/",
  });
  return response;
}

export async function GET(request: NextRequest) {
  const slug = request.nextUrl.searchParams.get("slug");
  if (!slug) return NextResponse.json({ error: "slug required" }, { status: 400 });

  const supabase = await createServerSupabaseClient();
  if (!supabase) return NextResponse.json({ count: 0, liked: false });

  const sessionId = await getSessionId();

  const { count } = await supabase
    .from("likes")
    .select("*", { count: "exact", head: true })
    .eq("slug", slug);

  const { data: myLike } = await supabase
    .from("likes")
    .select("id")
    .eq("slug", slug)
    .eq("session_id", sessionId)
    .single();

  return withSessionCookie(
    NextResponse.json({ count: count ?? 0, liked: !!myLike }),
    sessionId
  );
}

export async function POST(request: NextRequest) {
  const { slug } = await request.json();
  if (!slug) return NextResponse.json({ error: "slug required" }, { status: 400 });

  const supabase = await createServerSupabaseClient();
  if (!supabase) return NextResponse.json({ count: 0, liked: false });

  const sessionId = await getSessionId();

  const { data: existing } = await supabase
    .from("likes")
    .select("id")
    .eq("slug", slug)
    .eq("session_id", sessionId)
    .single();

  if (existing) {
    await supabase.from("likes").delete().eq("id", existing.id);
  } else {
    await supabase.from("likes").insert({ slug, session_id: sessionId });
  }

  const { count } = await supabase
    .from("likes")
    .select("*", { count: "exact", head: true })
    .eq("slug", slug);

  return withSessionCookie(
    NextResponse.json({ count: count ?? 0, liked: !existing }),
    sessionId
  );
}
