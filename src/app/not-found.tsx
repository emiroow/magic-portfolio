import NotFoundPage from '@/app/[locale]/not-found';

/** Fallback 404 for URLs that never enter the localized segment. */
export default function RootNotFound() {
  return <NotFoundPage />;
}
