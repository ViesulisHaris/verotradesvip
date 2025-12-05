export const ALL_EMOTIONS = [
  'FOMO',
  'REVENGE',
  'TILT',
  'OVERRISK',
  'PATIENCE',
  'REGRET',
  'DISCIPLINE',
  'CONFIDENT',
  'ANXIOUS',
  'NEUTRAL'
] as const;

export type Emotion = typeof ALL_EMOTIONS[number];