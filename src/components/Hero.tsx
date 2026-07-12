import React, { useEffect, useState } from "react";
import { Compass, BookOpen, Star, TrendingUp, Users } from "lucide-react";

interface HeroProps {
  onSelectManga: (slug: string) => void;
}

const FEATURED_LIST = [
  {
    title: "One Piece",
    slug: "one-piece",
    type: "Manga",
    banner: "https://gambar.mangaku.guru/uploads/manga/komik-one-piece-indo/manga_thumbnail-Komik-One-Piece.jpg?w=400",
    description: "Monkey D. Luffy menolak membiarkan siapapun menghalangi jalannya untuk menjadi Raja Bajak Laut. Bersama kru bajak laut Topi Jerami, Luffy mengarungi lautan Grand Line demi menemukan harta karun legendaris 'One Piece'.",
    rating: "9.8",
    status: "Ongoing",
    genres: ["Action", "Adventure", "Fantasy", "Shounen"],
    readers: 1450000
  },
  {
    title: "Magic Emperor",
    slug: "magic-emperor",
    type: "Manhua",
    banner: "https://gambar.mangaku.guru/uploads/manga/magic-emperor/manga_thumbnail-Komik-Magic-Emperor.jpg?w=400",
    description: "Kaisar iblis Zhuo Yifan dikhianati dan dibunuh oleh muridnya sendiri. Namun jiwanya bereinkarnasi dalam tubuh seorang pelayan rumah tangga rendahan bernama Zhuo Fan di keluarga Luo yang sedang hancur.",
    rating: "9.7",
    status: "Ongoing",
    genres: ["Action", "Fantasy", "Martial Arts", "Reincarnation"],
    readers: 1120000
  },
  {
    title: "Solo Leveling",
    slug: "solo-leveling-id",
    type: "Manhwa",
    banner: "https://gambar.mangaku.guru/uploads/manga/solo-leveling/manga_thumbnail-Solo-Leveling.jpg?w=400",
    description: "Di dunia di mana hunter harus bertarung melawan monster mematikan, Sung Jin-Woo adalah hunter terlemah dari seluruh dunia. Namun takdir memberinya program rahasia 'System' yang membuatnya bisa naik level tanpa batas.",
    rating: "9.9",
    status: "Completed",
    genres: ["Action", "Adventure", "Fantasy", "Overpowered"],
    readers: 1890000
  }
];

export default function Hero({ onSelectManga }: HeroProps) {
  const [featuredList, setFeaturedList] = useState<any[]>(FEATURED_LIST);
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    async function fetchRecommendations() {
      try {
        const res = await fetch("/api/manga/recommendations");
        const json = await res.json();
        if (json.success && json.data && json.data.length > 0) {
          setFeaturedList(json.data);
        }
      } catch (err) {
        console.error("Failed to fetch dynamic recommendations:", err);
      }
    }
    fetchRecommendations();
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % featuredList.length);
    }, 6000);
    return () => clearInterval(timer);
  }, [featuredList]);

  const current = featuredList[activeIndex] || FEATURED_LIST[0];

  return (
    <div className="relative bg-[#050505] border border-white/5 rounded-2xl overflow-hidden shadow-2xl mb-8 group" id="hero-carousel">
      {/* Background decoration */}
      <div className="absolute inset-0 bg-gradient-to-r from-black via-black/80 to-transparent z-10" />
      
      {/* Blurred image background */}
      <div className="absolute inset-0 overflow-hidden select-none pointer-events-none">
        <img
          src={current.banner}
          alt=""
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover scale-110 blur-xl opacity-20 transition-all duration-1000"
        />
      </div>

      {/* Hero Content */}
      <div className="relative z-20 max-w-4xl px-6 py-8 sm:px-12 sm:py-14 flex flex-col md:flex-row items-center gap-6 sm:gap-10">
        
        {/* Featured Card Poster */}
        <div 
          onClick={() => onSelectManga(current.slug)}
          className="w-36 h-52 sm:w-44 sm:h-64 object-cover rounded-xl shadow-2xl bg-[#121212] border border-white/10 flex-shrink-0 cursor-pointer overflow-hidden transform group-hover:scale-102 transition-all duration-300 relative group/poster"
        >
          <img
            src={current.banner}
            alt={current.title}
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover group-hover/poster:scale-105 transition-transform duration-500"
          />
          <div className="absolute inset-0 bg-black/45 flex items-center justify-center opacity-0 group-hover/poster:opacity-100 transition-opacity">
            <BookOpen className="w-8 h-8 text-red-600" />
          </div>
        </div>

        {/* Info detail */}
        <div className="flex-1 text-center md:text-left">
          <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 mb-3">
            <span className="bg-red-600 text-white font-black px-3 py-1 rounded-full text-[10px] tracking-[0.2em] uppercase flex items-center gap-1 shadow-lg shadow-red-600/35">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>REKOMENDASI TERATAS</span>
            </span>
            <span className="bg-white/5 text-gray-300 font-semibold px-2.5 py-0.5 rounded-full text-[10px] uppercase">
              {current.type}
            </span>
            <span className="bg-white/5 text-gray-300 font-semibold px-2.5 py-0.5 rounded-full text-[10px] uppercase">
              ★ {current.rating}
            </span>
            {current.readers && (
              <span className="bg-red-500/10 border border-red-500/10 text-red-400 font-bold px-2.5 py-0.5 rounded-full text-[10px] uppercase flex items-center gap-1 shadow-[0_0_8px_rgba(239,68,68,0.1)]">
                <Users className="w-3 h-3 text-red-400" />
                <span>{current.readers.toLocaleString("id-ID")} Pembaca</span>
              </span>
            )}
          </div>

          <h1 className="text-3xl sm:text-5xl font-black italic tracking-tighter text-white uppercase mb-3 leading-none">
            {current.title}
          </h1>

          <p className="text-gray-300 text-xs sm:text-sm leading-relaxed mb-4 max-w-xl line-clamp-3">
            {current.description}
          </p>

          <div className="flex flex-wrap items-center justify-center md:justify-start gap-1.5 mb-5">
            {current.genres.map((g: string) => (
              <span key={g} className="bg-white/5 border border-white/5 text-gray-400 px-2.5 py-1 rounded text-[11px] font-medium">
                {g}
              </span>
            ))}
          </div>

          <button
            onClick={() => onSelectManga(current.slug)}
            className="inline-flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white font-bold px-6 py-3 rounded-lg shadow-lg shadow-red-600/20 hover:shadow-red-600/30 transition-all text-sm focus:outline-none focus:ring-2 focus:ring-red-600"
          >
            <BookOpen className="w-4 h-4" />
            <span>Baca Sekarang</span>
          </button>
        </div>

      </div>

      {/* Slider Indicators */}
      <div className="absolute bottom-4 right-6 z-30 flex items-center gap-2">
        {featuredList.map((_, idx) => (
          <button
            key={idx}
            onClick={() => setActiveIndex(idx)}
            className={`h-2 rounded-full transition-all focus:outline-none ${activeIndex === idx ? "bg-red-600 w-6" : "bg-white/10 w-2 hover:bg-white/30"}`}
            aria-label={`Go to slide ${idx + 1}`}
          />
        ))}
      </div>
    </div>
  );
}
