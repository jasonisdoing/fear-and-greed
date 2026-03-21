import type { Metadata } from 'next';
import { buildMetadata, getDetailPage } from '@/lib/seo';

export const metadata: Metadata = buildMetadata(
  getDetailPage('/guide') || {
    title: 'CNN Fear & Greed Guide',
    description: '원본 출처, CSV·JSON 데이터셋, GitHub 저장소 링크와 차트 해석 가이드를 함께 제공하는 안내 페이지입니다.',
    path: '/guide',
  },
);

export default function GuideLayout({ children }: { children: React.ReactNode }) {
  return children;
}
