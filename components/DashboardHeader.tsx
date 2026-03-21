'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import ThemeToggle from '@/components/ThemeToggle';
import { FearGreedData } from '@/types';
import { FEAR_GREED_PALETTE, getFearGreedPalette } from '@/lib/fear-greed-theme';

export default function DashboardSidebar() {
  const pathname = usePathname();
  const [data, setData] = useState<FearGreedData | null>(null);

  useEffect(() => {
    fetch('/api/fear-greed')
      .then(res => res.json())
      .then(d => setData(d))
      .catch(err => console.error('Failed to fetch FG in header', err));
  }, []);

  const navItems = [
    { path: '/', label: 'CNN 공포 탐욕 지수', shortLabel: '공포 탐욕 지수', icon: '🧭' },
    { path: '/history', label: '과거 데이터', icon: '📊' },
    { path: '/sp500-momentum', label: 'S&P 500 모멘텀', icon: '📈' },
    { path: '/guide', label: '가이드', icon: '🗂️' },
  ];

  return (
    <aside className="dashboard-sidebar">
      <div className="sidebar-scrollable-area">
        <div className="sidebar-header-row">
          <div className="dashboard-brand">
            <Link href="/" style={{ textDecoration: 'none' }}>
              <h1>Fear & Greed</h1>
              {data ? (
                <div className="mobile-mini-gauge-container">
                  <div className="mini-gauge-row">
                    <span className="mini-gauge-score" style={{ color: getFearGreedPalette(data.score).text }}>
                      {data.score.toFixed(1)}
                    </span>
                    <span className="mini-gauge-label">
                      ({getFearGreedPalette(data.score).label})
                    </span>
                  </div>
                  <div className="segmented-gauge-outer">
                    <div className="segmented-gauge-container">
                      {FEAR_GREED_PALETTE.map((seg, i) => (
                        <div key={i} className="gauge-segment" style={{ backgroundColor: seg.fill }}>
                          {data.score >= seg.start && data.score < (i === 4 ? 101 : seg.end) && (
                            <span className="gauge-segment-emoji">{getFearGreedPalette(data.score).emoji}</span>
                          )}
                        </div>
                      ))}
                    </div>
                    <div className="gauge-labels-row">
                      <span>FEAR</span>
                      <span>GREED</span>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="subtitle">CNN 공포 탐욕지수</p>
              )}
            </Link>
          </div>
        </div>

        <nav className="sidebar-nav">
          {navItems.map((item) => {
            const isActive = pathname === item.path;
            return (
              <Link
                key={item.path}
                href={item.path}
                className={`nav-item ${isActive ? 'active' : ''}`}
              >
                <span className="nav-icon">{item.icon}</span>
                <span className="nav-label-desktop">{item.label}</span>
                <span className="nav-label-mobile">{item.shortLabel ?? item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="theme-toggle-desktop">
        <ThemeToggle />
      </div>
    </aside>
  );
}
