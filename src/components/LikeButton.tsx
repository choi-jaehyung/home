"use client";

import { useEffect, useState } from "react";

type Props = {
  slug: string;
};

export default function LikeButton({ slug }: Props) {
  const [count, setCount] = useState(0);
  const [liked, setLiked] = useState(false);
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    fetch(`/api/likes?slug=${slug}`)
      .then((r) => r.json())
      .then(({ count, liked }) => {
        setCount(count);
        setLiked(liked);
      })
      .catch(() => {});
  }, [slug]);

  const toggle = async () => {
    if (loading) return;
    setLoading(true);
    // Optimistic update
    setLiked((prev) => !prev);
    setCount((prev) => (liked ? prev - 1 : prev + 1));

    try {
      const res = await fetch("/api/likes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug }),
      });
      const data = await res.json();
      setCount(data.count);
      setLiked(data.liked);
    } catch {
      // Revert on error
      setLiked((prev) => !prev);
      setCount((prev) => (liked ? prev + 1 : prev - 1));
    } finally {
      setLoading(false);
    }
  };

  if (!mounted) return null;

  return (
    <button
      onClick={toggle}
      disabled={loading}
      className={`group inline-flex items-center gap-2.5 px-5 py-2.5 rounded-full border text-sm font-medium transition-all ${
        liked
          ? "bg-red-50 border-red-200 text-red-500 hover:bg-red-100"
          : "bg-white border-gray-200 text-gray-500 hover:border-gray-300 hover:text-gray-700"
      }`}
    >
      <span
        className={`text-base transition-transform ${loading ? "scale-90" : liked ? "scale-110" : "group-hover:scale-110"}`}
      >
        {liked ? "❤️" : "🤍"}
      </span>
      <span>{count > 0 ? count : ""}</span>
      <span>{liked ? "좋아요 취소" : "좋아요"}</span>
    </button>
  );
}
