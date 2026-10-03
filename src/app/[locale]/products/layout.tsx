/** Products layout: the catalogue and its pages share the site rhythm. */
export default function ProductsLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <div className="site-shell max-w-4xl">{children}</div>;
}
