import { COUNT, P9_COUNT, EASE, HOVER_EASE, TOTAL_CARDS, lerp } from '@/animation/constants'
import { computeTargets } from '@/animation/phases'
import { useI18n } from '@/composables/useI18n'

const base = import.meta.env.BASE_URL

export function useCardState() {
  const { t } = useI18n()
  let currentProgress = 0
  let phase9 = false
  let phase9Progress = 0
  let p8HoveredIdx = -1

  const cur = Array.from({ length: COUNT }, () => ({ x: 0, y: 0, z: 0, r: 0, rx: 0, ry: 0, s: 1, wx: 1, o: 1 }))
  const tgt = Array.from({ length: COUNT }, () => ({ x: 0, y: 0, z: 0, r: 0, rx: 0, ry: 0, s: 1, wx: 1, o: 1 }))
  const curText = { o: 1, y: 0 }
  const tgtText = { o: 1, y: 0 }
  const curArc = { o: 0, y: 20 }
  const tgtArc = { o: 0, y: 20 }
  const curBottom = { o: 0, y: 30 }
  const tgtBottom = { o: 0, y: 30 }

  const p9Cur = Array.from({ length: P9_COUNT }, () => ({ x: 0, y: 0, z: 0, r: 0, rx: 0, ry: 0, s: 1, o: 0 }))
  const p9Tgt = Array.from({ length: P9_COUNT }, () => ({ x: 0, y: 0, z: 0, r: 0, rx: 0, ry: 0, s: 1, o: 0 }))

  const hoverSpin = Array.from({ length: COUNT }, () => 0)
  const hoverLift = Array.from({ length: COUNT }, () => 0)
  const p8Hover = Array.from({ length: COUNT }, () => 0)
  const p8Dim = Array.from({ length: COUNT }, () => 0)
  const p9Hover = Array.from({ length: P9_COUNT }, () => 0)

  // Project name keys for spread phase hover (one per visible card, TOTAL_CARDS + 1)
  const projectNameKeys = [
    'project.afi',
    'project.level',
    'project.mosfilm',
    'project.n100',
    'project.n35',
    'project.afi',
  ]

  let cachedTitleEl = null
  let cachedPhilosophyEl = null
  let cachedSubEl = null
  let cachedBottomEl = null
  let selectedProjectName = ''

  // Cascade collapse (scroll down in phase 9 compresses cards into a stack)
  let cascadeCollapse = 0
  let cascadeCollapseTarget = 0
  let phase9ExitTime = 0
  let lastWheelTime = 0

  // Mobile drag (phase 8: horizontal, phase 9: along cascade diagonal)
  let dragOffsetX = 0
  let dragDiag = 0
  let dragMomentumX = 0
  let dragMomentumDiag = 0
  let isDragging = false
  let lastDragX = 0
  let lastDragY = 0
  // Cascade diagonal direction (matches cascadePhase refW/refH)
  const cascadeAngle = -Math.atan2(900, 1440) * 0.9
  const cascadeDirX = Math.cos(cascadeAngle)
  const cascadeDirY = Math.sin(cascadeAngle)

  // Real project photos distributed across 24 circle slots
  const projectPhotos = [
    'projects/afi/1.jpg',   'projects/level/1.jpg',  'projects/mosfilm/001.jpg', 'projects/n100/2.jpg',  'projects/n35/1.jpg',
    'projects/afi/2.jpg',   'projects/level/2.jpg',  'projects/mosfilm/002.jpg', 'projects/n100/3.jpg',  'projects/n35/2.jpg',
    'projects/afi/3.jpg',   'projects/level/3.jpg',  'projects/mosfilm/003.jpg', 'projects/n100/4.jpg',  'projects/n35/3.jpg',
    'projects/afi/4.jpg',   'projects/level/4.jpg',  'projects/mosfilm/004.jpg', 'projects/n100/5.jpg',  'projects/n35/4.jpg',
    'projects/afi/5.jpg',   'projects/level/5.jpg',  'projects/mosfilm/005.jpg', 'projects/n100/6.jpg',
  ].map(p => base + p)
  const thumbnails = Array.from({ length: COUNT }, (_, i) => ({
    src: projectPhotos[i % projectPhotos.length],
  }))

  // Phase 9 cascade: one hero photo per project + extras
  const p9Photos = [
    'projects/afi/1.jpg',   'projects/afi/2.jpg',   'projects/afi/3.jpg',   'projects/afi/4.jpg',
    'projects/level/1.jpg', 'projects/level/2.jpg',  'projects/level/3.jpg', 'projects/level/4.jpg',
    'projects/mosfilm/001.jpg', 'projects/mosfilm/002.jpg', 'projects/mosfilm/003.jpg', 'projects/mosfilm/004.jpg',
    'projects/n100/2.jpg',  'projects/n100/3.jpg',  'projects/n100/4.jpg',  'projects/n100/5.jpg',
    'projects/n35/1.jpg',   'projects/n35/2.jpg',   'projects/n35/3.jpg',   'projects/n35/4.jpg',
    'projects/afi/5.jpg',
  ].map(p => base + p)
  const p9Thumbnails = Array.from({ length: P9_COUNT }, (_, i) => ({
    src: p9Photos[i % p9Photos.length],
  }))

  function setProgress(p) {
    if (phase9) {
      // In showcase scroll mode, ignore progress — scrolling is handled by Lenis/browser
      // Only exit if user deliberately scrolls back far enough
      if (showcaseScrolling && p < 0.9) {
        phase9 = false
        showcaseScrolling = false
        phase9ExitTime = performance.now()
        currentProgress = p
      }
      return
    }
    const now = performance.now()
    const elapsed = now - phase9ExitTime
    // Block progress updates while wheel inertia is still active after phase 9 exit
    if (elapsed < 4000 && now - lastWheelTime < 300) return
    currentProgress = p
  }

  function onThumbClick() {
    if (currentProgress >= 0.96 && !phase9) {
      // Capture the project name that was hovered when the user clicked
      if (p8HoveredIdx >= 0) {
        const rotStep = (Math.PI * 2) / COUNT
        const finalRot = -rotStep * 9
        let cIdx = Math.round(((-Math.PI / 2 - finalRot) / (Math.PI * 2)) * COUNT) % COUNT
        if (cIdx < 0) cIdx += COUNT
        let slot = p8HoveredIdx - cIdx
        if (slot > COUNT / 2) slot -= COUNT
        if (slot < -COUNT / 2) slot += COUNT
        selectedProjectName = t(projectNameKeys[slot]) || ''
      } else {
        selectedProjectName = ''
      }
      phase9 = true
      dragOffsetX = 0
      dragDiag = 0
      dragMomentumX = 0
      dragMomentumDiag = 0
    }
  }

  function tick({ thumbEls, p9ThumbEls, centerEl, arcTextEl, arcWordEls, bottomEl, stickyEl, mouse, smoothMouse, glLayer, dt }) {
    const els = thumbEls
    if (!els.length) return

    const vh = window.innerHeight
    const vw = window.innerWidth

    // GL crossfade: ramp 0→1 over progress 0.92→0.95
    const glReady = glLayer && glLayer.gl
    const isSpread = currentProgress >= 0.92 && !phase9
    const glFade = glReady && isSpread ? Math.min(1, (currentProgress - 0.92) / 0.03) : 0

    // Phase 9 transition
    if (!phase9) cascadeCollapseTarget = 0
    const p9Target = phase9 ? 1 : 0
    phase9Progress += (p9Target - phase9Progress) * (phase9 ? 0.04 : 0.08)
    const collapseDir = cascadeCollapseTarget - cascadeCollapse
    const collapseEase = collapseDir < 0
      ? lerp(0.07, 0.04, Math.min(cascadeCollapse, 1))
      : cascadeCollapse > 1
        ? 0.07
        : lerp(0.08, 0.04, cascadeCollapse)
    cascadeCollapse += (cascadeCollapseTarget - cascadeCollapse) * collapseEase

    const mx = mouse.x * vw / 2
    const my = mouse.y * vh / 2
    const hoverActive = currentProgress <= 0.15

    // Mobile drag: momentum + bounds (phase 8 & 9)
    const isMobile = vw < 1024
    if (isMobile && currentProgress >= 0.96) {
      if (!isDragging) {
        if (phase9) {
          dragDiag += dragMomentumDiag
          dragMomentumDiag *= 0.95
          if (Math.abs(dragMomentumDiag) < 0.5) dragMomentumDiag = 0
        } else {
          dragOffsetX += dragMomentumX
          dragMomentumX *= 0.95
          if (Math.abs(dragMomentumX) < 0.5) dragMomentumX = 0
        }
      }
      if (phase9) {
        // Single scalar along cascade diagonal
        const refW = 1440, refH = 900
        const refDiag = Math.sqrt(refW * refW + refH * refH)
        const desiredStep = (refDiag - 400) / (P9_COUNT - 1) * 0.9
        const totalLen = (P9_COUNT - 1) * desiredStep
        const maxDiag = Math.max(0, totalLen / 2 - Math.min(vw, vh) * 0.3)
        // Rubber-band diagonal
        if (!isDragging) {
          if (dragDiag > maxDiag) dragDiag += (maxDiag - dragDiag) * 0.12
          else if (dragDiag < -maxDiag) dragDiag += (-maxDiag - dragDiag) * 0.12
        } else {
          if (dragDiag > maxDiag) dragDiag = maxDiag + (dragDiag - maxDiag) * 0.35
          else if (dragDiag < -maxDiag) dragDiag = -maxDiag + (dragDiag + maxDiag) * 0.35
        }
      } else {
        // Phase 8: horizontal only — match spreadPhase spacing & scale
        const spacing = 140
        const cardScale = 5
        const cardW = (vw < 640 ? 32 : 40) * cardScale
        const totalWidth = TOTAL_CARDS * spacing + cardW
        const maxDragX = Math.max(0, totalWidth / 2 - vw * 0.3)
        if (!isDragging) {
          if (dragOffsetX > maxDragX) dragOffsetX += (maxDragX - dragOffsetX) * 0.12
          else if (dragOffsetX < -maxDragX) dragOffsetX += (-maxDragX - dragOffsetX) * 0.12
        } else {
          if (dragOffsetX > maxDragX) dragOffsetX = maxDragX + (dragOffsetX - maxDragX) * 0.35
          else if (dragOffsetX < -maxDragX) dragOffsetX = -maxDragX + (dragOffsetX + maxDragX) * 0.35
        }
      }
    } else {
      if (Math.abs(dragOffsetX) > 1) dragOffsetX *= 0.85
      else dragOffsetX = 0
      if (Math.abs(dragDiag) > 1) dragDiag *= 0.85
      else dragDiag = 0
      dragMomentumX = 0
      dragMomentumDiag = 0
    }

    // Allow cards to overflow on mobile during drag phases, and during showcase
    const showcaseActive = cascadeCollapse > 1
    if (stickyEl) {
      stickyEl.style.overflow = ((isMobile && currentProgress >= 0.92) || showcaseActive) ? 'visible' : 'hidden'
    }

    const result = computeTargets(currentProgress, {
      vh, vw, tgt, tgtText, tgtArc, tgtBottom, cur, els, mouse,
      smoothMouse, p9Tgt, phase9, phase9Progress, dragOffsetX, dragDiag, cascadeDirX, cascadeDirY, cascadeCollapse,
    })
    p8HoveredIdx = result.p8HoveredIdx

    // Interpolate main cards
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

      // Circle hover
      let spinTarget = 0
      let liftTarget = 0
      if (hoverActive) {
        const dx = c.x - mx
        const dy = c.y - my
        const dist = Math.sqrt(dx * dx + dy * dy)
        const spinProx = dist < 40 ? 1 : Math.max(0, 1 - (dist - 40) / 160)
        const liftProx = Math.max(0, 1 - dist / 200)
        spinTarget = spinProx * 180
        liftTarget = liftProx * 220
      }
      hoverSpin[i] += (spinTarget - hoverSpin[i]) * HOVER_EASE
      hoverLift[i] += (liftTarget - hoverLift[i]) * HOVER_EASE
      const hz = hoverLift[i]

      // Phase 8 hover
      const p8LiftTarget = (p8HoveredIdx >= 0 && i === p8HoveredIdx) ? 1 : 0
      const p8DimTarget = (p8HoveredIdx >= 0 && i !== p8HoveredIdx) ? 0.4 : 0
      p8Hover[i] += (p8LiftTarget - p8Hover[i]) * HOVER_EASE
      p8Dim[i] += (p8DimTarget - p8Dim[i]) * HOVER_EASE

      els[i].style.transform = `translate3d(${c.x}px, ${c.y + p8Hover[i] * -40}px, ${c.z + hz}px) perspective(1500px) rotateX(${c.rx}deg) rotateY(${c.ry}deg) rotateZ(${c.r}deg) rotateY(${hoverSpin[i]}deg) scale(${c.s}) scaleX(${c.wx})`
      if (t.o < 0.01) c.o = 0
      const baseO = c.o > 0.95 ? 1 : Math.max(0, c.o)
      const finalO = baseO * (1 - p8Dim[i])
      els[i].style.opacity = String(finalO * (1 - glFade))
    }

    // ── WebGL glass cards ──
    if (glFade > 0.01) {
      glLayer.resize()
      const cardW = vw < 640 ? 32 : vw < 1024 ? 40 : 50
      const cardH = vw < 640 ? 46 : vw < 1024 ? 58 : 72
      const glCards = []
      for (let i = 0; i < COUNT; i++) {
        if (tgt[i].o < 0.1) continue
        const c = cur[i]
        const baseO = c.o > 0.95 ? 1 : Math.max(0, c.o)
        glCards.push({
          x: c.x, y: c.y + p8Hover[i] * -40, z: c.z + hoverLift[i],
          rx: c.rx, ry: c.ry, r: c.r, s: c.s, wx: c.wx,
          o: baseO * (1 - p8Dim[i]) * glFade,
          index: i,
          zOrder: parseInt(els[i].style.zIndex) || 0,
        })
      }
      glCards.sort((a, b) => a.zOrder - b.zOrder)
      glLayer.render(glCards, dt || 0.016, cardW, cardH)
    } else if (glReady) {
      glLayer.clear()
    }

    // Phase 9 elements — hover detection (disabled during showcase collapse)
    let p9HoveredIdx = -1
    if (phase9 && phase9Progress > 0.5 && cascadeCollapse < 0.3) {
      let bestIdx = -1
      let bestDist = Infinity
      for (let i = 0; i < P9_COUNT && i < p9ThumbEls.length; i++) {
        const dx = p9Cur[i].x - mx
        const dy = p9Cur[i].y - my
        const d = dx * dx + dy * dy
        if (d < bestDist) { bestDist = d; bestIdx = i }
      }
      p9HoveredIdx = Math.sqrt(bestDist) < 150 ? bestIdx : -1
    }

    for (let i = 0; i < P9_COUNT && i < p9ThumbEls.length; i++) {
      const c = p9Cur[i]
      const t = p9Tgt[i]
      if (t.o < 0.01) c.o *= 0.9
      c.x += (t.x - c.x) * EASE
      c.y += (t.y - c.y) * EASE
      c.z += (t.z - c.z) * EASE
      c.rx += (t.rx - c.rx) * EASE
      c.ry += (t.ry - c.ry) * EASE
      c.r += (t.r - c.r) * EASE
      c.s += (t.s - c.s) * EASE
      c.o += (t.o - c.o) * EASE

      const hoverTarget = i === p9HoveredIdx ? 1 : 0
      p9Hover[i] += (hoverTarget - p9Hover[i]) * HOVER_EASE
      const hx = p9Hover[i] * 40

      p9ThumbEls[i].style.transform = `translate3d(${c.x}px, ${c.y}px, ${c.z}px) rotateX(${c.rx}deg) rotateY(${c.ry}deg) rotateZ(${c.r}deg) translateX(${hx}px) scale(${c.s})`
      const p9o = Math.max(0, c.o)
      p9ThumbEls[i].style.opacity = String(p9o)
      p9ThumbEls[i].style.zIndex = String(P9_COUNT - i)
      p9ThumbEls[i].style.pointerEvents = p9o > 0.3 ? 'auto' : 'none'
    }

    // Text elements
    curText.o = tgtText.o >= 1 ? 1 : curText.o + (tgtText.o - curText.o) * EASE
    curText.y = tgtText.y === 0 && Math.abs(curText.y) < 0.5 ? 0 : curText.y + (tgtText.y - curText.y) * EASE
    if (centerEl) {
      centerEl.style.opacity = String(Math.max(0, curText.o))
      centerEl.style.transform = `translateY(${curText.y}px)`
    }

    curArc.o += (tgtArc.o - curArc.o) * EASE
    curArc.y += (tgtArc.y - curArc.y) * EASE
    if (arcTextEl) {
      arcTextEl.style.opacity = String(Math.max(0, curArc.o))
      arcTextEl.style.transform = `translateY(${curArc.y}px)`
    }

    // Word-by-word bold highlight
    if (arcWordEls && arcWordEls.length) {
      const wordCount = arcWordEls.length
      const highlightStart = 0.25
      const highlightEnd = 0.55
      const wordProgress = Math.max(0, (currentProgress - highlightStart) / (highlightEnd - highlightStart)) * wordCount
      for (let i = 0; i < wordCount; i++) {
        const active = i < wordProgress
        arcWordEls[i].style.fontWeight = active ? '500' : '300'
        arcWordEls[i].style.color = active ? 'rgba(26,26,26,0.75)' : ''
      }
    }

    curBottom.o += (tgtBottom.o - curBottom.o) * EASE
    curBottom.y += (tgtBottom.y - curBottom.y) * EASE
    if (bottomEl) {
      bottomEl.style.opacity = String(Math.max(0, curBottom.o))
      bottomEl.style.transform = `translateY(${curBottom.y}px)`

      // Update title text on hover
      if (cachedBottomEl !== bottomEl) {
        cachedBottomEl = bottomEl
        cachedTitleEl = bottomEl.querySelector('.bottom-title-project')
        cachedPhilosophyEl = bottomEl.querySelector('.bottom-title-philosophy')
        cachedSubEl = bottomEl.querySelector('.bottom-sub')
      }

      // Smooth crossfade between project title / philosophy text / sub line
      // based on the cascade→showcase progress.
      const showcaseT = Math.min(1, Math.max(0, cascadeCollapse - 1))
      // Ease (smoothstep) so the swap feels gentle
      const sT = showcaseT * showcaseT * (3 - 2 * showcaseT)

      if (cachedTitleEl) {
        if (phase9 && selectedProjectName) {
          cachedTitleEl.textContent = selectedProjectName
        } else if (p8HoveredIdx >= 0) {
          const rotStep = (Math.PI * 2) / COUNT
          const finalRot = -rotStep * 9
          let cIdx = Math.round(((-Math.PI / 2 - finalRot) / (Math.PI * 2)) * COUNT) % COUNT
          if (cIdx < 0) cIdx += COUNT
          let slot = p8HoveredIdx - cIdx
          if (slot > COUNT / 2) slot -= COUNT
          if (slot < -COUNT / 2) slot += COUNT
          cachedTitleEl.textContent = t(projectNameKeys[slot]) || t('bottom.recent')
        } else {
          cachedTitleEl.textContent = t('bottom.recent')
        }
        cachedTitleEl.style.opacity = String(1 - sT)
      }
      if (cachedPhilosophyEl) {
        cachedPhilosophyEl.style.opacity = String(sT)
      }
      if (cachedSubEl) {
        cachedSubEl.style.opacity = String(1 - sT)
      }
    }
  }

  function startDrag(x, y) {
    isDragging = true
    lastDragX = x
    lastDragY = y
    dragMomentumX = 0
    dragMomentumDiag = 0
  }

  function moveDrag(x, y) {
    if (!isDragging) return
    const dx = x - lastDragX
    const dy = y - lastDragY
    if (phase9) {
      // Project onto cascade diagonal
      const proj = dx * cascadeDirX + dy * cascadeDirY
      dragDiag += proj
      dragMomentumDiag = proj * 0.6 + dragMomentumDiag * 0.4
    } else {
      dragOffsetX += dx
      dragMomentumX = dx * 0.6 + dragMomentumX * 0.4
    }
    lastDragX = x
    lastDragY = y
  }

  function endDrag() {
    isDragging = false
  }

  function scrollCascade(deltaY) {
    if (!phase9) return
    // Exit phase9 when fully uncollapsed and still scrolling up
    if (deltaY < 0 && cascadeCollapseTarget <= 0 && cascadeCollapse < 0.001) {
      phase9 = false
      phase9ExitTime = performance.now()
      return
    }
    const isMobile = window.innerWidth < 1024
    const speed = isMobile ? 0.004 : 0.001
    cascadeCollapseTarget = Math.max(0, Math.min(2, cascadeCollapseTarget + deltaY * speed))
  }

  function isInPhase9() {
    return phase9
  }

  function recordWheel() {
    lastWheelTime = performance.now()
  }

  function shouldBlockScroll() {
    if (phase9) return true
    const now = performance.now()
    const elapsed = now - phase9ExitTime
    if (elapsed < 800 && now - lastWheelTime < 300) return true
    return false
  }

  function getShowcaseProgress() {
    return Math.max(0, cascadeCollapse - 1)
  }

  function isShowcaseOpen() {
    return cascadeCollapse >= 1.85
  }

  let showcaseScrolling = false

  function enterShowcaseScroll() {
    showcaseScrolling = true
  }

  function isShowcaseScrolling() {
    return showcaseScrolling
  }

  function exitShowcaseScroll() {
    showcaseScrolling = false
  }

  function forceExitPhase9() {
    phase9 = false
    showcaseScrolling = false
    phase9ExitTime = performance.now()
    currentProgress = 1
    cascadeCollapse = 0
    cascadeCollapseTarget = 0
  }

  function getProgress() {
    return currentProgress
  }

  return { cur, thumbnails, p9Thumbnails, setProgress, onThumbClick, scrollCascade, tick, startDrag, moveDrag, endDrag, isInPhase9, forceExitPhase9, shouldBlockScroll, recordWheel, getShowcaseProgress, isShowcaseOpen, isShowcaseScrolling, enterShowcaseScroll, exitShowcaseScroll, getProgress }
}
