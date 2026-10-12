/**
 * JSON-LD structured data components for Google rich results.
 *
 * Each component renders a <script type="application/ld+json"> tag with
 * server-side-only output (no client JS needed). They must be placed inside
 * a Server Component — they are not marked "use client".
 */

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://toomny.com";

// ---------------------------------------------------------------------------
// Organization + WebSite — emitted on every public page via the FR layout
// ---------------------------------------------------------------------------

export function OrganizationJsonLd() {
  const schema = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": `${SITE_URL}/#organization`,
        name: "Toomny",
        url: SITE_URL,
        logo: {
          "@type": "ImageObject",
          url: `${SITE_URL}/logo.png`,
          width: 200,
          height: 200,
        },
        description:
          "La marketplace de talents d'Afrique de l'Ouest. Paiement en mobile money, conservé jusqu'à la livraison.",
        areaServed: "West Africa",
        contactPoint: {
          "@type": "ContactPoint",
          contactType: "customer support",
          email: "support@toomny.com",
          availableLanguage: ["French", "English"],
        },
        sameAs: [],
      },
      {
        "@type": "WebSite",
        "@id": `${SITE_URL}/#website`,
        url: SITE_URL,
        name: "Toomny",
        publisher: { "@id": `${SITE_URL}/#organization` },
        inLanguage: ["fr-FR", "en-US"],
        potentialAction: {
          "@type": "SearchAction",
          target: {
            "@type": "EntryPoint",
            urlTemplate: `${SITE_URL}/services?q={search_term_string}`,
          },
          "query-input": "required name=search_term_string",
        },
      },
    ],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

// ---------------------------------------------------------------------------
// FAQPage — used on the homepage and /tarifs
// ---------------------------------------------------------------------------

export interface FaqItem {
  q: string;
  a: string;
}

export function FaqJsonLd({ items }: { items: FaqItem[] }) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.a,
      },
    })),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

// ---------------------------------------------------------------------------
// BreadcrumbList — used on deep pages (tarifs, comment-ca-marche, securite…)
// ---------------------------------------------------------------------------

export interface BreadcrumbItem {
  name: string;
  href: string;
}

export function BreadcrumbJsonLd({ items }: { items: BreadcrumbItem[] }) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: `${SITE_URL}${item.href}`,
    })),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
