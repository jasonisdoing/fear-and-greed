import type { Metadata } from 'next';
import { buildMetadata, getDetailPage } from '@/lib/seo';

export const metadata: Metadata = buildMetadata(
  getDetailPage('/fear-and-greed-backtest') || {
    title: '공포 탐욕 백테스트 · Fear & Greed 기반 S&P 500 전략',
    description: '공포 탐욕 지수 기준을 선택해 S&P 500을 매수했을 경우 1주일·1개월·3개월·6개월·1년 뒤 수익률 통계를 비교해보세요.',
    path: '/fear-and-greed-backtest',
  },
);

export default function FearAndGreedBacktestLayout({ children }: { children: React.ReactNode }) {
  return children;
}
