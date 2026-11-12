import * as React from 'react';

export interface MetaTagsProps {
  title: string;
  description?: string;
  canonicalUrl?: string;
  ogImage?: string;
  ogType?: 'profile' | 'website' | 'business.business';
  jsonLd?: Record<string, unknown>;
}

export function MetaTags({
  title,
  description,
  canonicalUrl,
  ogImage,
  ogType = 'profile',
  jsonLd,
}: MetaTagsProps) {
  React.useEffect(() => {
    // 1. Title
    if (title) {
      document.title = title;
    }

    // 2. Meta description
    if (description) {
      let descMeta = document.querySelector('meta[name="description"]');
      if (!descMeta) {
        descMeta = document.createElement('meta');
        descMeta.setAttribute('name', 'description');
        document.head.appendChild(descMeta);
      }
      descMeta.setAttribute('content', description);
    }

    // 3. Open Graph Tags
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

    setMetaProperty('og:title', title);
    setMetaProperty('og:description', description);
    setMetaProperty('og:type', ogType);
    if (canonicalUrl) setMetaProperty('og:url', canonicalUrl);
    if (ogImage) setMetaProperty('og:image', ogImage);

    // 4. Schema.org JSON-LD
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
  }, [title, description, canonicalUrl, ogImage, ogType, jsonLd]);

  return null;
}
