import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { COUNT, PHOTO_W, SPACING, STEP, getCircleR } from '@/animation/constants'

gsap.registerPlugin(ScrollTrigger)

// Fixed Y offsets (fraction of vh) traced from reference screenshot
// Cards 0–23 left→right, diagonal scatter from top-left to bottom-right
const scatterFactors = [
  -0.25, 0.20, 0.40, -0.35, -0.05, 0.10, -0.15, 0.30,
  -0.20, 0.20, 0.20, 0.10, -0.35, 0.30, 0.15, -0.1,
  0.1, 0.4, -0.2, -0.35, -0.1, -0.1, 0.3, 0.15,
]

export function useIntroTimeline() {
  let masterTl = null
  let gsapCtx = null
  let scrollEnd = 0

  function create({ introEl, headerEl, stageEl, centerEl, bottomEl, thumbEls, cur, onScrollProgress, onReady }) {
    const vw = window.innerWidth
    const els = thumbEls
    const isMobile = vw < 1024

    if (!els.length) return

    document.documentElement.style.overflow = 'hidden'

    const vh = window.innerHeight
    const circleR = getCircleR(vw, vh)

    gsap.set(els, { opacity: 0, scale: 1, x: 0, y: 0, rotation: 0 })
    gsap.set(headerEl, { opacity: 0, y: -30 })
    gsap.set(centerEl, { opacity: 0, scale: 0.85, y: 20 })
    gsap.set(bottomEl, { opacity: 0, y: 30 })

    // Pre-calculate horizontal line positions (desktop only)
    const padding = 40
    const availableWidth = vw - padding * 2
    const totalWidth = COUNT * PHOTO_W + (COUNT - 1) * SPACING
    const rowScale = Math.min(1, availableWidth / totalWidth)
    const halfTotal = totalWidth / 2
    const line = els.map((_, i) => ({
      x: (-halfTotal + PHOTO_W / 2 + i * STEP) * rowScale,
    }))

    // Pre-calculate circle positions
    const circle = els.map((_, i) => {
      const angle = (i / COUNT) * Math.PI * 2
      return {
        x: Math.cos(angle) * circleR,
        y: Math.sin(angle) * circleR,
        r: (angle * 180 / Math.PI) + 90,
      }
    })

    masterTl = gsap.timeline({
      onComplete: () => {
        document.documentElement.style.overflow = ''
        gsap.set(stageEl, { rotation: 0 })
        gsap.set(centerEl, { opacity: 1, scale: 1, y: 0 })

        // Initialize interpolation state from circle positions
        for (let i = 0; i < COUNT; i++) {
          const angle = (i / COUNT) * Math.PI * 2
          cur[i].x = Math.cos(angle) * circleR
          cur[i].y = Math.sin(angle) * circleR
          cur[i].r = (angle * 180 / Math.PI) + 90
          cur[i].s = 1; cur[i].wx = 1; cur[i].o = 1
          cur[i].z = 0; cur[i].rx = 0; cur[i].ry = 0
        }

        // ScrollTrigger-driven animation
        gsapCtx = gsap.context(() => {
          const st = ScrollTrigger.create({
            trigger: introEl,
            pin: true,
            start: 'top top',
            end: () => `+=${window.innerHeight * (window.innerWidth < 1024 ? 6 : 10)}`,
            onUpdate: (self) => {
              scrollEnd = self.end
              onScrollProgress(self.progress)
            },
          })
          scrollEnd = st.end
        })

        onReady()
      },
    })

    // Header fade in
    masterTl.to(headerEl, {
      opacity: 1, y: 0, duration: 0.6, ease: 'power3.out',
    }, 0)

    if (isMobile) {
      // Mobile/tablet: appear as a flat centered stack (scaled up)
      els.forEach((el, i) => {
        masterTl.to(el, {
          opacity: 1, scale: 1.8, x: 0, y: 0,
          rotation: 0,
          duration: 0.5, ease: 'power2.out',
        }, 0.6 + i * 0.02)
      })

      // Spread from stack into circle (scale down)
      els.forEach((el, i) => {
        masterTl.to(el, {
          scale: 0.75, x: circle[i].x, y: circle[i].y, rotation: circle[i].r,
          duration: 1.2, ease: 'power2.inOut',
        }, 1.4 + (i / COUNT) * 0.15)
      })

      // Smoothly scale up in circle
      els.forEach((el, i) => {
        masterTl.to(el, {
          scale: 1, duration: 1.0, ease: 'power2.out',
        }, 2.8 + (i / COUNT) * 0.1)
      })

      // Text reveals after circle is formed
      masterTl.to(centerEl, {
        opacity: 1, scale: 1, y: 0, duration: 0.8, ease: 'power2.out',
      }, 3.2)
    } else {
      // Desktop: place at scattered positions, then fade in with opacity
      els.forEach((el, i) => {
        gsap.set(el, { x: line[i].x, y: scatterFactors[i] * window.innerHeight })
      })
      els.forEach((el) => {
        masterTl.to(el, {
          opacity: 1, duration: 0.6, ease: 'power2.out',
        }, 0.6 + Math.random() * 0.25)
      })

      els.forEach((el, i) => {
        masterTl.to(el, {
          y: 0, duration: 1.0, ease: 'power3.inOut',
        }, 1.5 + Math.abs(i - COUNT / 2) / COUNT * 0.3)
      })

      els.forEach((el, i) => {
        masterTl.to(el, {
          x: circle[i].x, y: circle[i].y, rotation: circle[i].r,
          duration: 1.0, ease: 'power2.inOut',
        }, 2.7 + (i / COUNT) * 0.15)
      })

      masterTl.to(centerEl, {
        opacity: 1, scale: 1, y: 0, duration: 0.8, ease: 'power2.out',
      }, 3.9)
    }
  }

  function destroy() {
    masterTl?.kill()
    gsapCtx?.revert()
    document.documentElement.style.overflow = ''
  }

  function getScrollEnd() {
    return scrollEnd
  }

  return { create, destroy, getScrollEnd }
}
