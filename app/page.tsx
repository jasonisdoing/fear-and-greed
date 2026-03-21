import SinglePageDashboard from '@/components/SinglePageDashboard';
import type { Metadata } from 'next';
import { buildMetadata, homePage } from '@/lib/seo';

export const metadata: Metadata = buildMetadata(homePage);

export default function HomePage() {
  return (
    <div className="single-page-home">
      <section className="unified-detail-sections">
        <SinglePageDashboard />
      </section>
    </div>
  );
}
