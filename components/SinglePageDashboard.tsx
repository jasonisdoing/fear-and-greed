'use client';

import { useCallback, useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import FearGreedIndex from '@/components/FearGreedIndex';
import { FearGreedData } from '@/types';

const GeneralChart = dynamic(() => import('@/components/GeneralChart'), {
  ssr: false,
  loading: () => <div className="loading-container">차트를 불러오는 중...</div>,
});

const REFRESH_INTERVAL = 60000;

function usePollingJson<T>(url: string, transform?: (data: T) => T) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch(url);
      const json = await res.json();
      setData(transform ? transform(json) : json);
    } catch (error) {
      console.error(`Failed to fetch ${url}:`, error);
    } finally {
      setLoading(false);
    }
  }, [transform, url]);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, REFRESH_INTERVAL);
    return () => clearInterval(interval);
  }, [fetchData]);

  return { data, loading: loading && !data };
}

function FearGreedSection() {
  const { data, loading } = usePollingJson<FearGreedData>('/api/fear-greed');

  return (
    <section id="fear-and-greed-section" className="dashboard-section">
      <FearGreedIndex
        data={data}
        loading={loading}
        showTimeline={false}
        compactHeader
        description="시장 참가자 심리가 어느 구간에 있는지 현재 점수와 장기 흐름으로 확인합니다."
      />

      <div className="dashboard-chart-slot">
        <GeneralChart compactHeader />
      </div>
    </section>
  );
}

export default function SinglePageDashboard() {
  return (
    <div className="single-page-dashboard">
      <div className="dashboard-detail-list">
        <FearGreedSection />
      </div>
    </div>
  );
}
