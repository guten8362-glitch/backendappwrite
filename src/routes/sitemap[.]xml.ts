import { createFileRoute } from "@tanstack/react-router";
import { fetchAuditoriums } from "@/lib/auditoriums";

// TODO: replace with your project URL once a project name or custom domain is set.
const BASE_URL = "";

interface SitemapEntry {
  path: string;
  changefreq?: "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | "never";
  priority?: string;
}

export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: async () => {
        const auditoriums = await fetchAuditoriums();
        
        const entries: SitemapEntry[] = [
          { path: "/", changefreq: "monthly", priority: "1.0" },
          { path: "/auditoriums", changefreq: "weekly", priority: "0.9" },
          ...auditoriums.map((a) => ({
            path: `/auditoriums/${a.id}`,
            changefreq: "weekly" as const,
            priority: "0.8",
          })),
          { path: "/bookings", changefreq: "weekly", priority: "0.6" },
          { path: "/notifications", changefreq: "weekly", priority: "0.4" },
          { path: "/profile", changefreq: "monthly", priority: "0.4" },
          { path: "/admin", changefreq: "weekly", priority: "0.3" },
        ];

        const urls = entries.map((e) =>
          [
            `  <url>`,
            `    <loc>${BASE_URL}${e.path}</loc>`,
            e.changefreq ? `    <changefreq>${e.changefreq}</changefreq>` : null,
            e.priority ? `    <priority>${e.priority}</priority>` : null,
            `  </url>`,
          ]
            .filter(Boolean)
            .join("\n")
        );

        const xml = [
          `<?xml version="1.0" encoding="UTF-8"?>`,
          `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`,
          ...urls,
          `</urlset>`,
        ].join("\n");

        return new Response(xml, {
          headers: { "Content-Type": "application/xml", "Cache-Control": "public, max-age=3600" },
        });
      },
    },
  },
});
