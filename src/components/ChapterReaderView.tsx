import React, { useState, useEffect, useRef } from "react";
import { ArrowLeft, ChevronLeft, ChevronRight, Settings, ArrowUp, RefreshCw, AlertCircle, Eye, Play, Pause, X, Zap } from "lucide-react";
import { Chapter } from "../types";

interface ChapterReaderViewProps {
  mangaSlug: string;
  chapterSlug: string;
  onBackToManga: () => void;
  onSelectChapter: (newChapterSlug: string) => void;
  allChapters: Chapter[];
  controlsVisible: boolean;
  onToggleControls: () => void;
}

export default function ChapterReaderView({
  mangaSlug,
  chapterSlug,
  onBackToManga,
  onSelectChapter,
  allChapters,
  controlsVisible,
  onToggleControls,
}: ChapterReaderViewProps) {
  const [data, setData] = useState<{ title: string; images: { src: string; alt: string }[] } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [zoomWidth, setZoomWidth] = useState<"max-w-2xl" | "max-w-3xl" | "max-w-4xl" | "max-w-full">("max-w-3xl");
  const [showHint, setShowHint] = useState(true);

  // Auto-dismiss hint after 6 seconds
  useEffect(() => {
    if (!loading && data) {
      const timer = setTimeout(() => {
        setShowHint(false);
      }, 6000);
      return () => clearTimeout(timer);
    }
  }, [loading, data]);

  // Auto Scroll States
  const [autoScrollActive, setAutoScrollActive] = useState(false);
  const [isScrolling, setIsScrolling] = useState(false);
  const [scrollSpeed, setScrollSpeed] = useState(3); // Scale from 1 to 15

  const topRef = useRef<HTMLDivElement>(null);
  const requestRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number | null>(null);

  const scrollStep = (time: number) => {
    if (lastTimeRef.current !== null) {
      const isAtBottom = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 20;
      if (isAtBottom) {
        setIsScrolling(false);
        setAutoScrollActive(false);
        return;
      }
      const delta = (time - lastTimeRef.current) / 16.67;
      window.scrollBy(0, scrollSpeed * 0.25 * delta);
    }
    lastTimeRef.current = time;
    requestRef.current = requestAnimationFrame(scrollStep);
  };

  useEffect(() => {
    if (autoScrollActive && isScrolling) {
      lastTimeRef.current = null;
      requestRef.current = requestAnimationFrame(scrollStep);
    } else {
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
      }
    }
    return () => {
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
      }
    };
  }, [autoScrollActive, isScrolling, scrollSpeed]);

  // Fetch chapter data
  const fetchChapter = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/manga/chapter/${mangaSlug}/${chapterSlug}`);
      const json = await res.json();
      if (json.success && json.data) {
        setData(json.data);
        // Scroll to top
        window.scrollTo({ top: 0, behavior: "smooth" });
      } else {
        throw new Error(json.message || "Gagal memuat halaman bab");
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Terjadi kesalahan saat memuat halaman bab");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setAutoScrollActive(false);
    setIsScrolling(false);
    fetchChapter();
  }, [mangaSlug, chapterSlug]);

  // Show scroll to top button
  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 500);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Determine prev / next chapter slugs
  const currentIdx = allChapters.findIndex((c) => c.slug === chapterSlug);
  const prevChapter = currentIdx !== -1 && currentIdx < allChapters.length - 1 ? allChapters[currentIdx + 1] : null; // chapters are reverse sorted
  const nextChapter = currentIdx !== -1 && currentIdx > 0 ? allChapters[currentIdx - 1] : null;

  const handleScrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto py-24 text-center text-slate-400">
        <RefreshCw className="w-12 h-12 text-red-600 animate-spin mx-auto mb-4" />
        <p className="text-sm font-semibold">Memuat gambar komik...</p>
        <p className="text-xs text-slate-500 mt-2">Menghubungkan ke server scraper...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="bg-red-950/10 border border-red-900/30 rounded-2xl p-8 text-center max-w-xl mx-auto my-8">
        <AlertCircle className="w-12 h-12 text-red-600 mx-auto mb-4 animate-bounce" />
        <h3 className="text-lg font-bold text-slate-100 mb-2">Gagal Memuat Halaman</h3>
        <p className="text-sm text-red-400 mb-6">{error || "Data halaman bab kosong."}</p>
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={onBackToManga}
            className="bg-white/5 hover:bg-white/10 text-white px-5 py-2.5 rounded-xl text-sm transition-all focus:outline-none"
          >
            Info Detail
          </button>
          <button
            onClick={fetchChapter}
            className="bg-red-600 hover:bg-red-700 text-white font-bold px-5 py-2.5 rounded-xl text-sm transition-all shadow flex items-center gap-2 focus:outline-none shadow-red-600/20"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Muat Ulang</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050505] text-slate-100 pb-20" ref={topRef}>
      {/* Reader Control Header */}
      {controlsVisible && (
        <div className="sticky top-0 md:top-[64px] z-40 bg-black/85 backdrop-blur-md border-b border-white/5 shadow-lg py-3.5 px-4">
          <div className="max-w-5xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-3">
            
            {/* Back link & Title */}
            <div className="flex items-center gap-2 min-w-0">
              <button
                onClick={onBackToManga}
                className="p-1.5 rounded-lg hover:bg-white/5 text-slate-400 hover:text-white transition-colors focus:outline-none shrink-0"
                title="Kembali ke Info Detail"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div className="min-w-0">
                <h1 className="text-sm font-bold text-slate-200 truncate leading-snug">
                  {data.title.replace(" Bahasa Indonesia", "")}
                </h1>
              </div>
            </div>

            {/* Nav buttons & Chapter selector */}
            <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0">
              {/* Prev chapter button */}
              <button
                onClick={() => prevChapter && onSelectChapter(prevChapter.slug)}
                disabled={!prevChapter}
                className="flex items-center gap-1 bg-white/5 hover:bg-white/10 text-slate-200 hover:text-red-500 px-3 py-1.5 rounded-lg text-xs font-semibold disabled:opacity-20 disabled:pointer-events-none transition-colors focus:outline-none border border-white/5"
                title={prevChapter ? `Sebelumnya: ${prevChapter.name}` : "Sudah di Bab Pertama"}
              >
                <ChevronLeft className="w-4 h-4" />
                <span className="hidden sm:inline">Sebelumnya</span>
              </button>

              {/* Dropdown Selector */}
              {allChapters.length > 0 ? (
                <select
                  value={chapterSlug}
                  onChange={(e) => onSelectChapter(e.target.value)}
                  className="bg-[#121212] border border-white/10 text-slate-100 px-3 py-1.5 rounded-lg text-xs font-bold focus:outline-none focus:border-red-600 focus:ring-1 focus:ring-red-600 transition-all cursor-pointer"
                >
                  {allChapters.map((ch) => (
                    <option key={ch.slug} value={ch.slug}>
                      {ch.name}
                    </option>
                  ))}
                </select>
              ) : (
                <div className="bg-[#121212] border border-white/5 text-slate-500 px-3 py-1.5 rounded-lg text-xs font-semibold animate-pulse">
                  Memuat Bab...
                </div>
              )}

              {/* Next chapter button */}
              <button
                onClick={() => nextChapter && onSelectChapter(nextChapter.slug)}
                disabled={!nextChapter}
                className="flex items-center gap-1 bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 rounded-lg text-xs font-bold disabled:opacity-25 disabled:pointer-events-none transition-colors focus:outline-none border border-red-600/35 shadow-lg shadow-red-600/25"
                title={nextChapter ? `Selanjutnya: ${nextChapter.name}` : "Sudah di Bab Terbaru"}
              >
                <span className="hidden sm:inline">Selanjutnya</span>
                <ChevronRight className="w-4 h-4" />
              </button>

              {/* Zoom setting dropdown */}
              <div className="flex items-center gap-1.5 ml-2 border-l border-white/5 pl-3 hidden sm:flex">
                <Eye className="w-4 h-4 text-slate-500" />
                <select
                  value={zoomWidth}
                  onChange={(e) => setZoomWidth(e.target.value as any)}
                  className="bg-[#121212] border border-white/10 text-slate-300 px-2.5 py-1 rounded-md text-[11px] focus:outline-none cursor-pointer focus:border-red-600 focus:ring-red-600"
                  title="Lebar Gambar"
                >
                  <option value="max-w-2xl">Kecil</option>
                  <option value="max-w-3xl">Sedang</option>
                  <option value="max-w-4xl">Lebar</option>
                  <option value="max-w-full">Penuh</option>
                </select>
              </div>

              {/* Auto Scroll toggle */}
              <div className="flex items-center gap-1.5 ml-2 border-l border-white/5 pl-3">
                <button
                  onClick={() => {
                    const newActive = !autoScrollActive;
                    setAutoScrollActive(newActive);
                    setIsScrolling(newActive);
                  }}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all focus:outline-none border ${
                    autoScrollActive
                      ? "bg-red-600 border-red-600 text-white shadow-lg shadow-red-600/25 animate-pulse"
                      : "bg-[#121212] border-white/10 text-slate-300 hover:bg-white/5 hover:text-white"
                  }`}
                  title="Gulir Halaman Otomatis"
                >
                  <Zap className={`w-3.5 h-3.5 ${autoScrollActive ? "fill-white text-white" : "text-slate-400"}`} />
                  <span>Scroll</span>
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* Toggle Hint Alert Banner */}
      {showHint && (
        <div className="max-w-xl mx-auto px-4 mt-4">
          <div className="bg-red-950/20 border border-red-500/20 rounded-xl p-3 flex items-center justify-between text-xs text-slate-300 animate-fade-in shadow-lg">
            <span className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-red-500 shrink-0 animate-pulse" />
              <span><strong>Tips:</strong> Ketuk/klik area gambar komik untuk menyembunyikan atau menampilkan kembali menu baca.</span>
            </span>
            <button onClick={() => setShowHint(false)} className="text-slate-400 hover:text-white p-1 rounded-md hover:bg-white/5 transition-colors focus:outline-none">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Reader Page Image Stack */}
      <div className="mt-4 px-2 sm:px-4">
        {data.images.length === 0 ? (
          <div className="max-w-md mx-auto py-20 text-center bg-[#0a0a0a] border border-white/5 rounded-2xl p-6 shadow-xl my-8">
            <AlertCircle className="w-12 h-12 text-red-600 mx-auto mb-3 animate-pulse" />
            <p className="text-slate-300 text-sm font-semibold mb-2">Tidak ada halaman gambar dimuat.</p>
            <p className="text-slate-500 text-xs">Hubungi pengurus atau coba bab lain.</p>
          </div>
        ) : (
          <div 
            onClick={onToggleControls}
            className={`flex flex-col items-center justify-center bg-black/40 rounded-2xl p-2 sm:p-4 border border-white/5 mx-auto ${zoomWidth} transition-all duration-300 cursor-pointer`}
            title="Klik untuk sembunyikan/tampilkan menu"
          >
            {data.images.map((image, index) => (
              <div key={index} className="relative w-full text-center flex flex-col items-center mb-1 last:mb-0">
                {/* Image item with referrerPolicy to safely bypass standard proxy image checks */}
                <img
                  src={image.src}
                  alt={image.alt || `Halaman ${index + 1}`}
                  loading={index < 3 ? "eager" : "lazy"}
                  referrerPolicy="no-referrer"
                  className="w-full object-contain max-h-[160vh]"
                />
                {/* Visual Page Counter Accent */}
                <span className="absolute bottom-2 right-4 bg-black/60 text-slate-400 text-[10px] font-bold px-2 py-0.5 rounded-md opacity-30 select-none">
                  Hal {index + 1}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Reader Bottom Navigation block */}
      {controlsVisible && (
        <div className="max-w-md mx-auto px-4 mt-12 flex items-center justify-center gap-3">
          {prevChapter && (
            <button
              onClick={() => onSelectChapter(prevChapter.slug)}
              className="flex-1 flex items-center justify-center gap-1.5 bg-white/5 hover:bg-white/10 text-slate-200 border border-white/5 hover:border-red-500/35 py-3 rounded-xl text-xs font-bold transition-all focus:outline-none"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Bab {prevChapter.name.replace("Chapter ", "")}</span>
            </button>
          )}
          
          {nextChapter && (
            <button
              onClick={() => onSelectChapter(nextChapter.slug)}
              className="flex-1 flex items-center justify-center gap-1.5 bg-red-600 hover:bg-red-700 text-white py-3 rounded-xl text-xs font-extrabold transition-all shadow-md focus:outline-none shadow-red-600/25"
            >
              <span>Bab {nextChapter.name.replace("Chapter ", "")}</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          )}
        </div>
      )}

      {/* Floating Auto-Scroll Speed Adjuster widget */}
      {autoScrollActive && controlsVisible && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 sm:left-6 sm:translate-x-0 z-50 bg-[#0a0a0a]/90 backdrop-blur-md border border-white/10 px-3 py-1.5 rounded-full shadow-2xl flex items-center gap-2 text-slate-100 transition-all duration-300">
          <div className="flex items-center gap-1">
            <Zap className="w-3.5 h-3.5 fill-red-600 animate-pulse text-red-500 shrink-0" />
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider hidden xs:inline">Auto</span>
          </div>

          <div className="w-[1px] h-3 bg-white/10" />

          {/* Play / Pause Toggle Button */}
          <button
            onClick={() => setIsScrolling(!isScrolling)}
            className={`p-1.5 rounded-full transition-all focus:outline-none ${
              isScrolling
                ? "bg-red-600 text-white shadow-md shadow-red-600/30"
                : "bg-white/5 text-slate-300 hover:bg-white/10"
            }`}
            title={isScrolling ? "Jeda Gulir" : "Mulai Gulir"}
          >
            {isScrolling ? (
              <Pause className="w-3 h-3 fill-white text-white" />
            ) : (
              <Play className="w-3 h-3 fill-white text-white" />
            )}
          </button>

          <div className="flex items-center gap-1 bg-white/5 px-2 py-0.5 rounded-full border border-white/5">
            <button
              onClick={() => setScrollSpeed((prev) => Math.max(1, prev - 1))}
              className="text-xs text-slate-400 hover:text-white font-bold w-4 h-4 flex items-center justify-center rounded transition-colors"
              title="Kurangi Kecepatan"
            >
              -
            </button>
            <span className="text-[10px] text-slate-200 font-mono font-bold min-w-[20px] text-center">
              {scrollSpeed}x
            </span>
            <button
              onClick={() => setScrollSpeed((prev) => Math.min(15, prev + 1))}
              className="text-xs text-slate-400 hover:text-white font-bold w-4 h-4 flex items-center justify-center rounded transition-colors"
              title="Tambah Kecepatan"
            >
              +
            </button>
          </div>

          <div className="w-[1px] h-3 bg-white/10" />

          <button
            onClick={() => {
              setAutoScrollActive(false);
              setIsScrolling(false);
            }}
            className="text-slate-400 hover:text-white p-1 rounded-full hover:bg-white/10 transition-colors focus:outline-none"
            title="Tutup Panel"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Floating Scroll to Top button */}
      {showScrollTop && controlsVisible && (
        <button
          onClick={handleScrollToTop}
          className="fixed bottom-6 right-6 p-3 bg-red-600 hover:bg-red-700 text-white rounded-full shadow-lg hover:shadow-red-600/30 transition-all z-50 animate-bounce focus:outline-none"
          title="Scroll ke Atas"
          id="scroll-to-top"
        >
          <ArrowUp className="w-5 h-5 stroke-[2.5]" />
        </button>
      )}
    </div>
  );
}
