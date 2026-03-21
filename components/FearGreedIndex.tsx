'use client';

import dynamic from 'next/dynamic';
import { FearGreedData } from '@/types';
import { FEAR_GREED_PALETTE, getFearGreedPalette } from '@/lib/fear-greed-theme';

const Plot = dynamic(() => import('react-plotly.js'), { ssr: false });

interface Props {
    data: FearGreedData | null;
    loading: boolean;
    showTimeline?: boolean;
    compactHeader?: boolean;
    description?: string;
}

const SEGMENTS = FEAR_GREED_PALETTE.map((segment) => ({
    ...segment,
    label: segment.label.toUpperCase(),
    width: `${segment.end - segment.start}%`,
}));

export default function FearGreedIndex({ data, loading, showTimeline = true, compactHeader = false, description }: Props) {
    if (loading) {
        return (
            <div className="fear-greed-panel fear-greed-panel-loading">
                <div className="loading-spinner" />
                <span className="loading-text" style={{ marginTop: '1rem' }}>Fear & Greed 데이터를 불러오는 중...</span>
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

    const rating = getFearGreedPalette(data.score);
    const markerPosition = `${data.score}%`;

    return (
        <section className="fear-greed-panel">
            <div className={`fear-greed-panel-header ${compactHeader ? 'compact' : ''}`}>
                <h2 className="fear-greed-panel-title">
                    CNN Fear & Greed Index
                </h2>
                {description && (
                    <p className="fear-greed-panel-description">
                        {description}
                    </p>
                )}
                <div className="fear-greed-panel-score" style={{ color: rating.text }}>
                    {data.score.toFixed(1)}
                </div>
                <div className="fear-greed-panel-rating" style={{ color: rating.text }}>
                    {rating.label}
                </div>
            </div>

            <div className="sentiment-bar-container">
                <div className="sentiment-labels">
                    {SEGMENTS.map(seg => (
                        <div
                            key={seg.label}
                            className="sentiment-label"
                            style={{ width: seg.width }}
                        >
                            {seg.label}
                        </div>
                    ))}
                </div>
                <div className="sentiment-bar">
                    {SEGMENTS.map(seg => (
                        <div
                            key={seg.label}
                            className="sentiment-segment"
                            style={{
                                width: seg.width,
                                background: seg.fill,
                            }}
                        />
                    ))}
                    <div className="score-marker" style={{ left: markerPosition }}>
                        <span style={{
                            fontSize: '24px',
                            textShadow: '0 0 3px #ffffff, 0 0 8px rgba(255, 255, 255, 0.5)',
                            pointerEvents: 'none'
                        }}>
                            {data.score <= 45 ? '😱' : data.score <= 55 ? '😃' : '🤑'}
                        </span>
                    </div>
                </div>
            </div>

            <div className="stats-grid fear-greed-stats-grid">
                <div className="stat-item fear-greed-stat-item">
                    <div className="stat-label">전일 종가</div>
                    <div className="stat-value">{data.previousClose.toFixed(1)}</div>
                </div>
                <div className="stat-item fear-greed-stat-item">
                    <div className="stat-label">1주 전</div>
                    <div className="stat-value">{data.oneWeekAgo.toFixed(1)}</div>
                </div>
                <div className="stat-item fear-greed-stat-item">
                    <div className="stat-label">1개월 전</div>
                    <div className="stat-value">{data.oneMonthAgo.toFixed(1)}</div>
                </div>
                <div className="stat-item fear-greed-stat-item">
                    <div className="stat-label">1년 전</div>
                    <div className="stat-value">{data.oneYearAgo.toFixed(1)}</div>
                </div>
            </div>

            {showTimeline && data.timeline && data.timeline.length > 0 && (
                <div className="fear-greed-chart-wrap">
                    <h3 className="fear-greed-chart-title">
                        최근 1년
                    </h3>
                    <Plot
                        data={[
                            {
                                x: data.timeline.map(t => new Date(t.timestamp)),
                                y: data.timeline.map(t => t.score),
                                type: 'scatter',
                                mode: 'lines',
                                fill: 'tozeroy',
                                fillcolor: `${rating.stroke}15`,
                                line: {
                                    color: rating.stroke,
                                    width: 2,
                                    shape: 'spline',
                                },
                                hovertemplate: '%{x|%Y-%m-%d}<br>Score: %{y:.1f}<extra></extra>',
                            },
                        ]}
                        layout={{
                            autosize: true,
                            height: 200,
                            dragmode: false,
                            margin: { l: 40, r: 20, t: 10, b: 30 },
                            paper_bgcolor: 'transparent',
                            plot_bgcolor: 'transparent',
                            xaxis: {
                                showgrid: false,
                                showline: false,
                                fixedrange: true,
                                color: '#64748b',
                                tickfont: { size: 10, color: '#64748b', family: 'Inter' },
                            },
                            yaxis: {
                                showgrid: true,
                                gridcolor: 'rgba(148, 163, 184, 0.10)',
                                showline: false,
                                fixedrange: true,
                                range: [0, 100],
                                color: '#64748b',
                                tickfont: { size: 10, color: '#64748b', family: 'Inter' },
                            },
                            shapes: [
                                { type: 'line', x0: 0, x1: 1, xref: 'paper', y0: 25, y1: 25, line: { color: 'rgba(148, 163, 184, 0.16)', dash: 'dot', width: 1 } },
                                { type: 'line', x0: 0, x1: 1, xref: 'paper', y0: 50, y1: 50, line: { color: 'rgba(148, 163, 184, 0.16)', dash: 'dot', width: 1 } },
                                { type: 'line', x0: 0, x1: 1, xref: 'paper', y0: 75, y1: 75, line: { color: 'rgba(148, 163, 184, 0.16)', dash: 'dot', width: 1 } },
                            ],
                            hovermode: 'x unified',
                            hoverlabel: {
                                bgcolor: '#1a1f35',
                                bordercolor: 'rgba(99, 102, 241, 0.3)',
                                font: { color: '#f1f5f9', family: 'Inter', size: 12 },
                            },
                        }}
                        config={{ displayModeBar: false, responsive: true }}
                        useResizeHandler={true}
                        style={{ width: '100%', height: '100%' }}
                    />
                </div>
            )}
        </section>
    );
}
