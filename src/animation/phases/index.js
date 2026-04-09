import { COUNT, P9_COUNT, getCircleR } from '../constants'
import * as circlePhase from './circlePhase'
import * as arcSpreadPhase from './arcSpreadPhase'
import * as zoomPhase from './zoomPhase'
import * as tiltPhase from './tiltPhase'
import * as spreadPhase from './spreadPhase'
import * as cascadePhase from './cascadePhase'
import * as showcasePhase from './showcasePhase'

export function computeTargets(progress, ctx) {
  const { vh, vw, tgtBottom, tgtArc } = ctx

  const isMobile = vw < 1024
  const circleR = getCircleR(vw, vh)
  const radiusEnd = isMobile ? Math.max(circleR * 1.5, vh * 0.6) : vw * 0.48
  const rotationStep = (Math.PI * 2) / COUNT
  const finalRotOffset = -rotationStep * 9

  // Hidden by default
  tgtBottom.o = 0
  tgtBottom.y = 30
  tgtArc.o = 0
  tgtArc.y = 20

  const phaseCtx = { ...ctx, progress, radiusEnd, finalRotOffset }

  // ── Circle → arc → orbit (0–0.55) ──
  if (progress <= 0.55) {
    circlePhase.compute(phaseCtx)
    return { p8HoveredIdx: -1 }
  }

  // Derived values shared by arc-based phases
  let centerIdx = Math.round(((-Math.PI / 2 - finalRotOffset) / (Math.PI * 2)) * COUNT) % COUNT
  if (centerIdx < 0) centerIdx += COUNT

  const halfCount = COUNT / 2
  const angularStep = (Math.PI * 2) / COUNT
  const centerAngle = (centerIdx / COUNT) * Math.PI * 2 + finalRotOffset
  const arcCY = radiusEnd
  const arcRadius = radiusEnd
  const arcScale = isMobile ? 1.5 : 3

  Object.assign(phaseCtx, { centerIdx, halfCount, angularStep, centerAngle, arcCY, arcRadius, arcScale })

  // ── Arc spread (0.55–0.75) ──
  if (progress <= 0.75) {
    arcSpreadPhase.compute(phaseCtx)
    return { p8HoveredIdx: -1 }
  }

  // ── Center zoom (0.75–0.85) ──
  if (progress <= 0.85) {
    zoomPhase.compute(phaseCtx)
    return { p8HoveredIdx: -1 }
  }

  // ── Tilt accordion (0.85–0.92) ──
  if (progress <= 0.92) {
    tiltPhase.compute(phaseCtx)
    return { p8HoveredIdx: -1 }
  }

  // ── Spread + hover (0.92–1.0) ──
  const p8HoveredIdx = spreadPhase.compute(phaseCtx)

  // ── Cascade overlay (click-triggered) ──
  if (phaseCtx.phase9Progress > 0.01) {
    const collapse = phaseCtx.cascadeCollapse || 0
    if (collapse > 1) {
      showcasePhase.compute(phaseCtx)
    } else {
      cascadePhase.compute(phaseCtx)
    }
    // Fade cascade cards with phase9Progress transition
    const p9Fade = phaseCtx.phase9Progress
    for (let i = 0; i < P9_COUNT; i++) ctx.p9Tgt[i].o *= p9Fade
  } else {
    for (let i = 0; i < P9_COUNT; i++) ctx.p9Tgt[i].o = 0
  }

  return { p8HoveredIdx }
}
