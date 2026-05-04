import { ref } from 'vue'
import gsap from 'gsap'

// Page indices: 1 = Проекты, 2 = О нас, 3 = Контакты.
// Conceptual model: pages are laid out in a horizontal row, each occupying
// 100% of viewport width. Switching pages slides the entire row so the
// target page lands at viewport position 0.
//
//   xPercent of page N = (N - currentPage) * 100
//
//   currentPage=1: main 0%   | about 100% | contacts 200%
//   currentPage=2: main -100% | about 0%   | contacts 100%
//   currentPage=3: main -200% | about -100% | contacts 0%
//
// When jumping from 1 to 3, ALL three pages animate at once. The middle
// page (О нас) traverses through viewport mid-transition — exactly the
// requested behaviour. Page 1's visual surface is the pinned `.intro`, so
// the row math is applied to that element instead of the scrolled wrapper.
const currentPage = ref(1)
const isAnimating = ref(false)

const pageRefs = Object.create(null)
let lenisGetter = null

const DURATION = 0.85
const EASE = 'power3.inOut'

function registerPage(idx, el) {
  if (idx !== 1 && idx !== 2 && idx !== 3) return
  if (el) pageRefs[idx] = el
  else delete pageRefs[idx]
}

function setLenisGetter(fn) {
  lenisGetter = fn
}

function navigate(target) {
  if (isAnimating.value) return
  if (target !== 1 && target !== 2 && target !== 3) return
  const fromIdx = currentPage.value
  if (target === fromIdx) return

  // Lock scroll only when LEAVING page 1. When returning to page 1 we
  // defer the unlock until `onComplete` — restarting Lenis or letting the
  // mobile URL bar reflow mid-animation triggers ScrollTrigger.update()
  // / 100vh changes that nudge the pinned `.intro` a few pixels upward
  // (visible as a tiny black border at the bottom + "photos jumping").
  const lenis = lenisGetter?.()
  if (target !== 1) {
    document.documentElement.style.overflow = 'hidden'
    document.body.style.overflow = 'hidden'
    lenis?.stop()
  }

  const mainEl = pageRefs[1]
  const introEl = mainEl ? mainEl.querySelector('.intro') : null

  isAnimating.value = true
  const tl = gsap.timeline({
    onComplete: () => {
      isAnimating.value = false
      if (target === 1) {
        // Now that the pin is back in its real viewport position, it's
        // safe to release the body and resume Lenis — any ScrollTrigger
        // updates that fire from here on operate on a coherent layout.
        document.documentElement.style.overflow = ''
        document.body.style.overflow = ''
        lenis?.start()
      }
    },
  })

  const introAsPage = Boolean(introEl)

  for (const idx of [1, 2, 3]) {
    const el = pageRefs[idx]
    if (!el) continue
    if (idx === 1 && introAsPage) continue
    const targetPercent = (idx - target) * 100
    gsap.killTweensOf(el)
    tl.to(el, {
      xPercent: targetPercent,
      duration: DURATION,
      ease: EASE,
    }, 0)
  }

  // Page 1 is the ScrollTrigger-pinned intro. Animate that fixed surface
  // directly instead of transforming `.main-page`; transforming the scrolled
  // parent makes fixed descendants resolve against it and can reveal the dark
  // body background for a frame on mobile.
  if (introAsPage) {
    const targetPercent = (1 - target) * 100
    gsap.killTweensOf(introEl)
    tl.to(introEl, {
      xPercent: targetPercent,
      duration: DURATION,
      ease: EASE,
    }, 0)
  }

  currentPage.value = target
}

export function usePageNavigation() {
  return { currentPage, isAnimating, navigate, setLenisGetter, registerPage }
}
