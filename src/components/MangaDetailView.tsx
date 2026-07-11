import React, { useState, useEffect } from "react";
import { MangaDetail, BookmarkItem } from "../types";
import { ArrowLeft, Star, Play, RotateCcw, Search, BookOpen, AlertCircle, RefreshCw } from "lucide-react";

interface MangaDetailViewProps {
  slug: string;
  onBack: () => void;
  onSelectChapter: (chapterSlug: string) => void;
  bookmarks: BookmarkItem[];
  onToggleBookmark: (item: BookmarkItem) => void;
}

export default function MangaDetailView({
  slug,
  onBack,
  onSelectChapter,
  bookmarks,
  onToggleBookmark,
}: MangaDetailViewProps) {
  const [detail, setDetail] = useState<MangaDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [chapterSearch, setChapterSearch] = useState("");

  const isBookmarked = bookmarks.some((b) => b.slug === slug);

  const fetchDetail = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/manga/detail/${slug}`);
      const json = await res.json();
      if (json.success && json.data) {
        setDetail(json.data);
      } else {
        throw new Error(json.message || "Gagal memuat detail komik");
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Terjadi kesalahan saat memuat detail komik");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetail();
  }, [slug]);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto py-16 text-center text-slate-400">
        <RefreshCw className="w-12 h-12 text-red-600 animate-spin mx-auto mb-4" />
        <p className="text-sm font-semibold">Memuat info detail komik...</p>
      </div>
    );
  }

  if (error || !detail) {
    return (
      <div className="bg-red-950/10 border border-red-900/30 rounded-2xl p-8 text-center max-w-xl mx-auto my-8">
        <AlertCircle className="w-12 h-12 text-red-600 mx-auto mb-4 animate-bounce" />
        <h3 className="text-lg font-bold text-slate-100 mb-2">Gagal Memuat Komik</h3>
        <p className="text-sm text-red-400 mb-6">{error || "Detail komik kosong."}</p>
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={onBack}
            className="bg-white/5 hover:bg-white/10 text-white px-5 py-2.5 rounded-xl text-sm transition-all focus:outline-none"
          >
            Kembali
          </button>
          <button
            onClick={fetchDetail}
            className="bg-red-600 hover:bg-red-700 text-white font-bold px-5 py-2.5 rounded-xl text-sm transition-all shadow flex items-center gap-2 focus:outline-none shadow-red-600/20"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Coba Lagi</span>
          </button>
        </div>
      </div>
    );
  }

  // Filter chapters
  const filteredChapters = detail.chapters.filter((ch) =>
    ch.name.toLowerCase().includes(chapterSearch.toLowerCase())
  );

  const handleToggleFav = () => {
    onToggleBookmark({
      slug,
      title: detail.title,
      thumb: detail.thumb,
      type: detail.type,
      addedAt: Date.now(),
    });
  };

  return (
    <div className="max-w-4xl mx-auto py-4">
      {/* Back link */}
      <button
        onClick={onBack}
        className="inline-flex items-center gap-1.5 text-slate-400 hover:text-red-500 font-semibold mb-6 focus:outline-none transition-colors group"
      >
        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
        <span>Kembali ke Beranda</span>
      </button>

      {/* Main Detail Header Block */}
      <div className="bg-[#0a0a0a] border border-white/5 rounded-2xl overflow-hidden shadow-xl mb-8">
        <div className="p-6 sm:p-8 flex flex-col md:flex-row gap-6 sm:gap-8">
          {/* Cover Poster */}
          <div className="w-44 sm:w-56 aspect-[3/4] object-cover rounded-xl bg-black border border-white/10 flex-shrink-0 self-center md:self-start shadow-xl overflow-hidden">
            <img
              src={detail.thumb}
              alt={detail.title}
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover"
            />
          </div>

          {/* Info Side */}
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <span className="bg-red-600 text-white font-bold px-2.5 py-0.5 rounded-full text-[10px] tracking-wider uppercase">
                {detail.type}
              </span>
              <span className="bg-white/5 text-slate-300 font-semibold px-2.5 py-0.5 rounded-full text-[10px] uppercase">
                {detail.status}
              </span>
            </div>

            <h1 className="text-2xl sm:text-3.5xl font-black italic tracking-tighter text-white uppercase mb-1 leading-none">
              {detail.title}
            </h1>

            {detail.altTitle && (
              <p className="text-sm text-slate-400 font-medium mb-4 italic">
                {detail.altTitle}
              </p>
            )}

            {/* Author */}
            <div className="grid grid-cols-2 gap-y-2 text-xs text-slate-400 mb-5 border-y border-white/5 py-3.5">
              <div>
                <span className="text-slate-500 block mb-0.5">Penulis / Komikus</span>
                <span className="text-slate-200 font-semibold text-sm">
                  {detail.author || "Tidak diketahui"}
                </span>
              </div>
              {detail.publishedText && (
                <div>
                  <span className="text-slate-500 block mb-0.5">Publikasi / Rilis</span>
                  <span className="text-slate-200 font-semibold text-sm">
                    {detail.publishedText}
                  </span>
                </div>
              )}
            </div>

            {/* Genres */}
            <div className="flex flex-wrap gap-1.5 mb-6">
              {detail.genres.map((genre) => (
                <span
                  key={genre}
                  className="bg-white/5 border border-white/5 text-slate-300 px-2.5 py-1 rounded-lg text-xs"
                >
                  {genre}
                </span>
              ))}
            </div>

            {/* Action buttons */}
            <div className="flex flex-wrap gap-3">
              {/* Star Bookmark */}
              <button
                onClick={handleToggleFav}
                className={`flex items-center justify-center gap-2 px-5 py-3 rounded-xl font-bold text-sm transition-all focus:outline-none ${isBookmarked ? "bg-red-600 text-white shadow shadow-red-600/25 hover:bg-red-700" : "bg-white/5 border border-white/10 text-slate-200 hover:bg-white/10"}`}
              >
                <Star className={`w-4 h-4 ${isBookmarked ? "fill-white text-white" : ""}`} />
                <span>{isBookmarked ? "Hapus Favorit" : "Favoritkan"}</span>
              </button>

              {/* Start reading first chapter */}
              {detail.chapters.length > 0 && (
                <button
                  onClick={() => onSelectChapter(detail.chapters[detail.chapters.length - 1].slug)}
                  className="flex items-center justify-center gap-2 bg-white hover:bg-slate-100 text-black px-5 py-3 rounded-xl font-bold text-sm transition-all shadow"
                >
                  <Play className="w-4 h-4 fill-black" />
                  <span>Mulai Bab 1</span>
                </button>
              )}

              {/* Start reading latest chapter */}
              {detail.chapters.length > 0 && (
                <button
                  onClick={() => onSelectChapter(detail.chapters[0].slug)}
                  className="flex items-center justify-center gap-2 bg-white/5 border border-white/10 hover:bg-[#1a1a1a] text-red-500 px-5 py-3 rounded-xl font-bold text-sm transition-all shadow"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>Bab Terbaru</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Synopsis Panel */}
      <div className="bg-[#0a0a0a] border border-white/5 rounded-2xl p-6 sm:p-8 shadow-xl mb-8">
        <h2 className="text-lg font-extrabold text-white mb-3.5 flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-red-500" />
          <span>Sinopsis</span>
        </h2>
        <div className="text-slate-300 text-xs sm:text-sm leading-relaxed whitespace-pre-line bg-black/40 border border-white/5 p-4 rounded-xl">
          {detail.synopsis}
        </div>
      </div>

      {/* Chapter List Panel */}
      <div className="bg-[#0a0a0a] border border-white/5 rounded-2xl p-6 sm:p-8 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <h2 className="text-lg font-extrabold text-white flex items-center gap-2">
            <span className="w-1.5 h-5 bg-red-600 rounded-full" />
            <span>Daftar Chapter ({detail.chapters.length})</span>
          </h2>

          {/* Chapter Search */}
          <div className="relative">
            <input
              type="text"
              placeholder="Cari chapter... (misal: 10)"
              value={chapterSearch}
              onChange={(e) => setChapterSearch(e.target.value)}
              className="bg-[#121212] border border-white/10 text-slate-200 placeholder-slate-400 pl-9 pr-4 py-2.5 rounded-xl focus:outline-none focus:border-red-600 focus:ring-1 focus:ring-red-600 text-xs w-full sm:w-56 transition-all"
            />
            <Search className="absolute left-3 top-3 w-3.5 h-3.5 text-slate-400" />
          </div>
        </div>

        {/* Chapter Grid Table */}
        <div className="border border-white/5 rounded-xl overflow-hidden max-h-[500px] overflow-y-auto">
          {filteredChapters.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400">
              Chapter tidak ditemukan.
            </div>
          ) : (
            <div className="divide-y divide-white/5">
              {filteredChapters.map((ch, idx) => (
                <button
                  key={ch.slug}
                  onClick={() => onSelectChapter(ch.slug)}
                  className="w-full text-left p-3.5 hover:bg-white/5 flex items-center justify-between text-slate-200 hover:text-red-500 border-l-2 border-transparent hover:border-red-600 bg-black/20 group transition-all focus:outline-none"
                >
                  <div className="min-w-0 pr-4">
                    <span className="font-bold text-xs sm:text-sm group-hover:text-red-500 transition-colors">
                      {ch.name}
                    </span>
                  </div>
                  <div className="flex items-center gap-2.5 shrink-0">
                    <span className="text-[10px] text-slate-400 bg-[#121212] px-2.5 py-1 rounded-full group-hover:bg-white/5">
                      {ch.date}
                    </span>
                    <span className="bg-red-600 text-white font-bold px-2.5 py-0.5 rounded text-[10px] opacity-0 group-hover:opacity-100 transition-all">
                      BACA
                    </span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
