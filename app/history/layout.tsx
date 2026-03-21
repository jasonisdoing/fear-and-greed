import type { Metadata } from 'next';
import { buildMetadata, getDetailPage } from '@/lib/seo';

export const metadata: Metadata = buildMetadata(
  getDetailPage('/history') || {
    title: 'CNN Fear & Greed Historical Data',
    description: '날짜별 점수와 심리 구간을 페이지 단위로 확인할 수 있는 Fear & Greed 데이터 아카이브입니다.',
    path: '/history',
  },
);

export default function HistoryLayout({ children }: { children: React.ReactNode }) {
  return children;
}
