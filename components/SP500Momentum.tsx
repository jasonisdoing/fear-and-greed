'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ColorType,
  createChart,
  CrosshairMode,
  LineSeries,
  LineStyle,
  type IChartApi,
  type ISeriesApi,
  type LineData,
  type MouseEventParams,
  type Time,
} from 'lightweight-charts';
import { MomentumData } from '@/types';

interface Props {
  data: MomentumData | null;
  loading: boolean;
}

type MomentumPoint = LineData<Time> & {
  isoDate: string;
};

type HoverState = {
  isoDate: string;
  close: number;
  sma: number | null;
};

function normalizeMomentumData(data: MomentumData): {
  closeSeries: MomentumPoint[];
  smaSeries: MomentumPoint[];
} {
  const deduped = new Map<string, { close: number; sma: number | null }>();

  data.dates.forEach((date, index) => {
    deduped.set(date, {
      close: data.closes[index],
      sma: data.sma125[index] ?? null,
    });
  });

  const sortedEntries = Array.from(deduped.entries())
    .sort(([left], [right]) => left.localeCompare(right));

  return {
    closeSeries: sortedEntries.map(([date, values]) => ({
      time: date,
      value: values.close,
      isoDate: date,
    })),
    smaSeries: sortedEntries.flatMap(([date, values]) => {
      if (values.sma === null) {
        return [];
      }

      return [{
        time: date,
        value: values.sma,
        isoDate: date,
      }];
    }),
  };
}

function formatNumber(value: number): string {
  return value.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function formatDateLabel(value: string): string {
  return new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    timeZone: 'Asia/Seoul',
  }).format(new Date(`${value}T00:00:00Z`));
}

function extractIsoDate(time: Time): string {
  if (typeof time === 'string') {
    return time;
  }

  if ('year' in time) {
    return `${time.year}-${String(time.month).padStart(2, '0')}-${String(time.day).padStart(2, '0')}`;
  }

  return new Date(time * 1000).toISOString().slice(0, 10);
}

export default function SP500Momentum({ data, loading }: Props) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const closeSeriesRef = useRef<ISeriesApi<'Line', Time> | null>(null);
  const smaSeriesRef = useRef<ISeriesApi<'Line', Time> | null>(null);
  const closeDataRef = useRef<MomentumPoint[]>([]);
  const smaMapRef = useRef<Map<string, number>>(new Map());
  const [hoveredIsoDate, setHoveredIsoDate] = useState<string | null>(null);

  const isBullish = useMemo(() => data?.signal.startsWith('BULLISH') ?? false, [data]);
  const hovered = useMemo<HoverState | null>(() => {
    if (!data || data.dates.length === 0) {
      return null;
    }

    const targetDate = hoveredIsoDate ?? data.dates[data.dates.length - 1];
    const index = data.dates.findIndex((date) => date === targetDate);
    const safeIndex = index === -1 ? data.dates.length - 1 : index;

    return {
      isoDate: data.dates[safeIndex],
      close: data.closes[safeIndex],
      sma: data.sma125[safeIndex] ?? null,
    };
  }, [data, hoveredIsoDate]);

  useEffect(() => {
    if (!data || !chartContainerRef.current) {
      return;
    }

    const { closeSeries: closeSeriesData, smaSeries: smaSeriesData } = normalizeMomentumData(data);
    const smaMap = new Map(smaSeriesData.map((item) => [item.isoDate, item.value]));

    closeDataRef.current = closeSeriesData;
    smaMapRef.current = smaMap;
    const chart = createChart(chartContainerRef.current, {
      autoSize: true,
      height: 520,
      layout: {
        background: { type: ColorType.Solid, color: 'transparent' },
        textColor: '#94a3b8',
      },
      grid: {
        vertLines: { color: 'rgba(148, 163, 184, 0.03)' },
        horzLines: { color: 'rgba(148, 163, 184, 0.10)' },
      },
      crosshair: {
        mode: CrosshairMode.Normal,
        vertLine: {
          color: 'rgba(148, 163, 184, 0.28)',
          width: 1,
          style: LineStyle.Dashed,
          labelBackgroundColor: '#0f172a',
        },
        horzLine: {
          color: 'rgba(148, 163, 184, 0.16)',
          width: 1,
          style: LineStyle.Dotted,
          labelBackgroundColor: '#0f172a',
        },
      },
      rightPriceScale: {
        borderVisible: false,
        scaleMargins: {
          top: 0.10,
          bottom: 0.12,
        },
        minimumWidth: 78,
      },
      timeScale: {
        borderVisible: false,
        timeVisible: false,
        secondsVisible: false,
        rightOffset: 2,
        barSpacing: 8,
        minBarSpacing: 3,
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
      localization: {
        locale: 'ko-KR',
      },
    });

    const closeSeries = chart.addSeries(LineSeries, {
      title: 'S&P 500',
      color: '#0b74af',
      lineWidth: 3,
      lastValueVisible: false,
      priceLineVisible: false,
      crosshairMarkerRadius: 4,
      crosshairMarkerBorderColor: '#0b74af',
      crosshairMarkerBackgroundColor: '#ffffff',
    });

    const smaSeries = chart.addSeries(LineSeries, {
      title: '125-day SMA',
      color: '#f06c00',
      lineWidth: 3,
      lineStyle: LineStyle.LargeDashed,
      lastValueVisible: false,
      priceLineVisible: false,
      crosshairMarkerVisible: false,
    });

    closeSeries.setData(closeSeriesData);
    smaSeries.setData(smaSeriesData);
    chart.timeScale().fitContent();

    const handleCrosshairMove = (param: MouseEventParams<Time>) => {
      if (!param.time) {
        setHoveredIsoDate(null);
        return;
      }

      const isoDate = extractIsoDate(param.time);
      const closePoint = closeDataRef.current.find((item) => item.isoDate === isoDate);
      if (!closePoint) {
        return;
      }

      setHoveredIsoDate(isoDate);
    };

    chart.subscribeCrosshairMove(handleCrosshairMove);

    chartRef.current = chart;
    closeSeriesRef.current = closeSeries;
    smaSeriesRef.current = smaSeries;

    return () => {
      chart.unsubscribeCrosshairMove(handleCrosshairMove);
      chart.remove();
      chartRef.current = null;
      closeSeriesRef.current = null;
      smaSeriesRef.current = null;
    };
  }, [data]);

  if (loading) {
    return (
      <div className="momentum-panel momentum-panel-loading">
        <div className="loading-spinner" />
        <span className="loading-text" style={{ marginTop: '1rem' }}>Market Momentum 데이터를 불러오는 중...</span>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="loading-container">
        <span className="loading-text">데이터를 가져올 수 없습니다.</span>
      </div>
    );
  }

  return (
    <section className="momentum-panel">
      <div className="momentum-panel-header">
        <div className="page-intro">
          <h1 className="page-intro-title">S&amp;P 500 Momentum</h1>
          <p className="page-intro-description">
            S&amp;P 500과 125일 이동평균선을 비교해 중기 추세 강도를 확인합니다.
          </p>
        </div>
        <div className={`momentum-signal ${isBullish ? 'bullish' : 'bearish'}`}>
          {data.signal}
        </div>
      </div>

      <div className="momentum-metrics">
        <div className="momentum-metric">
          <div className="momentum-metric-label">
            S&P 500 Price
          </div>
          <div className="momentum-metric-value momentum-metric-value-primary">
            {formatNumber(data.currentPrice)}
          </div>
        </div>
        <div className="momentum-metric">
          <div className="momentum-metric-label">
            125-day SMA
          </div>
          <div className="momentum-metric-inline">
            <div className="momentum-metric-value momentum-metric-value-secondary">
              {formatNumber(data.currentSMA)}
            </div>
            <div className={`momentum-metric-delta ${isBullish ? 'bullish' : 'bearish'}`}>
              (125일 이동평균선 대비 {Math.abs((data.currentPrice - data.currentSMA) / data.currentSMA * 100).toFixed(2)}% {isBullish ? '높음' : '낮음'})
            </div>
          </div>
        </div>
      </div>

      <div className="momentum-plot-wrap">
        <div className="momentum-chart-toolbar">
          <div className="momentum-chart-legend">
            <span className="momentum-legend-item">
              <i className="momentum-legend-line momentum-legend-line-primary" />
              S&amp;P 500
            </span>
            <span className="momentum-legend-item">
              <i className="momentum-legend-line momentum-legend-line-secondary" />
              125-day SMA
            </span>
          </div>

          <div className="momentum-hover-meta">
            <span>{hovered ? formatDateLabel(hovered.isoDate) : '--'}</span>
            <span>종가 {hovered ? formatNumber(hovered.close) : '--'}</span>
            <span>SMA {hovered?.sma !== null && hovered?.sma !== undefined ? formatNumber(hovered.sma) : '--'}</span>
          </div>
        </div>

        <div ref={chartContainerRef} className="momentum-chart-canvas" />
      </div>
    </section>
  );
}
