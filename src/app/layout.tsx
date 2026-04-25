import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SEO Denetim Aracı — Google Bot Gözüyle Analiz",
  description:
    "Web sitenizi Googlebot gözüyle analiz edin. Teknik SEO, yerel SEO, iç link mimarisi ve önceliklendirilmiş aksiyon planı.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="tr">
      <body>{children}</body>
    </html>
  );
}
