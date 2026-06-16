export function circlesOverlap(
  firstX: number,
  firstY: number,
  firstRadius: number,
  secondX: number,
  secondY: number,
  secondRadius: number,
) {
  const dx = firstX - secondX
  const dy = firstY - secondY
  const radius = firstRadius + secondRadius

  return dx * dx + dy * dy <= radius * radius
}
