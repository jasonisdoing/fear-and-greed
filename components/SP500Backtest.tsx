'use client';

import { useEffect, useState } from 'react';
import type { BacktestHorizonKey, FearGreedData, SP500BacktestData } from '@/types';

type ApiError = {
  error: string;
};

const HORIZON_ORDER: BacktestHorizonKey[] = ['1w', '1m', '3m', '6m', '12m'];
const THRESHOLD_OPTIONS = [
  { value: 25, label: '25 이하로' },
  { value: 20, label: '20 이하로' },
  { value: 15, label: '15 이하로' },
  { value: 10, label: '10 이하로' },
  { value: 5, label: '5 이하로' },
] as const;
const DEFAULT_THRESHOLD = 15;

function pickNearestThreshold(score: number): number {
  const allowedThresholds = THRESHOLD_OPTIONS.map((option) => option.value);
  return allowedThresholds.reduce((closest, current) => {
    const currentDistance = Math.abs(score - current);
    const closestDistance = Math.abs(score - closest);

    if (currentDistance < closestDistance) {
      return current;
    }

    if (currentDistance === closestDistance) {
      return current < closest ? current : closest;
    }

    return closest;
  }, DEFAULT_THRESHOLD);
}

function formatDateLabel(value: string): string {
  return new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'Asia/Seoul',
  }).format(new Date(`${value}T00:00:00Z`));
}

function formatPercent(value: number | null): string {
  if (value === null) {
    return '-';
  }

  return `${value > 0 ? '+' : ''}${value.toFixed(2)}%`;
}

function formatNumber(value: number): string {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

function getReturnTone(value: number | null): string {
  if (value === null) {
    return 'neutral';
  }

  if (value > 0) {
    return 'positive';
  }

  if (value < 0) {
    return 'negative';
  }

  return 'neutral';
}

export default function SP500Backtest() {
  const [data, setData] = useState<SP500BacktestData | null>(null);
  const [threshold, setThreshold] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const initializeThreshold = async () => {
      try {
        const response = await fetch('/api/fear-greed');
        const payload = (await response.json()) as FearGreedData | ApiError;

        if (!response.ok || 'error' in payload || typeof payload.score !== 'number' || Number.isNaN(payload.score)) {
          throw new Error('현재 공포 탐욕 지수를 불러오지 못했습니다.');
        }

        setThreshold(pickNearestThreshold(payload.score));
      } catch (caughtError) {
        setError(caughtError instanceof Error ? caughtError.message : '현재 공포 탐욕 지수를 불러오지 못했습니다.');
        setLoading(false);
      }
    };

    initializeThreshold().catch(() => undefined);
  }, []);

  useEffect(() => {
    if (threshold === null) {
      return;
    }

    const fetchBacktest = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(`/api/sp500-backtest?threshold=${threshold}`);
        const payload = (await response.json()) as SP500BacktestData | ApiError;

        if (!response.ok) {
          throw new Error('error' in payload ? payload.error : 'S&P 500 백테스트 조회에 실패했습니다.');
        }

        setData(payload as SP500BacktestData);
      } catch (caughtError) {
        setError(caughtError instanceof Error ? caughtError.message : 'S&P 500 백테스트를 불러오지 못했습니다.');
      } finally {
        setLoading(false);
      }
    };

    fetchBacktest().catch(() => undefined);
  }, [threshold]);

  if (loading) {
    return (
      <div className="backtest-shell">
        <div className="loading-container" style={{ minHeight: '320px' }}>
          <div className="loading-spinner" />
          <p className="loading-text">S&amp;P 500 백테스트를 계산하는 중입니다.</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="backtest-shell">
        <div className="history-chart-error">
          <strong>백테스트 렌더링 실패</strong>
          <p>{error ?? '응답 데이터가 없습니다.'}</p>
        </div>
      </div>
    );
  }

  return (
    <section className="backtest-shell">
      <div className="backtest-hero">
        <div className="backtest-hero-top">
          <div className="backtest-hero-copy">
            <div className="backtest-inline-intro">
              <span>공포 탐욕 지수가</span>
              <div className="backtest-select-wrap">
                <select value={threshold ?? DEFAULT_THRESHOLD} onChange={(event) => setThreshold(Number(event.target.value))} aria-label="공포 탐욕 기준 선택">
                  {THRESHOLD_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
                <span className="backtest-select-hint">클릭해서 기준 변경</span>
              </div>
              <span>내려온 날을 매수 시점으로 잡고, 이후 보유 기간별 기대 수익률을 비교한 백테스트입니다.</span>
            </div>
          </div>
          <div className="backtest-hero-badges" aria-label="백테스트 핵심 요약">
            <div className="backtest-hero-badge">
              <span>실제 비교 구간</span>
              <strong>{formatDateLabel(data.analysisRange.startDate)} ~ {formatDateLabel(data.analysisRange.endDate)}</strong>
            </div>
          </div>
        </div>
      </div>

      <div className="backtest-table-container">
        <div className="table-header-row">
          <h2>기간별 비교</h2>
          <p className="table-subtitle">
            아래 표가 이 전략의 핵심 결과입니다. 공포 탐욕 데이터와 S&amp;P 500 데이터가 모두 있는
            {` ${formatDateLabel(data.analysisRange.startDate)} ~ ${formatDateLabel(data.analysisRange.endDate)} `}
            구간만 비교했고, 만기가 아직 오지 않은 기간은 표본에서 자동 제외됩니다.
          </p>
        </div>

        <div className="table-responsive-wrapper">
          <table className="custom-data-table">
            <thead>
              <tr>
                <th>보유 기간</th>
                <th>표본 수</th>
                <th>평균 수익률</th>
                <th>중앙값</th>
                <th>승률</th>
                <th>최고</th>
                <th>최저</th>
              </tr>
            </thead>
            <tbody>
              {data.summaries.map((summary) => (
                <tr key={summary.key}>
                  <td className="font-bold">{summary.label}</td>
                  <td>{summary.sampleCount.toLocaleString('ko-KR')}건</td>
                  <td className={getReturnTone(summary.averageReturnPct)}>{formatPercent(summary.averageReturnPct)}</td>
                  <td className={getReturnTone(summary.medianReturnPct)}>{formatPercent(summary.medianReturnPct)}</td>
                  <td>{summary.winRatePct === null ? '-' : `${summary.winRatePct.toFixed(1)}%`}</td>
                  <td className={getReturnTone(summary.bestReturnPct)}>{formatPercent(summary.bestReturnPct)}</td>
                  <td className={getReturnTone(summary.worstReturnPct)}>{formatPercent(summary.worstReturnPct)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="backtest-table-container">
        <div className="table-header-row">
          <h2>개별 진입 결과</h2>
          <p className="table-subtitle">
            공포 탐욕 데이터는 {data.dataSource.fearGreed}, S&amp;P 500 데이터는 {data.dataSource.sp500} 기준입니다.
            공포 탐욕 원본 범위는 {formatDateLabel(data.fearGreedRange.startDate)} ~ {formatDateLabel(data.fearGreedRange.endDate)},
            S&amp;P 500 원본 범위는 {formatDateLabel(data.sp500Range.startDate)} ~ {formatDateLabel(data.sp500Range.endDate)}입니다.
          </p>
        </div>

        <div className="table-responsive-wrapper">
          <table className="custom-data-table">
            <thead>
              <tr>
                <th>진입일</th>
                <th>공포지수</th>
                <th>진입가</th>
                {HORIZON_ORDER.map((key) => (
                  <th key={key}>{data.summaries.find((summary) => summary.key === key)?.label ?? key}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.trades.map((trade) => (
                <tr key={trade.entryDate}>
                  <td>{formatDateLabel(trade.entryDate)}</td>
                  <td>{trade.fearGreedScore.toFixed(1)}</td>
                  <td className="font-mono">{formatNumber(trade.entryPrice)}</td>
                  {HORIZON_ORDER.map((key) => {
                    const point = trade.returns[key];

                    return (
                      <td key={key}>
                        {point ? (
                          <div className="backtest-return-cell">
                            <strong className={getReturnTone(point.returnPct)}>{formatPercent(point.returnPct)}</strong>
                            <span>{formatDateLabel(point.exitDate)}</span>
                          </div>
                        ) : (
                          '-'
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
