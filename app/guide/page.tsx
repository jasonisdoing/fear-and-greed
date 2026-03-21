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

      <section className="indicator-guide">
        <h2 className="indicator-guide-title">데이터 구성 방식</h2>
        <ul className="indicator-guide-list">
          <li>CNN은 Fear &amp; Greed Index의 장기 히스토릭 데이터를 충분히 접근 가능한 공식 형태로 제공하지 않습니다.</li>
          <li>그래서 오랜 기간 동안 여러 사람들이 다양한 도구와 아카이브를 통해 데이터를 수집하고, 보존하고, 공유해 왔습니다.</li>
          <li>최근 데이터는 CNN의 비공식 API를 일별 수집해 유지합니다.</li>
          <li>
            과거 데이터는 <a href="https://web.archive.org/" target="_blank" rel="noreferrer">web.archive.org</a>,
            공개 GitHub 저장소, 과거에 동작하던 수집 봇의 기록, 그리고 수동 검증을 통해 보완했습니다.
          </li>
          <li>이 저장소의 데이터는 공식 CNN 전체 히스토리 덤프가 아니라, 복수 출처를 바탕으로 재구성한 장기 히스토리 데이터셋입니다.</li>
          <li>일부 날짜는 게시 시점, 타임존, 휴장일 처리 차이로 인해 원페이지 표시일과 완전히 일치하지 않을 수 있습니다.</li>
          <li>이 데이터셋의 주된 목적은 일별 완전 복원보다 장기 추세와 극단 구간 분석입니다.</li>
        </ul>
      </section>

      <IndicatorGuide currentPath="/fear-greed" />
    </div>
  );
}
