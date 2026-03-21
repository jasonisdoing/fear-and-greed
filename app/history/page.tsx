'use client';

import dynamic from 'next/dynamic';

const HistoryDataTable = dynamic(() => import('@/components/HistoryDataTable'), {
  ssr: false,
  loading: () => <div className="loading-container">테이블을 불러오는 중...</div>,
});

export default function HistoryPage() {
  return (
    <div className="dashboard-section" style={{ marginTop: '1rem' }}>
      <div className="page-intro">
        <h1 className="page-intro-title">CNN Fear &amp; Greed Historical Data</h1>
        <p className="page-intro-description">
          날짜별 점수와 심리 구간을 페이지 단위로 확인할 수 있는 데이터 아카이브입니다.
        </p>
      </div>

      <div style={{ marginTop: '2rem' }}>
        <HistoryDataTable />
      </div>
    </div>
  );
}
