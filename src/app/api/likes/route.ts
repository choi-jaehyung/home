import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { cookies } from "next/headers";
import { randomUUID } from "crypto";

async function getSessionId(): Promise<string> {
  const cookieStore = await cookies();
  let sessionId = cookieStore.get("session_id")?.value;
  if (!sessionId) {
    sessionId = randomUUID();
  }
  return sessionId;
}

export async function GET(request: NextRequest) {
  const slug = request.nextUrl.searchParams.get("slug");
  if (!slug) return NextResponse.json({ error: "slug required" }, { status: 400 });

  const supabase = await createServerSupabaseClient();
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

  const response = NextResponse.json({ count: count ?? 0, liked: !!myLike });
  response.cookies.set("session_id", sessionId, {
    httpOnly: true,
    maxAge: 60 * 60 * 24 * 365,
    path: "/",
  });
  return response;
}

export async function POST(request: NextRequest) {
  const { slug } = await request.json();
  if (!slug) return NextResponse.json({ error: "slug required" }, { status: 400 });

  const supabase = await createServerSupabaseClient();
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

  const response = NextResponse.json({ count: count ?? 0, liked: !existing });
  response.cookies.set("session_id", sessionId, {
    httpOnly: true,
    maxAge: 60 * 60 * 24 * 365,
    path: "/",
  });
  return response;
}
