import { COUNT, P9_COUNT, lerp } from '../constants'

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
  const collapse = ctx.cascadeCollapse || 0

  for (let i = 0; i < COUNT; i++) {
    tgt[i].o = 0
  }

  const { diagAngle, desiredStep, cardScale } = getCascadeLayout(vw, vh)

  // Phase A: cascade collapse (0→1), Phase B: showcase (1→2)
  const collapseT = Math.min(collapse, 1)
  const showcaseT = Math.max(0, Math.min(collapse - 1, 1))

  const collapsedStep = 0.4
  const effectiveStep = lerp(desiredStep, collapsedStep, collapseT)

  const dd = ctx.dragDiag || 0
  const dirX = ctx.cascadeDirX || Math.cos(diagAngle)
  const dirY = ctx.cascadeDirY || Math.sin(diagAngle)

  // Keep drag offset during collapse, fade only during showcase transition
  const dragFade = 1 - showcaseT
  const anchorX = dd * dirX * dragFade
  const anchorY = dd * dirY * dragFade

  const totalLen = (P9_COUNT - 1) * effectiveStep
  const startX = -totalLen / 2 * Math.cos(diagAngle)
  const startY = -totalLen / 2 * Math.sin(diagAngle)

  // Top card index (last in the stack)
  const topIdx = P9_COUNT - 1

  for (let i = 0; i < P9_COUNT; i++) {
    const diagX = startX + i * effectiveStep * Math.cos(diagAngle)
    const diagY = startY + i * effectiveStep * Math.sin(diagAngle)

    const cascadeX = diagX + anchorX
    const cascadeY = diagY + anchorY

    if (i === topIdx) {
      // Top card: move to center, flatten rotation, scale up
      const isMob = vw < 1024
      const showcaseScale = isMob
        ? Math.min(vw * 0.95, vh * 0.55) / 50
        : Math.min(vw * 0.45, vh * 0.55) / 50
      p9Tgt[i].x = lerp(cascadeX, 0, showcaseT)
      p9Tgt[i].y = lerp(cascadeY, 0, showcaseT)
      p9Tgt[i].z = lerp(i * collapseT * 2, 0, showcaseT)
      p9Tgt[i].rx = lerp(lerp(-25, -20, collapseT), 0, showcaseT)
      p9Tgt[i].ry = lerp(lerp(-35, -30, collapseT), 0, showcaseT)
      p9Tgt[i].r = 0
      p9Tgt[i].s = lerp(cardScale, showcaseScale, showcaseT)
      p9Tgt[i].o = 1
    } else {
      // Other cards: fade out during showcase
      p9Tgt[i].x = cascadeX
      p9Tgt[i].y = cascadeY
      p9Tgt[i].z = i * collapseT * 2
      p9Tgt[i].rx = lerp(-25, -20, collapseT)
      p9Tgt[i].ry = lerp(-35, -30, collapseT)
      p9Tgt[i].r = 0
      p9Tgt[i].s = cardScale
      p9Tgt[i].o = 1 - showcaseT
    }
  }

  // Bottom stays fully visible — the philosophy text becomes part of the page in showcase.
  tgtBottom.o = 1
  tgtBottom.y = 0
}
