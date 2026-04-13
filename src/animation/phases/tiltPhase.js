import { COUNT, TOTAL_CARDS } from '../constants'

export function compute(ctx) {
  const { progress, tgt, tgtText, centerIdx, halfCount, els } = ctx

  const stackProgress = (progress - 0.80) / 0.12

  const tiltP = Math.min(1, stackProgress / 0.35)
  const cardsP = Math.max(0, (stackProgress - 0.25) / 0.75)

  const tiltRX = tiltP * -24
  const tiltRY = tiltP * -55
  const tiltR = tiltP * 3
  const tiltZ = tiltP * 140

  for (let i = 0; i < COUNT; i++) {
    let rawDist = i - centerIdx
    if (rawDist > halfCount) rawDist -= COUNT
    if (rawDist < -halfCount) rawDist += COUNT

    tgt[i].s = 2.6

    if (rawDist === 0) {
      tgt[i].x = 0; tgt[i].y = 0; tgt[i].z = tiltZ
      tgt[i].rx = tiltRX; tgt[i].ry = tiltRY; tgt[i].r = tiltR; tgt[i].wx = 1.15
      tgt[i].o = 1
      els[i].style.zIndex = String(TOTAL_CARDS + 1)
    } else if (rawDist > 0 && rawDist <= TOTAL_CARDS) {
      const idx = rawDist - 1
      const cardP = Math.max(0, Math.min(1, cardsP * (TOTAL_CARDS + 2) - idx * 1.2))
      tgt[i].x = cardP * rawDist * 14
      tgt[i].y = 0; tgt[i].z = tiltZ
      tgt[i].rx = tiltRX; tgt[i].ry = tiltRY; tgt[i].r = tiltR; tgt[i].wx = 1.15
      tgt[i].o = Math.min(1, cardP * 2)
      els[i].style.zIndex = String(TOTAL_CARDS + 1 - rawDist)
    } else {
      tgt[i].x = 0; tgt[i].y = 0; tgt[i].z = 0
      tgt[i].rx = 0; tgt[i].ry = 0; tgt[i].r = 0; tgt[i].wx = 1; tgt[i].o = 0
      els[i].style.zIndex = '0'
    }
  }

  tgtText.o = 0
  tgtText.y = 0
}
