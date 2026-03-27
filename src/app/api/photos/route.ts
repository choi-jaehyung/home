import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const ADMIN_EMAIL = process.env.ADMIN_EMAIL;

async function verifyAdmin(request: NextRequest): Promise<boolean> {
  const token = request.headers.get("authorization")?.replace("Bearer ", "");
  if (!token || !ADMIN_EMAIL) return false;

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  const { data: { user } } = await supabase.auth.getUser(token);
  return !!user && user.email === ADMIN_EMAIL.trim();
}

function adminClient() {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey) throw new Error("SUPABASE_SERVICE_ROLE_KEY not configured");
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, serviceKey);
}

// POST: Storage 업로드 + photos 테이블 insert
export async function POST(request: NextRequest) {
  const isAdmin = await verifyAdmin(request);
  if (!isAdmin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const formData = await request.formData();
  const file = formData.get("file") as File | null;
  const caption = formData.get("caption") as string | null;
  const taken_at = formData.get("taken_at") as string | null;

  if (!file) return NextResponse.json({ error: "file required" }, { status: 400 });

  const ext = file.name.split(".").pop();
  const filename = `${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;

  let supabase;
  try {
    supabase = adminClient();
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Server config error" }, { status: 500 });
  }

  // 1. Storage 업로드
  const { error: storageError } = await supabase.storage
    .from("photos")
    .upload(filename, file, { cacheControl: "3600", upsert: false });

  if (storageError) {
    return NextResponse.json({ error: storageError.message }, { status: 500 });
  }

  // 2. Public URL
  const { data: { publicUrl } } = supabase.storage.from("photos").getPublicUrl(filename);

  // 3. DB insert
  const { error: dbError } = await supabase.from("photos").insert({
    url: publicUrl,
    caption: caption || null,
    taken_at: taken_at || null,
    order: 0,
  });

  if (dbError) {
    await supabase.storage.from("photos").remove([filename]);
    return NextResponse.json({ error: dbError.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, url: publicUrl });
}

// DELETE: Storage + photos 테이블 delete
export async function DELETE(request: NextRequest) {
  const isAdmin = await verifyAdmin(request);
  if (!isAdmin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id, url } = await request.json();
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  let supabase;
  try {
    supabase = adminClient();
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Server config error" }, { status: 500 });
  }

  // Storage 파일 삭제
  if (url) {
    const urlParts = (url as string).split("/photos/");
    const filename = urlParts[urlParts.length - 1];
    if (filename) {
      await supabase.storage.from("photos").remove([filename]);
    }
  }

  const { error } = await supabase.from("photos").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true });
}
