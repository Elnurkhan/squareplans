import { useRef, useMemo } from 'react'
import { useFrame, useLoader } from '@react-three/fiber'
// 2D planes — no drei dependency needed
import * as THREE from 'three'
import { useScrollStore } from '../store/scrollStore'
import { CIRCLE_RADIUS, LINE_SPREAD, type PhotoData } from '../data/photos'

interface Props {
  data: PhotoData
  index: number
  total: number
  groupRotation: React.MutableRefObject<number>
  mouseWorld: THREE.Vector3
}

function clamp(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, v))
}

function damp(current: number, target: number, smoothing: number, dt: number) {
  return THREE.MathUtils.lerp(current, target, 1 - Math.exp(-smoothing * dt))
}

const HOVER_RADIUS = 2.5 // distance within which photos react to cursor
const HOVER_MAX_SPIN = Math.PI // max Y rotation (180°)

export default function PhotoPlane({ data, index, total, groupRotation, mouseWorld }: Props) {
  const meshRef = useRef<THREE.Mesh>(null)
  const materialRef = useRef<THREE.MeshStandardMaterial>(null)

  const texture = useLoader(THREE.TextureLoader, data.src)

  const staggerDelay = index * 0.04
  const circleStagger = (index / total) * 1.2 // stagger circle assembly over 1.2s
  const appearStartTime = useRef<number | null>(null)
  const circleStartTime = useRef<number | null>(null)

  const current = useRef({
    x: data.chaosX,
    y: data.chaosY,
    z: 0,
    rotZ: data.chaosRotation,
    hoverSpin: 0, // hover Y spin
    scale: 0,
    opacity: 0,
  })

  const roundedGeom = useMemo(() => {
    const base = 0.58
    const variation = 0.1
    const seed = Math.sin(index * 7.31) * 0.5 + 0.5
    const w = base + seed * variation
    const h = w * 1.2
    const r = 0.04 // corner radius

    const shape = new THREE.Shape()
    const hw = w / 2
    const hh = h / 2
    shape.moveTo(-hw + r, -hh)
    shape.lineTo(hw - r, -hh)
    shape.quadraticCurveTo(hw, -hh, hw, -hh + r)
    shape.lineTo(hw, hh - r)
    shape.quadraticCurveTo(hw, hh, hw - r, hh)
    shape.lineTo(-hw + r, hh)
    shape.quadraticCurveTo(-hw, hh, -hw, hh - r)
    shape.lineTo(-hw, -hh + r)
    shape.quadraticCurveTo(-hw, -hh, -hw + r, -hh)

    const geom = new THREE.ShapeGeometry(shape)
    // Remap UVs to 0–1 range
    const uv = geom.attributes.uv
    const pos = geom.attributes.position
    for (let i = 0; i < uv.count; i++) {
      uv.setXY(i, (pos.getX(i) + hw) / w, (pos.getY(i) + hh) / h)
    }
    return geom
  }, [index])

  useFrame((state, delta) => {
    if (!meshRef.current || !materialRef.current) return

    const phase = useScrollStore.getState().phase
    const progress = useScrollStore.getState().scrollProgress
    const c = current.current
    const time = state.clock.getElapsedTime()
    const dt = Math.min(delta, 0.1)

    // Compute visible width at z=0 for fitting line layout
    const cam = state.camera as THREE.PerspectiveCamera
    const visibleHeight = 2 * Math.tan(THREE.MathUtils.degToRad(cam.fov / 2)) * cam.position.z
    const visibleWidth = visibleHeight * (state.size.width / state.size.height)

    if (phase === 'loading') {
      c.opacity = 0
      c.scale = 0
    } else if (phase === 'chaos-in') {
      if (appearStartTime.current === null) {
        appearStartTime.current = time
      }
      const elapsed = time - appearStartTime.current - staggerDelay
      if (elapsed > 0) {
        const t = clamp(elapsed / 0.8, 0, 1)
        const eased = 1 - Math.pow(1 - t, 4)
        // Scale positions to fit within visible area
        const maxLineX = LINE_SPREAD / 2
        const availableHalfX = (visibleWidth / 2) * 0.9
        const scaleX = Math.min(1, availableHalfX / maxLineX)
        const maxChaosY = 4 // chaosY range is ±4
        const availableHalfY = (visibleHeight / 2) * 0.85
        const scaleY = Math.min(1, availableHalfY / maxChaosY)
        c.opacity = damp(c.opacity, eased, 8, dt)
        c.scale = damp(c.scale, data.chaosScale * eased, 8, dt)
        c.x = damp(c.x, data.chaosX * scaleX, 8, dt)
        c.y = damp(c.y, data.chaosY * scaleY, 6, dt)
        c.z = 0
        c.rotZ = damp(c.rotZ, data.chaosRotation, 6, dt)
      }
    } else if (phase === 'to-line') {
      const speed = 4
      // Scale lineX to fit within the visible screen width (with padding)
      const maxLineX = LINE_SPREAD / 2
      const availableHalf = (visibleWidth / 2) * 0.9 // 10% padding
      const lineScale = Math.min(1, availableHalf / maxLineX)
      c.opacity = damp(c.opacity, 1, speed, dt)
      c.scale = damp(c.scale, 0.7, speed, dt)
      c.x = damp(c.x, data.lineX * lineScale, speed, dt)
      c.y = damp(c.y, 0, speed, dt)
      c.z = damp(c.z, 0, speed, dt)
      c.rotZ = damp(c.rotZ, 0, speed * 1.5, dt)
    } else if (phase === 'to-circle') {
      if (circleStartTime.current === null) {
        circleStartTime.current = time
      }
      const elapsed = time - circleStartTime.current - circleStagger
      if (elapsed < 0) {
        // Waiting for stagger — stay in line
        c.opacity = 1
        c.scale = damp(c.scale, 0.7, 4, dt)
      } else {
        // Flight progress: 0→1 over ~1.5s
        const t = clamp(elapsed / 1.5, 0, 1)
        // Ease: fast start, soft landing
        const ease = 1 - Math.pow(1 - t, 3)

        // Fly through Z: arc toward camera then back to z=0
        const zArc = Math.sin(t * Math.PI) * 3
        // Spiral path: interpolate position with overshoot
        const targetX = data.circleX
        const targetY = data.circleY

        c.x = damp(c.x, data.lineX + (targetX - data.lineX) * ease, 8, dt)
        c.y = damp(c.y, (targetY) * ease, 8, dt)
        c.z = damp(c.z, zArc, 10, dt)
        c.opacity = 1
        // Scale: pulse up then settle
        const scalePulse = 0.75 + Math.sin(t * Math.PI) * 0.15
        c.scale = damp(c.scale, scalePulse, 6, dt)
        // Rotation: spin during flight, settle at circleTilt
        const spinDuringFlight = (1 - ease) * Math.PI * 1.5
        c.rotZ = damp(c.rotZ, data.circleTilt + spinDuringFlight, 5, dt)
      }
    } else if (phase === 'scroll-driven') {
      const speed = 6

      // Stage 1 (0→0.15): circle drops down
      // Stage 2 (0.15→0.45): circle grows + drops, half circle fills top half
      // Stage 3 (0.45→1): cards collapse into one centered stack

      const dropT = clamp(progress / 0.15, 0, 1)
      const growT = clamp((progress - 0.15) / 0.3, 0, 1)
      const mergeT = clamp((progress - 0.45) / 0.55, 0, 1)

      const growEase = 1 - Math.pow(1 - growT, 3)

      const halfH = visibleHeight / 2
      const targetRadius = halfH
      const currentRadius = CIRCLE_RADIUS + (targetRadius - CIRCLE_RADIUS) * growEase
      const yOffset = -dropT * halfH - growEase * (currentRadius - CIRCLE_RADIUS) * 0.5

      const baseAngle = (index / total) * Math.PI * 2
      const angle = baseAngle + groupRotation.current

      const circleX = Math.cos(angle) * currentRadius
      const circleY = Math.sin(angle) * currentRadius + yOffset
      const circleScale = 0.75 + growEase * 0.8

      if (mergeT <= 0) {
        // Stages 1–2: drop and grow circle
        c.x = damp(c.x, circleX, speed, dt)
        c.y = damp(c.y, circleY, speed, dt)
        c.z = damp(c.z, 0, speed, dt)
        c.opacity = 1
        c.scale = damp(c.scale, circleScale, speed, dt)
        c.rotZ = damp(c.rotZ, angle - Math.PI / 2, speed, dt)
      } else {
        // Stage 3: collapse into one card
        const selectedCard = useScrollStore.getState().selectedCard
        if (selectedCard < 0) {
          // Not yet computed — hold circle
          c.x = damp(c.x, circleX, speed, dt)
          c.y = damp(c.y, circleY, speed, dt)
          c.z = damp(c.z, 0, speed, dt)
          c.opacity = 1
          c.scale = damp(c.scale, circleScale, speed, dt)
          c.rotZ = damp(c.rotZ, angle - Math.PI / 2, speed, dt)
        } else if (index === selectedCard) {
          // STEP 2 — Selected card: move to center, scale → 1.3
          const selectT = clamp(mergeT / 0.4, 0, 1)
          const selectEase = 1 - Math.pow(1 - selectT, 3.5)

          c.x = damp(c.x, circleX * (1 - selectEase), speed + 3, dt)
          c.y = damp(c.y, circleY * (1 - selectEase), speed + 3, dt)
          c.z = damp(c.z, 0.3 * selectEase, speed, dt)
          c.rotZ = damp(c.rotZ, (angle - Math.PI / 2) * (1 - selectEase), speed + 2, dt)
          c.scale = damp(c.scale, circleScale + (1.3 - circleScale) * selectEase, speed + 2, dt)
          c.opacity = 1

          // STEP 7 — Stabilization: overshoot settle
          if (mergeT > 0.85) {
            const stabT = clamp((mergeT - 0.85) / 0.15, 0, 1)
            const stabEase = 1 - Math.pow(2, -10 * stabT)
            const overshoot = Math.sin(stabT * Math.PI) * 0.04
            c.scale = damp(c.scale, 1.3 + overshoot * (1 - stabEase), speed + 6, dt)
            c.x = damp(c.x, (1 - stabEase) * 0.015, speed + 6, dt)
            c.y = damp(c.y, (1 - stabEase) * 0.015, speed + 6, dt)
          }
        } else {
          // STEP 3–6 — Other cards: collapse inward, form depth stack

          // Depth index: neighbors of selected card stack closest
          const clockwise = ((index - selectedCard) + total) % total
          const counter = ((selectedCard - index) + total) % total
          const depthIndex = clockwise <= counter
            ? clockwise * 2 - 1
            : counter * 2

          // STEP 6 — Micro stagger: wave from neighbors outward
          const stagger = depthIndex * 0.015
          const staggeredMerge = clamp((mergeT - stagger) / (1 - stagger), 0, 1)

          // STEP 3 — Curved inward collapse (easeInOutCubic)
          const collapseT = clamp(staggeredMerge / 0.55, 0, 1)
          const collapseEase = collapseT < 0.5
            ? 4 * collapseT * collapseT * collapseT
            : 1 - Math.pow(-2 * collapseT + 2, 3) / 2

          // Curved trajectory: angle offset creates arc path
          const curveOffset = Math.sin(collapseEase * Math.PI) * 0.4
          const collapseAngle = angle + curveOffset
          const collapseRadius = currentRadius * (1 - collapseEase)

          const collapseX = Math.cos(collapseAngle) * collapseRadius
          const collapseY = Math.sin(collapseAngle) * collapseRadius + yOffset * (1 - collapseEase)

          // STEP 4 — Depth stack formation
          const stackT = clamp((staggeredMerge - 0.4) / 0.3, 0, 1)
          const stackEase = 1 - Math.pow(1 - stackT, 3)

          const DEPTH_Z = 0.1
          const DEPTH_X = 0.05
          const stackX = depthIndex * DEPTH_X * stackEase
          const stackZ = -depthIndex * DEPTH_Z * stackEase

          c.x = damp(c.x, collapseX + stackX, speed + 2, dt)
          c.y = damp(c.y, collapseY, speed + 2, dt)
          c.z = damp(c.z, stackZ, speed + 2, dt)

          // STEP 4 — Scale decreases with depth
          const MAX_VISIBLE = 8
          const effectiveDepth = Math.min(depthIndex, MAX_VISIBLE)
          const targetScale = 1 - effectiveDepth * 0.05
          c.scale = damp(c.scale, circleScale + (targetScale - circleScale) * collapseEase, speed, dt)

          // Rotation → 0
          c.rotZ = damp(c.rotZ, (angle - Math.PI / 2) * (1 - collapseEase), speed, dt)

          // STEP 5 — Opacity gradient
          const targetOpacity = depthIndex <= MAX_VISIBLE
            ? Math.max(0.15, 1 - depthIndex * 0.12)
            : 0
          c.opacity = damp(c.opacity, 1 + (targetOpacity - 1) * collapseEase, speed, dt)
        }
      }
    }

    // Magnetic hover: active on circle, fades as user scrolls down
    let proximity = 0
    let hoverStrength = 0
    if (phase === 'to-circle') {
      const elapsed = circleStartTime.current !== null ? time - circleStartTime.current - circleStagger : -1
      const t = elapsed > 0 ? clamp(elapsed / 1.5, 0, 1) : 0
      hoverStrength = t // grows as circle forms
    } else if (phase === 'scroll-driven') {
      hoverStrength = clamp(1 - progress / 0.45, 0, 1) // full on circle, off before merge
    }
    if (hoverStrength > 0) {
      const dx = mouseWorld.x - c.x
      const dy = mouseWorld.y - c.y
      const dist = Math.sqrt(dx * dx + dy * dy)
      proximity = clamp(1 - dist / HOVER_RADIUS, 0, 1) * hoverStrength
    }
    c.hoverSpin = damp(c.hoverSpin, proximity * HOVER_MAX_SPIN, 8, dt)
    const hoverZ = proximity * 1.5
    meshRef.current.position.set(c.x, c.y, c.z + hoverZ)
    meshRef.current.rotation.set(0, c.hoverSpin, c.rotZ, 'ZYX')
    meshRef.current.scale.setScalar(c.scale)
    materialRef.current.opacity = c.opacity
  })

  return (
    <mesh ref={meshRef} scale={0}>
      <primitive object={roundedGeom} attach="geometry" />
      <meshStandardMaterial
        ref={materialRef}
        map={texture}
        transparent
        opacity={0}
        toneMapped={false}
        roughness={1}
        metalness={0}
        side={THREE.DoubleSide}
      />
    </mesh>
  )
}
