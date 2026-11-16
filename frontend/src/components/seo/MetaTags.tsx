import * as React from 'react';

export interface MetaTagsProps {
  title: string;
  description?: string;
  canonicalUrl?: string;
  ogImage?: string;
  ogType?: 'profile' | 'website' | 'business.business';
  siteName?: string;
  twitterCard?: 'summary' | 'summary_large_image';
  robots?: string;
  jsonLd?: Record<string, unknown>;
}

export function MetaTags({
  title,
  description,
  canonicalUrl,
  ogImage,
  ogType = 'profile',
  siteName = 'Taptch',
  twitterCard = 'summary_large_image',
  robots = 'index, follow',
  jsonLd,
}: MetaTagsProps) {
  React.useEffect(() => {
    // 1. Document Title
    if (title) {
      document.title = title;
    }

        // Helper: set or update meta by name
        const setMetaByName = (name: string, content?: string) => {
          if (!content) return;
          let el = document.querySelector(`meta[name="${name}"]`);
          if (!el) {
            el = document.createElement('meta');
            el.setAttribute('name', name);
            document.head.appendChild(el);
          }
        el.setAttribute('content', content);
      };

      // Helper: set or update meta by property
      const setMetaProperty = (prop: string, content?: string) => {
        if (!content) return;
        let el = document.querySelector(`meta[property="${prop}"]`);
        if (!el) {
          el = document.createElement('meta');
          el.setAttribute('property', prop);
          document.head.appendChild(el);
        }
        el.setAttribute('content', content);
      };

      // 2. Standard Meta Description & Robots
      setMetaByName('description', description);
      setMetaByName('robots', robots);

      // 3. Canonical Link
      if (canonicalUrl) {
        let link = document.querySelector('link[rel="canonical"]');
        if (!link) {
          link = document.createElement('link');
          link.setAttribute('rel', 'canonical');
          document.head.appendChild(link);
        }
        link.setAttribute('href', canonicalUrl);
      }

      // 4. Open Graph Tags
      setMetaProperty('og:title', title);
      setMetaProperty('og:description', description);
      setMetaProperty('og:type', ogType);
      setMetaProperty('og:site_name', siteName);
      if (canonicalUrl) setMetaProperty('og:url', canonicalUrl);
      if (ogImage) setMetaProperty('og:image', ogImage);

      // 5. Twitter / X Card Tags
      setMetaByName('twitter:card', twitterCard);
      setMetaByName('twitter:title', title);
      setMetaByName('twitter:description', description);
      if (ogImage) setMetaByName('twitter:image', ogImage);

      // 6. Schema.org JSON-LD
      if (jsonLd) {
        let script = document.querySelector('script[data-seo="taptch-schema"]');
        if (!script) {
          script = document.createElement('script');
          script.setAttribute('type', 'application/ld+json');
          script.setAttribute('data-seo', 'taptch-schema');
          document.head.appendChild(script);
        }
        script.textContent = JSON.stringify(jsonLd);
      }
}, [title, description, canonicalUrl, ogImage, ogType, siteName, twitterCard, robots, jsonLd]);

return null;
}
