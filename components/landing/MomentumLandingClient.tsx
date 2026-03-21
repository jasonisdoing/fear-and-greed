'use client';

import { useCallback, useEffect, useState } from 'react';
import SP500Momentum from '@/components/SP500Momentum';
import { MomentumData } from '@/types';

const REFRESH_INTERVAL = 60000;

export default function MomentumLandingClient() {
  const [data, setData] = useState<MomentumData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/momentum?symbol=^GSPC&sma=125');
      const json = await res.json();
      setData(json);
    } catch (error) {
      console.error('시장 모멘텀 데이터 로딩 실패:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, REFRESH_INTERVAL);
    return () => clearInterval(interval);
  }, [fetchData]);

  return <SP500Momentum data={data} loading={loading && !data} />;
}
