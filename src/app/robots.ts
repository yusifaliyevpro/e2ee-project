import type { MetadataRoute } from "next";

// Nothing here is meant for search engines or crawlers
export default function robots(): MetadataRoute.Robots {
  return { rules: { userAgent: "*", disallow: "/" } };
}
