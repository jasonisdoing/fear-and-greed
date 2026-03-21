export interface TMarketData {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  openPrice?: number;
  highPrice?: number;
  lowPrice?: number;
  timestamp: string;
  session?: string;
  history?: { time: string; price: number }[];
  isMarketOpen?: boolean;
}

export interface FearGreedData {
  score: number;
  rating: string;
  previousClose: number;
  oneWeekAgo: number;
  oneMonthAgo: number;
  oneYearAgo: number;
  timeline: { timestamp: number; score: number }[];
}

export interface MomentumData {
  dates: string[];
  closes: number[];
  sma125: (number | null)[];
  currentPrice: number;
  currentSMA: number;
  signal: 'BULLISH(강세)' | 'BEARISH(약세)';
}

export type TabId =
  | 'sp500'
  | 'nasdaq'
  | 'vix'
  | 'fear-greed'
  | 'momentum';

export interface Tab {
  id: TabId;
  label: string;
  icon: string;
}
