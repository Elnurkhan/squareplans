import { COUNT, P9_COUNT, lerp } from '../constants'
import { getCascadeLayout } from './cascadePhase'

export function compute(ctx) {
  const { vh, vw, tgt, tgtBottom, p9Tgt } = ctx
  const showcaseT = Math.max(0, (ctx.cascadeCollapse || 0) - 1)

  for (let i = 0; i < COUNT; i++) {
    tgt[i].o = 0
  }

  const { diagAngle, desiredStep, cardScale } = getCascadeLayout(vw, vh)

  const collapsedStep = 0.4
  const totalLen = (P9_COUNT - 1) * collapsedStep
  const startX = -totalLen / 2 * Math.cos(diagAngle)
  const startY = -totalLen / 2 * Math.sin(diagAngle)

  const isMob = vw < 1024
  const showcaseMaxScale = isMob
    ? Math.min(vw * 0.95, vh * 0.55) / 50
    : cardScale * 2.6
  const showcaseScale = lerp(cardScale, showcaseMaxScale, showcaseT)

  for (let i = 0; i < P9_COUNT; i++) {
    const diagX = startX + i * collapsedStep * Math.cos(diagAngle)
    const diagY = startY + i * collapsedStep * Math.sin(diagAngle)
    const dd = ctx.dragDiag || 0

    if (i === 0) {
      p9Tgt[i].x = lerp(diagX + dd * (ctx.cascadeDirX || 0), 0, showcaseT)
      p9Tgt[i].y = lerp(diagY + dd * (ctx.cascadeDirY || 0), 0, showcaseT)
      p9Tgt[i].z = 0
      p9Tgt[i].rx = lerp(-20, 0, showcaseT)
      p9Tgt[i].ry = lerp(-30, 0, showcaseT)
      p9Tgt[i].r = 0
      p9Tgt[i].s = showcaseScale
      p9Tgt[i].o = 1
    } else {
      p9Tgt[i].x = diagX + dd * (ctx.cascadeDirX || 0)
      p9Tgt[i].y = diagY + dd * (ctx.cascadeDirY || 0)
      p9Tgt[i].z = i * 2
      p9Tgt[i].rx = -20
      p9Tgt[i].ry = -30
      p9Tgt[i].r = 0
      p9Tgt[i].s = cardScale
      p9Tgt[i].o = lerp(1, 0, showcaseT)
    }
  }

  // Bottom (philosophy text) stays as a permanent part of the showcase page.
  tgtBottom.o = 1
  tgtBottom.y = 0
}
