import { COUNT, TOTAL_CARDS, lerp } from '../constants'

export function compute(ctx) {
  const { progress, tgt, tgtText, tgtBottom, cur, centerIdx, halfCount, els, mouse, phase9 } = ctx

  const isPhase7 = progress <= 0.96
  const rawSpread = isPhase7 ? (progress - 0.92) / 0.04 : 1
  const spreadProgress = rawSpread * rawSpread * (3 - 2 * rawSpread) // smoothstep
  const spacing = lerp(14, 140, spreadProgress)

  const tiltRX7 = lerp(-24, -20, spreadProgress)
  const tiltRY7 = lerp(-55, -55, spreadProgress)
  const tiltR7 = lerp(3, 0, spreadProgress)
  const tiltZ7 = lerp(140, 0, spreadProgress)
  const wx7 = lerp(1, 1.4, spreadProgress)
  const scale7 = lerp(2.6, 5, spreadProgress)
  const yShift = lerp(0, 0, spreadProgress)
  const centerCard = Math.floor(TOTAL_CARDS / 2)
  const groupOffset = -centerCard * spacing

  // Phase 8 hover: find nearest visible card to cursor
  const p8Active = !isPhase7 && !phase9
  let p8HoveredIdx = -1
  if (p8Active) {
    const mx = mouse.x * window.innerWidth / 2
    const my = mouse.y * window.innerHeight / 2
    let bestIdx = -1
    let bestDist = Infinity
    for (let i = 0; i < COUNT; i++) {
      let rawDist = i - centerIdx
      if (rawDist > halfCount) rawDist -= COUNT
      if (rawDist < -halfCount) rawDist += COUNT
      if (rawDist < 0 || rawDist > TOTAL_CARDS) continue
      const dx = cur[i].x - mx
      const dy = cur[i].y - my
      const d = dx * dx + dy * dy
      if (d < bestDist) { bestDist = d; bestIdx = i }
    }
    p8HoveredIdx = Math.sqrt(bestDist) < 250 ? bestIdx : -1
  }

  for (let i = 0; i < COUNT; i++) {
    let rawDist = i - centerIdx
    if (rawDist > halfCount) rawDist -= COUNT
    if (rawDist < -halfCount) rawDist += COUNT

    tgt[i].s = scale7

    if (rawDist >= 0 && rawDist <= TOTAL_CARDS) {
      const p6End = rawDist * 14
      const p7End = groupOffset + rawDist * spacing
      const xPos = lerp(p6End, p7End, spreadProgress) + (ctx.dragOffsetX || 0)
      tgt[i].x = xPos; cur[i].x = xPos
      tgt[i].y = yShift; tgt[i].z = tiltZ7 + rawDist * lerp(0, 30, spreadProgress)
      tgt[i].rx = tiltRX7; tgt[i].ry = tiltRY7; tgt[i].r = tiltR7; tgt[i].wx = wx7
      tgt[i].o = 1
      els[i].style.zIndex = String(TOTAL_CARDS + 1 - rawDist)
    } else {
      tgt[i].x = 0; tgt[i].y = 0; tgt[i].z = 0
      tgt[i].rx = 0; tgt[i].ry = 0; tgt[i].r = 0; tgt[i].wx = 1; tgt[i].o = 0
      els[i].style.zIndex = '0'
    }
  }

  tgtText.o = 0
  tgtText.y = 0
  tgtBottom.o = Math.min(1, spreadProgress * 2)
  tgtBottom.y = lerp(30, 0, Math.min(1, spreadProgress * 2))

  return p8HoveredIdx
}
