<template>
  <div class="intro" ref="introEl">
    <div class="intro-sticky">
      <header class="intro-header" ref="headerEl">
        <nav class="intro-nav">
          <a href="#">Интро</a>
          <a href="#">Проекты</a>
          <span class="intro-brand">SP</span>
          <a href="#">Услуги</a>
          <a href="#">Контакты</a>
        </nav>
      </header>

      <div class="intro-center" ref="centerEl">
        <h1 class="intro-title">SQUAREPLANS</h1>
        <p class="intro-sub">ЛИСТАЙТЕ ЧТОБЫ УЗНАТЬ БОЛЬШЕ</p>
      </div>

      <div class="intro-bottom" ref="bottomEl">
        <h2 class="bottom-title">Недавние проекты</h2>
        <p class="bottom-sub">ВЫБЕРИТЕ ОДИН</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

const introEl = ref(null)
const headerEl = ref(null)
const stageEl = ref(null)
const thumbEls = ref([])
const centerEl = ref(null)
const bottomEl = ref(null)

const COUNT = 24
const PHOTO_W = 50
const SPACING = 16
const STEP = PHOTO_W + SPACING

const CIRCLE_R = 320
const rowScatterY = Array.from({ length: COUNT }, () => (Math.random() - 0.5) * 400)

const thumbnails = Array.from({ length: COUNT }, (_, i) => ({
  src: `https://picsum.photos/seed/ink${i}/400/560`,
}))

function lerp(a, b, t) {
  return a + (b - a) * t
}

let masterTl = null
let gsapCtx = null
let currentProgress = 0
const EASE = 0.045
const mouse = { x: 0, y: 0 }
const smoothMouse = { x: 0, y: 0 }
const MOUSE_EASE = 0.08
let hoveredIdx = -1
const hoverAmount = Array.from({ length: COUNT }, () => 0)
const HOVER_EASE = 0.12

function onMouseMove(e) {
  mouse.x = (e.clientX / window.innerWidth - 0.5) * 2
  mouse.y = (e.clientY / window.innerHeight - 0.5) * 2
}
const cur = Array.from({ length: COUNT }, () => ({ x: 0, y: 0, z: 0, r: 0, rx: 0, ry: 0, s: 1, wx: 1, o: 1 }))
const tgt = Array.from({ length: COUNT }, () => ({ x: 0, y: 0, z: 0, r: 0, rx: 0, ry: 0, s: 1, wx: 1, o: 1 }))
const curText = { o: 0, y: 30 }
const tgtText = { o: 0, y: 30 }
const curBottom = { o: 0, y: 30 }
const tgtBottom = { o: 0, y: 30 }

onMounted(() => {
  const vw = window.innerWidth
  const vh = window.innerHeight
  const els = thumbEls.value

  if (!els.length) return

  // Lock scroll during intro animation
  document.documentElement.style.overflow = 'hidden'
  window.addEventListener('mousemove', onMouseMove)

  // Initial state
  gsap.set(els, { opacity: 0, scale: 0.8, x: 0, y: 0, rotation: 0 })
  gsap.set(headerEl.value, { opacity: 0, y: -30 })
  gsap.set(centerEl.value, { opacity: 0, scale: 0.85, y: 20 })
  gsap.set(bottomEl.value, { opacity: 0, y: 30 })

  // Pre-calculate horizontal line positions, fitted to screen with padding
  const padding = 40
  const availableWidth = vw - padding * 2
  const totalWidth = COUNT * PHOTO_W + (COUNT - 1) * SPACING
  const rowScale = Math.min(1, availableWidth / totalWidth)
  const halfTotal = totalWidth / 2
  const line = els.map((_, i) => ({
    x: (-halfTotal + PHOTO_W / 2 + i * STEP) * rowScale,
  }))

  // Pre-calculate circle positions (radius matches scroll initial state)
  const circle = els.map((_, i) => {
    const angle = (i / COUNT) * Math.PI * 2
    return {
      x: Math.cos(angle) * CIRCLE_R,
      y: Math.sin(angle) * CIRCLE_R,
      r: (angle * 180 / Math.PI) + 90,
    }
  })

  masterTl = gsap.timeline({
    onComplete: () => {
      document.documentElement.style.overflow = ''
      gsap.set(stageEl.value, { rotation: 0 })
      gsap.set(centerEl.value, { opacity: 0, scale: 1, y: 30 })
      // Initialize interpolation state from circle positions
      for (let i = 0; i < COUNT; i++) {
        const angle = (i / COUNT) * Math.PI * 2
        cur[i].x = Math.cos(angle) * CIRCLE_R
        cur[i].y = Math.sin(angle) * CIRCLE_R
        cur[i].r = (angle * 180 / Math.PI) + 90
        cur[i].s = 1; cur[i].wx = 1; cur[i].o = 1
        cur[i].z = 0; cur[i].rx = 0; cur[i].ry = 0
      }
      // ScrollTrigger-driven animation
      gsapCtx = gsap.context(() => {
        ScrollTrigger.create({
          trigger: introEl.value,
          pin: true,
          start: 'top top',
          end: () => `+=${window.innerHeight * 10}`,
          onUpdate: (self) => {
            currentProgress = self.progress
          },
        })
      })
      gsap.ticker.add(tickFn)
    },
  })

  // ── Phase 1 (0 → 0.6s): header fade in ──
  masterTl.to(headerEl.value, {
    opacity: 1,
    y: 0,
    duration: 0.6,
    ease: 'power3.out',
  }, 0)

  // ── Phase 2 (0.6 → 1.4s): images appear in row, scattered vertically ──
  els.forEach((el, i) => {
    masterTl.to(el, {
      opacity: 1,
      scale: 1,
      x: line[i].x,
      y: rowScatterY[i],
      rotation: 0,
      duration: 0.6,
      ease: 'back.out(1.2)',
    }, 0.6 + Math.random() * 0.25)
  })

  // ── Phase 3 (1.4 → 2.6s): align vertically into clean row ──
  els.forEach((el, i) => {
    masterTl.to(el, {
      y: 0,
      duration: 1.0,
      ease: 'power3.inOut',
    }, 1.5 + Math.abs(i - COUNT / 2) / COUNT * 0.3)
  })

  // ── Phase 4 (2.6 → 3.6s): form circle ──
  els.forEach((el, i) => {
    masterTl.to(el, {
      x: circle[i].x,
      y: circle[i].y,
      rotation: circle[i].r,
      duration: 1.0,
      ease: 'power2.inOut',
    }, 2.7 + (i / COUNT) * 0.15)
  })

  // Center text reveals during circle formation
  masterTl.to(centerEl.value, {
    opacity: 1,
    scale: 1,
    y: 0,
    duration: 0.8,
    ease: 'power2.out',
  }, 3.2)
})

// ── Tick: interpolate cur → tgt each frame ──────────────────

function tickFn() {
  const els = thumbEls.value
  if (!els.length) return

  const vh = window.innerHeight
  const vw = window.innerWidth

  smoothMouse.x += (mouse.x - smoothMouse.x) * MOUSE_EASE
  smoothMouse.y += (mouse.y - smoothMouse.y) * MOUSE_EASE

  // Proximity-based hover: find nearest card to cursor
  const mx = mouse.x * vw / 2
  const my = mouse.y * vh / 2
  let nearestIdx = -1
  let nearestDist = Infinity
  for (let i = 0; i < COUNT; i++) {
    const dx = cur[i].x - mx
    const dy = cur[i].y - my
    const d = dx * dx + dy * dy
    if (d < nearestDist) { nearestDist = d; nearestIdx = i }
  }
  hoveredIdx = nearestDist < 150 * 150 ? nearestIdx : -1

  computeTargets(currentProgress, vh, vw, els)

  for (let i = 0; i < COUNT; i++) {
    const c = cur[i]
    const t = tgt[i]
    if (c.o < 0.01 && t.o < 0.01) {
      c.x = t.x; c.y = t.y; c.z = t.z
      c.r = t.r; c.rx = t.rx; c.ry = t.ry; c.s = t.s; c.wx = t.wx
    }
    c.x += (t.x - c.x) * EASE
    c.y += (t.y - c.y) * EASE
    c.z += (t.z - c.z) * EASE
    let dr = t.r - c.r
    if (dr > 180) dr -= 360
    if (dr < -180) dr += 360
    c.r += dr * EASE
    c.rx += (t.rx - c.rx) * EASE
    c.ry += (t.ry - c.ry) * EASE
    c.s += (t.s - c.s) * EASE
    c.wx += (t.wx - c.wx) * EASE
    c.o += (t.o - c.o) * EASE

    // Hover: smooth per-card influence, independent of main EASE
    let hTarget = 0
    if (hoveredIdx >= 0) {
      let dist = Math.abs(i - hoveredIdx)
      if (dist > COUNT / 2) dist = COUNT - dist
      if (dist <= 3) hTarget = 1 - dist / 4
    }
    hoverAmount[i] += (hTarget - hoverAmount[i]) * HOVER_EASE
    const hz = hoverAmount[i] * 50
    const hs = hoverAmount[i] * 0.15

    els[i].style.transform = `translate3d(${c.x}px, ${c.y}px, ${c.z + hz}px) rotateX(${c.rx}deg) rotateY(${c.ry}deg) rotateZ(${c.r}deg) scale(${c.s + hs}) scaleX(${c.wx})`
    const finalO = c.o > 0.95 ? 1 : Math.max(0, c.o)
    els[i].style.opacity = String(finalO)
  }

  curText.o += (tgtText.o - curText.o) * EASE
  curText.y += (tgtText.y - curText.y) * EASE
  if (centerEl.value) {
    centerEl.value.style.opacity = String(Math.max(0, curText.o))
    centerEl.value.style.transform = `translateY(${curText.y}px)`
  }

  curBottom.o += (tgtBottom.o - curBottom.o) * EASE
  curBottom.y += (tgtBottom.y - curBottom.y) * EASE
  if (bottomEl.value) {
    bottomEl.value.style.opacity = String(Math.max(0, curBottom.o))
    bottomEl.value.style.transform = `translateY(${curBottom.y}px)`
  }
}

function computeTargets(progress, vh, vw, els) {
  const radiusEnd = vw * 0.48
  const rotationStep = (Math.PI * 2) / COUNT
  const finalRotOffset = -rotationStep * 9

  // Bottom text hidden by default, Phase 7 overrides
  tgtBottom.o = 0; tgtBottom.y = 30

  // ── Phases 1–3: circle → arc → orbit ──
  if (progress <= 0.55) {
    let centerYOffset, radius, scale
    let rotationOffset = 0

    if (progress <= 0.15) {
      const p = progress / 0.15
      centerYOffset = lerp(0, vh * 0.35, p)
      radius = CIRCLE_R
      scale = 1
    } else if (progress <= 0.3) {
      const p = (progress - 0.15) / 0.15
      centerYOffset = lerp(vh * 0.35, vh * 0.85, p)
      radius = lerp(CIRCLE_R, radiusEnd, p)
      scale = lerp(1, 2, p)
    } else {
      const p = (progress - 0.3) / 0.25
      centerYOffset = vh * 0.85
      radius = radiusEnd
      scale = 2
      rotationOffset = lerp(0, finalRotOffset, p)
    }

    // Mouse influence: rotation + shift + tilt
    const mouseRot = smoothMouse.x * 0.12
    const mouseShiftX = smoothMouse.x * 25
    const mouseShiftY = smoothMouse.y * 15

    for (let i = 0; i < COUNT; i++) {
      const angle = (i / COUNT) * Math.PI * 2 + rotationOffset + mouseRot
      tgt[i].x = mouseShiftX + Math.cos(angle) * radius
      tgt[i].y = centerYOffset + mouseShiftY + Math.sin(angle) * radius
      tgt[i].r = (angle * 180 / Math.PI) + 90
      tgt[i].s = scale
      tgt[i].wx = 1
      tgt[i].o = 1
      tgt[i].z = 0
      tgt[i].rx = 0; tgt[i].ry = 0
    }

    const textP = Math.max(0, (progress - 0.2) / 0.3)
    tgtText.y = lerp(30, 0, textP)
    tgtText.o = Math.min(textP, 1)
    return
  }

  // Shared for Phases 4 & 5
  const arcCY = vh * 0.85
  const arcRadius = radiusEnd
  const arcScale = 2

  let centerIdx = Math.round(((-Math.PI / 2 - finalRotOffset) / (Math.PI * 2)) * COUNT) % COUNT
  if (centerIdx < 0) centerIdx += COUNT

  const halfCount = COUNT / 2
  const angularStep = (Math.PI * 2) / COUNT
  const centerAngle = (centerIdx / COUNT) * Math.PI * 2 + finalRotOffset

  // ── Phase 4: spread along arc ──
  if (progress <= 0.75) {
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
      tgt[i].rx = 0; tgt[i].ry = 0

      const fadeIn = Math.min(scrollStep * 6, 1)
      const distOpacity = 1 - absDist * 0.45
      tgt[i].o = Math.max(0, lerp(1, distOpacity, fadeIn))
    }

    tgtText.o = 1
    tgtText.y = 0
    return
  }

  // ── Phase 5: center image zoom ──
  if (progress <= 0.85) {
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
      tgt[i].rx = 0; tgt[i].ry = 0
    }

    tgtText.o = Math.max(0, 1 - zoomProgress * 2)
    tgtText.y = 0
    return
  }

  // ── Phase 6: perspective tilt → accordion reveal (0.85 → 0.92) ──
  const TOTAL_CARDS = 5

  if (progress <= 0.92) {
    const stackProgress = (progress - 0.85) / 0.07

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
      const absDist = Math.abs(rawDist)

      if (rawDist === 0) {
        tgt[i].x = 0; tgt[i].y = 0; tgt[i].z = tiltZ
        tgt[i].rx = tiltRX; tgt[i].ry = tiltRY; tgt[i].r = tiltR; tgt[i].wx = 1.15
        tgt[i].o = 1
        els[i].style.zIndex = String(TOTAL_CARDS + 1)
      } else if (absDist <= TOTAL_CARDS) {
        const idx = absDist - 1
        const cardP = Math.max(0, Math.min(1, cardsP * (TOTAL_CARDS + 2) - idx * 1.2))
        tgt[i].x = cardP * absDist * 14
        tgt[i].y = 0; tgt[i].z = tiltZ
        tgt[i].rx = tiltRX; tgt[i].ry = tiltRY; tgt[i].r = tiltR; tgt[i].wx = 1.15
        tgt[i].o = Math.min(1, cardP * 2)
        els[i].style.zIndex = String(TOTAL_CARDS + 1 - absDist)
      } else {
        tgt[i].x = 0; tgt[i].y = 0; tgt[i].z = 0
        tgt[i].rx = 0; tgt[i].ry = 0; tgt[i].r = 0; tgt[i].wx = 1; tgt[i].o = 0
        els[i].style.zIndex = '0'
      }
    }

    tgtText.o = 0; tgtText.y = 0
    return
  }

  // ── Phase 7: cards spread apart (0.92 → 1.0) ──
  const spreadProgress = (progress - 0.92) / 0.08
  const spacing = lerp(14, 155, spreadProgress)

  const tiltRX7 = -24
  const tiltRY7 = lerp(-55, -30, spreadProgress)
  const tiltR7 = lerp(3, 0, spreadProgress)
  const tiltZ7 = 140
  const wx7 = lerp(1.15, 1.35, spreadProgress)
  const scale7 = lerp(2.6, 3, spreadProgress)
  const yShift = lerp(0, -40, spreadProgress)

  for (let i = 0; i < COUNT; i++) {
    let rawDist = i - centerIdx
    if (rawDist > halfCount) rawDist -= COUNT
    if (rawDist < -halfCount) rawDist += COUNT

    tgt[i].s = scale7
    const absDist = Math.abs(rawDist)

    // All cards go right (absDist), group centered via offset
    const groupOffset = -TOTAL_CARDS * spacing / 2

    if (rawDist === 0) {
      const xPos = lerp(0, groupOffset, spreadProgress)
      tgt[i].x = xPos; cur[i].x = xPos
      tgt[i].y = yShift; tgt[i].z = tiltZ7
      tgt[i].rx = tiltRX7; tgt[i].ry = tiltRY7; tgt[i].r = tiltR7; tgt[i].wx = wx7
      tgt[i].o = 1
      els[i].style.zIndex = String(TOTAL_CARDS + 1)
    } else if (absDist <= TOTAL_CARDS) {
      const p6End = absDist * 14
      const p7End = groupOffset + absDist * spacing
      const xPos = lerp(p6End, p7End, spreadProgress)
      tgt[i].x = xPos; cur[i].x = xPos
      tgt[i].y = yShift; tgt[i].z = tiltZ7
      tgt[i].rx = tiltRX7; tgt[i].ry = tiltRY7; tgt[i].r = tiltR7; tgt[i].wx = wx7
      tgt[i].o = 1
      els[i].style.zIndex = String(TOTAL_CARDS + 1 - absDist)
    } else {
      tgt[i].x = 0; tgt[i].y = 0; tgt[i].z = 0
      tgt[i].rx = 0; tgt[i].ry = 0; tgt[i].r = 0; tgt[i].wx = 1; tgt[i].o = 0
      els[i].style.zIndex = '0'
    }
  }

  tgtText.o = 0; tgtText.y = 0
  tgtBottom.o = Math.min(1, spreadProgress * 2)
  tgtBottom.y = lerp(30, 0, Math.min(1, spreadProgress * 2))
}

onBeforeUnmount(() => {
  masterTl?.kill()
  gsapCtx?.revert()
  gsap.ticker.remove(tickFn)
  window.removeEventListener('mousemove', onMouseMove)
  document.documentElement.style.overflow = ''
})
</script>

<style>
.intro {
  position: relative;
  height: 100vh;
  z-index: 50;
  background: #fafafa;
}

.intro-sticky {
  height: 100vh;
  overflow: hidden;
}

/* ── Header ── */
.intro-header {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  z-index: 3;
  padding: 2rem 3rem;
}

.intro-nav {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 3rem;
  font-family: 'Jost', sans-serif;
}

.intro-nav a {
  font-size: 0.7rem;
  font-weight: 400;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: #1a1a1a;
  text-decoration: none;
  opacity: 0.45;
  transition: opacity 0.3s;
}

.intro-nav a:hover {
  opacity: 1;
}

.intro-brand {
  font-family: 'Unbounded', sans-serif;
  font-size: 0.8rem;
  font-weight: 600;
  letter-spacing: 0.25em;
  color: #1a1a1a;
}

/* ── Thumbnail stage ── */
.intro-stage {
  position: absolute;
  inset: 0;
  z-index: 1;
  perspective: 1200px;
}

.thumb {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 50px;
  height: 72px;
  margin-left: -25px;
  margin-top: -36px;
  border-radius: 10px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08), 0 1px 4px rgba(0, 0, 0, 0.04);
  will-change: transform, opacity;
  transform-style: preserve-3d;
}

.thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: inherit;
  display: block;
}

/* 3D right edge — visible when card rotates via rotateY */
.thumb::after {
  content: '';
  position: absolute;
  top: 0;
  left: 100%;
  width: 12px;
  height: 100%;
  background: linear-gradient(to right, #c0b8a8, #8a7e72 60%, #6a6058);
  transform-origin: left center;
  transform: rotateY(90deg);
  border-radius: 0 3px 3px 0;
}

/* 3D bottom edge */
.thumb::before {
  content: '';
  position: absolute;
  top: 100%;
  left: 0;
  width: 100%;
  height: 12px;
  background: linear-gradient(to bottom, #b0a898, #7a7068 60%, #5a5048);
  transform-origin: center top;
  transform: rotateX(-90deg);
  border-radius: 0 0 3px 3px;
}

/* ── Center text ── */
.intro-center {
  position: absolute;
  inset: 0;
  z-index: 2;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  pointer-events: none;
}

.intro-title {
  font-family: 'Unbounded', sans-serif;
  font-size: clamp(1.4rem, 3vw, 2.4rem);
  font-weight: 700;
  letter-spacing: 0.3em;
  color: #1a1a1a;
  margin-bottom: 1.2rem;
}

.intro-sub {
  font-family: 'Jost', sans-serif;
  font-size: 0.65rem;
  font-weight: 300;
  letter-spacing: 0.3em;
  text-transform: uppercase;
  color: rgba(26, 26, 26, 0.4);
}

/* ── Bottom text (Phase 7) ── */
.intro-bottom {
  position: absolute;
  bottom: 8%;
  left: 0;
  right: 0;
  z-index: 2;
  text-align: center;
  pointer-events: none;
}

.bottom-title {
  font-family: 'Jost', sans-serif;
  font-size: clamp(1rem, 2vw, 1.4rem);
  font-weight: 400;
  letter-spacing: 0.05em;
  color: #1a1a1a;
  margin-bottom: 0.6rem;
}

.bottom-sub {
  font-family: 'Jost', sans-serif;
  font-size: 0.65rem;
  font-weight: 300;
  letter-spacing: 0.3em;
  text-transform: uppercase;
  color: rgba(26, 26, 26, 0.4);
}

/* ── Responsive ── */
@media (max-width: 640px) {
  .intro-nav {
    gap: 1.5rem;
  }

  .intro-nav a {
    font-size: 0.6rem;
  }

  .intro-brand {
    font-size: 0.7rem;
  }

  .thumb {
    width: 50px;
    height: 72px;
    margin-left: -25px;
    margin-top: -36px;
  }
}
</style>
