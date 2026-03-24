import SP500Backtest from '@/components/SP500Backtest';

export default function FearAndGreedBacktestPage() {
  return (
    <div className="dashboard-section" style={{ marginTop: '1rem' }}>
      <div className="page-intro">
        <h1 className="page-intro-title">공포 탐욕 백테스트</h1>
        <p className="page-intro-description">
          공포 탐욕 지수 기준을 선택해 미국 대표 지수인 S&amp;P 500을 매수했을 때 이후 보유 기간별 성과를 비교합니다.
        </p>
      </div>

      <div style={{ marginTop: '2rem' }}>
        <SP500Backtest />
      </div>
    </div>
  );
}
