"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";

type Props = {
  tags: string[];
  currentTag?: string;
};

export default function TagFilter({ tags, currentTag }: Props) {
  const t = useTranslations("articles");
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const setTag = (tag?: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (tag) {
      params.set("tag", tag);
    } else {
      params.delete("tag");
    }
    router.push(`${pathname}?${params.toString()}`);
  };

  return (
    <div className="flex flex-wrap gap-2 mb-10">
      <button
        onClick={() => setTag(undefined)}
        className={`px-3.5 py-1.5 text-sm rounded-full border transition-colors ${
          !currentTag
            ? "bg-gray-900 text-white border-gray-900"
            : "border-gray-200 text-gray-500 hover:border-gray-400 hover:text-gray-900"
        }`}
      >
        {t("all")}
      </button>
      {tags.map((tag) => (
        <button
          key={tag}
          onClick={() => setTag(tag)}
          className={`px-3.5 py-1.5 text-sm rounded-full border transition-colors ${
            currentTag === tag
              ? "bg-gray-900 text-white border-gray-900"
              : "border-gray-200 text-gray-500 hover:border-gray-400 hover:text-gray-900"
          }`}
        >
          #{tag}
        </button>
      ))}
    </div>
  );
}
