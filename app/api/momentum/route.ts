import { NextRequest, NextResponse } from 'next/server';

interface YahooChartResult {
    timestamp: number[];
    indicators: {
        quote: Array<{
            close: (number | null)[];
        }>;
    };
}

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const symbol = searchParams.get('symbol') || '^GSPC';
    const smaDays = parseInt(searchParams.get('sma') || '125', 10);

    // Try fetching from Yahoo Finance
    try {
        const res = await fetch(
            `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?range=2y&interval=1d`,
            {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
                },
                next: { revalidate: 300 },
            }
        );

        if (!res.ok) {
            throw new Error(`Yahoo Finance returned ${res.status}`);
        }

        const data = await res.json();
        const result: YahooChartResult = data.chart?.result?.[0];

        if (!result?.timestamp || !result?.indicators?.quote?.[0]?.close) {
            throw new Error('Invalid chart data');
        }

        const timestamps = result.timestamp;
        const rawCloses = result.indicators.quote[0].close;

        const validData: { date: string; close: number }[] = [];
        timestamps.forEach((ts: number, i: number) => {
            if (rawCloses[i] !== null) {
                validData.push({
                    date: new Date(ts * 1000).toISOString().split('T')[0],
                    close: rawCloses[i] as number,
                });
            }
        });

        // Calculate SMA
        const allCloses = validData.map(d => d.close);
        const smaValues: (number | null)[] = allCloses.map((_, i) => {
            if (i < smaDays - 1) return null;
            const window = allCloses.slice(i - smaDays + 1, i + 1);
            return window.reduce((a, b) => a + b, 0) / smaDays;
        });

        const displayLength = Math.min(252, validData.length);
        const startIdx = validData.length - displayLength;

        const dates = validData.slice(startIdx).map(d => d.date);
        const closes = allCloses.slice(startIdx);
        const sma125 = smaValues.slice(startIdx);

        const currentPrice = closes[closes.length - 1];
        const currentSMA = sma125[sma125.length - 1] ?? currentPrice;

        const responseData = {
            dates,
            closes,
            sma125,
            currentPrice,
            currentSMA,
            signal: currentPrice >= currentSMA ? 'BULLISH(강세)' : 'BEARISH(약세)',
            timestamp: new Date(timestamps[timestamps.length - 1] * 1000).toISOString(),
            _source: 'api',
            _cached: false,
        };

        return NextResponse.json(responseData);
    } catch (error) {
        console.error('Momentum API error:', error);
        return NextResponse.json(
            { error: '모멘텀 데이터를 계산할 수 없습니다 (No Data)' },
            { status: 500 }
        );
    }
}
