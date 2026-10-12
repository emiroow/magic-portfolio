'use client';

type JsonLdProps = {
  item: Record<string, unknown>;
};

/**
 * Renders a JSON-LD script tag for schema.org structured data.
 *
 * `<` is escaped so a `</script>` (or `<!--`) inside owner-authored content — a
 * project or post title, say — cannot close the tag early and corrupt the head.
 * The escaped form parses back to the identical JSON.
 */
export function JsonLd({ item }: JsonLdProps) {
  const json = JSON.stringify(item).replace(/</g, '\\u003c');
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: json }} />;
}
