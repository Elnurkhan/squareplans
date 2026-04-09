import { COUNT, lerp } from '../constants'

export function compute(ctx) {
  const { progress, tgt, tgtText, arcCY, arcRadius, arcScale, centerIdx, halfCount, angularStep, centerAngle } = ctx

  const zoomProgress = (progress - 0.75) / 0.10
  const startX = Math.cos(centerAngle) * arcRadius
  const startY = arcCY + Math.sin(centerAngle) * arcRadius
  const startR = (centerAngle * 180 / Math.PI) + 90

  for (let i = 0; i < COUNT; i++) {
    let rawDist = i - centerIdx
    if (rawDist > halfCount) rawDist -= COUNT
    if (rawDist < -halfCount) rawDist += COUNT

    if (rawDist !== 0) {
      const angle = centerAngle + rawDist * angularStep * 4
      tgt[i].x = Math.cos(angle) * arcRadius
      tgt[i].y = arcCY + Math.sin(angle) * arcRadius
      tgt[i].r = (angle * 180 / Math.PI) + 90
      tgt[i].s = arcScale
      tgt[i].o = 0
    } else {
      tgt[i].x = lerp(startX, 0, zoomProgress)
      tgt[i].y = lerp(startY, 0, zoomProgress)
      tgt[i].r = lerp(startR, 0, zoomProgress)
      tgt[i].s = lerp(arcScale, 2.6, zoomProgress)
      tgt[i].o = 1
    }
    tgt[i].z = 0
    tgt[i].wx = 1
    tgt[i].rx = 0
    tgt[i].ry = 0
  }

  tgtText.o = 0
  tgtText.y = 0
}
