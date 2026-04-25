"use client";

import { useState } from "react";
import type { CrawlConfig, CrawlMode } from "@/lib/types";
import {
  Globe, Settings, Zap, MapPin, ChevronDown, ChevronUp,
} from "lucide-react";

interface Props {
  onSubmit: (config: CrawlConfig) => void;
}

export default function AuditForm({ onSubmit }: Props) {
  const [domain, setDomain] = useState("");
  const [mode, setMode] = useState<CrawlMode>("crawl");
  const [maxPages, setMaxPages] = useState(20);
  const [respectRobots, setRespectRobots] = useState(true);
  const [useSitemap, setUseSitemap] = useState(true);
  const [localSeoMode, setLocalSeoMode] = useState(true);
  const [performanceAnalysis, setPerformanceAnalysis] = useState(true);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [domainError, setDomainError] = useState("");

  const validateDomain = (val: string): boolean => {
    const cleaned = val.replace(/^https?:\/\//, "").replace(/\/$/, "").trim();
    if (!cleaned) {
      setDomainError("Domain adresi zorunlu");
      return false;
    }
    if (!/^[a-z0-9.-]+\.[a-z]{2,}$/i.test(cleaned)) {
      setDomainError("Geçerli bir domain girin (örn: example.com)");
      return false;
    }
    setDomainError("");
    return true;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateDomain(domain)) return;

    const cleanDomain = domain.replace(/^https?:\/\//, "").replace(/\/$/, "").trim();

    onSubmit({
      domain: cleanDomain,
      mode,
      maxPages,
      respectRobots,
      useSitemap,
      localSeoMode,
      performanceAnalysis,
      startUrl: `https://${cleanDomain}`,
    });
  };

  return (
    <div className="card">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Domain */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            <Globe className="inline w-4 h-4 mr-1" />
            Web Sitesi Domain
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              className={`input ${domainError ? "border-red-500" : ""}`}
              placeholder="example.com"
              value={domain}
              onChange={(e) => {
                setDomain(e.target.value);
                if (domainError) setDomainError("");
              }}
              onBlur={() => domain && validateDomain(domain)}
            />
          </div>
          {domainError && (
            <p className="text-red-400 text-xs mt-1">{domainError}</p>
          )}
        </div>

        {/* Tarama Modu */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            <Settings className="inline w-4 h-4 mr-1" />
            Tarama Modu
          </label>
          <div className="grid grid-cols-3 gap-2">
            {([
              { val: "single", label: "Tek Sayfa", desc: "Yalnızca girilen URL" },
              { val: "sitemap", label: "Sitemap", desc: "Sitemap.xml'den" },
              { val: "crawl", label: "Tam Tarama", desc: "Link keşfi ile" },
            ] as { val: CrawlMode; label: string; desc: string }[]).map(({ val, label, desc }) => (
              <button
                key={val}
                type="button"
                onClick={() => setMode(val)}
                className={`p-3 rounded-lg border text-left transition-colors ${
                  mode === val
                    ? "border-blue-500 bg-blue-500/10 text-blue-300"
                    : "border-gray-700 bg-gray-800 text-gray-400 hover:border-gray-600"
                }`}
              >
                <div className="font-medium text-sm">{label}</div>
                <div className="text-xs mt-0.5 opacity-70">{desc}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Maksimum Sayfa */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Maksimum Sayfa Sayısı:{" "}
            <span className="text-blue-400 font-bold">{maxPages}</span>
          </label>
          <input
            type="range"
            min={1}
            max={50}
            value={maxPages}
            onChange={(e) => setMaxPages(Number(e.target.value))}
            className="w-full accent-blue-600"
          />
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>1</span>
            <span>10</span>
            <span>25</span>
            <span>50</span>
          </div>
        </div>

        {/* Özellik Açma/Kapama */}
        <div className="grid grid-cols-2 gap-3">
          {[
            { key: "localSeoMode", label: "Yerel SEO Analizi", icon: MapPin, value: localSeoMode, set: setLocalSeoMode },
            { key: "performanceAnalysis", label: "Performans Analizi", icon: Zap, value: performanceAnalysis, set: setPerformanceAnalysis },
          ].map(({ key, label, icon: Icon, value, set }) => (
            <button
              key={key}
              type="button"
              onClick={() => set(!value)}
              className={`flex items-center gap-2 p-3 rounded-lg border transition-colors ${
                value
                  ? "border-blue-500 bg-blue-500/10 text-blue-300"
                  : "border-gray-700 bg-gray-800 text-gray-500"
              }`}
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span className="text-sm font-medium">{label}</span>
              <div
                className={`ml-auto w-8 h-4 rounded-full transition-colors ${
                  value ? "bg-blue-500" : "bg-gray-600"
                }`}
              >
                <div
                  className={`w-3 h-3 bg-white rounded-full mt-0.5 transition-transform ${
                    value ? "ml-4" : "ml-0.5"
                  }`}
                />
              </div>
            </button>
          ))}
        </div>

        {/* Gelişmiş Ayarlar */}
        <div>
          <button
            type="button"
            className="flex items-center gap-1 text-sm text-gray-400 hover:text-gray-300"
            onClick={() => setShowAdvanced(!showAdvanced)}
          >
            {showAdvanced ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            Gelişmiş Ayarlar
          </button>

          {showAdvanced && (
            <div className="mt-3 space-y-2 pl-4 border-l border-gray-700">
              {[
                { key: "respectRobots", label: "robots.txt kurallarına uy", value: respectRobots, set: setRespectRobots },
                { key: "useSitemap", label: "sitemap.xml'i kullan", value: useSitemap, set: setUseSitemap },
              ].map(({ key, label, value, set }) => (
                <label key={key} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={value}
                    onChange={() => set(!value)}
                    className="accent-blue-500"
                  />
                  <span className="text-sm text-gray-400">{label}</span>
                </label>
              ))}
            </div>
          )}
        </div>

        {/* Submit */}
        <button
          type="submit"
          className="btn-primary w-full py-3 text-base"
        >
          Taramayı Başlat
        </button>
      </form>
    </div>
  );
}
