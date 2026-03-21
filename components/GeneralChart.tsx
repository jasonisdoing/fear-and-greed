'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ColorType,
  createChart,
  CrosshairMode,
  LineSeries,
  type IChartApi,
  type LineData,
  LineStyle,
  type MouseEventParams,
  PriceScaleMode,
  type Time,
  type UTCTimestamp,
} from 'lightweight-charts';
import { FEAR_GREED_PALETTE, getFearGreedPalette } from '@/lib/fear-greed-theme';

type HistoryApiItem = {
  d: string;
  v: number;
};

type SegmentPoint = {
  time: UTCTimestamp;
  value: number;
};

type ChartPoint = LineData<Time> & {
  time: UTCTimestamp;
  value: number;
  isoDate: string;
};

type RangeKey = '1Y' | '3Y' | '5Y' | '10Y' | 'MAX';

type SummaryStats = {
  latest: number;
  previous: number;
  high: number;
  low: number;
  start: string;
  end: string;
};

type VisibleStats = {
  change: number;
  changeRate: number;
  start: string;
  end: string;
};

type GeneralChartProps = {
  compactHeader?: boolean;
};

const RANGE_OPTIONS: RangeKey[] = ['1Y', '3Y', '5Y', '10Y', 'MAX'];
const SEGMENT_THRESHOLDS = FEAR_GREED_PALETTE.slice(1).map((item) => item.start);

function assertHistoryData(payload: unknown): HistoryApiItem[] {
  if (!Array.isArray(payload)) {
    throw new Error('과거 데이터 응답 형식이 배열이 아닙니다.');
  }

  return payload.map((item, index) => {
    if (
      typeof item !== 'object' ||
      item === null ||
      typeof (item as HistoryApiItem).d !== 'string' ||
      typeof (item as HistoryApiItem).v !== 'number' ||
      Number.isNaN((item as HistoryApiItem).v)
    ) {
      throw new Error(`과거 데이터 ${index + 1}번째 항목 형식이 올바르지 않습니다.`);
    }

    return item as HistoryApiItem;
  });
}

function normalizeHistoryData(items: HistoryApiItem[]): ChartPoint[] {
  const uniqueData = new Map<string, number>();

  [...items].reverse().forEach((item) => {
    uniqueData.set(item.d, item.v);
  });

  return Array.from(uniqueData.entries())
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([time, value]) => ({
      time: dateToTimestamp(time),
      value,
      isoDate: time,
    }));
}

function dateToTimestamp(value: string): UTCTimestamp {
  return Math.floor(new Date(`${value}T00:00:00Z`).getTime() / 1000) as UTCTimestamp;
}

function formatDateLabel(value: string): string {
  return new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    timeZone: 'Asia/Seoul',
  }).format(new Date(`${value}T00:00:00Z`));
}

function timeToIsoDate(time: Time): string {
  if (typeof time === 'string') {
    return time;
  }

  if (typeof time === 'number') {
    return new Date(time * 1000).toISOString().slice(0, 10);
  }

  if (typeof time === 'object' && time !== null && 'year' in time) {
    return `${time.year}-${String(time.month).padStart(2, '0')}-${String(time.day).padStart(2, '0')}`;
  }

  throw new Error('지원하지 않는 시간 형식입니다.');
}

function formatNumber(value: number): string {
  return new Intl.NumberFormat('ko-KR', {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(value);
}

function formatSignedNumber(value: number): string {
  const formatted = formatNumber(Math.abs(value));
  if (value === 0) {
    return `0.0`;
  }

  return `${value > 0 ? '+' : '-'}${formatted}`;
}

function formatSignedPercent(value: number): string {
  const formatted = new Intl.NumberFormat('ko-KR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Math.abs(value));

  if (value === 0) {
    return '0.00%';
  }

  return `${value > 0 ? '+' : '-'}${formatted}%`;
}

function classifySentiment(value: number): { label: string; tone: string; description: string } {
  const palette = getFearGreedPalette(value);

  if (palette.tone === 'extreme_fear') {
    return { label: '극도의 공포', tone: 'extreme-fear', description: '방어 심리가 과도하게 확대된 구간' };
  }

  if (palette.tone === 'fear') {
    return { label: '공포', tone: 'fear', description: '리스크 회피가 우세한 구간' };
  }

  if (palette.tone === 'neutral') {
    return { label: '중립', tone: 'neutral', description: '심리 에너지가 균형을 찾는 구간' };
  }

  if (palette.tone === 'greed') {
    return { label: '탐욕', tone: 'greed', description: '상승 기대가 우세한 구간' };
  }

  return { label: '극도의 탐욕', tone: 'extreme-greed', description: '과열 기대가 누적된 구간' };
}

function subtractYears(dateText: string, years: number): string {
  const date = new Date(`${dateText}T00:00:00Z`);
  date.setUTCFullYear(date.getUTCFullYear() - years);
  return date.toISOString().slice(0, 10);
}

function findNearestStart(data: ChartPoint[], targetDate: string): ChartPoint {
  const point = data.find((item) => item.isoDate >= targetDate);
  if (!point) {
    throw new Error(`가시 범위 시작점을 찾을 수 없습니다: ${targetDate}`);
  }

  return point;
}

function buildSummaryStats(data: ChartPoint[]): SummaryStats {
  if (data.length < 2) {
    throw new Error('차트 렌더링에 필요한 과거 데이터가 부족합니다.');
  }

  const values = data.map((item) => item.value);

  return {
    latest: data[data.length - 1].value,
    previous: data[data.length - 2].value,
    high: Math.max(...values),
    low: Math.min(...values),
    start: data[0].isoDate,
    end: data[data.length - 1].isoDate,
  };
}

function buildVisibleStats(data: ChartPoint[], from: string, to: string): VisibleStats {
  const points = data.filter((item) => item.isoDate >= from && item.isoDate <= to);
  if (points.length < 2) {
    throw new Error(`가시 범위 통계를 계산할 데이터가 부족합니다: ${from} ~ ${to}`);
  }

  const first = points[0].value;
  const last = points[points.length - 1].value;
  const change = last - first;
  const changeRate = first === 0 ? 0 : (change / first) * 100;

  return {
    change,
    changeRate,
    start: points[0].isoDate,
    end: points[points.length - 1].isoDate,
  };
}

function buildSegmentSeries(data: ChartPoint[]) {
  const runsByTone = new Map(
    FEAR_GREED_PALETTE.map((palette) => [palette.tone, [] as Array<Array<LineData<Time>>>]),
  );
  const activeRuns = new Map(
    FEAR_GREED_PALETTE.map((palette) => [palette.tone, null as Array<LineData<Time>> | null]),
  );

  for (let index = 0; index < data.length - 1; index += 1) {
    const current = data[index];
    const next = data[index + 1];
    const splitPoints = buildSplitPoints(current, next);

    for (let splitIndex = 0; splitIndex < splitPoints.length - 1; splitIndex += 1) {
      const startPoint = splitPoints[splitIndex];
      const endPoint = splitPoints[splitIndex + 1];
      const midValue = (startPoint.value + endPoint.value) / 2;
      const tone = getFearGreedPalette(midValue).tone;
      const run = activeRuns.get(tone);

      if (!run) {
        activeRuns.set(tone, [
          { time: startPoint.time, value: startPoint.value },
          { time: endPoint.time, value: endPoint.value },
        ]);
      } else {
        const lastPoint = run[run.length - 1];
        if (lastPoint.time !== startPoint.time || lastPoint.value !== startPoint.value) {
          run.push({ time: startPoint.time, value: startPoint.value });
        }
        run.push({ time: endPoint.time, value: endPoint.value });
      }

      activeRuns.forEach((activeRun, activeTone) => {
        if (activeTone !== tone && activeRun) {
          runsByTone.get(activeTone)?.push(activeRun);
          activeRuns.set(activeTone, null);
        }
      });
    }
  }

  activeRuns.forEach((run, tone) => {
    if (run) {
      runsByTone.get(tone)?.push(run);
    }
  });

  return FEAR_GREED_PALETTE.map((palette) => runsByTone.get(palette.tone) ?? []);
}

function buildSplitPoints(current: ChartPoint, next: ChartPoint): SegmentPoint[] {
  if (current.value === next.value) {
    return [
      { time: current.time, value: current.value },
      { time: next.time, value: next.value },
    ];
  }

  const lower = Math.min(current.value, next.value);
  const upper = Math.max(current.value, next.value);
  const thresholds = SEGMENT_THRESHOLDS
    .filter((threshold) => threshold > lower && threshold < upper)
    .sort((left, right) => (current.value < next.value ? left - right : right - left));

  const splitPoints: SegmentPoint[] = [{ time: current.time, value: current.value }];

  thresholds.forEach((threshold) => {
    const ratio = (threshold - current.value) / (next.value - current.value);
    const interpolatedTime = Math.round(
      current.time + (next.time - current.time) * ratio,
    ) as UTCTimestamp;

    splitPoints.push({
      time: interpolatedTime,
      value: threshold,
    });
  });

  splitPoints.push({ time: next.time, value: next.value });

  return splitPoints;
}

export default function GeneralChart({ compactHeader = false }: GeneralChartProps) {
  const chartShellRef = useRef<HTMLDivElement>(null);
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const dataRef = useRef<ChartPoint[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeRange, setActiveRange] = useState<RangeKey>('1Y');
  const [summary, setSummary] = useState<SummaryStats | null>(null);
  const [visibleStats, setVisibleStats] = useState<VisibleStats | null>(null);
  const [hoveredPoint, setHoveredPoint] = useState<ChartPoint | null>(null);

  useEffect(() => {
    if (!chartContainerRef.current || !chartShellRef.current) {
      return;
    }

    let mounted = true;
    let resizeObserver: ResizeObserver | null = null;
    let handleCrosshairMove: ((param: MouseEventParams<Time>) => void) | null = null;
    let handleVisibleRangeChange: ((range: { from: Time; to: Time } | null) => void) | null = null;

    const renderChart = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch('/api/fear-greed/history');
        if (!response.ok) {
          throw new Error(`과거 데이터 조회에 실패했습니다. status=${response.status}`);
        }

        const payload = assertHistoryData(await response.json());
        const normalizedData = normalizeHistoryData(payload);
        const summaryStats = buildSummaryStats(normalizedData);

        if (!mounted || !chartContainerRef.current || !chartShellRef.current) {
          return;
        }

        dataRef.current = normalizedData;
        setSummary(summaryStats);
        setHoveredPoint(normalizedData[normalizedData.length - 1]);
        setVisibleStats(
          buildVisibleStats(normalizedData, summaryStats.start, summaryStats.end),
        );

        const segmentedSeriesData = buildSegmentSeries(normalizedData);

        const chart = createChart(chartContainerRef.current, {
          autoSize: true,
          height: 520,
          layout: {
            background: { type: ColorType.Solid, color: 'transparent' },
            textColor: '#94a3b8',
          },
          grid: {
            vertLines: { color: 'rgba(148, 163, 184, 0.06)' },
            horzLines: { color: 'rgba(148, 163, 184, 0.08)' },
          },
          crosshair: {
            mode: CrosshairMode.Normal,
            vertLine: {
              color: 'rgba(148, 163, 184, 0.30)',
              width: 1,
              style: LineStyle.Dashed,
              labelBackgroundColor: '#0f172a',
            },
            horzLine: {
              color: 'rgba(148, 163, 184, 0.20)',
              width: 1,
              style: LineStyle.Dotted,
              labelBackgroundColor: '#0f172a',
            },
          },
          rightPriceScale: {
            borderVisible: false,
            scaleMargins: {
              top: 0.16,
              bottom: 0.10,
            },
            mode: PriceScaleMode.Normal,
            minimumWidth: 70,
          },
          timeScale: {
            borderVisible: false,
            timeVisible: false,
            rightOffset: 6,
            barSpacing: 8,
            minBarSpacing: 0.35,
            fixLeftEdge: false,
            fixRightEdge: false,
          },
          localization: {
            locale: 'ko-KR',
            timeFormatter: (time: Time) => {
              return formatDateLabel(timeToIsoDate(time));
            },
          },
          handleScroll: {
            mouseWheel: true,
            pressedMouseMove: true,
            horzTouchDrag: true,
            vertTouchDrag: false,
          },
          handleScale: {
            axisPressedMouseMove: true,
            mouseWheel: true,
            pinch: true,
          },
        });

        const ghostSeries = chart.addSeries(LineSeries, {
          title: 'CNN 공포탐욕지수',
          color: 'rgba(12, 12, 12, 0.14)',
          lineWidth: 3,
          crosshairMarkerVisible: true,
          crosshairMarkerRadius: 5,
          crosshairMarkerBorderColor: '#f97316',
          crosshairMarkerBackgroundColor: '#0f172a',
          lastValueVisible: true,
          priceLineVisible: true,
          priceLineColor: '#f97316',
          priceLineWidth: 1,
          priceLineStyle: LineStyle.Dashed,
          priceFormat: {
            type: 'price',
            precision: 1,
            minMove: 0.1,
          },
        });

        ghostSeries.setData(normalizedData);

        FEAR_GREED_PALETTE.forEach((palette, index) => {
          segmentedSeriesData[index].forEach((run) => {
            const segmentSeries = chart.addSeries(LineSeries, {
              color: palette.text,
              lineWidth: 4,
              crosshairMarkerVisible: false,
              lastValueVisible: false,
              priceLineVisible: false,
            });

            segmentSeries.setData(run);
          });
        });

        ghostSeries.createPriceLine({
          price: 25,
          color: 'rgba(249, 115, 22, 0.55)',
          lineWidth: 1,
          lineStyle: LineStyle.Dashed,
          axisLabelVisible: true,
          title: '극공포',
        });

        ghostSeries.createPriceLine({
          price: 50,
          color: 'rgba(110, 110, 110, 0.45)',
          lineWidth: 1,
          lineStyle: LineStyle.Dotted,
          axisLabelVisible: true,
          title: '중립',
        });

        ghostSeries.createPriceLine({
          price: 75,
          color: 'rgba(61, 166, 114, 0.55)',
          lineWidth: 1,
          lineStyle: LineStyle.Dashed,
          axisLabelVisible: true,
          title: '극탐욕',
        });

        const latest = normalizedData[normalizedData.length - 1];
        const initialFrom = findNearestStart(
          normalizedData,
          subtractYears(latest.isoDate, 1),
        );

        chart.timeScale().setVisibleRange({
          from: initialFrom.time,
          to: latest.time,
        });

        setVisibleStats(
          buildVisibleStats(normalizedData, initialFrom.isoDate, latest.isoDate),
        );

        handleCrosshairMove = (param: MouseEventParams<Time>) => {
          if (!mounted) {
            return;
          }

          if (param.time === undefined) {
            setHoveredPoint(dataRef.current[dataRef.current.length - 1] ?? null);
            return;
          }

          const timeText = timeToIsoDate(param.time);

          const match = dataRef.current.find((item) => item.isoDate === timeText);
          if (match) {
            setHoveredPoint(match);
          }
        };

        handleVisibleRangeChange = (range: { from: Time; to: Time } | null) => {
          if (!mounted || !range) {
            return;
          }

          const from = timeToIsoDate(range.from);
          const to = timeToIsoDate(range.to);

          try {
            setVisibleStats(buildVisibleStats(dataRef.current, from, to));
          } catch {
            return;
          }
        };

        chart.subscribeCrosshairMove(handleCrosshairMove);
        chart.timeScale().subscribeVisibleTimeRangeChange(handleVisibleRangeChange);

        resizeObserver = new ResizeObserver(() => {
          chart.timeScale().scrollToRealTime();
        });
        resizeObserver.observe(chartShellRef.current);

        chartRef.current = chart;

        if (mounted) {
          setLoading(false);
        }
      } catch (caughtError) {
        console.error('Chart Error:', caughtError);
        if (mounted) {
          setError(caughtError instanceof Error ? caughtError.message : '차트 렌더링 중 알 수 없는 오류가 발생했습니다.');
          setLoading(false);
        }
      }
    };

    const cleanupPromise = renderChart();

    return () => {
      mounted = false;
      resizeObserver?.disconnect();
      cleanupPromise?.catch(() => undefined);
      if (chartRef.current && handleCrosshairMove) {
        chartRef.current.unsubscribeCrosshairMove(handleCrosshairMove);
      }
      if (chartRef.current && handleVisibleRangeChange) {
        chartRef.current.timeScale().unsubscribeVisibleTimeRangeChange(handleVisibleRangeChange);
      }
      chartRef.current?.remove();
      chartRef.current = null;
    };
  }, []);

  const hoveredSentiment = useMemo(() => {
    if (!hoveredPoint) {
      return null;
    }

    return classifySentiment(hoveredPoint.value);
  }, [hoveredPoint]);

  const summarySentiment = useMemo(() => {
    if (!summary) {
      return null;
    }

    return classifySentiment(summary.latest);
  }, [summary]);

  const handleRangeChange = (range: RangeKey) => {
    if (!chartRef.current || dataRef.current.length === 0) {
      return;
    }

    setActiveRange(range);

    if (range === 'MAX') {
      chartRef.current.timeScale().fitContent();
      const first = dataRef.current[0];
      const last = dataRef.current[dataRef.current.length - 1];
      setVisibleStats(buildVisibleStats(dataRef.current, first.isoDate, last.isoDate));
      return;
    }

    const latest = dataRef.current[dataRef.current.length - 1];
    const years = Number(range.replace('Y', ''));
    const targetDate = subtractYears(latest.isoDate, years);
    const from = findNearestStart(dataRef.current, targetDate);

    chartRef.current.timeScale().setVisibleRange({
      from: from.time,
      to: latest.time,
    });

    setVisibleStats(buildVisibleStats(dataRef.current, from.isoDate, latest.isoDate));
  };

  if (error) {
    return (
      <div className="history-chart-shell">
        <div className="history-chart-error">
          <strong>차트 렌더링 실패</strong>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <section className="history-chart-shell" ref={chartShellRef}>
      <div className="history-chart-topbar">
        <div className="history-chart-headline">
          {!compactHeader && <div className="history-chart-kicker">CNN Fear & Greed Index</div>}
          <div className="history-chart-price-row">
            {!compactHeader && (
              <div className="history-chart-price-block">
                <strong>{summary ? formatNumber(summary.latest) : '--'}</strong>
                <span className={`history-sentiment-pill ${summarySentiment?.tone ?? 'neutral'}`}>
                  {summarySentiment?.label ?? '로딩 중'}
                </span>
              </div>
            )}
            <div className="history-chart-inline-stats">
              {compactHeader && (
                <span className={`history-sentiment-pill ${summarySentiment?.tone ?? 'neutral'}`}>
                  {summarySentiment?.label ?? '로딩 중'}
                </span>
              )}
              <span>전일 대비 {summary ? formatSignedNumber(summary.latest - summary.previous) : '--'}</span>
              <span>전체 최고 {summary ? formatNumber(summary.high) : '--'}</span>
              <span>전체 최저 {summary ? formatNumber(summary.low) : '--'}</span>
            </div>
          </div>
          <p className="history-chart-subtitle">
            {summary && summarySentiment
              ? `${formatDateLabel(summary.end)} 기준 ${summarySentiment.description}`
              : '15년 이상의 장기 심리 흐름을 시계열로 추적합니다.'}
          </p>
        </div>

        <div className="history-chart-range-tabs" role="tablist" aria-label="차트 기간 선택">
          {RANGE_OPTIONS.map((range) => (
            <button
              key={range}
              type="button"
              className={`history-range-tab ${activeRange === range ? 'active' : ''}`}
              onClick={() => handleRangeChange(range)}
            >
              {range}
            </button>
          ))}
        </div>
      </div>

      <div className="history-chart-panel">
        <div className="history-chart-overlay">
          {!compactHeader && (
            <div className="history-tooltip-card">
              <span className="history-tooltip-label">
                {hoveredPoint ? formatDateLabel(hoveredPoint.isoDate) : '날짜 대기 중'}
              </span>
              <strong>{hoveredPoint ? formatNumber(hoveredPoint.value) : '--'}</strong>
              <p>{hoveredSentiment?.label ?? '데이터를 불러오는 중입니다.'}</p>
            </div>
          )}

          <div className="history-threshold-legend">
            <span className="fear">극공포 25</span>
            <span className="neutral">중립 50</span>
            <span className="greed">극탐욕 75</span>
          </div>
        </div>

        {loading && (
          <div className="history-chart-loading">
            <div className="loading-spinner" />
            <p className="loading-text">차트 엔진과 과거 데이터를 동기화하는 중입니다.</p>
          </div>
        )}

        <div ref={chartContainerRef} className="history-chart-canvas" />
      </div>

      <div className="history-chart-footer">
        <div className="history-footer-block">
          <span>데이터 범위</span>
          <strong>
            {summary ? `${formatDateLabel(summary.start)} ~ ${formatDateLabel(summary.end)}` : '--'}
          </strong>
        </div>
        <div className="history-footer-block">
          <span>가시 구간</span>
          <strong>
            {visibleStats
              ? `${formatDateLabel(visibleStats.start)} ~ ${formatDateLabel(visibleStats.end)} / ${formatSignedNumber(visibleStats.change)} / ${formatSignedPercent(visibleStats.changeRate)}`
              : '--'}
          </strong>
        </div>
        <div className="history-footer-block">
          <span>조작 안내</span>
          <strong>휠 확대, 드래그 이동, 버튼 구간 점프</strong>
        </div>
      </div>
    </section>
  );
}
