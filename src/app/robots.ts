import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://wappx.zynexdev.com";

  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/llms.txt", "/llms-full.txt", "/thumbnail.png"],
        disallow: ["/api/", "/admin/", "/app/"],
      },
      {
        userAgent: [
          "GPTBot",
          "ChatGPT-User",
          "PerplexityBot",
          "ClaudeBot",
          "anthropic-ai",
          "Google-Extended",
          "Applebot-Extended",
          "cohere-ai",
          "OAI-SearchBot",
          "Bingbot",
        ],
        allow: ["/", "/llms.txt", "/llms-full.txt", "/thumbnail.png"],
        disallow: ["/api/", "/admin/", "/app/"],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
