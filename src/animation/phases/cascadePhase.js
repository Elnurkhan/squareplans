import { COUNT, P9_COUNT } from '../constants'

export function getCascadeLayout(vw, vh) {
  const isMobile = vw < 1024
  const pad = 200

  let diagAngle, desiredStep, cardScale

  if (isMobile) {
    const refW = 1440, refH = 900
    diagAngle = -Math.atan2(refH, refW) * .9
    const refDiag = Math.sqrt(refW * refW + refH * refH)
    desiredStep = (refDiag - pad * 2) / (P9_COUNT - 1) * 0.9
    const desktopScale = Math.min(8, desiredStep / 70 * 1.8)
    const cssCardW = vw < 640 ? 32 : 40
    cardScale = desktopScale * (50 / cssCardW) * 1.3
  } else {
    diagAngle = -Math.atan2(vh, vw) * .9
    const screenDiag = Math.sqrt(vw * vw + vh * vh)
    desiredStep = (screenDiag - pad * 2) / (P9_COUNT - 1) * 0.9
    const baseSize = Math.min(Math.max(vw * 0.04, 40), 70)
    cardScale = Math.min(8, desiredStep / baseSize * 1.8)
  }

  return { diagAngle, desiredStep, cardScale }
}

export function compute(ctx) {
  const { vh, vw, tgt, tgtBottom, p9Tgt } = ctx

  for (let i = 0; i < COUNT; i++) {
    tgt[i].o = 0
  }

  const { diagAngle, desiredStep, cardScale } = getCascadeLayout(vw, vh)

  const dd = ctx.dragDiag || 0
  const dirX = ctx.cascadeDirX || Math.cos(diagAngle)
  const dirY = ctx.cascadeDirY || Math.sin(diagAngle)
  const anchorX = dd * dirX
  const anchorY = dd * dirY

  const totalLen = (P9_COUNT - 1) * desiredStep
  const startX = -totalLen / 2 * Math.cos(diagAngle)
  const startY = -totalLen / 2 * Math.sin(diagAngle)

  // Static cascade: every card sits on the diagonal, no collapse, no showcase.
  for (let i = 0; i < P9_COUNT; i++) {
    p9Tgt[i].x = startX + i * desiredStep * Math.cos(diagAngle) + anchorX
    p9Tgt[i].y = startY + i * desiredStep * Math.sin(diagAngle) + anchorY
    p9Tgt[i].z = 0
    p9Tgt[i].rx = -25
    p9Tgt[i].ry = -35
    p9Tgt[i].r = 0
    p9Tgt[i].s = cardScale
    p9Tgt[i].o = 1
  }

  tgtBottom.o = 1
  tgtBottom.y = 0
}
