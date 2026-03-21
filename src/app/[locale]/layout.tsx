import type { Metadata } from "next";
import { Geist, Geist_Mono, Nanum_Myeongjo, Nanum_Gothic } from "next/font/google";
import localFont from "next/font/local";
import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import "../globals.css";
import "katex/dist/katex.min.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const nanumMyeongjo = Nanum_Myeongjo({
  variable: "--font-nanum-myeongjo",
  subsets: ["latin"],
  weight: ["400", "700", "800"],
});

const nanumGothic = Nanum_Gothic({
  variable: "--font-nanum-gothic",
  subsets: ["latin"],
  weight: ["400", "700", "800"],
});

const lineSeed = localFont({
  src: [
    { path: "../../../public/fonts/LINESeedKR-Th.woff2", weight: "300" },
    { path: "../../../public/fonts/LINESeedKR-Rg.woff2", weight: "400" },
    { path: "../../../public/fonts/LINESeedKR-Bd.woff2", weight: "700" },
  ],
  variable: "--font-line-seed",
});

export const metadata: Metadata = {
  title: {
    template: "%s | Homepage",
    default: "Homepage",
  },
  description: "Personal homepage - About, Career, and Articles",
};

type Props = {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
};

export default async function LocaleLayout({ children, params }: Props) {
  const { locale } = await params;

  if (!routing.locales.includes(locale as 'ko' | 'en' | 'ja')) {
    notFound();
  }

  const messages = await getMessages();

  return (
    <div className={`${geistSans.variable} ${geistMono.variable} ${nanumMyeongjo.variable} ${nanumGothic.variable} ${lineSeed.variable} min-h-full flex flex-col bg-white text-gray-900 antialiased`}>
      <NextIntlClientProvider messages={messages}>
        <Header locale={locale} />
        <main className="flex-1">{children}</main>
        <Footer />
      </NextIntlClientProvider>
    </div>
  );
}
