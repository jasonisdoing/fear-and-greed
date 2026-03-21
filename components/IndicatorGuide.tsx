interface IndicatorGuideProps {
  currentPath: string;
}

const GUIDE_COPY: Record<string, { title: string; items: string[] }> = {
  '/sp500-momentum': {
    title: '이 차트를 이렇게 읽어보세요',
    items: [
      '이 지표는 현재 가격이 125일 이동평균선보다 위에 있는지 아래에 있는지를 통해 중기 추세의 방향을 보여줍니다.',
      '가격이 이동평균선 위에서 계속 벌어지면 추세가 강한 구간일 수 있지만, 너무 멀어지면 되돌림 가능성도 같이 생각해야 합니다.',
      '가격이 이동평균선 아래에 머무는 기간이 길어지면 반등이 나와도 추세 전환보다 단기 기술적 반등일 가능성이 있습니다.',
      '실시간 선물이나 공포탐욕지수와 함께 보면 추세, 단기 심리, 현재 가격 움직임을 한 번에 엮어 해석하기 좋습니다.',
    ],
  },
  '/fear-greed': {
    title: '이 차트를 이렇게 읽어보세요',
    items: [
      'Fear & Greed Index는 투자 심리가 공포 쪽에 가까운지, 탐욕 쪽에 가까운지를 한 숫자로 압축해 보여줍니다.',
      '극단 공포 구간은 공포가 과도해진 상태일 수 있고, 극단 탐욕 구간은 낙관이 과열된 상태일 수 있어 반대로 해석될 때도 있습니다.',
      '단일 숫자보다 최근 며칠 혹은 몇 주 동안 점수가 어떤 방향으로 이동하는지 보는 편이 더 유용합니다.',
      'VIX, S&P 500, 모멘텀 지표와 함께 보면 심리 변화가 실제 가격과 추세에 얼마나 반영되고 있는지 확인할 수 있습니다.',
    ],
  },
};

export default function IndicatorGuide({ currentPath }: IndicatorGuideProps) {
  const guide = GUIDE_COPY[currentPath];

  if (!guide) {
    return null;
  }

  return (
    <section className="indicator-guide">
      <h2 className="indicator-guide-title">{guide.title}</h2>
      <ul className="indicator-guide-list">
        {guide.items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </section>
  );
}
