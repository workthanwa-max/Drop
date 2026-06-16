import type { RefObject } from 'react'

type CanvasLayerProps = {
  canvasRef: RefObject<HTMLCanvasElement | null>
}

export function CanvasLayer({ canvasRef }: CanvasLayerProps) {
  return <canvas ref={canvasRef} className="game-canvas" aria-hidden="true" />
}
