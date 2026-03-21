import { NextResponse } from 'next/server';

export async function GET() {
    // Try fetching from CNN API
    try {
        const res = await fetch(
            'https://production.dataviz.cnn.io/index/fearandgreed/graphdata',
            {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
                    'Accept': 'application/json',
                },
                next: { revalidate: 300 },
            }
        );

        if (!res.ok) {
            throw new Error(`CNN API returned ${res.status}`);
        }

        const raw = await res.json();
        const fg = raw.fear_and_greed;
        const timeline = raw.fear_and_greed_historical?.data ?? [];

        const responseData = {
            score: fg.score,
            rating: fg.rating,
            previousClose: fg.previous_close,
            oneWeekAgo: fg.previous_1_week,
            oneMonthAgo: fg.previous_1_month,
            oneYearAgo: fg.previous_1_year,
            timeline: timeline.map((item: { x: number; y: number }) => ({
                timestamp: item.x,
                score: item.y,
            })),
            timestamp: new Date().toISOString(), // CNN doesn't give a specific live timestamp in this object, using fetch time
            _source: 'api',
            _cached: false,
        };

        return NextResponse.json(responseData);
    } catch (error) {
        console.error('Fear & Greed API error:', error);
        return NextResponse.json(
            { error: '공포 탐욕 지수 데이터를 가져올 수 없습니다 (No Data)' },
            { status: 500 }
        );
    }
}


