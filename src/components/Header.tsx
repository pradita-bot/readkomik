import React, { useState, useEffect, useRef } from "react";
import { Search, BookMarked, History, Compass, ArrowLeft, Loader, Star, Trash2 } from "lucide-react";
import { BookmarkItem, HistoryItem, Manga } from "../types";

interface HeaderProps {
  onSearch: (query: string) => void;
  onNavigateHome: () => void;
  onSelectManga: (slug: string) => void;
  onSelectChapter: (mangaSlug: string, chapterSlug: string) => void;
  bookmarks: BookmarkItem[];
  history: HistoryItem[];
  onRemoveBookmark: (slug: string, e: React.MouseEvent) => void;
  onClearHistory: () => void;
  currentView: string;
}

export default function Header({
  onSearch,
  onNavigateHome,
  onSelectManga,
  onSelectChapter,
  bookmarks,
  history,
  onRemoveBookmark,
  onClearHistory,
  currentView
}: HeaderProps) {
  const [searchVal, setSearchVal] = useState("");
  const [showBookmarks, setShowBookmarks] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [suggestions, setSuggestions] = useState<Manga[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  
  const suggestRef = useRef<HTMLDivElement>(null);

  // Handle Search Submit
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchVal.trim()) {
      onSearch(searchVal);
      setShowSuggestions(false);
    }
  };

  // Live suggestions fetch
  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (searchVal.trim().length >= 2) {
        setLoadingSuggestions(true);
        setShowSuggestions(true);
        try {
          const res = await fetch(`/api/manga/search?q=${encodeURIComponent(searchVal)}`);
          const json = await res.json();
          if (json.success && json.data) {
            setSuggestions(json.data.slice(0, 5));
          }
        } catch (error) {
          console.error("Error getting search suggestions:", error);
        } finally {
          setLoadingSuggestions(false);
        }
      } else {
        setSuggestions([]);
        setShowSuggestions(false);
      }
    }, 400);

    return () => clearTimeout(delayDebounceFn);
  }, [searchVal]);

  // Click outside suggestions close
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (suggestRef.current && !suggestRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <header className="sticky top-0 z-50 bg-black/40 backdrop-blur-md border-b border-white/5 text-slate-100 shadow-md">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
        
        {/* Brand / Logo */}
        <button
          onClick={onNavigateHome}
          className="flex items-center gap-3 text-xl font-bold tracking-tight hover:opacity-95 transition-all focus:outline-none"
          id="logo-button"
        >
          <div className="w-10 h-10 bg-red-600 rounded flex items-center justify-center shadow-[0_0_15px_rgba(220,38,38,0.5)]">
            <span className="font-black text-xl italic text-white">R</span>
          </div>
          <span className="text-2xl font-bold tracking-tighter uppercase italic text-white">READ<span className="text-red-600 underline underline-offset-4 decoration-2">KOMIK</span></span>
        </button>

        {/* Search Input with Suggestions */}
        <form onSubmit={handleSearchSubmit} className="flex-1 max-w-md relative" ref={suggestRef}>
          <div className="relative">
            <input
              type="text"
              placeholder="Cari manga, manhwa, manhua..."
              value={searchVal}
              onChange={(e) => setSearchVal(e.target.value)}
              onFocus={() => {
                if (searchVal.trim().length >= 2) setShowSuggestions(true);
              }}
              className="w-full bg-[#121212] border border-white/10 text-white placeholder-slate-400 pl-10 pr-4 py-2 rounded-full focus:outline-none focus:border-red-600 focus:ring-1 focus:ring-red-600 text-sm transition-all"
              id="search-input"
            />
            <Search className="absolute left-3.5 top-2.5 w-4.5 h-4.5 text-slate-400" />
            
            {/* Loading / Clear Indicator */}
            {loadingSuggestions && (
              <Loader className="absolute right-3.5 top-2.5 w-4.5 h-4.5 text-red-600 animate-spin" />
            )}
          </div>

          {/* Suggestions Dropdown */}
          {showSuggestions && (suggestions.length > 0 || loadingSuggestions) && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-[#121212] border border-white/10 rounded-xl shadow-2xl overflow-hidden z-50">
              {loadingSuggestions && suggestions.length === 0 ? (
                <div className="p-4 text-center text-xs text-slate-400">Mencari...</div>
              ) : (
                <div className="py-1">
                  {suggestions.map((manga) => (
                    <button
                      key={manga.slug}
                      onClick={() => {
                        onSelectManga(manga.slug);
                        setSearchVal("");
                        setShowSuggestions(false);
                      }}
                      className="w-full text-left px-4 py-2.5 hover:bg-[#1a1a1a] flex items-center gap-3 border-b border-white/5 last:border-0 transition-colors"
                    >
                      <img
                        src={manga.thumb}
                        alt={manga.title}
                        referrerPolicy="no-referrer"
                        className="w-9 h-12 object-cover rounded shadow bg-[#1a1a1a] flex-shrink-0"
                      />
                      <div className="min-w-0">
                        <div className="text-xs font-semibold text-red-600 truncate">{manga.type}</div>
                        <div className="text-sm text-slate-100 font-medium truncate">{manga.title}</div>
                        <div className="text-xs text-slate-400 truncate">{manga.chapter}</div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </form>

        {/* Navigation Actions */}
        <div className="flex items-center gap-1 sm:gap-2">
          
          {/* Bookmark Button */}
          <div className="relative">
            <button
              onClick={() => {
                setShowBookmarks(!showBookmarks);
                setShowHistory(false);
              }}
              className={`p-2 rounded-lg text-slate-300 hover:text-red-500 hover:bg-white/5 transition-colors focus:outline-none relative ${showBookmarks ? "text-red-500 bg-white/5" : ""}`}
              id="bookmark-btn"
              title="Favorit"
            >
              <BookMarked className="w-5 h-5" />
              {bookmarks.length > 0 && (
                <span className="absolute top-0 right-0 bg-red-600 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center border-2 border-slate-900">
                  {bookmarks.length}
                </span>
              )}
            </button>

            {/* Bookmarks Dropdown */}
            {showBookmarks && (
              <div className="absolute right-0 mt-2 w-72 sm:w-80 bg-[#121212] border border-white/10 rounded-xl shadow-2xl overflow-hidden z-50">
                <div className="p-3 border-b border-white/10 flex items-center justify-between">
                  <h3 className="font-bold text-sm text-red-600 flex items-center gap-1.5">
                    <Star className="w-4 h-4 fill-red-600 text-red-600" />
                    <span>Komik Favorit</span>
                  </h3>
                  <span className="text-[11px] text-slate-400 bg-[#1a1a1a] px-2 py-0.5 rounded-full">
                    {bookmarks.length} judul
                  </span>
                </div>
                <div className="max-h-96 overflow-y-auto divide-y divide-white/5">
                  {bookmarks.length === 0 ? (
                    <div className="p-6 text-center text-xs text-slate-400">
                      Belum ada komik favorit. Klik ikon bintang di halaman detail komik!
                    </div>
                  ) : (
                    bookmarks.map((item) => (
                      <div
                        key={item.slug}
                        className="p-2.5 hover:bg-[#1a1a1a] flex gap-3 group relative transition-colors"
                      >
                        <button
                          onClick={() => {
                            onSelectManga(item.slug);
                            setShowBookmarks(false);
                          }}
                          className="flex gap-3 text-left flex-1 min-w-0"
                        >
                          <img
                            src={item.thumb}
                            alt={item.title}
                            referrerPolicy="no-referrer"
                            className="w-10 h-14 object-cover rounded shadow bg-[#1a1a1a] flex-shrink-0"
                          />
                          <div className="min-w-0 pr-6">
                            <span className="inline-block text-[9px] font-bold text-white bg-red-600 px-1 py-0.5 rounded mb-1">
                              {item.type}
                            </span>
                            <h4 className="text-xs text-slate-100 font-semibold truncate group-hover:text-red-500 transition-colors">
                              {item.title}
                            </h4>
                            <p className="text-[10px] text-slate-400 mt-1">
                              Ditambahkan: {new Date(item.addedAt).toLocaleDateString("id-ID")}
                            </p>
                          </div>
                        </button>
                        <button
                          onClick={(e) => onRemoveBookmark(item.slug, e)}
                          className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-slate-500 hover:text-red-500 hover:bg-white/10 rounded transition-all focus:outline-none"
                          title="Hapus"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* History Button */}
          <div className="relative">
            <button
              onClick={() => {
                setShowHistory(!showHistory);
                setShowBookmarks(false);
              }}
              className={`p-2 rounded-lg text-slate-300 hover:text-red-500 hover:bg-white/5 transition-colors focus:outline-none ${showHistory ? "text-red-500 bg-white/5" : ""}`}
              id="history-btn"
              title="Riwayat Baca"
            >
              <History className="w-5 h-5" />
            </button>

            {/* History Dropdown */}
            {showHistory && (
              <div className="absolute right-0 mt-2 w-72 sm:w-80 bg-[#121212] border border-white/10 rounded-xl shadow-2xl overflow-hidden z-50">
                <div className="p-3 border-b border-white/10 flex items-center justify-between">
                  <h3 className="font-bold text-sm text-red-600 flex items-center gap-1.5">
                    <History className="w-4 h-4 text-red-600" />
                    <span>Riwayat Baca</span>
                  </h3>
                  {history.length > 0 && (
                    <button
                      onClick={() => {
                        if (confirm("Hapus semua riwayat membaca?")) {
                          onClearHistory();
                        }
                      }}
                      className="text-[10px] text-red-400 hover:text-red-300 transition-colors flex items-center gap-1"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>Hapus Semua</span>
                    </button>
                  )}
                </div>
                <div className="max-h-96 overflow-y-auto divide-y divide-white/5">
                  {history.length === 0 ? (
                    <div className="p-6 text-center text-xs text-slate-400">
                      Belum ada riwayat membaca komik.
                    </div>
                  ) : (
                    history.map((item) => (
                      <button
                        key={`${item.slug}-${item.chapterSlug}`}
                        onClick={() => {
                          onSelectChapter(item.slug, item.chapterSlug);
                          setShowHistory(false);
                        }}
                        className="w-full p-2.5 hover:bg-[#1a1a1a] flex gap-3 text-left transition-colors"
                      >
                        <img
                          src={item.thumb}
                          alt={item.title}
                          referrerPolicy="no-referrer"
                          className="w-10 h-14 object-cover rounded shadow bg-[#1a1a1a] flex-shrink-0"
                        />
                        <div className="min-w-0 flex-1">
                          <h4 className="text-xs text-slate-100 font-semibold truncate hover:text-red-500 transition-colors">
                            {item.title}
                          </h4>
                          <p className="text-[11px] text-red-500 font-medium mt-1 truncate">
                            Terakhir dibaca: {item.chapterName}
                          </p>
                          <p className="text-[9px] text-slate-400 mt-0.5">
                            {new Date(item.timestamp).toLocaleDateString("id-ID")} {new Date(item.timestamp).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}
                          </p>
                        </div>
                      </button>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Back Home button (if not on home) */}
          {currentView !== "home" && (
            <button
              onClick={onNavigateHome}
              className="p-2 rounded-lg text-slate-300 hover:text-red-500 hover:bg-white/5 transition-colors focus:outline-none"
              title="Kembali ke Beranda"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}

        </div>
      </div>
    </header>
  );
}
