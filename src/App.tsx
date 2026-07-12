import React, { useState, useEffect } from "react";
import Header from "./components/Header";
import Hero from "./components/Hero";
import MangaCard from "./components/MangaCard";
import MangaGrid from "./components/MangaGrid";
import MangaDetailView from "./components/MangaDetailView";
import ChapterReaderView from "./components/ChapterReaderView";
import { Manga, BookmarkItem, HistoryItem, Chapter } from "./types";
import { Search, Compass, RefreshCw, Star, ArrowLeft, RefreshCcw, Heart, ShieldCheck } from "lucide-react";

export default function App() {
  // Welcome Popup State
  const [showWelcome, setShowWelcome] = useState(false);

  useEffect(() => {
    try {
      const dismissed = localStorage.getItem("readkomik_welcome_dismissed");
      if (!dismissed) {
        setShowWelcome(true);
      }
    } catch (e) {
      console.error("Failed to read welcome dismiss status:", e);
    }
  }, []);

  const handleDismissWelcome = () => {
    setShowWelcome(false);
    try {
      localStorage.setItem("readkomik_welcome_dismissed", "true");
    } catch (e) {
      console.error("Failed to write welcome dismiss status:", e);
    }
  };

  // Navigation states
  const [currentView, setCurrentView] = useState<"home" | "detail" | "reader">("home");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedMangaSlug, setSelectedMangaSlug] = useState("");
  const [selectedChapterSlug, setSelectedChapterSlug] = useState("");
  const [cachedMangaSlug, setCachedMangaSlug] = useState("");
  const [cachedChapters, setCachedChapters] = useState<Chapter[]>([]);

  // Reader Controls Visibility State
  const [readerControlsVisible, setReaderControlsVisible] = useState(true);

  // Genre Filtering
  const [selectedGenre, setSelectedGenre] = useState("");

  // Main Page Lists
  const [mangaList, setMangaList] = useState<Manga[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Search Page List
  const [searchList, setSearchList] = useState<Manga[]>([]);
  const [loadingSearch, setLoadingSearch] = useState(false);
  const [errorSearch, setErrorSearch] = useState<string | null>(null);

  // Bookmarks / History persistence
  const [bookmarks, setBookmarks] = useState<BookmarkItem[]>([]);
  const [history, setHistory] = useState<HistoryItem[]>([]);

  // Initial local storage sync
  useEffect(() => {
    try {
      const savedBookmarks = localStorage.getItem("komik_bookmarks");
      if (savedBookmarks) {
        setBookmarks(JSON.parse(savedBookmarks));
      }
      const savedHistory = localStorage.getItem("komik_history");
      if (savedHistory) {
        setHistory(JSON.parse(savedHistory));
      }
    } catch (e) {
      console.error("Failed to load local storage state:", e);
    }
  }, []);

  // Sync bookmarks to localStorage
  const handleToggleBookmark = (item: BookmarkItem) => {
    let nextBookmarks = [];
    const index = bookmarks.findIndex((b) => b.slug === item.slug);
    if (index !== -1) {
      nextBookmarks = bookmarks.filter((b) => b.slug !== item.slug);
    } else {
      nextBookmarks = [item, ...bookmarks];
    }
    setBookmarks(nextBookmarks);
    localStorage.setItem("komik_bookmarks", JSON.stringify(nextBookmarks));
  };

  const handleRemoveBookmark = (slug: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const nextBookmarks = bookmarks.filter((b) => b.slug !== slug);
    setBookmarks(nextBookmarks);
    localStorage.setItem("komik_bookmarks", JSON.stringify(nextBookmarks));
  };

  // Sync history
  const handleAddHistory = (item: Omit<HistoryItem, "timestamp">) => {
    const nextHistory = [
      { ...item, timestamp: Date.now() },
      ...history.filter((h) => !(h.slug === item.slug && h.chapterSlug === item.chapterSlug))
    ].slice(0, 30); // limit to 30 latest read chapters
    
    setHistory(nextHistory);
    localStorage.setItem("komik_history", JSON.stringify(nextHistory));
  };

  const handleClearHistory = () => {
    setHistory([]);
    localStorage.removeItem("komik_history");
  };

  // Fetch paginated latest updates
  const fetchLatestUpdates = async (targetPage: number, genreSlug?: string) => {
    setLoading(true);
    setError(null);
    try {
      const activeGenre = genreSlug !== undefined ? genreSlug : selectedGenre;
      const url = activeGenre 
        ? `/api/manga?page=${targetPage}&genre=${activeGenre}` 
        : `/api/manga?page=${targetPage}`;
        
      const res = await fetch(url);
      const json = await res.json();
      if (json.success && json.data) {
        setMangaList(json.data);
        setPage(json.page);
        setTotalPages(json.totalPages);
      } else {
        throw new Error(json.message || "Gagal memuat galeri terbaru");
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Koneksi terputus atau server scrap bermasalah.");
    } finally {
      setLoading(false);
    }
  };

  // Trigger page load
  useEffect(() => {
    if (currentView === "home" && !searchQuery) {
      fetchLatestUpdates(page, selectedGenre);
    }
  }, [page, currentView, searchQuery, selectedGenre]);

  // Handle Search Request
  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    setSelectedGenre(""); // clear genre when searching
    setCurrentView("home");
    setLoadingSearch(true);
    setErrorSearch(null);
    try {
      const res = await fetch(`/api/manga/search?q=${encodeURIComponent(query)}`);
      const json = await res.json();
      if (json.success && json.data) {
        setSearchList(json.data);
      } else {
        throw new Error(json.message || "Gagal mencari komik");
      }
    } catch (err: any) {
      console.error(err);
      setErrorSearch(err.message || "Terjadi kesalahan saat mencari komik.");
    } finally {
      setLoadingSearch(false);
    }
  };

  // Quick navigation handlers
  const handleNavigateHome = () => {
    setSearchQuery("");
    setSearchList([]);
    setSelectedGenre("");
    setPage(1);
    setCurrentView("home");
  };

  const handleSelectManga = (slug: string) => {
    setSelectedMangaSlug(slug);
    setCurrentView("detail");
    // Scroll to top
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Accessing a chapter directly (from history or detail view)
  const handleSelectChapter = async (mangaSlug: string, chapterSlug: string) => {
    setSelectedMangaSlug(mangaSlug);
    setSelectedChapterSlug(chapterSlug);
    setReaderControlsVisible(true);
    
    // Clear old cache immediately if we are opening a different manga
    if (cachedMangaSlug !== mangaSlug) {
      setCachedChapters([]);
      setCachedMangaSlug(""); // force mismatch so it passes [] to ChapterReaderView
    }
    
    setCurrentView("reader");

    // Fetch the detail pages to cache all chapters if they aren't already cached
    // This supports previous/next navigation perfectly!
    try {
      const res = await fetch(`/api/manga/detail/${mangaSlug}`);
      const json = await res.json();
      if (json.success && json.data) {
        setCachedChapters(json.data.chapters);
        setCachedMangaSlug(mangaSlug);
        
        // Save to History!
        const chapterObj = json.data.chapters.find((c: Chapter) => c.slug === chapterSlug);
        handleAddHistory({
          slug: mangaSlug,
          title: json.data.title,
          thumb: json.data.thumb,
          chapterSlug,
          chapterName: chapterObj ? chapterObj.name : chapterSlug.replace(/-/g, " ").toUpperCase()
        });
      }
    } catch (e) {
      console.error("Failed to load list of chapters for navigation cache:", e);
    }
  };

  // Navigating chapter within the reader view
  const handleReaderSelectChapter = (chapterSlug: string) => {
    setSelectedChapterSlug(chapterSlug);
    setReaderControlsVisible(true);
    // Find name from cache
    const cachedCh = cachedChapters.find((c) => c.slug === chapterSlug);
    // Refresh history
    const savedBookmarkMatch = bookmarks.find((b) => b.slug === selectedMangaSlug);
    const foundManga = mangaList.find((m) => m.slug === selectedMangaSlug) || searchList.find((m) => m.slug === selectedMangaSlug);
    const mangaTitle = savedBookmarkMatch ? savedBookmarkMatch.title : (foundManga ? foundManga.title : selectedMangaSlug.replace(/-/g, " "));
    const mangaThumb = savedBookmarkMatch ? savedBookmarkMatch.thumb : (foundManga ? foundManga.thumb : "");
    
    handleAddHistory({
      slug: selectedMangaSlug,
      title: mangaTitle,
      thumb: mangaThumb,
      chapterSlug,
      chapterName: cachedCh ? cachedCh.name : chapterSlug.replace(/-/g, " ").toUpperCase()
    });
  };

  return (
    <div className="min-h-screen bg-[#050505] text-slate-100 flex flex-col font-sans select-none antialiased">
      {/* Header - Hidden in Reader view if controls are toggled off */}
      {!(currentView === "reader" && !readerControlsVisible) && (
        <Header
          onSearch={handleSearch}
          onNavigateHome={handleNavigateHome}
          onSelectManga={handleSelectManga}
          onSelectChapter={handleSelectChapter}
          bookmarks={bookmarks}
          history={history}
          onRemoveBookmark={handleRemoveBookmark}
          onClearHistory={handleClearHistory}
          currentView={currentView}
        />
      )}

      {/* Main Container */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 py-6">
        {currentView === "home" && (
          <>
            {searchQuery ? (
              // Search Results Page
              <div>
                <button
                  onClick={handleNavigateHome}
                  className="inline-flex items-center gap-1 text-slate-400 hover:text-red-500 font-semibold mb-6 focus:outline-none transition-colors group"
                >
                  <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                  <span>Kembali ke Beranda</span>
                </button>

                <h2 className="text-xl font-extrabold tracking-tight text-white flex items-center gap-2 mb-6">
                  <span className="w-1.5 h-6 bg-red-600 rounded-full shadow-[0_0_8px_rgba(220,38,38,0.5)]" />
                  <span>Hasil Pencarian: "{searchQuery}"</span>
                </h2>

                {loadingSearch ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 sm:gap-6">
                    {Array.from({ length: 6 }).map((_, idx) => (
                      <div key={idx} className="bg-[#121212] border border-white/5 rounded-xl overflow-hidden shadow h-80 flex flex-col animate-pulse">
                        <div className="bg-white/5 aspect-[3/4] w-full" />
                        <div className="p-3 flex-1 flex flex-col justify-between">
                          <div className="bg-white/5 h-4 rounded w-5/6 mb-2" />
                          <div className="bg-white/5 h-3 rounded w-1/2" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : errorSearch ? (
                  <div className="text-center py-12 text-red-400">
                    Gagal memuat hasil pencarian: {errorSearch}
                  </div>
                ) : searchList.length === 0 ? (
                  <div className="bg-[#0a0a0a] border border-white/5 rounded-2xl p-8 text-center max-w-lg mx-auto">
                    <Search className="w-12 h-12 text-slate-500 mx-auto mb-4" />
                    <h3 className="text-base font-bold text-slate-200 mb-1">Manga tidak ditemukan</h3>
                    <p className="text-xs text-slate-400 mb-4">Pastikan ejaan benar atau cari judul alternatif lain.</p>
                    <button
                      onClick={handleNavigateHome}
                      className="bg-red-600 hover:bg-red-700 text-white font-bold px-5 py-2.5 rounded-lg text-xs transition-colors"
                    >
                      Kembali ke Beranda
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 sm:gap-6">
                    {searchList.map((manga) => (
                      <MangaCard key={manga.slug} manga={manga} onSelect={handleSelectManga} />
                    ))}
                  </div>
                )}
              </div>
            ) : (
              // Default Landing Page
              <>
                {/* Hero Featured Slider */}
                <Hero onSelectManga={handleSelectManga} />

                {/* Paginated grid */}
                <MangaGrid
                  mangaList={mangaList}
                  loading={loading}
                  error={error}
                  page={page}
                  totalPages={totalPages}
                  onPageChange={(p) => setPage(p)}
                  onSelectManga={handleSelectManga}
                  onRetry={() => fetchLatestUpdates(page, selectedGenre)}
                  selectedGenre={selectedGenre}
                  onGenreChange={(genreSlug) => {
                    setSelectedGenre(genreSlug);
                    setPage(1);
                  }}
                />
              </>
            )}
          </>
        )}

        {/* Manga Detail View */}
        {currentView === "detail" && (
          <MangaDetailView
            slug={selectedMangaSlug}
            onBack={handleNavigateHome}
            onSelectChapter={(chapterSlug) => handleSelectChapter(selectedMangaSlug, chapterSlug)}
            bookmarks={bookmarks}
            onToggleBookmark={handleToggleBookmark}
          />
        )}

        {/* Chapter Reader View */}
        {currentView === "reader" && (
          <ChapterReaderView
            mangaSlug={selectedMangaSlug}
            chapterSlug={selectedChapterSlug}
            onBackToManga={() => setCurrentView("detail")}
            onSelectChapter={handleReaderSelectChapter}
            allChapters={cachedMangaSlug === selectedMangaSlug ? cachedChapters : []}
            controlsVisible={readerControlsVisible}
            onToggleControls={() => setReaderControlsVisible(!readerControlsVisible)}
          />
        )}
      </main>

      {/* Footer */}
      {currentView !== "reader" && (
        <footer className="bg-[#0a0a0a] border-t border-white/5 py-6 text-center text-xs text-slate-500 mt-12 shrink-0">
          <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p>© 2026 ReadKomik Reader. Hak Cipta Dilindungi.</p>
            <p className="flex items-center gap-1.5 justify-center">
              <span>Dibuat dengan ❤️ untuk pencinta komik Indonesia</span>
            </p>
          </div>
        </footer>
      )}
      {/* Welcome & No-Ads Popup Modal */}
      {showWelcome && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in" id="welcome-modal">
          <div className="bg-[#0b0b0b] border border-white/10 rounded-2xl max-w-md w-full overflow-hidden shadow-2xl shadow-red-600/10 transform transition-all scale-100 p-6 sm:p-8 flex flex-col items-center text-center">
            
            {/* Top decorative gradient line */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-red-600 via-orange-500 to-red-600" />
            
            {/* Logo Circle */}
            <div className="w-14 h-14 rounded-full bg-red-600/10 border border-red-500/20 flex items-center justify-center mb-5 animate-pulse">
              <span className="text-xl font-black italic text-red-500">R</span>
            </div>
            
            <h3 className="text-xl sm:text-2xl font-black italic text-white uppercase tracking-tight mb-2">
              Selamat Datang!
            </h3>
            
            <p className="text-slate-400 text-xs sm:text-sm leading-relaxed mb-6">
              Terima kasih telah mengunjungi <span className="text-red-500 font-bold">ReadKomik</span>, platform baca manga, manhwa, dan manhua tercepat dengan antarmuka premium dan modern.
            </p>
            
            {/* Cards for creator and ad info */}
            <div className="w-full space-y-3 mb-6">
              {/* Creator Card */}
              <div className="flex items-start gap-3 p-3.5 rounded-xl bg-white/5 border border-white/5 text-left">
                <div className="bg-red-500/10 p-2 rounded-lg text-red-400 mt-0.5 shrink-0">
                  <Heart className="w-4 h-4 fill-red-400" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider">Pembuat Platform</h4>
                  <p className="text-xs text-slate-300">
                    Dikembangkan oleh <span className="text-red-400 font-semibold">Muhammad Fajar Pradita</span> dengan dedikasi penuh untuk menghadirkan kenyamanan membaca terbaik bagi seluruh komik lovers Indonesia.
                  </p>
                </div>
              </div>

              {/* No Ads Card */}
              <div className="flex items-start gap-3 p-3.5 rounded-xl bg-white/5 border border-white/5 text-left">
                <div className="bg-green-500/10 p-2 rounded-lg text-green-400 mt-0.5 shrink-0">
                  <ShieldCheck className="w-4 h-4 text-green-400" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider">100% BEBAS IKLAN & GRATIS</h4>
                  <p className="text-xs text-slate-300">
                    Kami berkomitmen penuh untuk <span className="text-green-400 font-semibold">TIDAK menampilkan iklan pop-up atau banner yang mengganggu</span>. Nikmati pengalaman membaca komik tanpa hambatan secara gratis selamanya!
                    </p>
                  </div>
                </div>
              </div>

              {/* Dismiss Button */}
              <button
                onClick={handleDismissWelcome}
                className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-6 rounded-xl shadow-lg shadow-red-600/25 transition-all text-sm active:scale-[0.98] cursor-pointer"
              >
                Mulai Membaca Sekarang
              </button>
            </div>
          </div>
      )}
    </div>
  );
}
