import { useRef, useEffect } from 'react'
import { useScrollStore } from '../store/scrollStore'
import PhotoScene from './PhotoScene'
import ScrollPrompt from './ScrollPrompt'
import TextReveal from './TextReveal'

export default function IntroSection() {
  const sectionRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Wait for chaos-in phase to trigger line formation
    const unsubscribe = useScrollStore.subscribe((state, prev) => {
      if (state.phase === 'chaos-in' && prev.phase !== 'chaos-in') {
        // After photos appear chaotically, transition to line
        const lineTimer = setTimeout(() => {
          useScrollStore.getState().setPhase('to-line')
        }, 2000)

        // After line forms, transition to circle
        const circleTimer = setTimeout(() => {
          useScrollStore.getState().setPhase('to-circle')
        }, 3800)

        // After circle forms, enable scrolling
        const scrollTimer = setTimeout(() => {
          useScrollStore.getState().setPhase('scroll-driven')
        }, 6000)

        return () => {
          clearTimeout(lineTimer)
          clearTimeout(circleTimer)
          clearTimeout(scrollTimer)
        }
      }
    })

    return () => unsubscribe()
  }, [])

  // Capture wheel events to drive progress (no actual page scrolling)
  useEffect(() => {
    let targetProgress = 0

    const onWheel = (e: WheelEvent) => {
      if (useScrollStore.getState().phase !== 'scroll-driven') return
      e.preventDefault()
      targetProgress += e.deltaY * 0.0003
      targetProgress = Math.max(0, Math.min(1, targetProgress))
      useScrollStore.getState().setProgress(targetProgress)
    }

    window.addEventListener('wheel', onWheel, { passive: false })
    return () => window.removeEventListener('wheel', onWheel)
  }, [])

  // Always prevent page scroll
  useEffect(() => {
    document.body.classList.add('no-scroll')
    return () => document.body.classList.remove('no-scroll')
  }, [])

  return (
    <div
      ref={sectionRef}
      className="relative w-full overflow-hidden"
      style={{ height: '100svh' }}
    >
      <PhotoScene />
      <ScrollPrompt />
      <TextReveal />
    </div>
  )
}
