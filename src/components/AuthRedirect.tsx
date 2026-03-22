"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";

export default function AuthRedirect() {
  const router = useRouter();

  useEffect(() => {
    const returnUrl = localStorage.getItem("authReturn");
    if (!returnUrl) return;

    const supabase = createClient();
    if (!supabase) return;

    supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        localStorage.removeItem("authReturn");
        router.push(returnUrl);
      }
    });
  }, [router]);

  return null;
}
