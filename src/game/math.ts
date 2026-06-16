export function lerp(current: number, target: number, amount: number) {
  return current + (target - current) * amount
}

export function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

export function normalizeDelta(deltaMs: number) {
  return Math.min(deltaMs / 1000, 0.05)
}
