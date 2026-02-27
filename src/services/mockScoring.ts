export interface VocalMetrics {
  score: number;
  rhythm: number;
  stability: number;
  vibrato: number;
}

export function calculateMockScore(duration: number): VocalMetrics {
  // Simulate a score based on the duration of singing
  // In a real app, this would compare the user's pitch curve to the standard melody
  
  const baseScore = 60 + Math.random() * 30; // 60-90
  const rhythm = 70 + Math.random() * 25; // 70-95
  const stability = 50 + Math.random() * 40; // 50-90
  const vibrato = 40 + Math.random() * 50; // 40-90

  return {
    score: Math.round(baseScore),
    rhythm: Math.round(rhythm),
    stability: Math.round(stability),
    vibrato: Math.round(vibrato),
  };
}
