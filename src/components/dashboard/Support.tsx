'use client';

import SupportOptions from '@/components/dashboard/SupportOptions';
import SupportRecords from '@/components/dashboard/SupportRecords';

/**
 * Dashboard support section.
 *
 * The ways this project is backed and the people who back it are one subject, not
 * two: they live on this page together, methods first and records under them, in the
 * same list-and-form surface every other archive uses.
 */
const Support = () => (
  <div>
    <SupportOptions />
    <SupportRecords />
  </div>
);

export default Support;
