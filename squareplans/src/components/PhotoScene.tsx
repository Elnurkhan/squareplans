import { Suspense, useRef } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { photos } from '../data/photos'
import { useScrollStore } from '../store/scrollStore'
import PhotoPlane from './PhotoPlane'

// Shared mouse world position — updated once per frame, read by all PhotoPlanes
const mouseWorld = new THREE.Vector3(0, 0, 0)
const raycaster = new THREE.Raycaster()
const mouseNDC = new THREE.Vector2(-10, -10) // off-screen initially

function MouseTracker() {
  const { camera } = useThree()

  useFrame(({ pointer }) => {
    mouseNDC.set(pointer.x, pointer.y)
    raycaster.setFromCamera(mouseNDC, camera)
    // Intersect with z=0 plane to get world coords
    const plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0)
    raycaster.ray.intersectPlane(plane, mouseWorld)
  })

  return null
}

const TILT_AMOUNT = 0.2 // max tilt in radians (~11.5°)

function Scene() {
  const groupRotation = useRef(0)
  const groupRef = useRef<THREE.Group>(null)
  const tiltX = useRef(0)
  const tiltY = useRef(0)

  useFrame(({ pointer }, delta) => {
    const { phase, scrollProgress } = useScrollStore.getState()
    const dt = Math.min(delta, 0.1)

    if (phase === 'scroll-driven') {
      const target = scrollProgress * Math.PI * 2.5
      groupRotation.current = THREE.MathUtils.lerp(
        groupRotation.current,
        target,
        1 - Math.exp(-5 * dt)
      )

      // Compute selected card once when merge begins
      if (scrollProgress >= 0.45 && useScrollStore.getState().selectedCard === -1) {
        const targetAngle = 3 * Math.PI / 2 // bottom/front of circle
        let bestIndex = 0
        let bestDist = Infinity
        const total = photos.length
        for (let i = 0; i < total; i++) {
          let cardAngle = ((i / total) * Math.PI * 2 + groupRotation.current) % (Math.PI * 2)
          if (cardAngle < 0) cardAngle += Math.PI * 2
          let dist = Math.abs(cardAngle - targetAngle)
          if (dist > Math.PI) dist = Math.PI * 2 - dist
          if (dist < bestDist) {
            bestDist = dist
            bestIndex = i
          }
        }
        useScrollStore.getState().setSelectedCard(bestIndex)
      }
    }

    // Tilt circle group based on cursor position
    const targetTiltX = -pointer.y * TILT_AMOUNT
    const targetTiltY = pointer.x * TILT_AMOUNT
    tiltX.current = THREE.MathUtils.lerp(tiltX.current, targetTiltX, 1 - Math.exp(-3 * dt))
    tiltY.current = THREE.MathUtils.lerp(tiltY.current, targetTiltY, 1 - Math.exp(-3 * dt))

    if (groupRef.current) {
      groupRef.current.rotation.set(tiltX.current, tiltY.current, 0)
    }
  })

  return (
    <group ref={groupRef}>
      <MouseTracker />
      {photos.map((photo, i) => (
        <PhotoPlane
          key={i}
          data={photo}
          index={i}
          total={photos.length}
          groupRotation={groupRotation}
          mouseWorld={mouseWorld}
        />
      ))}
    </group>
  )
}

export default function PhotoScene() {
  return (
    <Canvas
      camera={{ position: [0, 0, 10], fov: 50 }}
      dpr={[1, 2]}
      gl={{ antialias: true, alpha: true }}
      style={{
        position: 'absolute',
        inset: 0,
        zIndex: 0,
      }}
    >
      <ambientLight intensity={0.6} />
      <directionalLight position={[5, 5, 10]} intensity={0.8} />
      <directionalLight position={[-3, -2, 8]} intensity={0.3} />
      <Suspense fallback={null}>
        <Scene />
      </Suspense>
    </Canvas>
  )
}
