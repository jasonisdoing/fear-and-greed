import type { Metadata } from 'next';

export const siteName = 'CNN 공포 탐욕 지수';
export const defaultTitle = 'CNN Fear & Greed Index — 시장 심리 대시보드';
export const defaultDescription =
  'CNN Fear & Greed Index 현재 점수와 장기 과거 데이터를 함께 보며 시장 심리 변화를 한눈에 확인할 수 있는 대시보드입니다.';
export const defaultKeywords = [
  'CNN Fear & Greed Index',
  '공포탐욕지수',
  'Fear and Greed Index',
  '시장 심리',
  '공포 탐욕 지수 과거 데이터',
];

export const siteUrl = 'https://fear-and-greed.jason.ai.kr';

export interface SeoPageConfig {
  title: string;
  description: string;
  path: string;
  keywords?: string[];
}

export const homePage: SeoPageConfig = {
  title: 'CNN Fear & Greed Index',
  description: 'CNN Fear & Greed Index 현재 점수와 장기 히스토리 차트를 함께 보며 시장 심리 변화를 빠르게 확인해보세요.',
  path: '/',
  keywords: defaultKeywords,
};

export const detailPages: SeoPageConfig[] = [
  {
    title: 'S&P 500 모멘텀 · 125일 이동평균선',
    description: 'S&P 500이 125일 이동평균선 위에 있는지 아래에 있는지 보며 추세 강도를 확인해보세요.',
    path: '/sp500-momentum',
    keywords: ['S&P 500 모멘텀', '125일 이동평균선', '시장 모멘텀', '미국 증시 모멘텀'],
  },
  {
    title: 'CNN Fear & Greed Historical Data',
    description: '날짜별 점수와 심리 구간을 페이지 단위로 확인할 수 있는 Fear & Greed 데이터 아카이브입니다.',
    path: '/history',
    keywords: ['CNN Fear & Greed Historical Data', '공포탐욕지수 과거 데이터', 'Fear and Greed history', '시장 심리 아카이브'],
  },
  {
    title: 'CNN Fear & Greed Guide',
    description: '원본 출처, CSV·JSON 데이터셋, GitHub 저장소 링크와 차트 해석 가이드를 함께 제공하는 안내 페이지입니다.',
    path: '/guide',
    keywords: ['CNN Fear & Greed guide', '공포탐욕지수 가이드', 'Fear and Greed data source', 'Fear and Greed guide'],
  },
];

export function buildMetadata(config: SeoPageConfig): Metadata {
  const canonical = config.path;

  return {
    title: config.title,
    description: config.description,
    keywords: config.keywords,
    alternates: {
      canonical,
    },
    openGraph: {
      type: 'website',
      url: canonical,
      title: `${config.title} | ${siteName}`,
      description: config.description,
      siteName,
      locale: 'ko_KR',
    },
    twitter: {
      card: 'summary_large_image',
      title: `${config.title} | ${siteName}`,
      description: config.description,
    },
  };
}

export function getDetailPage(path: string) {
  return detailPages.find((page) => page.path === path);
}
