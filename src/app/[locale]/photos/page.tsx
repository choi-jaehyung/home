import { createServerSupabaseClient } from "@/lib/supabase-server";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

type Props = {
  params: Promise<{ locale: string }>;
};

type Photo = {
  id: string;
  url: string;
  caption: string | null;
  taken_at: string | null;
};

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "Photo",
    description: "Photo",
  };
}

export default async function PhotosPage({ params }: Props) {
  const { locale } = await params;
  const supabase = await createServerSupabaseClient();

  const { data: photos } = supabase
    ? await supabase
        .from("photos")
        .select("id, url, caption, taken_at")
        .order("taken_at", { ascending: false, nullsFirst: false })
        .order("created_at", { ascending: false })
    : { data: [] as Photo[] };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10 sm:py-16">
      <div className="mb-10">
        <div className="flex items-center gap-3 mb-1">
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">
            Photo
          </h1>
          <Link
            href={`/${locale}/admin/photos`}
            className="text-xs text-gray-400 border border-gray-200 rounded-full px-2.5 py-0.5 hover:border-gray-400 hover:text-gray-600 transition-colors"
          >
            Admin
          </Link>
        </div>
        <p className="text-sm text-gray-400">{(photos || []).length}장의 사진</p>
      </div>

      {!photos || photos.length === 0 ? (
        <p className="text-gray-400 text-sm">아직 업로드된 사진이 없습니다.</p>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {(photos as Photo[]).map((photo) => (
            <div
              key={photo.id}
              className="group relative aspect-square overflow-hidden rounded-xl bg-gray-100"
            >
              <Image
                src={photo.url}
                alt={photo.caption || ""}
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-500"
                sizes="(max-width: 768px) 50vw, 33vw"
              />
              {photo.caption && (
                <div className="absolute inset-0 flex items-end bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <p className="text-white text-sm font-medium px-3 py-3 leading-snug">
                    {photo.caption}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
