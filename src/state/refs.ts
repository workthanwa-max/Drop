import type { WristSnapshot } from '../app/types'

const hiddenWrist = {
  x: 0.5,
  y: 0.5,
  confidence: 0,
  visible: false,
  active: false,
  size: 0,
}

export function createInitialWristSnapshot(): WristSnapshot {
  return {
    left: { ...hiddenWrist, x: 0.38 },
    right: { ...hiddenWrist, x: 0.62 },
    tracking: false,
    timestamp: 0,
  }
}
