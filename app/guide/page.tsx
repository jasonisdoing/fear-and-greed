'use client';

import IndicatorGuide from '@/components/IndicatorGuide';

export default function GuidePage() {
  return (
    <div className="dashboard-section" style={{ marginTop: '1rem' }}>
      <div className="page-intro">
        <h1 className="page-intro-title">CNN Fear &amp; Greed Guide</h1>
        <p className="page-intro-description">
          원본 출처, 데이터 파일, GitHub 저장소 링크와 차트 해석 가이드를 한곳에서 확인할 수 있습니다.
        </p>
      </div>

      <section className="indicator-guide">
        <h2 className="indicator-guide-title">원본 출처</h2>
        <p className="github-guide-description">
          원본 지수 페이지는 CNN Fear &amp; Greed입니다.
        </p>
        <div className="site-utility-links">
          <a
            href="https://edition.cnn.com/markets/fear-and-greed"
            target="_blank"
            rel="noreferrer"
            className="site-utility-link"
          >
            원본 지수 페이지 보기
          </a>
        </div>
      </section>

      <section className="indicator-guide">
        <h2 className="indicator-guide-title">데이터 파일과 저장소</h2>
        <p className="github-guide-description">
          CSV 데이터셋, JSON 파일, 수집 로직, 프로젝트 코드는 GitHub 저장소에서 확인할 수 있습니다.
        </p>
        <div className="site-utility-links">
          <a
            href="https://github.com/jasonisdoing/fear-and-greed"
            target="_blank"
            rel="noreferrer"
            className="site-utility-link"
          >
            GitHub에서 데이터와 수집 코드를 보기
          </a>
          <a
            href="https://github.com/jasonisdoing/fear-and-greed/blob/main/data/cnn_fear_greed_historic_data.csv"
            target="_blank"
            rel="noreferrer"
            className="site-utility-link"
          >
            CSV 데이터 바로 보기
          </a>
        </div>
      </section>

      <section className="indicator-guide">
        <h2 className="indicator-guide-title">수집 데이터</h2>
        <ul className="indicator-guide-list">
          <li>제공 범위는 2011년 1월 3일부터 현재까지입니다.</li>
          <li>CSV와 JSON 형식으로 장기 과거 데이터를 제공합니다.</li>
          <li>메인 차트와 날짜별 아카이브 테이블로 데이터를 탐색할 수 있습니다.</li>
        </ul>
      </section>

      <IndicatorGuide currentPath="/fear-greed" />
    </div>
  );
}
