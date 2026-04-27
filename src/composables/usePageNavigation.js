import { ref } from 'vue'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

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
// requested behaviour.
const currentPage = ref(1)
const isAnimating = ref(false)

const pageRefs = Object.create(null)
let lenisGetter = null
// Snapshot of `.intro` inline `top` before we apply scroll compensation,
// so we can restore it exactly (pin may have had `top: 0` already).
let savedIntroTop = null

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

  // Update lenis/body lock state immediately so the pinned section doesn't
  // tick during the swipe.
  const lenis = lenisGetter?.()
  if (target === 1) {
    document.documentElement.style.overflow = ''
    document.body.style.overflow = ''
    lenis?.start()
  } else {
    document.documentElement.style.overflow = 'hidden'
    document.body.style.overflow = 'hidden'
    lenis?.stop()
  }

  // Pinned-section scroll compensation.
  //
  // Background: the .intro section inside the main page is held in place by
  // ScrollTrigger via `position: fixed; top: 0`. When we apply a transform
  // to its parent (.main-page), the parent becomes the containing block for
  // any fixed-position descendants. .main-page's top in viewport coords is
  // `-window.scrollY` (it sits above the viewport whenever the user has
  // scrolled). The pin's `top: 0` then resolves to viewport `-scrollY`,
  // making the section snap upwards and exposing the page background below.
  //
  // To prevent that snap, before applying the transform we shift the pin's
  // top by exactly `scrollY` so the visual position stays put. On the way
  // back to main we strip both the transform and the compensation in the
  // same frame so .intro snaps cleanly back to its original viewport spot.
  const mainEl = pageRefs[1]
  const introEl = mainEl ? mainEl.querySelector('.intro') : null

  if (fromIdx === 1 && target !== 1 && mainEl) {
    const scrollY = window.scrollY || window.pageYOffset || 0
    // Force an identity transform synchronously so the containing block
    // exists *before* we shift `.intro`. Otherwise a single browser frame
    // would render with the new top but the old containing block — a flash.
    gsap.set(mainEl, { xPercent: 0 })
    if (introEl) {
      // Snapshot whatever was there (pin may have set `top: 0`); we'll
      // restore it byte-for-byte on the way back instead of clearing it.
      savedIntroTop = introEl.style.top
      introEl.style.top = `${scrollY}px`
    }
  }

  isAnimating.value = true
  const tl = gsap.timeline({
    onComplete: () => {
      isAnimating.value = false
      if (target === 1 && mainEl) {
        // Strip transform AND restore .intro top in the same frame —
        // containing block disappears at the same instant the inline top
        // resets, so there's no visual jump.
        gsap.set(mainEl, { clearProps: 'transform,xPercent' })
        if (introEl && savedIntroTop !== null) {
          introEl.style.top = savedIntroTop
          savedIntroTop = null
        }
      }
    },
  })

  for (const idx of [1, 2, 3]) {
    const el = pageRefs[idx]
    if (!el) continue
    const targetPercent = (idx - target) * 100
    gsap.killTweensOf(el)
    tl.to(el, {
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
