import { useRef, useEffect, useCallback } from 'react'
import gsap from 'gsap'

// ─── Configuration ──────────────────────────────────────────────────────────

const TILE_COUNT = 24
const TILE_SIZE = 40 // px
const TILE_GAP = 4 // px between tiles in line formation
const CIRCLE_RADIUS_FACTOR = 0.25 // fraction of min(vw, vh)

// ─── Deterministic seed — matches PhotoPlane's seededHash ────────────────────

function seededRandom(i: number): number {
  return Math.sin(i * 7.31 + 1.37) * 0.5 + 0.5
}

// ─── Per-tile layout targets ─────────────────────────────────────────────────

interface TileLayout {
  // Stage 1: random scatter
  scatterX: number
  scatterY: number
  scatterRotation: number
  scatterScale: number
  // Stage 2: horizontal line
  lineX: number
  lineY: number
  // Stage 3: circle
  circleX: number
  circleY: number
  circleRotation: number // tangent angle along circumference
  // Stagger offsets (deterministic per-tile variation)
  seed: number
}

function computeLayouts(
  count: number,
  viewW: number,
  viewH: number,
): TileLayout[] {
  const centerX = viewW / 2
  const centerY = viewH / 2
  const radius = Math.min(viewW, viewH) * CIRCLE_RADIUS_FACTOR

  // Line formation: evenly distribute along X, centered
  const totalLineWidth = count * TILE_SIZE + (count - 1) * TILE_GAP
  const lineStartX = centerX - totalLineWidth / 2

  return Array.from({ length: count }, (_, i) => {
    const seed = seededRandom(i)

    // ── Scatter: random positions within 80% of viewport ──
    const scatterX = (seed * 0.8 + 0.1) * viewW
    const scatterY = (seededRandom(i + 100) * 0.7 + 0.15) * viewH
    const scatterRotation = (seed - 0.5) * 60 // -30° to +30°
    const scatterScale = 0.6 + seed * 0.5 // 0.6–1.1

    // ── Line: evenly spaced, vertically centered ──
    const lineX = lineStartX + i * (TILE_SIZE + TILE_GAP) + TILE_SIZE / 2
    const lineY = centerY

    // ── Circle: polar coordinates ──
    // angle = position around ring, offset by -π/2 so first tile is at top
    const angle = (i / count) * Math.PI * 2 - Math.PI / 2
    const circleX = centerX + radius * Math.cos(angle)
    const circleY = centerY + radius * Math.sin(angle)
    // Tangent rotation: perpendicular to radius, converted to degrees
    const circleRotation = (angle + Math.PI / 2) * (180 / Math.PI)

    return {
      scatterX,
      scatterY,
      scatterRotation,
      scatterScale,
      lineX,
      lineY,
      circleX,
      circleY,
      circleRotation,
      seed,
    }
  })
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function TileOrchestration() {
  const containerRef = useRef<HTMLDivElement>(null)
  const tilesRef = useRef<HTMLDivElement[]>([])
  const timelineRef = useRef<gsap.core.Timeline | null>(null)
  const layoutsRef = useRef<TileLayout[]>([])

  const setTileRef = useCallback((el: HTMLDivElement | null, i: number) => {
    if (el) tilesRef.current[i] = el
  }, [])

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const tiles = tilesRef.current
    if (tiles.length !== TILE_COUNT) return

    const vw = container.offsetWidth
    const vh = container.offsetHeight
    const layouts = computeLayouts(TILE_COUNT, vw, vh)
    layoutsRef.current = layouts

    // ── Initialize all tiles at scatter positions, invisible ──
    tiles.forEach((tile, i) => {
      const l = layouts[i]
      gsap.set(tile, {
        x: l.scatterX - TILE_SIZE / 2,
        y: l.scatterY - TILE_SIZE / 2,
        rotation: l.scatterRotation,
        scale: 0.8 * l.scatterScale,
        opacity: 0,
        transformOrigin: '50% 50%',
      })
    })

    // ════════════════════════════════════════════════════════════════════════
    // MASTER TIMELINE
    // ════════════════════════════════════════════════════════════════════════

    const tl = gsap.timeline({ paused: true })
    timelineRef.current = tl

    // ── STAGE 1: SCATTER IN ──────────────────────────────────────────────
    //
    // Each tile fades in with a scale pop.
    // Stagger: 40–80ms per tile (deterministic via seed).
    // We sort tiles by seed to create a "popcorn" reveal pattern
    // rather than a left-to-right sweep.

    const scatterOrder = layouts
      .map((l, i) => ({ i, delay: i * 0.05 + l.seed * 0.03 }))
      .sort((a, b) => a.delay - b.delay)

    tl.addLabel('scatter')

    scatterOrder.forEach(({ i, delay }) => {
      const l = layouts[i]
      tl.to(
        tiles[i],
        {
          opacity: 1,
          scale: l.scatterScale,
          duration: 0.5,
          ease: 'power2.out', // fast deceleration — easeOutQuart-like
        },
        `scatter+=${delay}`,
      )
    })

    // ── STAGE 2: HORIZONTAL ALIGNMENT ────────────────────────────────────
    //
    // All tiles move toward a single horizontal strip.
    // Motion feels "magnetic": ease-in-out with per-tile stagger.
    //
    // Key math:
    //   target position = lineStartX + i * (TILE_SIZE + TILE_GAP)
    //   stagger = seed * 0.3s (0–300ms variation)

    const lineStart = 'scatter+=1.6' // overlap slightly with scatter end
    tl.addLabel('toLine', lineStart)

    layouts.forEach((l, i) => {
      const elementDelay = l.seed * 0.3

      tl.to(
        tiles[i],
        {
          x: l.lineX - TILE_SIZE / 2,
          y: l.lineY - TILE_SIZE / 2,
          rotation: 0,
          scale: 0.7,
          duration: 1.8,
          ease: 'power2.inOut', // S-curve — cubic ease-in-out
        },
        `toLine+=${elementDelay}`,
      )
    })

    // ── STAGE 3: CIRCULAR FORMATION ──────────────────────────────────────
    //
    // Tiles fly from the horizontal line into polar-coordinate positions.
    //
    // Implementation:
    //   Final position: x = cx + r*cos(θ), y = cy + r*sin(θ)
    //   where θ = (i/total) * 2π - π/2
    //
    // The flight path is NOT a straight interpolation — we add a spiral
    // offset that decays over the animation duration. This creates
    // the "tornado" convergence effect:
    //
    //   spiralDecay = 1 - easeProgress  (starts at 1, goes to 0)
    //   spiralAngle = spiralDecay * 2π * (0.6 + seed * 0.6)
    //   offset = spiralDecay * amplitude * [cos(spiralAngle), sin(spiralAngle)]
    //
    // We apply this via onUpdate modifier since GSAP can't natively
    // interpolate along spiral paths.

    const circleStart = 'toLine+=1.5'
    tl.addLabel('toCircle', circleStart)

    const centerX = vw / 2
    const centerY = vh / 2

    layouts.forEach((l, i) => {
      // Stagger: spread tiles over ~1.3s based on ring position + seed
      const circleStagger = (i / TILE_COUNT) * 1.0 + l.seed * 0.3

      // Proxy object for GSAP to tween — we intercept in onUpdate
      // to add spiral offset
      const proxy = { t: 0 }

      // Capture starting position at the moment this tween begins
      const startPos = { x: 0, y: 0 }
      let captured = false

      tl.to(
        proxy,
        {
          t: 1,
          duration: 2.0,
          ease: 'expo.out', // fast burst, long deceleration tail

          onStart() {
            // Snapshot current position as flight origin
            const matrix = gsap.getProperty(tiles[i])
            startPos.x = matrix('x') as number
            startPos.y = matrix('y') as number
            captured = true
          },

          onUpdate() {
            if (!captured) return
            const t = proxy.t

            // ── Spiral offset computation ──
            // spiralDecay goes 1→0 as t goes 0→1
            // This makes the spiral tighten and vanish at the end
            const spiralDecay = 1 - t
            const spiralAngle =
              spiralDecay * Math.PI * 2 * (0.6 + l.seed * 0.6)
            const spiralAmplitude = spiralDecay * 80 // px — max spiral radius

            const spiralX = Math.cos(spiralAngle) * spiralAmplitude
            const spiralY = Math.sin(spiralAngle) * spiralAmplitude

            // ── Interpolate start → circle target + spiral ──
            const targetX = l.circleX - TILE_SIZE / 2
            const targetY = l.circleY - TILE_SIZE / 2

            const x = startPos.x + (targetX - startPos.x) * t + spiralX
            const y = startPos.y + (targetY - startPos.y) * t + spiralY

            gsap.set(tiles[i], { x, y })
          },
        },
        `toCircle+=${circleStagger}`,
      )

      // Rotation and scale animate separately (simpler path)
      tl.to(
        tiles[i],
        {
          rotation: l.circleRotation,
          scale: 0.75,
          duration: 2.0,
          ease: 'back.out(1.2)', // slight overshoot snap
        },
        `toCircle+=${circleStagger}`,
      )
    })

    // ── STAGE 4: FINAL STABILIZATION ─────────────────────────────────────
    //
    // Micro-corrections: each tile nudges to its exact final position.
    // Exponential ease-out creates a "settling" feel — fast correction
    // followed by imperceptible drift to rest.

    const settleStart = 'toCircle+=2.5'
    tl.addLabel('settle', settleStart)

    layouts.forEach((l, i) => {
      tl.to(
        tiles[i],
        {
          x: l.circleX - TILE_SIZE / 2,
          y: l.circleY - TILE_SIZE / 2,
          rotation: l.circleRotation,
          scale: 0.75,
          duration: 1.5,
          ease: 'expo.out', // exponential deceleration for settle
        },
        `settle+=${l.seed * 0.2}`,
      )
    })

    // ── Play ──
    tl.play()

    // ── Cleanup ──
    return () => {
      tl.kill()
    }
  }, [])

  return (
    <div
      ref={containerRef}
      style={{
        position: 'fixed',
        inset: 0,
        overflow: 'hidden',
        background: '#0a0a0a',
      }}
    >
      {Array.from({ length: TILE_COUNT }, (_, i) => (
        <div
          key={i}
          ref={(el) => setTileRef(el, i)}
          style={{
            position: 'absolute',
            width: TILE_SIZE,
            height: TILE_SIZE,
            borderRadius: 4,
            // Each tile gets a unique hue derived from its index
            backgroundColor: `hsl(${(i / TILE_COUNT) * 360}, 55%, 55%)`,
            willChange: 'transform, opacity',
          }}
        />
      ))}
    </div>
  )
}
