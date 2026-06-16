export type GameItemKind = 'pill' | 'needle' | 'powder' | 'alcohol' | 'shield' | 'heart' | 'star'

export type GameItem = {
  id: number
  kind: GameItemKind
  active: boolean
  x: number
  y: number
  radius: number
  speed: number
  value: number
  wobble: number
  age: number
}

export type HandCursor = {
  x: number
  y: number
  radius: number
  active: boolean
  landmarks?: { x: number; y: number }[]
}

export type GameEffect = {
  active: boolean
  x: number
  y: number
  radius: number
  alpha: number
  color: string
}
