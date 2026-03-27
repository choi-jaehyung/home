import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const ADMIN_EMAIL = process.env.ADMIN_EMAIL;

async function verifyAdmin(request: NextRequest): Promise<string | null> {
  const token = request.headers.get("authorization")?.replace("Bearer ", "");
  if (!token || !ADMIN_EMAIL) return null;

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  const { data: { user } } = await supabase.auth.getUser(token);
  if (!user || user.email !== ADMIN_EMAIL.trim()) return null;
  return token;
}

function makeClient(token: string) {
  // 서비스 롤 키가 있으면 RLS 우회, 없으면 사용자 JWT로 auth.uid() 활성화
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  return serviceKey
    ? createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, serviceKey)
    : createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        { global: { headers: { Authorization: `Bearer ${token}` } } }
      );
}

// POST: photos 테이블 insert
export async function POST(request: NextRequest) {
  const token = await verifyAdmin(request);
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { url, caption, taken_at } = await request.json();
  if (!url) return NextResponse.json({ error: "url required" }, { status: 400 });

  const supabase = makeClient(token);
  const { error } = await supabase.from("photos").insert({
    url,
    caption: caption || null,
    taken_at: taken_at || null,
    order: 0,
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}

// DELETE: photos 테이블 delete
export async function DELETE(request: NextRequest) {
  const token = await verifyAdmin(request);
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await request.json();
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  const supabase = makeClient(token);
  const { error } = await supabase.from("photos").delete().eq("id", id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
