"use client";

import { useTranslations } from "next-intl";

export default function Footer() {
  const t = useTranslations("footer");
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-gray-100 py-8 mt-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center text-sm text-gray-400">
        <p>© {year} Jaehyung Choi. {t("rights")}</p>
      </div>
    </footer>
  );
}
