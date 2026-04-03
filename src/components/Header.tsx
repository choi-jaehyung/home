"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useState } from "react";

type Props = {
  locale: string;
};

export default function Header({ locale }: Props) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  const navLinks = [
    { href: `/${locale}`, label: "Home" },
    { href: `/${locale}/about`, label: "About" },
    { href: `/${locale}/career`, label: "Career" },
    { href: `/${locale}/articles`, label: "Writings" },
    { href: `/${locale}/photos`, label: "Photo" },
    { href: `/${locale}/works`, label: "Works" },
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
        <div className="flex items-center justify-between h-[4.6rem]">
          <Link
            href={`/${locale}`}
            className="hover:opacity-70 transition-opacity"
          >
            <Image
              src="/logo.png"
              alt="Jaehyung Choi"
              width={120}
              height={40}
              className="h-14 w-auto object-contain"
              priority
            />
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-8">
            {navLinks.slice(1).map((link, idx) => (
              <span key={link.href} className="flex items-center gap-8">
                {idx > 0 && <span className="text-gray-400 font-light select-none">|</span>}
                <Link
                  href={link.href}
                  className={`text-base font-bold transition-colors hover:text-black ${
                    pathname === link.href ? "text-black" : "text-gray-500"
                  }`}
                >
                  {link.label}
                </Link>
              </span>
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
