import express from "express";
import axios from "axios";
import * as cheerio from "cheerio";

const app = express();
app.use(express.json());

// Set a common headers agent to bypass basic blocks
const AXIOS_HEADERS = {
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8",
  "Accept-Language": "en-US,en;q=0.9,id;q=0.8",
};

// Helper function to extract a clean slug from an absolute or relative href
function extractSlug(href: string): string {
  if (!href) return "";
  let clean = href.trim();
  if (clean.includes("mangaku.guru")) {
    const parts = clean.split("mangaku.guru");
    clean = parts[parts.length - 1] || "";
  }
  // Remove /komik/ prefix, leading slash, and trailing slash
  clean = clean.replace(/^\/komik\//, "").replace(/^\//, "").replace(/\/$/, "");
  return clean;
}

// API Route: Get popular genres
app.get("/api/genres", (req, res) => {
  const popularGenres = [
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
  res.setHeader("Cache-Control", "s-maxage=3600, stale-while-revalidate=600");
  res.json({ success: true, data: popularGenres });
});

// Cache store for 1-hour scraping results
const cacheStore: Record<string, { timestamp: number; data: any }> = {};
const CACHE_DURATION = 60 * 60 * 1000; // 1 hour in ms

function getCachedData(key: string): any | null {
  const cached = cacheStore[key];
  if (cached && (Date.now() - cached.timestamp < CACHE_DURATION)) {
    console.log(`[Cache Hit] Serving from cache for key: ${key}`);
    return cached.data;
  }
  return null;
}

function setCachedData(key: string, data: any) {
  cacheStore[key] = {
    timestamp: Date.now(),
    data,
  };
  console.log(`[Cache Set] Cached data for key: ${key}`);
}

// Pool of popular manga for recommendations
const POPULAR_POOL = [
  {
    title: "One Piece",
    slug: "one-piece",
    type: "Manga",
    banner: "https://gambar.mangaku.guru/uploads/manga/komik-one-piece-indo/manga_thumbnail-Komik-One-Piece.jpg?w=400",
    description: "Monkey D. Luffy menolak membiarkan siapapun menghalangi jalannya untuk menjadi Raja Bajak Laut. Bersama kru bajak laut Topi Jerami, Luffy mengarungi lautan Grand Line demi menemukan harta karun legendaris 'One Piece'.",
    rating: "9.8",
    status: "Ongoing",
    genres: ["Action", "Adventure", "Fantasy", "Shounen"],
    baseReaders: 1450000
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
    baseReaders: 1120000
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
    baseReaders: 1890000
  },
  {
    title: "Nano Machine",
    slug: "nano-machine",
    type: "Manhwa",
    banner: "https://gambar.mangaku.guru/uploads/manga/nano-machine/manga_thumbnail-Nano-Machine.jpg?w=400",
    description: "Setelah disiksa dan di ambang kematian, Cheon Yeo-Woon, keturunan dari Kultus Iblis yang tertindas, dikunjungi oleh keturunan masa depannya yang menanamkan mesin nano ke dalam tubuhnya.",
    rating: "9.6",
    status: "Ongoing",
    genres: ["Action", "Sci-Fi", "Martial Arts", "Overpowered"],
    baseReaders: 980000
  },
  {
    title: "Solo Leveling: Ragnarok",
    slug: "alone-leveling-ragnarok",
    type: "Manhwa",
    banner: "https://gambar.mangaku.guru/uploads/manga/alone-leveling-ragnarok/manga_thumbnail-Alone-Leveling-Ragnarok.jpg?w=400",
    description: "Sekuel resmi dari webtoon populer Solo Leveling. Kehidupan Sung Su-ho, putra tunggal Sung Jin-woo, terguncang ketika kekuatan misterius mulai bangkit kembali untuk menantang ancaman alam semesta.",
    rating: "9.5",
    status: "Ongoing",
    genres: ["Action", "Fantasy", "Adventure", "Supernatural"],
    baseReaders: 820000
  },
  {
    title: "Martial Peak",
    slug: "martial-peak",
    type: "Manhua",
    banner: "https://gambar.mangaku.guru/uploads/manga/martial-peak/manga_thumbnail-Martial-Peak.jpg?w=400",
    description: "Puncak bela diri adalah perjalanan yang panjang dan sepi. Kai Yang, seorang murid uji coba biasa, menemukan sebuah buku hitam misterius yang membimbingnya menuju kekuasaan absolut.",
    rating: "9.4",
    status: "Ongoing",
    genres: ["Action", "Harem", "Martial Arts", "Cultivation"],
    baseReaders: 1250000
  },
  {
    title: "Jujutsu Kaisen",
    slug: "jujutsu-kaisen-indo",
    type: "Manga",
    banner: "https://gambar.mangaku.guru/uploads/manga/komik-jujutsu-kaisen-indo/manga_thumbnail-Komik-Jujutsu-Kaisen.jpg?w=400",
    description: "Yuji Itadori menelan jari kutukan legendaris Ryomen Sukuna untuk menyelamatkan teman-temannya. Ia kemudian bergabung dengan SMA Jujutsu untuk melacak sisa jari kutukan lainnya.",
    rating: "9.6",
    status: "Ongoing",
    genres: ["Action", "Supernatural", "School Life", "Shounen"],
    baseReaders: 1350000
  },
  {
    title: "Boruto: Two Blue Vortex",
    slug: "boruto-two-blue-vortex",
    type: "Manga",
    banner: "https://gambar.mangaku.guru/uploads/manga/boruto-two-blue-vortex/manga_thumbnail-Boruto-Two-Blue-Vortex.jpg?w=400",
    description: "Setelah ingatan dunia diubah oleh kekuatan Omnipotence milik Eida, Boruto Uzumaki kini menjadi buronan berbahaya dan harus bertahan hidup di luar desa sambil bersiap mengalahkan Code.",
    rating: "9.4",
    status: "Ongoing",
    genres: ["Action", "Adventure", "Ninja", "Shounen"],
    baseReaders: 1050000
  }
];

// Helper to get fluctuating dynamic reader counts based on current day & hour
function getDynamicReaders(slug: string, baseReaders: number): number {
  const currentHour = new Date().getHours();
  const currentDay = new Date().getDate();
  const seed = (currentHour + currentDay * 24) % 100;
  const charSum = slug.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const sinVal = Math.sin(seed + charSum); // Value between -1 and 1
  
  // Fluctuate readers by up to 15%
  const fluctuationPercent = 0.15;
  const fluctuation = Math.floor(baseReaders * fluctuationPercent * sinVal);
  return baseReaders + fluctuation;
}

// API Route: Get recommended popular mangas sorted by dynamic readership
app.get("/api/manga/recommendations", (req, res) => {
  const recommended = POPULAR_POOL.map(manga => {
    const readers = getDynamicReaders(manga.slug, manga.baseReaders);
    return {
      title: manga.title,
      slug: manga.slug,
      type: manga.type,
      banner: manga.banner,
      description: manga.description,
      rating: manga.rating,
      status: manga.status,
      genres: manga.genres,
      readers: readers
    };
  }).sort((a, b) => b.readers - a.readers);

  res.setHeader("Cache-Control", "s-maxage=3600, stale-while-revalidate=600");
  res.json({ success: true, data: recommended });
});

// API Route: Get Latest Manga Updates
app.get("/api/manga", async (req, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const genre = req.query.genre as string;
    const refresh = req.query.refresh === "true";
    
    const cacheKey = `manga_page_${page}_genre_${genre || "all"}`;
    if (!refresh) {
      const cached = getCachedData(cacheKey);
      if (cached) {
        res.setHeader("Cache-Control", "s-maxage=3600, stale-while-revalidate=600");
        return res.json(cached);
      }
    }
    
    let url = "";
    if (genre && genre.trim() !== "") {
      url = page <= 1 
        ? `https://mangaku.guru/genre/${genre.trim().toLowerCase()}/` 
        : `https://mangaku.guru/genre/${genre.trim().toLowerCase()}/page/${page}/`;
    } else {
      url = page <= 1 
        ? "https://mangaku.guru/komik/" 
        : `https://mangaku.guru/komik/page/${page}/`;
    }

    console.log(`[API] Fetching manga page ${page} (genre: ${genre || "none"}): ${url}`);
    
    const response = await axios.get(url, {
      headers: AXIOS_HEADERS,
      timeout: 10000,
    });

    const $ = cheerio.load(response.data);
    const cards = $(".mk-card");
    const list: any[] = [];

    cards.each((_, el) => {
      const title = $(el).find(".mk-card__title").text().trim() || $(el).attr("title") || "No Title";
      const href = $(el).attr("href") || "";
      const slug = extractSlug(href);
      const thumb = $(el).find("img").attr("src") || "";
      const chapter = $(el).find(".mk-card__chapter").text().trim();
      const type = $(el).find(".mk-badge--tipe").text().trim() || "Manga";
      const time = $(el).find(".mk-card__time").text().trim();

      if (slug) {
        list.push({
          title,
          slug,
          thumb,
          chapter,
          type,
          time,
        });
      }
    });

    // Simple total pages determination
    let totalPages = 50; 
    const lastPageLink = $(".page-numbers").not(".next").last().text().trim();
    if (lastPageLink && !isNaN(parseInt(lastPageLink))) {
      totalPages = parseInt(lastPageLink);
    }

    const responseData = {
      success: true,
      data: list,
      page,
      totalPages,
    };
    setCachedData(cacheKey, responseData);
    res.setHeader("Cache-Control", "s-maxage=3600, stale-while-revalidate=600");
    res.json(responseData);
  } catch (error: any) {
    console.error("[API Error] Latest Manga:", error.message || error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch latest manga list",
      error: error.message,
    });
  }
});

// API Route: Search Manga
app.get("/api/manga/search", async (req, res) => {
  try {
    const query = (req.query.q as string) || "";
    if (!query.trim()) {
      return res.json({ success: true, data: [] });
    }

    const url = `https://mangaku.guru/?s=${encodeURIComponent(query)}`;
    console.log(`[API] Searching manga for query "${query}": ${url}`);

    const response = await axios.get(url, {
      headers: AXIOS_HEADERS,
      timeout: 10000,
    });

    const $ = cheerio.load(response.data);
    const cards = $(".mk-card");
    const list: any[] = [];

    cards.each((_, el) => {
      const title = $(el).find(".mk-card__title").text().trim() || $(el).attr("title") || "No Title";
      const href = $(el).attr("href") || "";
      const slug = extractSlug(href);
      const thumb = $(el).find("img").attr("src") || "";
      const chapter = $(el).find(".mk-card__chapter").text().trim();
      const type = $(el).find(".mk-badge--tipe").text().trim() || "Manga";
      const time = $(el).find(".mk-card__time").text().trim();

      if (slug) {
        list.push({
          title,
          slug,
          thumb,
          chapter,
          type,
          time,
        });
      }
    });

    res.json({
      success: true,
      data: list,
    });
  } catch (error: any) {
    console.error("[API Error] Search Manga:", error.message || error);
    res.status(500).json({
      success: false,
      message: "Failed to search manga",
      error: error.message,
    });
  }
});

// API Route: Manga Details
app.get("/api/manga/detail/:slug", async (req, res) => {
  try {
    const slug = req.params.slug;
    const refresh = req.query.refresh === "true";
    const cacheKey = `manga_detail_${slug}`;
    
    if (!refresh) {
      const cached = getCachedData(cacheKey);
      if (cached) {
        res.setHeader("Cache-Control", "s-maxage=3600, stale-while-revalidate=600");
        return res.json(cached);
      }
    }

    const url = `https://mangaku.guru/komik/${slug}/`;
    console.log(`[API] Fetching manga detail for slug "${slug}": ${url}`);

    const response = await axios.get(url, {
      headers: AXIOS_HEADERS,
      timeout: 10000,
    });

    const $ = cheerio.load(response.data);
    
    const title = $(".mk-series__title").text().trim() || $("h1").first().text().trim();
    const altTitle = $(".mk-series__alt").text().trim();
    const type = $(".mk-series__eyebrow-tipe").text().trim() || "Manga";
    const status = $(".mk-series__eyebrow-link").text().trim() || "Ongoing";
    const thumb = $(".mk-series__cover img").attr("src") || "";
    
    let author = $(".mk-series__author").text().trim();
    if (!author) {
      $("p").each((_, el) => {
        const text = $(el).text();
        if (text.startsWith("oleh")) {
          author = text.replace("oleh", "").trim();
        }
      });
    } else {
      author = author.replace("oleh", "").trim();
    }

    const publishedText = $(".mk-series__published").text().trim();
    
    const genres: string[] = [];
    $(".mk-chip, .mk-series__genres a").each((_, el) => {
      genres.push($(el).text().trim());
    });

    // Extract synopsis robustly
    let synopsis = "";
    $("p, div").each((_, el) => {
      const text = $(el).text().trim();
      if (text.startsWith("Sinopsis Komik")) {
        synopsis = text.replace(`Sinopsis Komik ${title}`, "").trim();
        if (!synopsis) {
          synopsis = text.substring(text.indexOf(title) + title.length).trim();
        }
      }
    });
    if (!synopsis) {
      synopsis = $(".mk-series__lead").text().trim() || "Tidak ada sinopsis untuk komik ini.";
    }

    // Extract Chapters
    const chapters: any[] = [];
    $("a").each((_, el) => {
      const href = $(el).attr("href") || "";
      const text = $(el).text().trim();

      // Skip landing buttons and headers that aren't specific chapter entries
      const isMulaiBaca = text.toLowerCase().includes("mulai baca") || $(el).find("[data-mulai-baca-label]").length > 0;
      const isTerbaruLabel = text.toLowerCase().includes("chapter terbaru") || text === "Chapter Terbaru";
      if (isMulaiBaca || isTerbaruLabel) {
        return;
      }

      // Match any link referencing the comic and a sub-path chapter
      const slugPattern = `/komik/${slug}/`;
      if (href.includes(slugPattern) && href.length > href.indexOf(slugPattern) + slugPattern.length) {
        const remaining = href.substring(href.indexOf(slugPattern) + slugPattern.length).replace(/\/$/, "");
        // Skip general query parameter sub-links or feed endpoints
        if (!remaining || remaining.includes("?") || remaining.includes("#") || remaining === "feed") {
          return;
        }

        // Extract Chapter Slug robustly
        const cleanHref = href.endsWith("/") ? href.slice(0, -1) : href;
        const parts = cleanHref.split("/");
        const chapterSlug = parts[parts.length - 1];

        if (chapterSlug && !chapters.some(c => c.slug === chapterSlug)) {
          const nameEl = $(el).find(".mk-chapter-list__name");
          const dateEl = $(el).find(".mk-chapter-list__date");

          let chName = "";
          let date = "";

          if (nameEl.length > 0) {
            chName = nameEl.text().trim();
            date = dateEl.text().trim();
          } else {
            // Regex fallback
            const match = text.match(/(Chapter\s+\d+(\.\d+)?)/i);
            if (match) {
              chName = match[1];
              date = text.replace(chName, "").trim();
            } else {
              chName = text || `Bab ${chapterSlug.replace("chapter-", "")}`;
              date = "Baru";
            }
          }

          chapters.push({
            name: chName,
            slug: chapterSlug,
            date: date || "Baru",
            href: href,
          });
        }
      }
    });

    const responseData = {
      success: true,
      data: {
        title,
        altTitle,
        type,
        status,
        thumb,
        author,
        publishedText,
        genres: Array.from(new Set(genres)),
        synopsis,
        chapters,
      },
    };
    setCachedData(cacheKey, responseData);
    res.setHeader("Cache-Control", "s-maxage=3600, stale-while-revalidate=600");
    res.json(responseData);
  } catch (error: any) {
    console.error(`[API Error] Manga Detail (${req.params.slug}):`, error.message || error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch manga detail",
      error: error.message,
    });
  }
});

// API Route: Chapter Details / Pages
app.get("/api/manga/chapter/:slug/:chapterSlug", async (req, res) => {
  try {
    const { slug, chapterSlug } = req.params;
    const refresh = req.query.refresh === "true";
    const cacheKey = `chapter_${slug}_${chapterSlug}`;
    
    if (!refresh) {
      const cached = getCachedData(cacheKey);
      if (cached) {
        res.setHeader("Cache-Control", "s-maxage=3600, stale-while-revalidate=600");
        return res.json(cached);
      }
    }

    const url = `https://mangaku.guru/komik/${slug}/${chapterSlug}/`;
    console.log(`[API] Fetching chapter page for "${slug}" / "${chapterSlug}": ${url}`);

    const response = await axios.get(url, {
      headers: AXIOS_HEADERS,
      timeout: 10000,
    });

    const $ = cheerio.load(response.data);
    const title = $("h1").first().text().trim() || $("title").text().trim();
    const images: any[] = [];

    $("img").each((_, el) => {
      const src = $(el).attr("src") || $(el).attr("data-src") || "";
      const alt = $(el).attr("alt") || "";

      const isChapterImage = src.includes("img.mangaku.guru") || alt.toLowerCase().includes("halaman") || src.includes("/upload");
      const isNotAdOrRec = !src.includes("manga_thumbnail") && !alt.toLowerCase().includes("komik");

      if (src && isChapterImage && isNotAdOrRec) {
        images.push({
          src,
          alt: alt || `Halaman`,
        });
      }
    });

    const responseData = {
      success: true,
      data: {
        title,
        images,
      },
    };
    setCachedData(cacheKey, responseData);
    res.setHeader("Cache-Control", "s-maxage=3600, stale-while-revalidate=600");
    res.json(responseData);
  } catch (error: any) {
    console.error(`[API Error] Chapter (${req.params.slug}/${req.params.chapterSlug}):`, error.message || error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch chapter details",
      error: error.message,
    });
  }
});

export default app;
