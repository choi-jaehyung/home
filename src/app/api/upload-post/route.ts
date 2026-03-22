import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase-server";

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const GITHUB_OWNER = process.env.GITHUB_OWNER;
const GITHUB_REPO = process.env.GITHUB_REPO;
const ADMIN_EMAIL = process.env.ADMIN_EMAIL;

async function verifyAdmin(request: NextRequest): Promise<boolean> {
  if (!ADMIN_EMAIL) return false;

  // Authorization 헤더 토큰 우선 (쿠키 세션이 없는 경우 대응)
  const token = request.headers.get("authorization")?.replace("Bearer ", "");
  if (token) {
    const supabase = await createServerSupabaseClient();
    if (!supabase) return false;
    const { data: { user } } = await supabase.auth.getUser(token);
    return !!user && user.email === ADMIN_EMAIL.trim();
  }

  // 쿠키 세션 폴백
  const supabase = await createServerSupabaseClient();
  if (!supabase) return false;
  const { data: { user } } = await supabase.auth.getUser();
  return !!user && user.email === ADMIN_EMAIL.trim();
}

function githubHeaders() {
  return {
    Authorization: `Bearer ${GITHUB_TOKEN}`,
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
  };
}

function normalizeFilename(filename: string) {
  return filename.normalize("NFC");
}

function contentsUrl(filename: string) {
  return `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/content/posts/${encodeURIComponent(normalizeFilename(filename))}`;
}

// GET: 파일 존재 여부 확인
export async function GET(request: NextRequest) {
  const isAdmin = await verifyAdmin(request);
  if (!isAdmin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const filename = request.nextUrl.searchParams.get("filename");
  if (!filename) return NextResponse.json({ error: "filename required" }, { status: 400 });

  const res = await fetch(contentsUrl(filename), {
    headers: githubHeaders(),
    cache: "no-store",
  });

  if (res.status === 404) return NextResponse.json({ exists: false });
  if (!res.ok) return NextResponse.json({ error: "GitHub API error" }, { status: 502 });

  const data = await res.json();
  return NextResponse.json({ exists: true, sha: data.sha });
}

// POST: 파일 커밋
export async function POST(request: NextRequest) {
  const isAdmin = await verifyAdmin(request);
  if (!isAdmin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { filename, content, sha } = await request.json();
  if (!filename || !content) {
    return NextResponse.json({ error: "filename and content required" }, { status: 400 });
  }

  const body: Record<string, string> = {
    message: `post: upload ${filename}`,
    content, // base64
  };
  if (sha) body.sha = sha;

  const res = await fetch(contentsUrl(filename), {
    method: "PUT",
    headers: { ...githubHeaders(), "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    return NextResponse.json(
      { error: (err as { message?: string }).message || "GitHub API error" },
      { status: 502 }
    );
  }

  const data = await res.json();
  return NextResponse.json({
    success: true,
    commitUrl: (data.commit as { html_url?: string })?.html_url,
  });
}
