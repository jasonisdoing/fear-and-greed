import fs from 'fs';
import path from 'path';
import { NextRequest, NextResponse } from 'next/server';
import type { BacktestHorizonKey, BacktestReturnPoint, BacktestSummary, BacktestTrade, SP500BacktestData } from '@/types';

type FearGreedHistoryItem = {
  d: string;
  v: number;
};

type SP500Point = {
  date: string;
  close: number;
};

type HorizonConfig = {
  key: BacktestHorizonKey;
  label: string;
} & (
  | { unit: 'days'; amount: number }
  | { unit: 'months'; amount: number }
);

const DEFAULT_FEAR_THRESHOLD = 15;
const ALLOWED_THRESHOLDS = new Set([25, 20, 15, 10, 5]);
const HORIZONS: HorizonConfig[] = [
  { key: '1w', label: '1주일', unit: 'days', amount: 7 },
  { key: '1m', label: '1개월', unit: 'months', amount: 1 },
  { key: '3m', label: '3개월', unit: 'months', amount: 3 },
  { key: '6m', label: '6개월', unit: 'months', amount: 6 },
  { key: '12m', label: '1년', unit: 'months', amount: 12 },
];

function readFearGreedHistory(): FearGreedHistoryItem[] {
  const filePath = path.join(process.cwd(), 'data', 'cnn_fear_greed_historic_data.json');

  if (!fs.existsSync(filePath)) {
    throw new Error('공포 탐욕 데이터 파일이 없습니다.');
  }

  const payload = JSON.parse(fs.readFileSync(filePath, 'utf-8')) as unknown;
  if (!Array.isArray(payload)) {
    throw new Error('공포 탐욕 데이터 형식이 배열이 아닙니다.');
  }

  return payload.map((item, index) => {
    if (
      typeof item !== 'object' ||
      item === null ||
      typeof (item as FearGreedHistoryItem).d !== 'string' ||
      typeof (item as FearGreedHistoryItem).v !== 'number' ||
      Number.isNaN((item as FearGreedHistoryItem).v)
    ) {
      throw new Error(`공포 탐욕 데이터 ${index + 1}번째 항목 형식이 올바르지 않습니다.`);
    }

    return item as FearGreedHistoryItem;
  });
}

async function fetchSP500History(): Promise<SP500Point[]> {
  const response = await fetch('https://fred.stlouisfed.org/graph/fredgraph.csv?id=SP500', {
    next: { revalidate: 3600 },
  });

  if (!response.ok) {
    throw new Error(`S&P 500 데이터를 가져오지 못했습니다. status=${response.status}`);
  }

  const csvText = await response.text();
  const lines = csvText.trim().split('\n');

  if (lines.length < 2) {
    throw new Error('S&P 500 CSV 데이터가 비어 있습니다.');
  }

  const [header, ...rows] = lines;
  const normalizedHeader = header.trim().toLowerCase();
  if (normalizedHeader !== 'date,sp500' && normalizedHeader !== 'observation_date,sp500') {
    throw new Error('S&P 500 CSV 헤더 형식이 예상과 다릅니다.');
  }

  const points = rows.flatMap((row, index) => {
    const [date, rawClose] = row.trim().split(',');

    if (!date || rawClose === undefined) {
      throw new Error(`S&P 500 CSV ${index + 2}번째 줄 형식이 올바르지 않습니다.`);
    }

    if (rawClose === '' || rawClose === '.') {
      return [];
    }

    const close = Number(rawClose);
    if (Number.isNaN(close)) {
      throw new Error(`S&P 500 CSV ${index + 2}번째 줄 종가가 숫자가 아닙니다.`);
    }

    return [{ date, close }];
  });

  if (points.length === 0) {
    throw new Error('유효한 S&P 500 데이터가 없습니다.');
  }

  return points;
}

function sortFearGreedHistory(items: FearGreedHistoryItem[]): FearGreedHistoryItem[] {
  return [...items].sort((left, right) => left.d.localeCompare(right.d));
}

function clampFearGreedHistoryToRange(
  items: FearGreedHistoryItem[],
  startDate: string,
  endDate: string,
): FearGreedHistoryItem[] {
  return items.filter((item) => item.d >= startDate && item.d <= endDate);
}

function addMonthsUtc(dateString: string, months: number): string {
  const [year, month, day] = dateString.split('-').map(Number);
  const targetMonthIndex = month - 1 + months;
  const targetYear = year + Math.floor(targetMonthIndex / 12);
  const normalizedMonthIndex = ((targetMonthIndex % 12) + 12) % 12;
  const lastDayOfMonth = new Date(Date.UTC(targetYear, normalizedMonthIndex + 1, 0)).getUTCDate();
  const normalizedDay = Math.min(day, lastDayOfMonth);

  return new Date(Date.UTC(targetYear, normalizedMonthIndex, normalizedDay)).toISOString().slice(0, 10);
}

function addDaysUtc(dateString: string, days: number): string {
  const [year, month, day] = dateString.split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, day + days)).toISOString().slice(0, 10);
}

function findLatestPointOnOrBefore(points: SP500Point[], targetDate: string): SP500Point | null {
  let left = 0;
  let right = points.length - 1;
  let foundIndex = -1;

  while (left <= right) {
    const middle = Math.floor((left + right) / 2);
    const middleDate = points[middle].date;

    if (middleDate <= targetDate) {
      foundIndex = middle;
      left = middle + 1;
    } else {
      right = middle - 1;
    }
  }

  return foundIndex >= 0 ? points[foundIndex] : null;
}

function calculateReturn(entryPrice: number, exitPrice: number): number {
  return ((exitPrice - entryPrice) / entryPrice) * 100;
}

function calculateMedian(values: number[]): number | null {
  if (values.length === 0) {
    return null;
  }

  const sortedValues = [...values].sort((left, right) => left - right);
  const middle = Math.floor(sortedValues.length / 2);

  if (sortedValues.length % 2 === 0) {
    return (sortedValues[middle - 1] + sortedValues[middle]) / 2;
  }

  return sortedValues[middle];
}

function calculateSummary(key: BacktestHorizonKey, label: string, trades: BacktestTrade[]): BacktestSummary {
  const returns = trades
    .map((trade) => trade.returns[key]?.returnPct ?? null)
    .filter((value): value is number => value !== null);

  if (returns.length === 0) {
    return {
      key,
      label,
      sampleCount: 0,
      averageReturnPct: null,
      medianReturnPct: null,
      winRatePct: null,
      bestReturnPct: null,
      worstReturnPct: null,
    };
  }

  const averageReturnPct = returns.reduce((sum, value) => sum + value, 0) / returns.length;
  const positiveCount = returns.filter((value) => value > 0).length;

  return {
    key,
    label,
    sampleCount: returns.length,
    averageReturnPct,
    medianReturnPct: calculateMedian(returns),
    winRatePct: (positiveCount / returns.length) * 100,
    bestReturnPct: Math.max(...returns),
    worstReturnPct: Math.min(...returns),
  };
}

function buildTrades(
  fearGreedHistory: FearGreedHistoryItem[],
  sp500Points: SP500Point[],
  threshold: number,
): BacktestTrade[] {
  const latestAvailableDate = sp500Points[sp500Points.length - 1].date;

  return fearGreedHistory
    .filter((item) => item.v <= threshold)
    .map((item) => {
      const entryPoint = findLatestPointOnOrBefore(sp500Points, item.d);
      if (!entryPoint) {
        throw new Error(`${item.d} 이전 S&P 500 종가를 찾을 수 없습니다.`);
      }

      const returns = HORIZONS.reduce<Partial<Record<BacktestHorizonKey, BacktestReturnPoint>>>((accumulator, horizon) => {
        const targetDate = horizon.unit === 'days'
          ? addDaysUtc(item.d, horizon.amount)
          : addMonthsUtc(item.d, horizon.amount);

        if (targetDate > latestAvailableDate) {
          return accumulator;
        }

        // 휴장일은 목표 달력일 이하의 가장 최근 거래일로 고정한다.
        const exitPoint = findLatestPointOnOrBefore(sp500Points, targetDate);

        if (!exitPoint || exitPoint.date < entryPoint.date) {
          return accumulator;
        }

        accumulator[horizon.key] = {
          exitDate: exitPoint.date,
          exitPrice: exitPoint.close,
          returnPct: calculateReturn(entryPoint.close, exitPoint.close),
        };

        return accumulator;
      }, {});

      return {
        entryDate: item.d,
        fearGreedScore: item.v,
        entryPrice: entryPoint.close,
        returns,
      };
    });
}

function parseThreshold(request: NextRequest): number {
  const thresholdParam = new URL(request.url).searchParams.get('threshold');
  if (thresholdParam === null) {
    return DEFAULT_FEAR_THRESHOLD;
  }

  const threshold = Number(thresholdParam);
  if (!Number.isInteger(threshold) || !ALLOWED_THRESHOLDS.has(threshold)) {
    throw new Error('threshold 값이 올바르지 않습니다.');
  }

  return threshold;
}

export async function GET(request: NextRequest) {
  try {
    const threshold = parseThreshold(request);
    const fearGreedHistory = sortFearGreedHistory(readFearGreedHistory());
    const sp500Points = await fetchSP500History();

    if (fearGreedHistory.length === 0) {
      throw new Error('공포 탐욕 데이터가 비어 있습니다.');
    }

    const analysisStartDate = sp500Points[0].date > fearGreedHistory[0].d ? sp500Points[0].date : fearGreedHistory[0].d;
    const analysisEndDate =
      sp500Points[sp500Points.length - 1].date < fearGreedHistory[fearGreedHistory.length - 1].d
        ? sp500Points[sp500Points.length - 1].date
        : fearGreedHistory[fearGreedHistory.length - 1].d;

    const comparableFearGreedHistory = clampFearGreedHistoryToRange(fearGreedHistory, analysisStartDate, analysisEndDate);
    if (comparableFearGreedHistory.length === 0) {
      throw new Error('공포 탐욕 데이터와 S&P 500 데이터의 겹치는 기간이 없습니다.');
    }

    const trades = buildTrades(comparableFearGreedHistory, sp500Points, threshold);

    const responseData: SP500BacktestData = {
      threshold,
      tradeCount: trades.length,
      fearGreedRange: {
        startDate: fearGreedHistory[0].d,
        endDate: fearGreedHistory[fearGreedHistory.length - 1].d,
      },
      sp500Range: {
        startDate: sp500Points[0].date,
        endDate: sp500Points[sp500Points.length - 1].date,
      },
      analysisRange: {
        startDate: analysisStartDate,
        endDate: analysisEndDate,
      },
      dataSource: {
        fearGreed: 'data/cnn_fear_greed_historic_data.json',
        sp500: 'FRED SP500 일별 종가 CSV',
      },
      summaries: HORIZONS.map((horizon) => calculateSummary(horizon.key, horizon.label, trades)),
      trades: [...trades].reverse(),
    };

    return NextResponse.json(responseData);
  } catch (error) {
    console.error('SP500 backtest API error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'S&P 500 백테스트 데이터를 계산할 수 없습니다.' },
      { status: 500 },
    );
  }
}
