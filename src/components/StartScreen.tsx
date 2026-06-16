type StartScreenProps = {
  onStart: () => void
}

export function StartScreen({ onStart }: StartScreenProps) {
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(err => {
        console.warn('Error attempting to enable fullscreen:', err)
      })
    } else {
      document.exitFullscreen()
    }
  }

  return (
    <section className="flow-panel flow-panel-start" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <button 
        type="button" 
        onClick={toggleFullscreen} 
        className="corner-action right"
      >
        ⛶ เต็มจอ
      </button>

      <div>
        <p className="eyebrow">เอไอผู้พิทักษ์ร่างกาย</p>
        <h1>ขยับมือ ปกป้องร่างกาย</h1>
        <p className="panel-copy">
          เก็บสัญลักษณ์ดี หลบภัยคุกคามสีแดง และรักษาเวลาให้นานที่สุด
        </p>
      </div>

      <div className="demo-container" aria-hidden="true">
        <div className="demo-emoji shield">🛡️</div>
        <div className="demo-emoji skull">💀</div>
        <div className="demo-emoji hand">✋</div>
      </div>

      <button type="button" className="primary-action" onClick={onStart}>
        เริ่มเล่น
      </button>
    </section>
  )
}
