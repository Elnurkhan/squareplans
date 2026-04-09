// Seeded random for deterministic positions
function seededRandom(seed: number) {
  const x = Math.sin(seed * 9301 + 49297) * 49297
  return x - Math.floor(x)
}

export interface PhotoData {
  src: string
  chaosX: number
  chaosY: number
  chaosRotation: number
  chaosScale: number
  lineX: number
  circleX: number
  circleY: number
  circleZ: number
  circleTilt: number
}

const PHOTO_COUNT = 24
const LINE_SPREAD = 20
const CIRCLE_RADIUS = 3.1
const CIRCLE_TILT = 0.35 // ~20° ring tilt toward camera

export const photos: PhotoData[] = Array.from({ length: PHOTO_COUNT }, (_, i) => {
  const seed = i + 1
  const r = seededRandom

  const lineX = ((i / (PHOTO_COUNT - 1)) - 0.5) * LINE_SPREAD

  const chaosX = lineX
  const chaosY = (r(seed * 2) - 0.5) * 8
  const chaosRotation = (r(seed * 3) - 0.5) * 0.3
  const chaosScale = 0.7 + r(seed * 4) * 0.3

  // Flat circle (no perspective tilt)
  const angle = (i / PHOTO_COUNT) * Math.PI * 2
  const circleX = Math.cos(angle) * CIRCLE_RADIUS
  const circleY = Math.sin(angle) * CIRCLE_RADIUS
  const circleZ = 0
  // Tangent rotation: photos lean along the circle edge
  const circleTilt = angle - Math.PI / 2

  return {
    src: `/images/photos/${String(i + 1).padStart(2, '0')}.jpg`,
    chaosX,
    chaosY,
    chaosRotation,
    chaosScale,
    lineX,
    circleX,
    circleY,
    circleZ,
    circleTilt,
  }
})

export { PHOTO_COUNT, LINE_SPREAD, CIRCLE_RADIUS, CIRCLE_TILT }
