import type { PermissionStatus } from '../app/types'

type PermissionScreenProps = {
  status: PermissionStatus
  errorMessage: string
  onRequestCamera: () => void
  onUseMock: () => void
  onBack: () => void
}

export function PermissionScreen({
  status,
  errorMessage,
  onRequestCamera,
  onUseMock,
  onBack,
}: PermissionScreenProps) {
  return (
    <section className="flow-panel">
      <button 
        type="button" 
        onClick={onBack} 
        className="corner-action left icon-only"
        aria-label="ย้อนกลับ"
      >
        ←
      </button>
      <p className="eyebrow">ขอสิทธิ์ใช้งาน</p>
      <h1>เปิดกล้องเพื่อเริ่มระบบ</h1>
      <p className="panel-copy">
        อนุญาตให้ใช้เว็บแคม เพื่อให้ระบบตรวจจับตำแหน่งมือของคุณ
      </p>
      {errorMessage ? <p className="error-copy">{errorMessage}</p> : null}
      <button
        type="button"
        className="primary-action"
        onClick={onRequestCamera}
        disabled={status === 'requesting'}
      >
        {status === 'requesting' ? 'กำลังเปิดกล้อง...' : 'เปิดใช้งานกล้อง'}
      </button>
      <button type="button" className="secondary-action" onClick={onUseMock}>
        ใช้โหมดจำลอง
      </button>
    </section>
  )
}
