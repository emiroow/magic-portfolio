/** Support layout: the page and its dialog share the site rhythm. */
export default function SupportLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <div className="site-shell max-w-4xl">{children}</div>;
}
