import { COUNT, lerp } from '../constants'

export function compute(ctx) {
  const { progress, tgt, tgtText, tgtArc, arcCY, arcRadius, arcScale, centerIdx, halfCount, angularStep, centerAngle } = ctx

  const scrollStep = (progress - 0.55) / 0.20
  const spreadFactor = 3

  for (let i = 0; i < COUNT; i++) {
    let rawDist = i - centerIdx
    if (rawDist > halfCount) rawDist -= COUNT
    if (rawDist < -halfCount) rawDist += COUNT
    const absDist = Math.abs(rawDist)

    const angle = centerAngle + rawDist * angularStep * (1 + scrollStep * spreadFactor)
    tgt[i].x = Math.cos(angle) * arcRadius
    tgt[i].y = arcCY + Math.sin(angle) * arcRadius
    tgt[i].r = (angle * 180 / Math.PI) + 90
    tgt[i].s = arcScale
    tgt[i].wx = 1
    tgt[i].z = 0
    tgt[i].rx = 0
    tgt[i].ry = 0

    const fadeIn = Math.min(scrollStep * 6, 1)
    const distOpacity = 1 - absDist * 0.45
    tgt[i].o = Math.max(0, lerp(1, distOpacity, fadeIn))
  }

  tgtText.o = 0
  tgtText.y = 0

  // Arc description text stays visible (already faded in during circlePhase)
  tgtArc.o = 1
  tgtArc.y = 0
}
