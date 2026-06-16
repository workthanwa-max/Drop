import type { WristPoint, WristSnapshot } from '../app/types'

export type PoseWristName = 'left' | 'right'

export type PoseWristMap = Record<PoseWristName, WristPoint>

export type VisionSnapshot = WristSnapshot
