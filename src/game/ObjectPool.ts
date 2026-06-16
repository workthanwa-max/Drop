import type { GameItem } from './types'

export class ObjectPool {
  private readonly items: GameItem[]

  constructor(items: GameItem[]) {
    this.items = items
  }

  get all() {
    return this.items
  }

  acquire() {
    return this.items.find((item) => !item.active) ?? null
  }

  release(item: GameItem) {
    item.active = false
  }

  reset() {
    this.items.forEach((item) => {
      item.active = false
    })
  }
}
