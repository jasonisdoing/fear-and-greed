export type FearGreedTone =
  | 'extreme_fear'
  | 'fear'
  | 'neutral'
  | 'greed'
  | 'extreme_greed';

export type FearGreedPalette = {
  tone: FearGreedTone;
  label: string;
  shortLabel: string;
  fill: string;
  stroke: string;
  text: string;
  emoji: string;
  start: number;
  end: number;
};

export const FEAR_GREED_PALETTE: FearGreedPalette[] = [
  {
    tone: 'extreme_fear',
    label: 'Extreme Fear',
    shortLabel: 'EF',
    fill: '#ff817080',
    stroke: '#9e092f',
    text: '#f97316',
    emoji: '😱',
    start: 0,
    end: 25,
  },
  {
    tone: 'fear',
    label: 'Fear',
    shortLabel: 'F',
    fill: '#ffb9a180',
    stroke: '#cd6200',
    text: '#cd6200',
    emoji: '😨',
    start: 25,
    end: 45,
  },
  {
    tone: 'neutral',
    label: 'Neutral',
    shortLabel: 'N',
    fill: '#e6e6e6',
    stroke: '#6e6e6e',
    text: '#6e6e6e',
    emoji: '😐',
    start: 45,
    end: 55,
  },
  {
    tone: 'greed',
    label: 'Greed',
    shortLabel: 'G',
    fill: '#b9ede9',
    stroke: '#3da672',
    text: '#3da672',
    emoji: '😃',
    start: 55,
    end: 75,
  },
  {
    tone: 'extreme_greed',
    label: 'Extreme Greed',
    shortLabel: 'EG',
    fill: '#8cd6c3',
    stroke: '#2b7a53',
    text: '#2b7a53',
    emoji: '🤑',
    start: 75,
    end: 100,
  },
];

export function getFearGreedPalette(score: number): FearGreedPalette {
  const lastIndex = FEAR_GREED_PALETTE.length - 1;

  return FEAR_GREED_PALETTE.find((item, index) => {
    if (score < item.start) {
      return false;
    }

    if (index === lastIndex) {
      return score <= item.end;
    }

    return score < item.end;
  }) ?? FEAR_GREED_PALETTE[lastIndex];
}
