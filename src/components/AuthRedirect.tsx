"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";

export default function AuthRedirect() {
  const router = useRouter();

  useEffect(() => {
    const supabase = createClient();
    if (!supabase) return;

    // 팝업 컨텍스트: 로그인 완료 후 부모 창에 알리고 팝업 닫기
    if (window.opener) {
      supabase.auth.getUser().then(({ data }) => {
        if (data.user) {
          try {
            window.opener.postMessage({ type: "AUTH_SUCCESS" }, window.location.origin);
          } catch {}
          window.close();
        }
      });
      return;
    }

    // 일반 리다이렉트 (어드민 로그인 등)
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
