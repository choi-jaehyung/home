"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";

export default function AuthRedirect() {
  const router = useRouter();

  useEffect(() => {
    const supabase = createClient();
    if (!supabase) return;

    // /auth/callback이 히트되지 않고 ?code=가 현재 페이지 URL에 붙은 경우
    // 클라이언트에서 직접 PKCE 코드 교환 (프로덕션 폴백)
    const url = new URL(window.location.href);
    const code = url.searchParams.get("code");
    if (code) {
      supabase.auth.exchangeCodeForSession(code).then(({ data }) => {
        url.searchParams.delete("code");
        window.history.replaceState({}, "", url.toString());
        if (data.session) {
          const returnUrl = localStorage.getItem("authReturn");
          if (returnUrl) {
            localStorage.removeItem("authReturn");
            router.push(returnUrl);
          }
        }
      });
      return;
    }

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
