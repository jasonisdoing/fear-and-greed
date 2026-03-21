'use client';

import { useEffect, useMemo, useState } from 'react';
import { getFearGreedPalette } from '@/lib/fear-greed-theme';

type HistoryApiItem = {
  d: string;
  v: number;
};

type HistoryTableItem = {
  date: string;
  score: number;
  change: number | null;
};

const PAGE_SIZE = 10;

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

function normalizeHistoryData(items: HistoryApiItem[]): HistoryTableItem[] {
  const uniqueData = new Map<string, number>();

  [...items].reverse().forEach((item) => {
    uniqueData.set(item.d, item.v);
  });

  const ascItems = Array.from(uniqueData.entries())
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([date, score]) => ({ date, score }));

  return ascItems
    .map((item, index, array) => ({
      date: item.date,
      score: item.score,
      change: index === 0 ? null : item.score - array[index - 1].score,
    }))
    .reverse();
}

function formatDateLabel(value: string): string {
  return new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'Asia/Seoul',
  }).format(new Date(`${value}T00:00:00Z`));
}

function formatNumber(value: number): string {
  return new Intl.NumberFormat('ko-KR', {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(value);
}

function formatChange(value: number | null): string {
  if (value === null) {
    return '-';
  }

  if (value === 0) {
    return '0.0';
  }

  return `${value > 0 ? '+' : ''}${formatNumber(value)}`;
}

function getSentimentLabel(score: number): string {
  const tone = getFearGreedPalette(score).tone;

  if (tone === 'extreme_fear') {
    return '극공포';
  }

  if (tone === 'fear') {
    return '공포';
  }

  if (tone === 'neutral') {
    return '중립';
  }

  if (tone === 'greed') {
    return '탐욕';
  }

  return '극탐욕';
}

export default function HistoryDataTable() {
  const [rows, setRows] = useState<HistoryTableItem[]>([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchRows = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch('/api/fear-greed/history');
        if (!response.ok) {
          throw new Error(`과거 데이터 조회에 실패했습니다. status=${response.status}`);
        }

        const payload = assertHistoryData(await response.json());
        setRows(normalizeHistoryData(payload));
      } catch (caughtError) {
        setError(caughtError instanceof Error ? caughtError.message : '과거 데이터를 불러오지 못했습니다.');
      } finally {
        setLoading(false);
      }
    };

    fetchRows().catch(() => undefined);
  }, []);

  const totalPages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));

  const paginatedRows = useMemo(() => {
    const startIndex = (page - 1) * PAGE_SIZE;
    return rows.slice(startIndex, startIndex + PAGE_SIZE);
  }, [page, rows]);

  useEffect(() => {
    setPage((currentPage) => Math.min(currentPage, totalPages));
  }, [totalPages]);

  if (loading) {
    return (
      <div className="history-table-shell">
        <div className="loading-container" style={{ minHeight: '280px' }}>
          <div className="loading-spinner" />
          <p className="loading-text">과거 데이터를 불러오는 중입니다.</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="history-table-shell">
        <div className="history-chart-error">
          <strong>테이블 렌더링 실패</strong>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <section className="history-table-shell">
      <div className="history-table-meta">
        <span>전체 {rows.length.toLocaleString('ko-KR')}건</span>
        <span>페이지 {page} / {totalPages}</span>
      </div>

      <div className="history-table-wrap">
        <table className="history-table">
          <thead>
            <tr>
              <th>날짜</th>
              <th>점수</th>
              <th>구간</th>
              <th>전일 대비</th>
            </tr>
          </thead>
          <tbody>
            {paginatedRows.map((row) => {
              const palette = getFearGreedPalette(row.score);

              return (
                <tr key={row.date}>
                  <td>{formatDateLabel(row.date)}</td>
                  <td>{formatNumber(row.score)}</td>
                  <td>
                    <span
                      className="history-table-tone"
                      style={{
                        color: palette.text,
                        background: palette.fill,
                        borderColor: palette.text,
                      }}
                    >
                      {getSentimentLabel(row.score)}
                    </span>
                  </td>
                  <td className={row.change !== null && row.change > 0 ? 'positive' : row.change !== null && row.change < 0 ? 'negative' : ''}>
                    {formatChange(row.change)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="history-table-pagination">
        <button
          type="button"
          className="history-table-page-button"
          onClick={() => setPage((currentPage) => Math.max(1, currentPage - 1))}
          disabled={page === 1}
        >
          이전
        </button>
        <span className="history-table-page-status">
          {page} / {totalPages}
        </span>
        <button
          type="button"
          className="history-table-page-button"
          onClick={() => setPage((currentPage) => Math.min(totalPages, currentPage + 1))}
          disabled={page === totalPages}
        >
          다음
        </button>
      </div>
    </section>
  );
}
