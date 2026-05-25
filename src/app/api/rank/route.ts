import { NextRequest, NextResponse } from "next/server";
import axios from "axios";
import * as cheerio from "cheerio";

export const maxDuration = 60; // Vercel için max duration

function cleanGoogleUrl(href: string): string | null {
  if (!href) return null;
  if (href.startsWith("/url?q=")) {
    try {
      const parsed = new URL("https://www.google.com" + href);
      const actualUrl = parsed.searchParams.get("q");
      return actualUrl ? actualUrl.split("&")[0] : null;
    } catch {
      return null;
    }
  }
  if (href.startsWith("http")) {
    return href;
  }
  return null;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { domain, keyword, region = "google.com.tr", hl = "tr", gl = "tr", depth = 100 } = body;

    if (!domain || !keyword) {
      return NextResponse.json(
        { error: "Domain ve anahtar kelime zorunludur." },
        { status: 400 }
      );
    }

    const cleanDomain = domain
      .toLowerCase()
      .replace(/^https?:\/\//, "")
      .replace(/^www\./, "")
      .replace(/\/$/, "")
      .trim();

    // Google arama URL'i
    // num parametresi ile istenen derinlikte sonuç çekiyoruz
    const url = `https://www.google.com/search?q=${encodeURIComponent(keyword)}&num=${depth}&hl=${hl}&gl=${gl}`;

    const response = await axios.get(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8",
        "Accept-Language": "tr-TR,tr;q=0.9,en-US;q=0.8,en;q=0.7",
        "Cache-Control": "max-age=0",
      },
      timeout: 15000,
    });

    const html = response.data;
    const $ = cheerio.load(html);
    const results: { title: string; url: string; snippet: string; rank: number }[] = [];
    let rankCounter = 1;

    // Yöntem 1: Klasik desktop (.g sınıfı olan bloklar)
    $(".g").each((_i, el) => {
      const linkEl = $(el).find("a[href]").first();
      const titleEl = $(el).find("h3").first();
      const href = linkEl.attr("href");
      if (!href) return;
      const parsedUrl = cleanGoogleUrl(href);
      if (!parsedUrl) return;

      try {
        const hostname = new URL(parsedUrl).hostname;
        if (
          hostname.includes("google.com") ||
          hostname.includes("google.com.tr") ||
          parsedUrl.includes("webcache.googleusercontent.com")
        ) {
          return;
        }
      } catch {
        return;
      }

      const title = titleEl.text().trim() || "Başlıksız Sonuç";
      const snippet =
        $(el).find(".VwiC3b, .yDCN3e, .MUFPAc, .bAWN1e").text().trim() ||
        $(el).find("span").last().text().trim() ||
        "";

      results.push({
        title,
        url: parsedUrl,
        snippet: snippet.slice(0, 250),
        rank: rankCounter++,
      });
    });

    // Yöntem 2: Eğer .g bulunamazsa h3 etiketlerini doğrudan tarama
    if (results.length === 0) {
      $("h3").each((_i, el) => {
        const parentA = $(el).closest("a");
        if (parentA.length === 0) return;
        const href = parentA.attr("href");
        if (!href) return;
        const parsedUrl = cleanGoogleUrl(href);
        if (!parsedUrl) return;

        try {
          const hostname = new URL(parsedUrl).hostname;
          if (
            hostname.includes("google.com") ||
            hostname.includes("google.com.tr") ||
            parsedUrl.includes("webcache.googleusercontent.com")
          ) {
            return;
          }
        } catch {
          return;
        }

        const title = $(el).text().trim() || "Başlıksız Sonuç";
        let snippet = "";
        const parentContainer = parentA.parent().parent();
        if (parentContainer.length > 0) {
          snippet = parentContainer.find("span, div").last().text().trim();
          if (snippet === title) snippet = "";
        }

        // Çift eklemeyi önle
        if (!results.some((r) => r.url === parsedUrl)) {
          results.push({
            title,
            url: parsedUrl,
            snippet: snippet.slice(0, 250),
            rank: rankCounter++,
          });
        }
      });
    }

    // Yöntem 3: Fallback - Organik görünümlü tüm dış linkleri topla
    if (results.length === 0) {
      $("a[href]").each((_i, el) => {
        const href = $(el).attr("href");
        if (!href) return;
        const parsedUrl = cleanGoogleUrl(href);
        if (!parsedUrl) return;

        try {
          const parsed = new URL(parsedUrl);
          const hostname = parsed.hostname;
          if (
            hostname.includes("google.com") ||
            hostname.includes("google.com.tr") ||
            parsedUrl.includes("webcache.googleusercontent.com") ||
            parsedUrl.startsWith("https://accounts.google.com") ||
            parsedUrl.startsWith("https://support.google.com") ||
            parsedUrl.startsWith("https://maps.google.com")
          ) {
            return;
          }
        } catch {
          return;
        }

        const title = $(el).text().trim();
        if (
          title.length < 5 ||
          title.toLowerCase() === "cache" ||
          title.toLowerCase() === "benzer"
        ) {
          return;
        }

        if (!results.some((r) => r.url === parsedUrl)) {
          results.push({
            title,
            url: parsedUrl,
            snippet: "",
            rank: rankCounter++,
          });
        }
      });
    }

    // Sınırlamayı sınırlandır (depth parametresine göre)
    const finalResults = results.slice(0, depth);

    // Kendi sitemizin sırasını bul
    let foundRank: number | null = null;
    let foundUrl: string | null = null;

    for (const res of finalResults) {
      try {
        const resDomain = new URL(res.url).hostname.toLowerCase().replace(/^www\./, "");
        if (resDomain === cleanDomain || resDomain.endsWith("." + cleanDomain)) {
          foundRank = res.rank;
          foundUrl = res.url;
          break;
        }
      } catch {
        // Geçersiz URL'leri es geç
      }
    }

    return NextResponse.json({
      keyword,
      domain: cleanDomain,
      region,
      rank: foundRank,
      foundUrl,
      results: finalResults,
    });
  } catch (err: any) {
    console.error("Rank query error:", err);
    if (err.response && err.response.status === 429) {
      return NextResponse.json(
        {
          error:
            "Google, robot olarak algıladı ve isteği geçici olarak engelledi (429). Lütfen birkaç dakika sonra tekrar deneyin veya daha spesifik bir arama yapın.",
        },
        { status: 429 }
      );
    }
    return NextResponse.json(
      { error: `Google arama sorgulama hatası: ${err.message || err}` },
      { status: 500 }
    );
  }
}
