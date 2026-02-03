export const DEFAULT_PROFILE_IMAGE = "/placeholder-user.svg"

export function getLoveDnaImage(loveDna?: string | null): string {
  if (!loveDna) return DEFAULT_PROFILE_IMAGE
  const normalized = loveDna.trim().toUpperCase()
  if (!/^[EI][FT][PS][DA]$/.test(normalized)) return DEFAULT_PROFILE_IMAGE
  return `/test/results/${normalized}.PNG`
}
