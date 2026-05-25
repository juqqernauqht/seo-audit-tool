"use client";

import { useState, useEffect } from "react";
import type { AuditReport, RankQuery } from "@/lib/types";
import { useAuditStore } from "@/store/auditStore";
import {
  Search,
  Loader2,
  TrendingUp,
  Globe,
  Trash2,
  RefreshCw,
  ExternalLink,
  ChevronRight,
  AlertCircle,
  Clock,
  Sparkles,
} from "lucide-react";

interface Props {
  report: AuditReport;
}

const REGION_OPTIONS = [
  { value: "google.com.tr", label: "Google Türkiye (google.com.tr)", hl: "tr", gl: "tr" },
  { value: "google.com", label: "Google Global (google.com)", hl: "en", gl: "us" },
  { value: "google.de", label: "Google Almanya (google.de)", hl: "de", gl: "de" },
  { value: "google.co.uk", label: "Google İngiltere (google.co.uk)", hl: "en", gl: "uk" },
  { value: "google.fr", label: "Google Fransa (google.fr)", hl: "fr", gl: "fr" },
];

// Güvenli URL ayrıştırma yardımcıları (İstemci tarafı çökmelerini önlemek için)
const getHostname = (urlStr: string): string => {
  try {
    return new URL(urlStr).hostname;
  } catch {
    return urlStr || "";
  }
};

const getPathname = (urlStr: string): string => {
  try {
    return new URL(urlStr).pathname;
  } catch {
    return "";
  }
};

// Benzersiz kimlik oluşturucu (uuid paketi bağımlılığını kaldırmak ve güvenli kılmak için)
const generateId = (): string => {
  return Math.random().toString(36).substring(2, 11) + Date.now().toString(36);
};

export default function GoogleRank({ report }: Props) {
  const { rankQueries, addRankQuery, deleteRankQuery } = useAuditStore();
  const [keyword, setKeyword] = useState("");
  const [region, setRegion] = useState("google.com.tr");
  const [depth, setDepth] = useState<number>(100);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Hydration mismatches (sunucu/istemci zaman uyumsuzluğu) hatalarını önlemek için
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Görselleştirilen (seçili) sorgu
  const [selectedQuery, setSelectedQuery] = useState<RankQuery | null>(
    rankQueries.length > 0 ? rankQueries[0] : null
  );

  const cleanDomain = report.domain
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/^www\./, "")
    .replace(/\/$/, "");

  const handleQuery = async (e?: React.FormEvent, customKeyword?: string, customRegion?: string) => {
    if (e) e.preventDefault();

    const queryKeyword = customKeyword ?? keyword;
    const queryRegion = customRegion ?? region;

    if (!queryKeyword.trim()) return;

    setLoading(true);
    setError(null);

    const selectedOption = REGION_OPTIONS.find((r) => r.value === queryRegion) || REGION_OPTIONS[0];

    try {
      const res = await fetch("/api/rank", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          domain: cleanDomain,
          keyword: queryKeyword.trim(),
          region: queryRegion,
          hl: selectedOption.hl,
          gl: selectedOption.gl,
          depth,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error ?? "Sıralama sorgulanamadı");
      }

      const newQuery: RankQuery = {
        id: generateId(),
        keyword: queryKeyword.trim(),
        domain: cleanDomain,
        region: queryRegion,
        rank: data.rank,
        foundUrl: data.foundUrl,
        queriedAt: new Date().toISOString(),
        results: data.results,
      };

      addRankQuery(newQuery);
      setSelectedQuery(newQuery);
      if (!customKeyword) setKeyword(""); // Formdan arandıysa temizle
    } catch (err: any) {
      setError(err.message || "Bilinmeyen bir hata oluştu");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    deleteRankQuery(id);
    if (selectedQuery?.id === id) {
      const remaining = rankQueries.filter((q) => q.id !== id);
      setSelectedQuery(remaining.length > 0 ? remaining[0] : null);
    }
  };

  const getRankBadgeClass = (rank: number | null) => {
    if (rank === null) return "bg-gray-800 text-gray-400 border border-gray-700";
    if (rank <= 3) return "bg-green-500/20 text-green-400 border border-green-500/30";
    if (rank <= 10) return "bg-blue-500/20 text-blue-400 border border-blue-500/30";
    if (rank <= 30) return "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30";
    return "bg-orange-500/20 text-orange-400 border border-orange-500/30";
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white mb-1">Google Sıralama Sorgulama</h2>
        <p className="text-gray-400 text-sm">
          Hedef site: <span className="text-blue-400 font-medium">{cleanDomain}</span> — Google sıralamasını anlık sorgulayın.
        </p>
      </div>

      {/* Arama Formu */}
      <div className="card">
        <form onSubmit={(e) => handleQuery(e)} className="grid gap-4 md:grid-cols-12 items-end">
          <div className="md:col-span-5 space-y-1.5">
            <label className="text-xs text-gray-400 font-medium">Anahtar Kelime</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                type="text"
                className="input pl-9"
                placeholder="Örn: seo analiz aracı"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                disabled={loading}
                required
              />
            </div>
          </div>

          <div className="md:col-span-3 space-y-1.5">
            <label className="text-xs text-gray-400 font-medium">Google Lokasyonu</label>
            <select
              className="input bg-gray-800 border-gray-700 text-gray-100 cursor-pointer"
              value={region}
              onChange={(e) => setRegion(e.target.value)}
              disabled={loading}
            >
              {REGION_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <div className="md:col-span-2 space-y-1.5">
            <label className="text-xs text-gray-400 font-medium">Tarama Derinliği</label>
            <select
              className="input bg-gray-800 border-gray-700 text-gray-100 cursor-pointer"
              value={depth}
              onChange={(e) => setDepth(Number(e.target.value))}
              disabled={loading}
            >
              <option value={50}>İlk 50 Sonuç</option>
              <option value={100}>İlk 100 Sonuç</option>
            </select>
          </div>

          <div className="md:col-span-2">
            <button type="submit" className="btn-primary w-full flex items-center justify-center gap-2 h-[42px]" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Sorgulanıyor...
                </>
              ) : (
                <>
                  <TrendingUp className="w-4 h-4" />
                  Sorgula
                </>
              )}
            </button>
          </div>
        </form>

        {error && (
          <div className="mt-4 bg-red-500/10 border border-red-500/30 text-red-400 text-sm p-4 rounded-xl flex gap-2.5 items-start">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">Hata Oluştu</p>
              <p className="text-gray-300 mt-1">{error}</p>
            </div>
          </div>
        )}
      </div>

      {/* İki Sütunlu Arayüz (Sonuçlar ve Geçmiş) */}
      <div className="grid gap-6 lg:grid-cols-12">
        
        {/* Sol Sütun: Arama Sonucu Detayları (SERP) */}
        <div className="lg:col-span-8 space-y-4">
          {selectedQuery ? (
            <div className="space-y-4">
              
              {/* Özet Pozisyon Kartı */}
              <div className="card flex flex-col md:flex-row md:items-center justify-between gap-4 border-l-4 border-blue-500">
                <div>
                  <div className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Anahtar Kelime</div>
                  <div className="text-xl font-bold text-white mt-0.5">"{selectedQuery.keyword}"</div>
                  <div className="flex items-center gap-2 mt-1.5 text-xs text-gray-400">
                    <Globe className="w-3.5 h-3.5" />
                    <span>{selectedQuery.region}</span>
                    <span>•</span>
                    <Clock className="w-3.5 h-3.5" />
                    <span>
                      {mounted
                        ? new Date(selectedQuery.queriedAt).toLocaleTimeString("tr-TR")
                        : ""}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3 bg-gray-950 p-4 rounded-xl border border-gray-800">
                  <div className="text-right">
                    <div className="text-[10px] text-gray-500 font-bold uppercase">Sıralama Pozisyonu</div>
                    {selectedQuery.rank !== null ? (
                      <div className="text-xs text-green-400 font-medium mt-0.5 truncate max-w-[200px]" title={selectedQuery.foundUrl || ""}>
                        {selectedQuery.foundUrl?.replace(cleanDomain, "") || "/"}
                      </div>
                    ) : (
                      <div className="text-xs text-gray-400 mt-0.5">İlk {selectedQuery.results.length} sonuçta yok</div>
                    )}
                  </div>
                  <div
                    className={`w-16 h-16 rounded-lg flex items-center justify-center font-extrabold text-2xl border ${getRankBadgeClass(
                      selectedQuery.rank
                    )}`}
                  >
                    {selectedQuery.rank !== null ? `#${selectedQuery.rank}` : "-"}
                  </div>
                </div>
              </div>

              {/* SERP Listesi */}
              <div className="space-y-3">
                <div className="flex justify-between items-center px-1">
                  <h3 className="text-base font-semibold text-gray-300">
                    Google Organik Arama Sonuçları (SERP)
                  </h3>
                  <span className="text-xs text-gray-500">
                    Toplam {selectedQuery.results.length} sonuç listeleniyor
                  </span>
                </div>

                <div className="space-y-2 bg-gray-900 border border-gray-800 rounded-xl p-4 max-h-[600px] overflow-y-auto">
                  {selectedQuery.results.map((res) => {
                    const isOwnSite =
                      res.url.toLowerCase().includes(cleanDomain);

                    return (
                      <div
                        key={res.rank}
                        className={`flex items-start gap-4 p-4 rounded-xl transition-colors ${
                          isOwnSite
                            ? "bg-blue-600/10 border-2 border-blue-500/40 relative"
                            : "hover:bg-gray-800/40 border border-transparent"
                        }`}
                      >
                        {/* Sıralama Sayısı */}
                        <div
                          className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 ${
                            isOwnSite
                              ? "bg-blue-600 text-white"
                              : "bg-gray-800 text-gray-400"
                          }`}
                        >
                          {res.rank}
                        </div>

                        {/* İçerik */}
                        <div className="flex-1 min-w-0">
                          {isOwnSite && (
                            <span className="absolute right-3 top-3 bg-blue-500 text-white text-[9px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 uppercase">
                              <Sparkles className="w-2.5 h-2.5" />
                              Sizin Siteniz
                            </span>
                          )}

                          {/* Link/Domain başlığı */}
                          <div className="text-xs text-gray-500 truncate max-w-[85%] flex items-center gap-1.5 mb-0.5">
                            <span className="text-green-500 font-medium">
                              {getHostname(res.url)}
                            </span>
                            <span className="text-gray-600">
                              {getPathname(res.url)}
                            </span>
                          </div>

                          {/* Başlık */}
                          <a
                            href={res.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={`font-semibold hover:underline flex items-center gap-1 leading-snug ${
                              isOwnSite
                                ? "text-blue-300 hover:text-blue-200 text-base"
                                : "text-blue-400 hover:text-blue-300 text-[15px]"
                            }`}
                          >
                            {res.title}
                            <ExternalLink className="w-3.5 h-3.5 inline opacity-50 hover:opacity-100" />
                          </a>

                          {/* Açıklama (Snippet) */}
                          <p className="text-sm text-gray-400 mt-1 leading-relaxed">
                            {res.snippet || (
                              <span className="text-gray-600 italic text-xs">
                                Açıklama bulunamadı.
                              </span>
                            )}
                          </p>
                        </div>
                      </div>
                    );
                  })}

                  {selectedQuery.results.length === 0 && (
                    <div className="text-center text-gray-500 py-10 text-sm">
                      Arama sonucu parse edilemedi.
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="card text-center text-gray-500 py-16 flex flex-col items-center justify-center gap-3">
              <div className="w-12 h-12 rounded-full bg-gray-800 flex items-center justify-center text-gray-400">
                <Search className="w-6 h-6" />
              </div>
              <div>
                <p className="font-semibold text-gray-300">Henüz Sorgulama Yapılmadı</p>
                <p className="text-xs text-gray-500 mt-1 max-w-sm">
                  Yukarıdaki formu kullanarak anahtar kelimenizin Google arama motorundaki sıralamasını hemen analiz edin.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Sağ Sütun: Sorgu Geçmişi */}
        <div className="lg:col-span-4 space-y-4">
          <div className="flex justify-between items-center px-1">
            <h3 className="text-base font-semibold text-gray-300">Sorgu Geçmişi</h3>
            {rankQueries.length > 0 && (
              <span className="text-xs text-gray-500">{rankQueries.length} Sorgu</span>
            )}
          </div>

          <div className="space-y-2 max-h-[720px] overflow-y-auto">
            {rankQueries.map((q) => {
              const isSelected = selectedQuery?.id === q.id;
              return (
                <div
                  key={q.id}
                  onClick={() => setSelectedQuery(q)}
                  className={`card p-4 flex items-center justify-between gap-3 cursor-pointer transition-all ${
                    isSelected
                      ? "border-blue-500 bg-blue-500/5 ring-1 ring-blue-500/30"
                      : "hover:border-gray-700 hover:bg-gray-800/20"
                  }`}
                >
                  <div className="min-w-0 flex-1">
                    <div className="font-bold text-sm text-white truncate" title={q.keyword}>
                      {q.keyword}
                    </div>
                    <div className="text-[10px] text-gray-500 mt-0.5 truncate flex items-center gap-1.5">
                      <span>{q.region}</span>
                      <span>•</span>
                      <span>
                        {mounted
                          ? new Date(q.queriedAt).toLocaleTimeString("tr-TR")
                          : ""}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {/* Sıra Sayısı */}
                    <div
                      className={`text-xs font-extrabold w-10 h-7 rounded flex items-center justify-center border ${getRankBadgeClass(
                        q.rank
                      )}`}
                    >
                      {q.rank !== null ? `#${q.rank}` : "-"}
                    </div>

                    {/* Yeniden Sorgula */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleQuery(undefined, q.keyword, q.region);
                      }}
                      className="p-1.5 text-gray-500 hover:text-white rounded-lg hover:bg-gray-800 transition-colors"
                      title="Yenile"
                      disabled={loading}
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
                    </button>

                    {/* Sil */}
                    <button
                      onClick={(e) => handleDelete(q.id, e)}
                      className="p-1.5 text-gray-500 hover:text-red-400 rounded-lg hover:bg-gray-800 transition-colors"
                      title="Sil"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>

                    <ChevronRight className="w-4 h-4 text-gray-600 shrink-0" />
                  </div>
                </div>
              );
            })}

            {rankQueries.length === 0 && (
              <div className="card text-center text-gray-500 py-10 text-xs italic">
                Geçmiş sorgu bulunamadı.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
