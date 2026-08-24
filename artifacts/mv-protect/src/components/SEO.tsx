import { useEffect, useRef } from 'react';

const SITE_URL = 'https://mvprotect.fr';
const OG_IMAGE = `${SITE_URL}/opengraph.jpg`;
const PUBLISHER_NAME = 'MV PROTECT';
const PUBLISHER_LOGO = `${SITE_URL}/images/logo.png`;

// Geo tags constants (Basse-Ham, Moselle, FR)
const GEO_REGION = 'FR-57';
const GEO_PLACENAME = 'Basse-Ham, Moselle, Grand Est';
const GEO_POSITION = '49.4061;6.3272';
const GEO_ICBM = '49.4061, 6.3272';

// Google requires headline ≤ 110 characters for rich result eligibility
const MAX_HEADLINE_LENGTH = 110;

interface SEOProps {
  title: string;
  description: string;
  /** ISO date string – triggers BlogPosting JSON-LD injection */
  datePublished?: string;
  /**
   * ISO date string for last modification.
   * Only include when a real updatedAt value is available from the API;
   * do NOT pass datePublished as a fallback — misleading metadata can
   * reduce rather than improve structured-data quality.
   */
  dateModified?: string;
  /** Absolute or relative cover image URL for the article */
  imageUrl?: string;
  /** Article author name */
  authorName?: string;
}

function setMeta(attr: 'name' | 'property', key: string, content: string) {
  let el = document.querySelector(`meta[${attr}="${key}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

function setCanonical(href: string) {
  let el = document.querySelector('link[rel="canonical"]');
  if (!el) {
    el = document.createElement('link');
    el.setAttribute('rel', 'canonical');
    document.head.appendChild(el);
  }
  el.setAttribute('href', href);
}

export function SEO({ title, description, datePublished, dateModified, imageUrl, authorName }: SEOProps) {
  const ldScriptRef = useRef<HTMLScriptElement | null>(null);
  const breadcrumbScriptRef = useRef<HTMLScriptElement | null>(null);

  useEffect(() => {
    const fullTitle = `${title} | MV PROTECT`;
    document.title = fullTitle;

    // Canonical URL for the current page (production domain, without query params)
    const base = import.meta.env.BASE_URL.replace(/\/$/, '');
    let path = window.location.pathname;
    if (base && path.startsWith(base)) path = path.slice(base.length) || '/';
    const canonicalUrl = `${SITE_URL}${path === '/' ? '/' : path.replace(/\/$/, '')}`;
    setCanonical(canonicalUrl);

    setMeta('name', 'description', description);

    // Open Graph
    setMeta('property', 'og:title', fullTitle);
    setMeta('property', 'og:description', description);
    setMeta('property', 'og:url', canonicalUrl);
    setMeta('property', 'og:image', OG_IMAGE);
    setMeta('property', 'og:image:width', '1200');
    setMeta('property', 'og:image:height', '630');
    setMeta('property', 'og:image:alt', 'MV PROTECT — Atelier de detailing automobile haut de gamme à Basse-Ham');
    setMeta('property', 'og:site_name', 'MV PROTECT');
    setMeta('property', 'og:locale', 'fr_FR');

    // Twitter Cards
    setMeta('name', 'twitter:card', 'summary_large_image');
    setMeta('name', 'twitter:title', fullTitle);
    setMeta('name', 'twitter:description', description);
    setMeta('name', 'twitter:image', OG_IMAGE);
    setMeta('name', 'twitter:image:alt', 'MV PROTECT — Atelier de detailing automobile haut de gamme à Basse-Ham');

    // Geo tags (constant — identify the business location for all pages)
    setMeta('name', 'geo.region', GEO_REGION);
    setMeta('name', 'geo.placename', GEO_PLACENAME);
    setMeta('name', 'geo.position', GEO_POSITION);
    setMeta('name', 'ICBM', GEO_ICBM);

    // BlogPosting JSON-LD — injected only on article pages
    if (datePublished) {
      // Resolve absolute image URL
      const articleImage = imageUrl
        ? imageUrl.startsWith('http')
          ? imageUrl
          : `${SITE_URL}${imageUrl.startsWith('/') ? '' : '/'}${imageUrl}`
        : OG_IMAGE;

      // Google requires headline ≤ 110 chars for rich result eligibility
      const headline = title.length > MAX_HEADLINE_LENGTH
        ? title.slice(0, MAX_HEADLINE_LENGTH - 1) + '…'
        : title;

      const schema: Record<string, unknown> = {
        '@context': 'https://schema.org',
        '@type': 'BlogPosting',
        '@id': `${canonicalUrl}#article`,
        headline,
        description,
        datePublished,
        inLanguage: 'fr-FR',
        // ImageObject without explicit dimensions — avoids misleading metadata
        // when actual asset dimensions are not known at render time.
        // (Dimensions can be added once the API exposes them.)
        image: {
          '@type': 'ImageObject',
          url: articleImage,
        },
        url: canonicalUrl,
        author: {
          '@type': 'Person',
          name: authorName ?? PUBLISHER_NAME,
        },
        publisher: {
          '@type': 'Organization',
          '@id': `${SITE_URL}/#business`,
          name: PUBLISHER_NAME,
          logo: {
            '@type': 'ImageObject',
            url: PUBLISHER_LOGO,
          },
        },
        mainEntityOfPage: {
          '@type': 'WebPage',
          '@id': canonicalUrl,
        },
        isPartOf: {
          '@type': 'Blog',
          '@id': `${SITE_URL}/actualites#blog`,
          name: 'Blog MV PROTECT',
          publisher: {
            '@type': 'Organization',
            '@id': `${SITE_URL}/#business`,
            name: PUBLISHER_NAME,
          },
        },
      };

      // Only include dateModified when a real modification timestamp is supplied.
      // Do NOT fall back to datePublished — identical values provide no signal to
      // Google and can be flagged as misleading structured data.
      if (dateModified && dateModified !== datePublished) {
        schema.dateModified = dateModified;
      }

      // Reuse or create the article LD script tag
      if (!ldScriptRef.current) {
        const el = document.createElement('script');
        el.setAttribute('type', 'application/ld+json');
        el.setAttribute('data-article-ld', 'true');
        document.head.appendChild(el);
        ldScriptRef.current = el;
      }
      ldScriptRef.current.textContent = JSON.stringify(schema);

      // BreadcrumbList JSON-LD — Accueil → Actualités → [Article title]
      const breadcrumbSchema = {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
          {
            '@type': 'ListItem',
            position: 1,
            name: 'Accueil',
            item: SITE_URL,
          },
          {
            '@type': 'ListItem',
            position: 2,
            name: 'Actualités',
            item: `${SITE_URL}/actualites`,
          },
          {
            '@type': 'ListItem',
            position: 3,
            name: title,
            item: canonicalUrl,
          },
        ],
      };

      if (!breadcrumbScriptRef.current) {
        const el = document.createElement('script');
        el.setAttribute('type', 'application/ld+json');
        el.setAttribute('data-breadcrumb-ld', 'true');
        document.head.appendChild(el);
        breadcrumbScriptRef.current = el;
      }
      breadcrumbScriptRef.current.textContent = JSON.stringify(breadcrumbSchema);
    }

    return () => {
      // Clean up article JSON-LD when navigating away from an article page
      if (ldScriptRef.current) {
        ldScriptRef.current.remove();
        ldScriptRef.current = null;
      }
      if (breadcrumbScriptRef.current) {
        breadcrumbScriptRef.current.remove();
        breadcrumbScriptRef.current = null;
      }
    };
  }, [title, description, datePublished, dateModified, imageUrl, authorName]);

  return null;
}
