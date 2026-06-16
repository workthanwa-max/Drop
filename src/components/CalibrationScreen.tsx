type CalibrationScreenProps = {
  isTracking: boolean
  isMockMode: boolean
  leftReady: boolean
  rightReady: boolean
  readyProgress: number
  onBack: () => void
}

export function CalibrationScreen({
  isTracking,
  isMockMode,
  leftReady,
  rightReady,
  readyProgress,
  onBack,
}: CalibrationScreenProps) {
  const bothHandsReady = leftReady && rightReady

  return (
    <section className="calibration-wrapper" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', display: 'flex', justifyContent: 'flex-start', alignItems: 'flex-end', padding: '24px', background: 'transparent', border: 'none', boxShadow: 'none' }}>
      <button 
        type="button" 
        onClick={onBack} 
        className="corner-action left icon-only"
        aria-label="ย้อนกลับ"
      >
        ←
      </button>

      <div className="calibration-card" style={{ background: 'var(--holo-glass)', backdropFilter: 'blur(24px)', padding: '16px 24px', borderRadius: '16px', display: 'flex', flexDirection: 'column', gap: '12px', minWidth: '240px', border: '1px solid var(--holo-border)', zIndex: 10 }}>
        <h2 style={{ fontSize: '18px', margin: 0, color: '#fff' }}>ยกมือทั้ง 2 ข้างค้างไว้ 3 วินาที</h2>
        <div className="hand-readiness" style={{ display: 'flex', gap: '16px', marginTop: '8px' }}>
          <span className={leftReady ? 'hand-status ready' : 'hand-status missing'} style={{ flex: 1, padding: '8px' }}>
            <strong>L</strong>
            {leftReady ? 'พร้อม' : 'ไม่พบ'}
          </span>
          <span className={rightReady ? 'hand-status ready' : 'hand-status missing'} style={{ flex: 1, padding: '8px' }}>
            <strong>R</strong>
            {rightReady ? 'พร้อม' : 'ไม่พบ'}
          </span>
        </div>
        <div className="ready-progress" style={{ width: '100%', height: '4px', background: 'rgba(255,255,255,0.1)', borderRadius: '2px', overflow: 'hidden', marginTop: '4px' }}>
          <span style={{ display: 'block', height: '100%', background: 'var(--pulse-green)', width: `${Math.round(readyProgress * 100)}%`, transition: 'width 0.1s linear' }} />
        </div>
      </div>
    </section>
  )
}
