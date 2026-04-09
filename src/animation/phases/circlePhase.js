import { COUNT, getCircleR, lerp } from '../constants'

export function compute(ctx) {
  const { progress, vh, smoothMouse, tgt, tgtText, tgtArc, radiusEnd, finalRotOffset } = ctx

  const vw = window.innerWidth
  const circleR = getCircleR(vw, vh)
  const isMobile = vw < 1024
  const endY = radiusEnd
  const midY = endY * 0.4

  let centerYOffset, radius, scale
  let rotationOffset = 0

  if (progress <= 0.15) {
    const p = progress / 0.15
    centerYOffset = lerp(0, midY, p)
    radius = circleR
    scale = 1
  } else if (progress <= 0.3) {
    const p = (progress - 0.15) / 0.15
    centerYOffset = lerp(midY, endY, p)
    radius = lerp(circleR, radiusEnd, p)
    scale = lerp(1, isMobile ? 1.2 : 2.5, p)
  } else {
    const p = (progress - 0.3) / 0.25
    centerYOffset = endY
    radius = radiusEnd
    scale = lerp(isMobile ? 1.8 : 2.5, isMobile ? 2.1 : 3, Math.min(1, p))
    rotationOffset = lerp(0, finalRotOffset, p)
  }

  const mouseFade = Math.max(0, 1 - progress / 0.15)
  const mouseRot = smoothMouse.x * 0.12 * mouseFade
  const mouseShiftX = smoothMouse.x * 25 * mouseFade
  const mouseShiftY = smoothMouse.y * 15 * mouseFade

  for (let i = 0; i < COUNT; i++) {
    const angle = (i / COUNT) * Math.PI * 2 + rotationOffset + mouseRot
    tgt[i].x = mouseShiftX + Math.cos(angle) * radius
    tgt[i].y = centerYOffset + mouseShiftY + Math.sin(angle) * radius
    tgt[i].r = (angle * 180 / Math.PI) + 90
    tgt[i].s = scale
    tgt[i].wx = 1
    tgt[i].o = 1
    tgt[i].z = 0
    tgt[i].rx = 0
    tgt[i].ry = 0
  }

  const fadeStart = 0.08
  const fadeEnd = 0.25
  tgtText.o = progress <= fadeStart ? 1 : Math.max(0, 1 - (progress - fadeStart) / (fadeEnd - fadeStart))
  tgtText.y = 0

  // Arc description text: appears during arc/orbit sub-phase (0.3–0.55)
  if (progress > 0.25) {
    const arcFade = Math.min(1, (progress - 0.25) / 0.1)
    tgtArc.o = arcFade
    tgtArc.y = lerp(20, 0, arcFade)
  }
}
