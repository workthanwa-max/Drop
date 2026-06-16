import type { GamePhase } from './types'

export const playerJourney: GamePhase[] = [
  'start',
  'permission',
  'camera-ready',
  'calibration',
  'countdown',
  'playing',
  'result',
]

export const phaseLabels: Record<GamePhase, string> = {
  start: 'เริ่ม',
  permission: 'ขอสิทธิ์',
  'camera-ready': 'กล้อง',
  calibration: 'สแกนมือ',
  countdown: 'นับถอยหลัง',
  playing: 'เล่น',
  result: 'ผลลัพธ์',
}

export function getPhaseIndex(phase: GamePhase) {
  return playerJourney.indexOf(phase)
}
