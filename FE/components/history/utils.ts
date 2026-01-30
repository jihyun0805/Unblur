/** 하트 clipPath(채워진 비율)용. 하트 밑 "n/4R" 텍스트는 그리지 않음. */
export function getRoundProgress(rounds: number): number {
  const maxRounds = 4
  return Math.min((rounds / maxRounds) * 100, 100)
}

export function getTemperatureColor(clarity: number): string {
  return "text-primary"
}

export function getTemperatureLabel(clarity: number): string {
  if (clarity >= 80) return "매우 따뜻한 매너"
  if (clarity >= 65) return "따뜻한 매너"
  if (clarity >= 50) return "보통 매너"
  if (clarity >= 35) return "조금 차가운 매너"
  return "차가운 매너"
}
