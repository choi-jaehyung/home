"use client";

import { useEffect, useState, useCallback } from "react";
import Image from "next/image";
import { createClient } from "@/lib/supabase";
import type { User } from "@supabase/supabase-js";

type Comment = {
  id: string;
  user_name: string;
  user_avatar: string | null;
  content: string;
  created_at: string;
};

type Props = {
  slug: string;
  locale: string;
};

export default function CommentSection({ slug, locale }: Props) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);

  const supabase = createClient();

  const loadComments = useCallback(async () => {
    const res = await fetch(`/api/comments?slug=${slug}`);
    const data = await res.json();
    setComments(data.comments ?? []);
  }, [slug]);

  useEffect(() => {
    setMounted(true);
    if (!supabase) return;
    loadComments();
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      setUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, [slug, loadComments, supabase]);

  const login = (provider: "google" | "github") => {
    const w = 500, h = 620;
    const left = Math.round(window.screenX + (window.outerWidth - w) / 2);
    const top = Math.round(window.screenY + (window.outerHeight - h) / 2);
    window.open(
      `/auth/popup-init?provider=${provider}`,
      "oauth-popup",
      `width=${w},height=${h},left=${left},top=${top},scrollbars=yes`
    );
  };

  useEffect(() => {
    const handler = (e: MessageEvent) => {
      if (e.origin !== window.location.origin) return;
      if (e.data?.type === "AUTH_SUCCESS") {
        supabase?.auth.getUser().then(({ data }) => setUser(data.user));
      }
    };
    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  }, [supabase]);

  const logout = async () => {
    if (!supabase) return;
    await supabase.auth.signOut();
    setUser(null);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || loading) return;
    setLoading(true);
    try {
      const res = await fetch("/api/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, content }),
      });
      if (res.ok) {
        setContent("");
        await loadComments();
      }
    } finally {
      setLoading(false);
    }
  };

  const deleteComment = async (id: string) => {
    await fetch("/api/comments", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    await loadComments();
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString(
      locale === "ko" ? "ko-KR" : locale === "ja" ? "ja-JP" : "en-US",
      { year: "numeric", month: "short", day: "numeric" }
    );
  };

  if (!mounted) return null;

  return (
    <div className="mt-16 pt-12 border-t border-gray-100">
      <h2 className="text-lg font-semibold text-gray-900 mb-8">
        댓글 {comments.length > 0 && <span className="text-gray-400 font-normal text-base">({comments.length})</span>}
      </h2>

      {/* Comment Input */}
      {user ? (
        <div className="mb-10">
          <div className="flex items-center gap-3 mb-4">
            {user.user_metadata?.avatar_url ? (
              <Image
                src={user.user_metadata.avatar_url}
                alt={user.user_metadata.full_name || ""}
                width={32}
                height={32}
                className="w-8 h-8 rounded-full"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-xs font-medium text-gray-500">
                {(user.user_metadata?.full_name || user.email || "?")[0].toUpperCase()}
              </div>
            )}
            <span className="text-sm text-gray-700 font-medium">
              {user.user_metadata?.full_name || user.email}
            </span>
            <button
              onClick={logout}
              className="ml-auto text-xs text-gray-400 hover:text-gray-700 transition-colors"
            >
              로그아웃
            </button>
          </div>
          <form onSubmit={submit}>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="댓글을 남겨주세요..."
              rows={3}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:border-gray-400 resize-none"
            />
            <div className="flex justify-end mt-2">
              <button
                type="submit"
                disabled={!content.trim() || loading}
                className="px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-full hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? "게시 중..." : "게시"}
              </button>
            </div>
          </form>
        </div>
      ) : (
        <div className="mb-10 p-6 bg-gray-50 rounded-2xl text-center">
          <p className="text-sm text-gray-500 mb-4">댓글을 남기려면 로그인이 필요합니다.</p>
          <div className="flex justify-center gap-3">
            <button
              onClick={() => login("google")}
              className="inline-flex items-center gap-2 px-4 py-2 border border-gray-200 bg-white text-sm text-gray-700 font-medium rounded-full hover:border-gray-300 hover:shadow-sm transition-all"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              Google
            </button>
          </div>
        </div>
      )}

      {/* Comment List */}
      {comments.length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-8">아직 댓글이 없습니다. 첫 번째 댓글을 남겨보세요!</p>
      ) : (
        <div className="space-y-6">
          {comments.map((comment) => (
            <div key={comment.id} className="flex gap-3">
              {comment.user_avatar ? (
                <Image
                  src={comment.user_avatar}
                  alt={comment.user_name}
                  width={36}
                  height={36}
                  className="w-9 h-9 rounded-full flex-shrink-0"
                />
              ) : (
                <div className="w-9 h-9 rounded-full bg-gray-200 flex items-center justify-center text-sm font-medium text-gray-500 flex-shrink-0">
                  {comment.user_name[0].toUpperCase()}
                </div>
              )}
              <div className="flex-1">
                <div className="flex items-baseline gap-2 mb-1">
                  <span className="text-sm font-medium text-gray-800">{comment.user_name}</span>
                  <span className="text-xs text-gray-400">{formatDate(comment.created_at)}</span>
                  {user && user.id === comment.user_name && (
                    <button
                      onClick={() => deleteComment(comment.id)}
                      className="ml-auto text-xs text-gray-300 hover:text-red-400 transition-colors"
                    >
                      삭제
                    </button>
                  )}
                </div>
                <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                  {comment.content}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
