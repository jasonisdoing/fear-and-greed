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

export type BacktestHorizonKey = '1w' | '1m' | '3m' | '6m' | '12m';

export interface BacktestReturnPoint {
  exitDate: string;
  exitPrice: number;
  returnPct: number;
}

export interface BacktestTrade {
  entryDate: string;
  fearGreedScore: number;
  entryPrice: number;
  returns: Partial<Record<BacktestHorizonKey, BacktestReturnPoint>>;
}

export interface BacktestSummary {
  key: BacktestHorizonKey;
  label: string;
  sampleCount: number;
  averageReturnPct: number | null;
  medianReturnPct: number | null;
  winRatePct: number | null;
  bestReturnPct: number | null;
  worstReturnPct: number | null;
}

export interface SP500BacktestData {
  threshold: number;
  tradeCount: number;
  fearGreedRange: {
    startDate: string;
    endDate: string;
  };
  sp500Range: {
    startDate: string;
    endDate: string;
  };
  analysisRange: {
    startDate: string;
    endDate: string;
  };
  dataSource: {
    fearGreed: string;
    sp500: string;
  };
  summaries: BacktestSummary[];
  trades: BacktestTrade[];
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
