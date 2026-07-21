import { onMounted, onBeforeUnmount } from 'vue'
import { usePageNavigation } from '@/composables/usePageNavigation'

const SWIPE_THRESHOLD_PX = 60
const VERTICAL_TOLERANCE = 0.6 // |dy| / |dx| must be below this

/**
 * Attach horizontal swipe-to-navigate to a DOM element ref. Mobile only
 * (< 1024px). Swiping left advances to the next page in the row, swiping
 * right returns to the previous one. No-op on desktop.
 */
export function useSwipeNavigation(rootRef) {
  const { currentPage, navigate, isAnimating } = usePageNavigation()

  let startX = 0
  let startY = 0
  let active = false

  function onStart(e) {
    if (window.innerWidth >= 1024) return
    if (!e.touches || e.touches.length !== 1) return
    startX = e.touches[0].clientX
    startY = e.touches[0].clientY
    active = true
  }

  function onEnd(e) {
    if (!active) return
    active = false
    if (window.innerWidth >= 1024) return
    if (isAnimating.value) return
    const t = e.changedTouches && e.changedTouches[0]
    if (!t) return
    const dx = t.clientX - startX
    const dy = t.clientY - startY
    if (Math.abs(dx) < SWIPE_THRESHOLD_PX) return
    if (Math.abs(dy) > Math.abs(dx) * VERTICAL_TOLERANCE) return

    const cur = currentPage.value
    if (dx < 0 && cur < 3) navigate(cur + 1)
    else if (dx > 0 && cur > 1) navigate(cur - 1)
  }

  onMounted(() => {
    const el = rootRef.value
    if (!el) return
    el.addEventListener('touchstart', onStart, { passive: true })
    el.addEventListener('touchend', onEnd, { passive: true })
    el.addEventListener('touchcancel', onEnd, { passive: true })
  })

  onBeforeUnmount(() => {
    const el = rootRef.value
    if (!el) return
    el.removeEventListener('touchstart', onStart)
    el.removeEventListener('touchend', onEnd)
    el.removeEventListener('touchcancel', onEnd)
  })
}
