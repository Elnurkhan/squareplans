export const COUNT = 24
export const P9_COUNT = 21
export const PHOTO_W = 50
export const SPACING = 16
export const STEP = PHOTO_W + SPACING
export const CIRCLE_R = 320
export const EASE = typeof window !== 'undefined' && window.innerWidth < 1024 ? 0.18 : 0.1
export const MOUSE_EASE = 0.15
export const HOVER_EASE = 0.12
export const TOTAL_CARDS = 5

export function isCompactLandscape(vw, vh) {
  const w = vw || window.innerWidth
  const h = vh || window.innerHeight
  return w < 1024 && h <= 520 && w > h
}

export function usesSmallMobileCards(vw, vh) {
  const w = vw || window.innerWidth
  return w < 640 || isCompactLandscape(w, vh)
}

export function getCircleR(vw, vh) {
  const h = vh || window.innerHeight
  if (vw < 768) return Math.min(vw * 0.55, h * 0.42, 300)
  if (vw < 1024) return Math.min(vw * 0.38, h * 0.38, 310)
  return CIRCLE_R
}

export function getWideArcBoost(vw) {
  if (vw < 1800) return 1
  return Math.min(1.28, 1 + ((vw - 1800) / 1600) * 0.3)
}

export function lerp(a, b, t) {
  return a + (b - a) * t
}
