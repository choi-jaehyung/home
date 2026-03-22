import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function GET(request: NextRequest) {
  const token = request.headers.get("authorization")?.replace("Bearer ", "");

  const result: Record<string, unknown> = {
    env: {
      SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL
        ? process.env.NEXT_PUBLIC_SUPABASE_URL.substring(0, 30) + "..."
        : "NOT SET",
      ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
        ? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY.substring(0, 20) + "..."
        : "NOT SET",
      ADMIN_EMAIL: process.env.ADMIN_EMAIL
        ? `[${process.env.ADMIN_EMAIL.length}chars] "${process.env.ADMIN_EMAIL.charCodeAt(process.env.ADMIN_EMAIL.length - 1) === 10 ? "ENDS WITH NEWLINE!" : process.env.ADMIN_EMAIL}"`
        : "NOT SET",
    },
    token: token
      ? `received (${token.length} chars): ${token.substring(0, 30)}...`
      : "NOT RECEIVED",
  };

  if (token && process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    try {
      // JWT payload decode (no network call)
      const parts = token.split(".");
      if (parts.length === 3) {
        const payload = JSON.parse(
          Buffer.from(parts[1], "base64url").toString("utf-8")
        );
        result.jwt_payload = {
          email: payload.email,
          exp: payload.exp,
          exp_readable: new Date(payload.exp * 1000).toISOString(),
          iss: payload.iss,
          is_expired: Date.now() / 1000 > payload.exp,
        };
      }

      // Supabase getUser call
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );
      const { data, error } = await supabase.auth.getUser(token);
      result.supabase_getUser = {
        user_email: data?.user?.email ?? null,
        error: error ? { message: error.message, status: error.status } : null,
      };

      if (data?.user?.email) {
        const adminEmail = process.env.ADMIN_EMAIL ?? "";
        result.email_match = {
          jwt_email: data.user.email,
          admin_email: adminEmail,
          trimmed_admin: adminEmail.trim(),
          match: data.user.email === adminEmail.trim(),
        };
      }
    } catch (e) {
      result.error = String(e);
    }
  }

  return NextResponse.json(result);
}
