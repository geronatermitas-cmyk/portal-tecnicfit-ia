// src/hooks/useSEO.ts
type SEOInput = {
  title: string;
  description: string;
  url?: string;              // canonical/og:url (si no llega usamos location.href)
  image?: string;            // og:image/twitter:image
  keywords?: string;
  jsonLd?: object;           // datos estructurados (opcional)
};

function upsertMeta(attr: 'name' | 'property', key: string, content: string) {
  if (!content) return;
  let el = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

function upsertLink(rel: string, href: string) {
  let el = document.head.querySelector<HTMLLinkElement>(`link[rel="${rel}"]`);
  if (!el) {
    el = document.createElement('link');
    el.setAttribute('rel', rel);
    document.head.appendChild(el);
  }
  el.setAttribute('href', href);
}

function upsertJsonLd(id: string, data: object) {
  let el = document.head.querySelector<HTMLScriptElement>(`script#${id}[type="application/ld+json"]`);
  if (!el) {
    el = document.createElement('script');
    el.id = id;
    el.type = 'application/ld+json';
    document.head.appendChild(el);
  }
  el.textContent = JSON.stringify(data);
}

export function useSEO(input: SEOInput) {
  const {
    title,
    description,
    url = (typeof window !== 'undefined' ? window.location.href : ''),
    image = 'https://portal-tecnicfit-ia.vercel.app/icon.png',
    keywords = 'accesibilidad, discapacidad, visual, auditiva, habla, tecnología asistiva, IA, tecnicfit',
    jsonLd,
  } = input;

  // título
  if (typeof document !== 'undefined') document.title = title;

  // básicos
  upsertMeta('name', 'description', description);
  upsertMeta('name', 'keywords', keywords);
  upsertLink('canonical', url);

  // Open Graph
  upsertMeta('property', 'og:title', title);
  upsertMeta('property', 'og:description', description);
  upsertMeta('property', 'og:type', 'website');
  upsertMeta('property', 'og:url', url);
  upsertMeta('property', 'og:image', image);

  // Twitter
  upsertMeta('name', 'twitter:card', 'summary_large_image');
  upsertMeta('name', 'twitter:title', title);
  upsertMeta('name', 'twitter:description', description);
  upsertMeta('name', 'twitter:image', image);

  // JSON-LD opcional
  if (jsonLd) upsertJsonLd('ld-category', jsonLd);
}