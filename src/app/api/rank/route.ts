import { NextRequest, NextResponse } from "next/server";
import axios from "axios";
import * as cheerio from "cheerio";

export const maxDuration = 60;

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
    const {
      domain,
      keyword,
      region = "google.com.tr",
      hl = "tr",
      gl = "tr",
      depth = 100,
      apiKey,
      apiProvider = "serper",
    } = body;

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

    let results: { title: string; url: string; snippet: string; rank: number }[] = [];

    // API Sağlayıcıları Kontrolü
    if (apiKey && apiProvider === "serper") {
      try {
        console.log("Querying Google via Serper.dev...");
        const serperRes = await axios.post(
          "https://google.serper.dev/search",
          { q: keyword, num: depth, gl, hl },
          {
            headers: {
              "X-API-KEY": apiKey,
              "Content-Type": "application/json",
            },
            timeout: 12000,
          }
        );

        if (serperRes.data && serperRes.data.organic) {
          results = serperRes.data.organic.map((item: any, idx: number) => ({
            title: item.title || "Başlıksız Sonuç",
            url: item.link || "",
            snippet: item.snippet || "",
            rank: item.position || idx + 1,
          }));
        }
      } catch (err: any) {
        return NextResponse.json(
          { error: `Serper.dev API Hatası: ${err.response?.data?.message || err.message}` },
          { status: 500 }
        );
      }
    } else if (apiKey && apiProvider === "serpapi") {
      try {
        console.log("Querying Google via SerpApi...");
        const serpapiRes = await axios.get("https://serpapi.com/search.json", {
          params: {
            q: keyword,
            engine: "google",
            google_domain: region,
            hl,
            gl,
            num: depth,
            api_key: apiKey,
          },
          timeout: 12000,
        });

        if (serpapiRes.data && serpapiRes.data.organic_results) {
          results = serpapiRes.data.organic_results.map((item: any, idx: number) => ({
            title: item.title || "Başlıksız Sonuç",
            url: item.link || "",
            snippet: item.snippet || "",
            rank: item.position || idx + 1,
          }));
        }
      } catch (err: any) {
        return NextResponse.json(
          { error: `SerpApi Hatası: ${err.response?.data?.error || err.message}` },
          { status: 500 }
        );
      }
    } else {
      // Doğrudan kazıma yöntemi (Ücretsiz ama limitli)
      try {
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

        // Yöntem 2: h3 etiketlerini doğrudan tarama
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
      } catch (err: any) {
        console.error("Direct scraping failed:", err.message);
      }

      // Doğrudan kazıma başarısız olduysa ve sonuç bulunamadıysa (Robot Koruması)
      if (results.length === 0) {
        return NextResponse.json(
          {
            error:
              "Google robot korumasına takıldı (Direct Scraping Blocked). Sorunsuz, kesintisiz ve yüksek hızlı sorgulama için lütfen Serper.dev veya SerpApi anahtarınızı girin. (Serper.dev üyelikte 2.500 sorguyu tamamen ücretsiz vermektedir).",
            isBlocked: true,
          },
          { status: 429 }
        );
      }
    }

    const finalResults = results.slice(0, depth);

    // Sitenin sırasını tespit et
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
      } catch {}
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
    console.error("Rank checker fatal API error:", err);
    return NextResponse.json(
      { error: `Google arama sorgulama hatası: ${err.message || err}` },
      { status: 500 }
    );
  }
}
