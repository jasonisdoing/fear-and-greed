# CNN Fear & Greed Index Historical Data
## CNN 공포 탐욕 지수 과거 데이터

Korean version is available below.  
한글 버전은 아래에 있습니다.

[![Live Site](https://img.shields.io/badge/Live_Site-fear--and--greed.jason.ai.kr-blue?style=for-the-badge&logo=vercel)](https://fear-and-greed.jason.ai.kr/)
[![CSV Dataset](https://img.shields.io/badge/CSV-2011_to_Present-success?style=for-the-badge)](./data/cnn_fear_greed_historic_data.csv)
[![JSON Dataset](https://img.shields.io/badge/JSON-Available-orange?style=for-the-badge)](./data/cnn_fear_greed_historic_data.json)

Free CNN Fear & Greed Index historical data from 2011 to the present, with a live website for exploring long-term market sentiment.

This repository collects and maintains long-range Fear & Greed Index data that is difficult to find in a free, reusable format.  
The live site provides an interactive chart, a historical archive, and supporting market context for easier exploration.

Live site:  
[https://fear-and-greed.jason.ai.kr/](https://fear-and-greed.jason.ai.kr/)

## English

### What this project provides

- Long-range CNN Fear & Greed Index historical data
- CSV and JSON datasets for direct use
- A live website for chart-based exploration
- A paginated historical archive by date
- Supporting S&P 500 momentum context

### Data files

- CSV: [data/cnn_fear_greed_historic_data.csv](./data/cnn_fear_greed_historic_data.csv)
- JSON: [data/cnn_fear_greed_historic_data.json](./data/cnn_fear_greed_historic_data.json)
- Coverage: January 3, 2011 to present
- Update policy: regularly updated

### Website

The website is intended for users who want to explore the dataset visually instead of working only with raw files.

- Main dashboard: current Fear & Greed reading and long-term chart
- Historical data page: paginated archive view
- S&P 500 momentum page: additional market context

Visit:  
[https://fear-and-greed.jason.ai.kr/](https://fear-and-greed.jason.ai.kr/)

### Use cases

- Quant research
- Backtesting sentiment-based ideas
- Market commentary
- Data journalism
- Personal dashboards and side projects

### Notes

- The dataset is maintained from collected historical records.
- The original index page is published by CNN: [https://edition.cnn.com/markets/fear-and-greed](https://edition.cnn.com/markets/fear-and-greed)
- Obviously invalid values are filtered during processing.
- The goal is to provide a practical long-range dataset for historical analysis.

### Methodology

- CNN does not provide a sufficiently accessible official long-range historical dataset for the Fear & Greed Index.
- Over time, many people have collected, preserved, and shared pieces of this data through different tools and archives.
- Recent data is maintained by collecting CNN's unofficial API on a daily basis.
- Older data is supplemented with [https://web.archive.org/](https://web.archive.org/), public GitHub repositories, records from bots that previously collected the index, and manual verification.
- This repository does not contain an official full-history dump from CNN. It is a reconstructed long-range historical dataset assembled from multiple sources.
- Some dates may not perfectly match the original page's displayed date because of posting time, timezone differences, or market holiday handling.
- The main purpose of this dataset is long-term trend and extreme-zone analysis rather than perfect day-by-day reconstruction.

### Contributing

If you find missing dates, incorrect values, or processing issues:

1. Open an issue with the affected date and a short explanation.
2. Submit a pull request if you already have a verified fix.

---

## 한글

### 이 프로젝트가 제공하는 것

- CNN 공포 탐욕 지수 장기 과거 데이터
- 바로 활용할 수 있는 CSV, JSON 데이터셋
- 장기 흐름을 탐색할 수 있는 라이브 웹사이트
- 날짜별 페이지네이션 과거 데이터 아카이브
- 보조 지표로 활용할 수 있는 S&P 500 모멘텀 페이지

### 데이터 파일

- CSV: [data/cnn_fear_greed_historic_data.csv](./data/cnn_fear_greed_historic_data.csv)
- JSON: [data/cnn_fear_greed_historic_data.json](./data/cnn_fear_greed_historic_data.json)
- 제공 범위: 2011년 1월 3일 ~ 현재
- 업데이트 정책: 정기적으로 갱신

### 웹사이트

원시 데이터 파일만 보는 대신, 웹사이트에서 장기 시장 심리를 더 쉽게 탐색할 수 있습니다.

- 메인 대시보드: 현재 Fear & Greed 수치와 장기 차트
- 과거 데이터 페이지: 날짜별 페이지네이션 아카이브
- S&P 500 모멘텀 페이지: 보조 시장 맥락 제공

바로가기:  
[https://fear-and-greed.jason.ai.kr/](https://fear-and-greed.jason.ai.kr/)

### 활용 예시

- 퀀트 리서치
- 심리 기반 백테스트
- 시장 분석 글 작성
- 데이터 저널리즘
- 개인 대시보드와 사이드 프로젝트

### 데이터 구성 방식

- CNN은 Fear & Greed Index의 장기 히스토릭 데이터를 충분히 접근 가능한 공식 형태로 제공하지 않습니다.
- 원본 지수 페이지는 CNN Fear & Greed입니다: [https://edition.cnn.com/markets/fear-and-greed](https://edition.cnn.com/markets/fear-and-greed)
- 그래서 오랜 기간 동안 여러 사람들이 다양한 도구와 아카이브를 통해 데이터를 수집하고, 보존하고, 공유해 왔습니다.
- 최근 데이터는 CNN의 비공식 API를 일별 수집해 유지합니다.
- 과거 데이터는 [https://web.archive.org/](https://web.archive.org/), 공개 GitHub 저장소, 과거에 동작하던 수집 봇의 기록, 그리고 수동 검증을 통해 보완했습니다.
- 이 저장소의 데이터는 공식 CNN 전체 히스토리 덤프가 아니라, 복수 출처를 바탕으로 재구성한 장기 히스토리 데이터셋입니다.
- 일부 날짜는 게시 시점, 타임존, 휴장일 처리 차이로 인해 원페이지 표시일과 완전히 일치하지 않을 수 있습니다.
- 이 데이터셋의 주된 목적은 일별 완전 복원보다 장기 추세와 극단 구간 분석입니다.

### 기여

누락된 날짜, 잘못된 값, 처리 이슈를 발견했다면:

1. 문제가 있는 날짜와 내용을 이슈로 남겨 주세요.
2. 검증된 수정값이 있다면 PR로 보내 주세요.

### 향후 계획 (Roadmap)

더 깊이 있는 장기 심리 분석을 위해 다음 기능들을 준비하고 있습니다.

- [ ] **S&P 500 백테스트:** 시장이 극단적 공포 구간일 때 매수했을 경우, 1개월·3개월·6개월·1년 뒤 기대 수익률 통계를 자동 계산하고 시각화합니다.
- [ ] **주요 경제 이벤트:** 리먼 브라더스 사태, 코로나 팬데믹 같은 주요 시장 이벤트 전후의 지수 흐름을 함께 보여줍니다.
