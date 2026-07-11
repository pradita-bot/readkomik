import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import axios from "axios";
import * as cheerio from "cheerio";

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

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

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
    res.json({ success: true, data: popularGenres });
  });

  // API Route: Get Latest Manga Updates (or paginated list, with optional genre)
  app.get("/api/manga", async (req, res) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const genre = req.query.genre as string;
      
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

      // Simple total pages determination - usually can extract from pagination
      let totalPages = 50; // default fallback
      const lastPageLink = $(".page-numbers").not(".next").last().text().trim();
      if (lastPageLink && !isNaN(parseInt(lastPageLink))) {
        totalPages = parseInt(lastPageLink);
      }

      res.json({
        success: true,
        data: list,
        page,
        totalPages,
      });
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

      res.json({
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
      });
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

      res.json({
        success: true,
        data: {
          title,
          images,
        },
      });
    } catch (error: any) {
      console.error(`[API Error] Chapter (${req.params.slug}/${req.params.chapterSlug}):`, error.message || error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch chapter details",
        error: error.message,
      });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
