import type { GameItem, GameItemKind } from './types'

const itemKinds: GameItemKind[] = [
  'pill',
  'needle',
  'powder',
  'alcohol',
  'shield',
  'heart',
  'star',
]
const harmfulKinds: GameItemKind[] = ['pill', 'needle', 'powder', 'alcohol']

export function createItemPool(size: number): GameItem[] {
  return Array.from({ length: size }, (_, index) => ({
    id: index,
    kind: itemKinds[index % itemKinds.length],
    active: false,
    x: 0,
    y: 0,
    radius: 18,
    speed: 120,
    value: 10,
    wobble: 0,
    age: 0,
  }))
}

export function activateItem(
  item: GameItem,
  canvasWidth: number,
  seed: number,
  difficulty: number,
) {
  const laneCount = 7
  const lane = seed % laneCount
  const laneWidth = canvasWidth / laneCount
  const kind = pickItemKind(seed)

  const margin = Math.max(80, canvasWidth * 0.08)
  const rawX = laneWidth * lane + laneWidth * 0.5

  item.active = true
  item.kind = kind
  item.x = Math.max(margin, Math.min(canvasWidth - margin, rawX))
  item.y = -24
  item.radius = harmfulKinds.includes(kind) ? 22 : 18
  item.speed = 132 + difficulty * 64 + (seed % 5) * 18
  item.value = getItemValue(kind)
  item.wobble = (seed % 9) * 0.7
  item.age = 0
}

function pickItemKind(seed: number): GameItemKind {
  if (seed % 2 === 0 || seed % 5 === 0) {
    return harmfulKinds[seed % harmfulKinds.length]
  }

  if (seed % 11 === 0) {
    return 'shield'
  }

  if (seed % 3 === 0) {
    return 'heart'
  }

  return 'star'
}

function getItemValue(kind: GameItemKind) {
  if (kind === 'shield') {
    return 30
  }

  if (kind === 'heart') {
    return 20
  }

  if (kind === 'star') {
    return 35
  }

  return -18
}
