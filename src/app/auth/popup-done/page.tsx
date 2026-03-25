"use client";

import { useEffect } from "react";
import { createClient } from "@/lib/supabase";

// 팝업 OAuth 완료 후 착지 페이지.
// 세션을 브라우저 스토리지에 동기화하고, localStorage 이벤트와
// postMessage 두 경로로 부모 창에 알린 뒤 팝업을 닫는다.
export default function PopupDone() {
  useEffect(() => {
    const supabase = createClient();

    const finish = () => {
      // localStorage 이벤트 — storage 리스너가 있는 모든 동일 출처 창에 전달됨
      try {
        localStorage.setItem("auth_popup_done", Date.now().toString());
      } catch {}

      // postMessage — window.opener가 살아 있는 브라우저(Chrome 등)용
      if (window.opener) {
        try {
          window.opener.postMessage({ type: "AUTH_SUCCESS" }, window.location.origin);
        } catch {}
      }

      setTimeout(() => window.close(), 200);
    };

    if (!supabase) {
      finish();
      return;
    }

    // getSession()은 쿠키에서 세션을 읽어 브라우저 내부 상태를 갱신한다.
    supabase.auth.getSession().then(() => finish());
  }, []);

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        height: "100vh",
        fontFamily: "sans-serif",
        color: "#888",
        fontSize: "14px",
      }}
    >
      로그인 완료. 잠시 후 창이 닫힙니다.
    </div>
  );
}
