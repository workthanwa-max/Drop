export type GamePhase =
  | 'start'
  | 'permission'
  | 'camera-ready'
  | 'calibration'
  | 'countdown'
  | 'playing'
  | 'result'

export type WristPoint = {
  x: number
  y: number
  confidence: number
  visible: boolean
  active: boolean
  size: number
  landmarks?: { x: number; y: number }[]
}

export type WristSnapshot = {
  left: WristPoint
  right: WristPoint
  tracking: boolean
  timestamp: number
  stats?: VisionStats
}

export type VisionStats = {
  fps: number
  inferenceMs: number
  droppedFrames: number
  quality: number
}

export type GameResult = {
  score: number
  collected: number
  avoided: number
  missed: number
  maxCombo: number
  rewardLevel: number
}

export type PermissionStatus = 'idle' | 'requesting' | 'granted' | 'denied'

export type VisionMode = 'idle' | 'real' | 'mock'

export type QualityProfile = 'performance' | 'balanced' | 'quality'
