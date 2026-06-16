import type { GamePhase } from '../app/types'
import type { VisionMode } from '../app/types'

type HudOverlayProps = {
  phase: GamePhase
  tracking: boolean
  mode: VisionMode
}

export function HudOverlay({ phase, tracking, mode }: HudOverlayProps) {
  if (phase !== 'playing') {
    return null
  }

  return (
    <>
      <div className="hud-overlay" aria-label="สถานะเกม">
        <div className="hud-stat">
          <span>คะแนน</span>
          <strong id="game-score">0</strong>
        </div>
        <div className="hud-stat">
          <span>เวลา</span>
          <strong id="game-health">60s</strong>
        </div>
        <div className="hud-stat">
          <span>คอมโบ</span>
          <strong id="game-combo">0</strong>
        </div>
        <div className="hud-stat">
          <span>ติดตาม</span>
          <strong id="game-tracking">{tracking ? labelForMode(mode) : 'หลุด'}</strong>
        </div>
      </div>
      <div id="game-perf" className="perf-badge" aria-hidden="true">
        ปกติ R-- V-- --ms
      </div>
      <div id="game-feedback" className="game-feedback" aria-hidden="true" />
    </>
  )
}

function labelForMode(mode: VisionMode) {
  if (mode === 'real') {
    return 'กล้อง'
  }

  if (mode === 'mock') {
    return 'จำลอง'
  }

  return 'พร้อม'
}

export { labelForMode as labelForVisionMode }
