"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { useState } from "react";

type Props = {
  locale: string;
};

export default function Header({ locale }: Props) {
  const t = useTranslations("nav");
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  const navLinks = [
    { href: `/${locale}`, label: t("home") },
    { href: `/${locale}/about`, label: t("about") },
    { href: `/${locale}/career`, label: t("career") },
    { href: `/${locale}/articles`, label: t("articles") },
  ];

  const locales = [
    { code: "ko", label: "한국어" },
    { code: "en", label: "English" },
    { code: "ja", label: "日本語" },
  ];

  const getLocalizedPath = (newLocale: string) => {
    const segments = pathname.split("/");
    segments[1] = newLocale;
    return segments.join("/") || "/";
  };

  return (
    <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-sm border-b border-gray-100">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          <Link
            href={`/${locale}`}
            className="text-lg font-semibold tracking-tight hover:opacity-70 transition-opacity"
          >
            Jaehyung Choi
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-6">
            {navLinks.slice(1).map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`text-sm transition-colors hover:text-black ${
                  pathname === link.href
                    ? "text-black font-medium"
                    : "text-gray-500"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            {/* Language Switcher */}
            <div className="hidden md:flex items-center gap-1 text-xs text-gray-400">
              {locales.map((loc, idx) => (
                <span key={loc.code} className="flex items-center gap-1">
                  {idx > 0 && <span>/</span>}
                  <Link
                    href={getLocalizedPath(loc.code)}
                    className={`hover:text-black transition-colors ${
                      locale === loc.code ? "text-black font-medium" : ""
                    }`}
                  >
                    {loc.label}
                  </Link>
                </span>
              ))}
            </div>

            {/* Mobile Menu Button */}
            <button
              className="md:hidden p-2 text-gray-500 hover:text-black"
              onClick={() => setMenuOpen(!menuOpen)}
              aria-label="Toggle menu"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {menuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {menuOpen && (
          <div className="md:hidden border-t border-gray-100 py-4 space-y-3">
            {navLinks.slice(1).map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMenuOpen(false)}
                className={`block text-sm py-1 transition-colors hover:text-black ${
                  pathname === link.href ? "text-black font-medium" : "text-gray-500"
                }`}
              >
                {link.label}
              </Link>
            ))}
            <div className="flex items-center gap-2 pt-2 border-t border-gray-100">
              {locales.map((loc) => (
                <Link
                  key={loc.code}
                  href={getLocalizedPath(loc.code)}
                  onClick={() => setMenuOpen(false)}
                  className={`text-xs transition-colors hover:text-black ${
                    locale === loc.code ? "text-black font-medium" : "text-gray-400"
                  }`}
                >
                  {loc.label}
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
