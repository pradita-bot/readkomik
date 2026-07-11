import React, { useState, useMemo } from "react";
import { Manga } from "../types";
import MangaCard from "./MangaCard";
import { ChevronLeft, ChevronRight, RefreshCw, AlertCircle, Filter, ArrowUpDown, Search } from "lucide-react";

interface MangaGridProps {
  mangaList: Manga[];
  loading: boolean;
  error: string | null;
  page: number;
  totalPages: number;
  onPageChange: (newPage: number) => void;
  onSelectManga: (slug: string) => void;
  onRetry: () => void;
  selectedGenre: string;
  onGenreChange: (genreSlug: string) => void;
}

const POPULAR_GENRES = [
  { name: "Semua Genre", slug: "" },
  { name: "Action", slug: "action" },
  { name: "Adventure", slug: "adventure" },
  { name: "Comedy", slug: "comedy" },
  { name: "Drama", slug: "drama" },
  { name: "Fantasy", slug: "fantasy" },
  { name: "Romance", slug: "romance" },
  { name: "School Life", slug: "school-life" },
  { name: "Slice of Life", slug: "slice-of-life" },
  { name: "Supernatural", slug: "supernatural" },
];

const ALL_GENRES = [
  { name: "Action", slug: "action" },
  { name: "Adventure", slug: "adventure" },
  { name: "Comedy", slug: "comedy" },
  { name: "Drama", slug: "drama" },
  { name: "Fantasy", slug: "fantasy" },
  { name: "Harem", slug: "harem" },
  { name: "Historical", slug: "historical" },
  { name: "Isekai", slug: "isekai" },
  { name: "Mecha", slug: "mecha" },
  { name: "Mystery", slug: "mystery" },
  { name: "Romance", slug: "romance" },
  { name: "School Life", slug: "school-life" },
  { name: "Sci-fi", slug: "sci-fi" },
  { name: "Seinen", slug: "seinen" },
  { name: "Shoujo", slug: "shoujo" },
  { name: "Shounen", slug: "shounen" },
  { name: "Slice of Life", slug: "slice-of-life" },
  { name: "Sports", slug: "sports" },
  { name: "Supernatural", slug: "supernatural" },
  { name: "Thriller", slug: "thriller" },
];

export default function MangaGrid({
  mangaList,
  loading,
  error,
  page,
  totalPages,
  onPageChange,
  onSelectManga,
  onRetry,
  selectedGenre,
  onGenreChange,
}: MangaGridProps) {
  // Filter and Sort states
  const [selectedType, setSelectedType] = useState<string>("all");
  const [localSearchText, setLocalSearchText] = useState<string>("");
  const [sortBy, setSortBy] = useState<string>("default");

  // Filter & Sort calculation
  const filteredList = useMemo(() => {
    let list = [...mangaList];

    // 1. Filter by type
    if (selectedType !== "all") {
      if (selectedType === "colored") {
        list = list.filter(
          (item) =>
            item.type?.toLowerCase().includes("colored") ||
            item.type?.toLowerCase().includes("warna")
        );
      } else {
        list = list.filter((item) =>
          item.type?.toLowerCase().includes(selectedType)
        );
      }
    }

    // 2. Filter by local search query
    if (localSearchText.trim()) {
      const query = localSearchText.toLowerCase();
      list = list.filter((item) =>
        item.title.toLowerCase().includes(query)
      );
    }

    // 3. Sort options
    if (sortBy === "az") {
      list.sort((a, b) => a.title.localeCompare(b.title));
    } else if (sortBy === "za") {
      list.sort((a, b) => b.title.localeCompare(a.title));
    }

    return list;
  }, [mangaList, selectedType, localSearchText, sortBy]);

  if (error) {
    return (
      <div className="bg-red-950/10 border border-red-900/30 rounded-2xl p-8 text-center max-w-xl mx-auto my-8">
        <AlertCircle className="w-12 h-12 text-red-600 mx-auto mb-4 animate-bounce" />
        <h3 className="text-lg font-bold text-slate-100 mb-2">Gagal Memuat Komik</h3>
        <p className="text-sm text-red-400 mb-6">{error}</p>
        <button
          onClick={onRetry}
          className="bg-red-600 hover:bg-red-700 text-white font-bold px-6 py-2.5 rounded-xl text-sm transition-all shadow flex items-center justify-center gap-2 mx-auto focus:outline-none shadow-red-600/20"
        >
          <RefreshCw className="w-4 h-4" />
          <span>Coba Lagi</span>
        </button>
      </div>
    );
  }

  return (
    <div>
      {/* Title & Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <h2 className="text-xl font-extrabold tracking-tight text-white flex items-center gap-2">
          <span className="w-1.5 h-6 bg-red-600 rounded-full shadow-[0_0_8px_rgba(220,38,38,0.5)]" />
          <span>Update Komik Terbaru</span>
        </h2>
        {/* Simple Page Indicator */}
        <span className="text-xs text-slate-400 font-medium">
          Halaman {page} dari {totalPages}
        </span>
      </div>

      {/* Comic Filters Panel */}
      <div className="bg-[#0a0a0a] border border-white/5 rounded-2xl p-4 mb-4 flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <span className="text-xs text-slate-400 font-bold flex items-center gap-1.5 mr-2">
            <Filter className="w-3.5 h-3.5 text-red-500" />
            <span>Tipe:</span>
          </span>
          {[
            { id: "all", label: "🌐 Semua" },
            { id: "manga", label: "🇯🇵 Manga" },
            { id: "manhwa", label: "🇰🇷 Manhwa" },
            { id: "manhua", label: "🇨🇳 Manhua" },
            { id: "colored", label: "🎨 Warna" },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setSelectedType(t.id)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all focus:outline-none ${
                selectedType === t.id
                  ? "bg-red-600 text-white shadow-md shadow-red-600/20 font-bold"
                  : "bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto shrink-0">
          {/* Filter Inside Page */}
          <div className="relative flex-1 sm:w-48">
            <input
              type="text"
              placeholder="Filter judul..."
              value={localSearchText}
              onChange={(e) => setLocalSearchText(e.target.value)}
              className="w-full bg-[#121212] border border-white/10 text-slate-200 placeholder-slate-500 pl-8 pr-3 py-1.5 rounded-lg focus:outline-none focus:border-red-600 focus:ring-1 focus:ring-red-600 text-xs transition-all"
            />
            <Search className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-slate-500" />
          </div>

          {/* Sort Menu */}
          <div className="relative shrink-0 flex items-center gap-1.5">
            <span className="text-slate-500 text-xs hidden sm:inline">
              <ArrowUpDown className="w-3.5 h-3.5" />
            </span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-[#121212] border border-white/10 text-slate-300 px-2.5 py-1.5 rounded-lg text-xs focus:outline-none cursor-pointer focus:border-red-600 focus:ring-red-600"
            >
              <option value="default">Terbaru (Default)</option>
              <option value="az">Judul A - Z</option>
              <option value="za">Judul Z - A</option>
            </select>
          </div>
        </div>
      </div>

      {/* Genre Filter Panel */}
      <div className="bg-[#0a0a0a] border border-white/5 rounded-2xl p-4 mb-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-2 overflow-x-auto pb-2 lg:pb-0 scrollbar-none w-full lg:w-auto">
            <span className="text-xs text-slate-400 font-bold flex items-center gap-1.5 shrink-0 mr-2">
              <Filter className="w-3.5 h-3.5 text-red-500" />
              <span>Genre:</span>
            </span>
            {POPULAR_GENRES.map((g) => (
              <button
                key={g.slug}
                onClick={() => onGenreChange(g.slug)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all shrink-0 focus:outline-none ${
                  selectedGenre === g.slug
                    ? "bg-red-600 text-white shadow-md shadow-red-600/20 font-bold"
                    : "bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white"
                }`}
              >
                {g.name}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 shrink-0 w-full lg:w-auto justify-between lg:justify-start border-t border-white/5 pt-3 lg:border-t-0 lg:pt-0">
            <span className="text-xs text-slate-400 font-bold shrink-0">Genre Lainnya:</span>
            <select
              value={ALL_GENRES.some((g) => g.slug === selectedGenre) ? selectedGenre : ""}
              onChange={(e) => onGenreChange(e.target.value)}
              className="bg-[#121212] border border-white/10 text-slate-300 px-3 py-1.5 rounded-lg text-xs focus:outline-none cursor-pointer focus:border-red-600 focus:ring-red-600 min-w-[140px]"
            >
              <option value="">-- Pilih Genre --</option>
              {ALL_GENRES.map((g) => (
                <option key={g.slug} value={g.slug}>
                  {g.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Filter Results Info */}
      {(selectedType !== "all" || selectedGenre !== "" || localSearchText.trim() !== "" || sortBy !== "default") && (
        <div className="text-xs text-slate-400 mb-6 flex items-center justify-between px-3 py-2.5 bg-white/5 border border-white/5 rounded-xl">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 bg-red-600 rounded-full" />
            <span>
              Menampilkan <span className="text-red-500 font-bold">{filteredList.length}</span> komik{" "}
              {selectedGenre !== "" && (
                <span>
                  genre <span className="text-slate-200 capitalize font-semibold">{ALL_GENRES.find(g => g.slug === selectedGenre)?.name || selectedGenre}</span>{" "}
                </span>
              )}
              {selectedType !== "all" && (
                <span>
                  tipe <span className="text-slate-200 capitalize font-semibold">{selectedType}</span>{" "}
                </span>
              )}
              {localSearchText.trim() !== "" && (
                <span>
                  dengan judul <span className="text-slate-200 font-medium">"{localSearchText}"</span>
                </span>
              )}
            </span>
          </div>
          <button
            onClick={() => {
              setSelectedType("all");
              onGenreChange("");
              setLocalSearchText("");
              setSortBy("default");
            }}
            className="text-[11px] text-red-500 hover:text-red-400 transition-colors font-bold underline underline-offset-2"
          >
            Reset Filter
          </button>
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 sm:gap-6">
          {Array.from({ length: 18 }).map((_, idx) => (
            <div
              key={idx}
              className="bg-[#121212] border border-white/5 rounded-xl overflow-hidden shadow h-80 flex flex-col animate-pulse"
            >
              <div className="bg-white/5 aspect-[3/4] w-full" />
              <div className="p-3 flex-1 flex flex-col justify-between">
                <div className="bg-white/5 h-4 rounded w-5/6 mb-2" />
                <div className="bg-white/5 h-3 rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : filteredList.length === 0 ? (
        <div className="text-center py-16 bg-[#0a0a0a] border border-white/5 rounded-2xl text-slate-400">
          <Filter className="w-12 h-12 text-slate-600 mx-auto mb-3 opacity-60" />
          <h3 className="font-bold text-slate-300 mb-1">Tidak ada komik cocok</h3>
          <p className="text-xs text-slate-500">Coba ubah pengaturan filter atau filter judul pencarian Anda.</p>
        </div>
      ) : (
        <>
          {/* Cards Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 sm:gap-6">
            {filteredList.map((manga) => (
              <MangaCard key={manga.slug} manga={manga} onSelect={onSelectManga} />
            ))}
          </div>

          {/* Pagination Controls */}
          <div className="flex items-center justify-center gap-2 mt-12 mb-6" id="pagination">
            {/* Prev Button */}
            <button
              onClick={() => onPageChange(page - 1)}
              disabled={page <= 1}
              className="p-2.5 rounded-xl border border-white/5 bg-[#121212] text-slate-300 hover:bg-white/5 hover:text-red-500 transition-all disabled:opacity-30 disabled:pointer-events-none focus:outline-none"
              title="Halaman Sebelumnya"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>

            {/* Current Page and Context pages */}
            {Array.from({ length: Math.min(5, totalPages) }).map((_, idx) => {
              // Calculate page sliding window around active page
              let targetPage = page;
              if (page <= 3) {
                targetPage = idx + 1;
              } else if (page >= totalPages - 2) {
                targetPage = totalPages - 4 + idx;
              } else {
                targetPage = page - 2 + idx;
              }

              if (targetPage < 1 || targetPage > totalPages) return null;

              return (
                <button
                  key={targetPage}
                  onClick={() => onPageChange(targetPage)}
                  className={`w-10 h-10 rounded-xl font-bold text-sm transition-all focus:outline-none ${
                    page === targetPage
                      ? "bg-red-600 text-white shadow shadow-red-600/25"
                      : "bg-[#121212] border border-white/5 text-slate-300 hover:bg-white/5 hover:text-red-500"
                  }`}
                >
                  {targetPage}
                </button>
              );
            })}

            {/* Next Button */}
            <button
              onClick={() => onPageChange(page + 1)}
              disabled={page >= totalPages}
              className="p-2.5 rounded-xl border border-white/5 bg-[#121212] text-slate-300 hover:bg-white/5 hover:text-red-500 transition-all disabled:opacity-30 disabled:pointer-events-none focus:outline-none"
              title="Halaman Selanjutnya"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </>
      )}
    </div>
  );
}
