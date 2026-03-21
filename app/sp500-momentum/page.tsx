import IndicatorGuide from '@/components/IndicatorGuide';
import MomentumLandingClient from '@/components/landing/MomentumLandingClient';

export default function SP500MomentumPage() {
  return (
    <div className="seo-landing-page">
      <MomentumLandingClient />
      <IndicatorGuide currentPath="/sp500-momentum" />
    </div>
  );
}
