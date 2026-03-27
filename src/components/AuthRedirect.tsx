"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";

export default function AuthRedirect() {
  const router = useRouter();

  useEffect(() => {
    const supabase = createClient();
    if (!supabase) return;

    // 어드민 로그인 후 원래 페이지로 복귀
    const returnUrl = localStorage.getItem("authReturn");
    if (!returnUrl) return;

    supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        localStorage.removeItem("authReturn");
        router.push(returnUrl);
      }
    });
  }, [router]);

  return null;
}
