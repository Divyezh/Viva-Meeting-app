import { useEffect } from "react";

interface PageSEOProps {
  title: string;
  description?: string;
  canonicalPath?: string;
  noIndex?: boolean;
}

const BASE_URL = "https://viva-meeting-app.vercel.app";

/**
 * Dynamically updates document.title, canonical URL, and meta description
 * to enforce brand relevance for "Viva Meeting" across search engines.
 */
export const usePageSEO = ({ title, description, canonicalPath = "", noIndex = false }: PageSEOProps) => {
  useEffect(() => {
    // 1. Set Title Tag
    const fullTitle = title.includes("Viva Meeting") ? title : `${title} | Viva Meeting`;
    document.title = fullTitle;

    // 2. Set Meta Description
    if (description) {
      let descMeta = document.querySelector('meta[name="description"]');
      if (!descMeta) {
        descMeta = document.createElement("meta");
        descMeta.setAttribute("name", "description");
        document.head.appendChild(descMeta);
      }
      descMeta.setAttribute("content", description);

      // Open Graph Description
      let ogDesc = document.querySelector('meta[property="og:description"]');
      if (ogDesc) {
        ogDesc.setAttribute("content", description);
      }
    }

    // 3. Set Canonical Link
    const fullCanonical = `${BASE_URL}${canonicalPath}`;
    let canonicalLink = document.querySelector('link[rel="canonical"]');
    if (!canonicalLink) {
      canonicalLink = document.createElement("link");
      canonicalLink.setAttribute("rel", "canonical");
      document.head.appendChild(canonicalLink);
    }
    canonicalLink.setAttribute("href", fullCanonical);

    // 4. Set Open Graph Title
    let ogTitle = document.querySelector('meta[property="og:title"]');
    if (ogTitle) {
      ogTitle.setAttribute("content", fullTitle);
    }

    // 5. Set Robots Meta (noindex for private rooms, index for public pages)
    let robotsMeta = document.querySelector('meta[name="robots"]');
    if (!robotsMeta) {
      robotsMeta = document.createElement("meta");
      robotsMeta.setAttribute("name", "robots");
      document.head.appendChild(robotsMeta);
    }
    robotsMeta.setAttribute(
      "content",
      noIndex
        ? "noindex, nofollow"
        : "index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1"
    );
  }, [title, description, canonicalPath, noIndex]);
};

export default usePageSEO;
