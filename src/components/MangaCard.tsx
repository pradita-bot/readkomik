import React from "react";
import { Manga } from "../types";
import { BookOpen, Clock, Zap } from "lucide-react";

interface MangaCardProps {
  key?: string;
  manga: Manga;
  onSelect: (slug: string) => void;
}

export default function MangaCard({ manga, onSelect }: MangaCardProps) {
  // Determine badge styling based on comic type
  const getTypeBadgeStyles = (type: string) => {
    const cleanType = type.toLowerCase();
    if (cleanType.includes("manhwa")) {
      return "bg-sky-500 text-slate-900"; // Korean
    }
    if (cleanType.includes("manhua")) {
      return "bg-emerald-500 text-slate-900"; // Chinese
    }
    return "bg-red-600 text-white"; // Japanese Manga
  };

  return (
    <div
      onClick={() => onSelect(manga.slug)}
      className="group bg-[#121212] rounded-xl border border-white/5 hover:border-red-600/50 shadow-lg hover:shadow-red-600/5 overflow-hidden cursor-pointer transition-all duration-300 transform hover:-translate-y-1.5 flex flex-col h-full"
      id={`manga-card-${manga.slug}`}
    >
      {/* Thumbnail Container */}
      <div className="relative aspect-[3/4] overflow-hidden bg-slate-900">
        <img
          src={manga.thumb}
          alt={manga.title}
          loading="lazy"
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        
        {/* Type Badge */}
        <span className={`absolute top-2 left-2 px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider shadow-md ${getTypeBadgeStyles(manga.type)}`}>
          {manga.type}
        </span>

        {/* Floating Chapter overlay */}
        {manga.chapter && (
          <div className="absolute bottom-2 left-2 right-2 bg-[#050505]/85 backdrop-blur-sm border border-white/10 px-2.5 py-1 rounded-md flex items-center justify-between text-[11px] text-red-500 font-semibold shadow-md">
            <span className="flex items-center gap-1">
              <Zap className="w-3.5 h-3.5 fill-red-600 text-red-600 animate-pulse" />
              <span>{manga.chapter}</span>
            </span>
          </div>
        )}
      </div>

      {/* Content Container */}
      <div className="p-3.5 flex flex-col flex-1 min-w-0">
        {/* Title */}
        <h3 className="font-bold text-sm text-slate-100 group-hover:text-red-500 transition-colors line-clamp-2 leading-snug flex-1">
          {manga.title}
        </h3>
        
        {/* Extra Info */}
        {manga.time && (
          <div className="mt-2.5 pt-2 border-t border-white/5 flex items-center justify-between text-[11px] text-slate-400">
            <span className="flex items-center gap-1 truncate max-w-[120px]">
              <Clock className="w-3 h-3 text-slate-500 shrink-0" />
              <span className="truncate">{manga.time}</span>
            </span>
            <span className="text-[10px] text-slate-500 flex items-center gap-0.5 font-medium hover:text-red-500 transition-colors">
              <BookOpen className="w-3 h-3" />
              <span>Baca</span>
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
