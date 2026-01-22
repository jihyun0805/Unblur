/** 하트 clipPath(채워진 비율)용. 하트 밑 "n/4R" 텍스트는 그리지 않음. */
export function getRoundProgress(rounds: number): number {
  const maxRounds = 4
  return Math.min((rounds / maxRounds) * 100, 100)
}

export function getTemperatureColor(temp: number): string {
  if (temp >= 40) return "text-red-500"
  if (temp >= 38) return "text-orange-500"
  if (temp >= 36) return "text-green-500"
  if (temp >= 34) return "text-blue-500"
  return "text-blue-700"
}

export function getTemperatureLabel(temp: number): string {
  if (temp >= 40) return "매우 따뜻한 매너"
  if (temp >= 38) return "따뜻한 매너"
  if (temp >= 36) return "보통 매너"
  if (temp >= 34) return "조금 차가운 매너"
  return "차가운 매너"
}
