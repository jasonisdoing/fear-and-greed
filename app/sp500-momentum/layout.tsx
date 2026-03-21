import type { Metadata } from 'next';
import { buildMetadata, getDetailPage } from '@/lib/seo';

export const metadata: Metadata = buildMetadata(
    getDetailPage('/sp500-momentum') || {
        title: 'S&P 500 모멘텀 · 125일 이동평균선',
        description: 'S&P 500이 125일 이동평균선 위에 있는지 아래에 있는지 보며 추세 강도를 확인해보세요.',
        path: '/sp500-momentum',
    }
);

export default function SP500MomentumLayout({ children }: { children: React.ReactNode }) {
    return children;
}
