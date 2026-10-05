'use client';

type JsonLdProps = {
  item: Record<string, unknown>;
};

/** Renders a JSON-LD script tag for schema.org structured data. */
export function JsonLd({ item }: JsonLdProps) {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(item) }} />;
}
