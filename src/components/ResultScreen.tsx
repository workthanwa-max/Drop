import type { GameResult } from '../app/types'

type ResultScreenProps = {
  result: GameResult
  onPlayAgain: () => void
  onExit: () => void
}

export function ResultScreen({
  result,
  onPlayAgain,
  onExit,
}: ResultScreenProps) {
  const rating = getRating(result.rewardLevel)

  return (
    <section className="flow-panel result-panel">
      <p className="eyebrow">ผลลัพธ์</p>
      <h1>{result.score} คะแนน</h1>
      <p className="result-rank">{rating}</p>
      <div className="result-grid">
        <span>
          <strong>{result.collected}</strong>
          เก็บได้
        </span>
        <span>
          <strong>{result.avoided}</strong>
          หลบภัยคุกคาม
        </span>
        <span>
          <strong>{result.missed}</strong>
          พลาด
        </span>
        <span>
          <strong>{result.maxCombo}</strong>
          คอมโบสูงสุด
        </span>
        <span>
          <strong>{result.rewardLevel}</strong>
          ระดับรางวัล
        </span>
      </div>
      <div className="action-row">
        <button type="button" className="secondary-action" onClick={onExit}>
          ออก
        </button>
        <button type="button" className="primary-action" onClick={onPlayAgain}>
          เล่นอีกครั้ง
        </button>
      </div>
    </section>
  )
}

function getRating(rewardLevel: number) {
  if (rewardLevel === 4) {
    return 'รางวัลระดับ 4: ผู้พิทักษ์สูงสุด'
  }

  if (rewardLevel === 3) {
    return 'รางวัลระดับ 3: ผู้พิทักษ์ยอดเยี่ยม'
  }

  if (rewardLevel === 2) {
    return 'รางวัลระดับ 2: ผู้พิทักษ์แข็งแกร่ง'
  }

  return 'รางวัลระดับ 1: ผู้พิทักษ์เริ่มต้น'
}
