import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const privatePaths = [
    "/api/",
    "/login",
    "/site-admin/",
    "/transitos/",
    "/dashboard",
    "/projects",
    "/routes",
    "/vehicles",
    "/drivers",
    "/subcontractors",
    "/expenses",
    "/finance",
    "/earnings",
    "/settings",
    "/surveys",
    "/calendar"
  ];

  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/seflektur/", "/llms.txt"],
        disallow: privatePaths
      },
      {
        userAgent: ["OAI-SearchBot", "ChatGPT-User", "GPTBot", "Google-Extended", "ClaudeBot", "PerplexityBot"],
        allow: ["/", "/seflektur/", "/llms.txt"],
        disallow: privatePaths
      }
    ],
    sitemap: "https://www.seflektur.com/sitemap.xml",
    host: "https://www.seflektur.com"
  };
}

