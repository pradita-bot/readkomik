export interface Manga {
  title: string;
  slug: string;
  thumb: string;
  chapter: string;
  type: string;
  time?: string;
}

export interface Chapter {
  name: string;
  slug: string;
  date: string;
  href: string;
}

export interface MangaDetail {
  title: string;
  altTitle?: string;
  type: string;
  status: string;
  thumb: string;
  author: string;
  publishedText?: string;
  genres: string[];
  synopsis: string;
  chapters: Chapter[];
}

export interface HistoryItem {
  slug: string;
  title: string;
  thumb: string;
  chapterSlug: string;
  chapterName: string;
  timestamp: number;
}

export interface BookmarkItem {
  slug: string;
  title: string;
  thumb: string;
  type: string;
  addedAt: number;
}
