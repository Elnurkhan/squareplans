<template>
  <header class="intro-header" ref="headerEl">
    <nav class="intro-nav">
      <a href="#" :class="{ active: activeNav === 0 }">Интро</a>
      <a href="#" :class="{ active: activeNav === 1 }">Проекты</a>
      <a href="#" :class="{ active: activeNav === 2 }">О нас</a>
      <a href="#" :class="{ active: activeNav === 3 }">Контакты</a>
    </nav>
  </header>

  <div class="intro" ref="introEl">
    <div class="intro-sticky" ref="stickyEl">
      <div class="intro-stage" ref="stageEl">
        <div
          v-for="(thumb, i) in thumbnails"
          :key="i"
          class="thumb"
          ref="thumbEls"
          @click="handleThumbClick"
        >
          <img :src="thumb.src" alt="" />
          <div class="thumb-highlight" />
        </div>
        <div class="p9-wrapper">
          <div
            v-for="(thumb, i) in p9Thumbnails"
            :key="'p9-' + i"
            class="thumb p9-thumb"
            ref="p9ThumbEls"
            @click="handleP9Click(i)"
          >
            <img :src="thumb.src" alt="" />
            <div class="thumb-highlight" />
          </div>
        </div>
      </div>

      <div class="intro-center" ref="centerEl">
        <img class="intro-logo" :src="`${$base}logo.svg`" alt="SQUAREPLANS" />
        <span class="intro-sub">Листайте, чтобы узнать больше</span>
      </div>

      <div class="intro-arc-text" ref="arcTextEl">
        <p>
          <template v-for="(line, li) in arcLines" :key="'l'+li">
            <br v-if="li > 0" />
            <span v-for="(word, wi) in line" :key="li+'-'+wi" class="arc-word" ref="arcWordEls">{{ word }}</span>
          </template>
        </p>
      </div>

      <div class="intro-bottom" ref="bottomEl">
        <div class="bottom-title-stack">
          <div class="bottom-title bottom-title-project">Недавние проекты</div>
          <div class="bottom-title bottom-title-philosophy">Создаём не просто дизайн, а пространства и образы, которые становятся<br> частью жизни наших клиентов</div>
        </div>
        <div class="bottom-sub">Выберите один</div>
      </div>

    </div>
  </div>

  <div class="after-intro" ref="afterIntroEl" data-lenis-prevent>
    <div class="showcase-spacer"></div>
    <ProjectPage />
  </div>

  <PhotoLightbox
    :visible="lightboxOpen"
    :photos="p9LightboxPhotos"
    :start-index="lightboxStartIdx"
    @close="lightboxOpen = false"
  />
</template>

<script setup>
import { ref, inject, onMounted, onBeforeUnmount } from 'vue'
import gsap from 'gsap'
import { useMouseTracking } from '@/composables/useMouseTracking'
import { useIntroTimeline } from '@/composables/useIntroTimeline'
import { useCardState } from '@/composables/useCardState'
import PhotoLightbox from '@/components/PhotoLightbox.vue'
import ProjectPage from '@/components/ProjectPage.vue'
import { GlassCardLayer } from '@/webgl/GlassCardLayer'

const lenisRef = inject('lenis')

const introEl = ref(null)
const headerEl = ref(null)
const stickyEl = ref(null)
const stageEl = ref(null)
const thumbEls = ref([])
const p9ThumbEls = ref([])
const centerEl = ref(null)
const arcTextEl = ref(null)
const arcWordEls = ref([])
const bottomEl = ref(null)
const showcaseInfoEl = ref(null)
const afterIntroEl = ref(null)

const arcLines = [
  ['ИНДИВИДУАЛЬНЫЕ', 'ДИЗАЙН-ПРОЕКТЫ', 'ДЛЯ', 'ЖИЛЫХ'],
  ['И', 'КОММЕРЧЕСКИХ', 'ПОМЕЩЕНИЙ', 'ПОД', 'КЛЮЧ.'],
  ['АВТОРСКИЙ', 'НАДЗОР'],
]

const mouseTracking = useMouseTracking()
const timeline = useIntroTimeline()
const cards = useCardState()
const glCardLayer = new GlassCardLayer()

const { thumbnails, p9Thumbnails } = cards

// Mobile drag: horizontal for phase 8, free 2D for phase 9
let touchStartX = 0
let touchStartY = 0
let touchLocked = null
let dragPreventsClick = false
let touchLastY = 0

const activeNav = ref(0)

// Smooth scroll state for showcase overlay
let showcaseScrollTarget = 0
let showcaseScrollCurrent = 0
let showcaseVelocity = 0

const lightboxOpen = ref(false)
const lightboxStartIdx = ref(0)

const p9LightboxPhotos = cards.p9Thumbnails.map(t => ({
  src: t.src.replace('/800/1120', '/1600/2240'),
}))

function handleThumbClick() {
  if (dragPreventsClick) {
    dragPreventsClick = false
    return
  }
  cards.onThumbClick()
  if (cards.isInPhase9()) {
    lenisRef.value?.stop()
  }
}

function handleP9Click(i) {
  if (dragPreventsClick) {
    dragPreventsClick = false
    return
  }
  lightboxStartIdx.value = i
  lightboxOpen.value = true
}

function onTouchStart(e) {
  if (window.innerWidth >= 1024) return
  const t = e.touches[0]
  touchStartX = t.clientX
  touchStartY = t.clientY
  touchLastY = t.clientY
  touchLocked = null

  // Don't start card drag if we're in showcase scroll mode
  if (!cards.isShowcaseScrolling()) {
    cards.startDrag(t.clientX, t.clientY)
  }
}

function onTouchMove(e) {
  if (window.innerWidth >= 1024) return
  const t = e.touches[0]

  // Showcase scroll mode: scroll the overlay content via touch
  if (cards.isShowcaseScrolling()) {
    const dy = touchLastY - t.clientY // positive = finger moved up = scroll down
    touchLastY = t.clientY
    const el = afterIntroEl.value
    if (el) {
      const maxScroll = el.scrollHeight - el.clientHeight
      // Swiping down at the top → exit showcase scroll
      if (dy < 0 && showcaseScrollTarget <= 0) {
        exitShowcaseScrollMode()
        e.preventDefault()
        return
      }
      showcaseVelocity = dy * 0.35
      showcaseScrollTarget = Math.max(0, Math.min(maxScroll, showcaseScrollTarget + dy * 1.0))
    }
    e.preventDefault()
    return
  }

  // Showcase open (but not scrolling yet): swipe up → enter scroll mode
  if (cards.isShowcaseOpen()) {
    const dy = t.clientY - touchStartY
    if (dy < -20) {
      enterShowcaseScrollMode()
      touchLastY = t.clientY
      e.preventDefault()
      return
    }
    // Swipe down → go back to cascade
    if (dy > 20) {
      cards.scrollCascade(dy * -0.15)
      if (!cards.isInPhase9()) exitPhase9WithLenis()
      e.preventDefault()
      return
    }
    e.preventDefault()
    return
  }

  // Phase 9: diagonal drag, vertical swipe collapses
  if (cards.isInPhase9()) {
    if (!touchLocked) {
      const dx = Math.abs(t.clientX - touchStartX)
      const dy = Math.abs(t.clientY - touchStartY)
      if (dx + dy > 8) touchLocked = dy > dx * 1.5 ? 'v9' : 'd'
    }
    if (touchLocked === 'v9') {
      const dy = t.clientY - touchStartY
      cards.scrollCascade(-dy * 0.15)
      if (!cards.isInPhase9()) exitPhase9WithLenis()
      e.preventDefault()
      return
    }
    e.preventDefault()
    cards.moveDrag(t.clientX, t.clientY)
    dragPreventsClick = true
    return
  }

  // Phase 8: direction-locked, horizontal only
  if (!touchLocked) {
    const dx = Math.abs(t.clientX - touchStartX)
    const dy = Math.abs(t.clientY - touchStartY)
    if (dx + dy > 8) touchLocked = dx > dy ? 'h' : 'v'
  }
  if (touchLocked === 'h') {
    e.preventDefault()
    cards.moveDrag(t.clientX, t.clientY)
    dragPreventsClick = true
  } else if (touchLocked === 'v') {
    cards.endDrag()
  }
}

function onTouchEnd() {
  cards.endDrag()
  touchLocked = null
}

function exitPhase9WithLenis() {
  const l = lenisRef.value
  if (l) l.start()
}

function exitShowcaseScrollMode() {
  if (!cards.isShowcaseScrolling()) return
  showcaseVelocity = 0
  if (afterIntroEl.value) {
    afterIntroEl.value.style.display = 'none'
  }
  cards.exitShowcaseScroll()
}

function enterShowcaseScrollMode() {
  if (cards.isShowcaseScrolling()) return
  if (afterIntroEl.value) {
    const el = afterIntroEl.value
    el.style.display = 'block'
    el.style.position = 'fixed'
    el.style.inset = '0'
    el.style.overflowY = 'auto'
    el.style.zIndex = '60'
    el.style.background = 'transparent'
    el.scrollTop = 0
  }
  showcaseScrollTarget = 0
  showcaseScrollCurrent = 0
  cards.enterShowcaseScroll()
}

function onWheel(e) {
  // Block scroll during phase9 exit cooldown (absorb trackpad inertia)
  if (!cards.isInPhase9()) {
    if (cards.shouldBlockScroll()) {
      cards.recordWheel()
      e.preventDefault()
      e.stopImmediatePropagation()
    }
    return
  }

  // Showcase scroll mode: update target, block Lenis
  if (cards.isShowcaseScrolling()) {
    const el = afterIntroEl.value
    if (el) {
      const maxScroll = el.scrollHeight - el.clientHeight
      // Scrolling up at the top → exit showcase scroll, return to showcase view
      if (e.deltaY < 0 && showcaseScrollTarget <= 0) {
        exitShowcaseScrollMode()
        e.preventDefault()
        e.stopImmediatePropagation()
        return
      }
      showcaseVelocity = e.deltaY * 0.2
      showcaseScrollTarget = Math.max(0, Math.min(maxScroll, showcaseScrollTarget + e.deltaY * 0.7))
    }
    e.preventDefault()
    e.stopImmediatePropagation()
    return
  }

  // Showcase open + scroll down → transition to normal page scroll without consuming the event
  if (cards.isShowcaseOpen() && e.deltaY > 0) {
    enterShowcaseScrollMode()
    return
  }

  cards.recordWheel()
  e.preventDefault()
  e.stopImmediatePropagation()

  if (cards.isShowcaseOpen()) {
    // Scroll up → go back to cascade
    if (e.deltaY < 0) {
      cards.scrollCascade(e.deltaY)
      if (!cards.isInPhase9()) exitPhase9WithLenis()
    }
    return
  }
  cards.scrollCascade(e.deltaY)
  if (!cards.isInPhase9()) exitPhase9WithLenis()
}

function tickFn(time, deltaTime) {
  mouseTracking.update()
  cards.tick({
    thumbEls: thumbEls.value,
    p9ThumbEls: p9ThumbEls.value,
    centerEl: centerEl.value,
    arcTextEl: arcTextEl.value,
    arcWordEls: arcWordEls.value,
    bottomEl: bottomEl.value,
    stickyEl: stickyEl.value,
    mouse: mouseTracking.mouse,
    smoothMouse: mouseTracking.smoothMouse,
    glLayer: glCardLayer,
    dt: (deltaTime || 16.67) / 1000,
  })

  // Showcase info: fade in as showcase opens, fade out when scrolling starts
  const showcaseProgress = cards.getShowcaseProgress()
  const showPage = cards.isShowcaseScrolling()

  // Smooth-scroll the showcase overlay toward target (with inertia)
  if (showPage && afterIntroEl.value) {
    const el = afterIntroEl.value
    const maxScroll = el.scrollHeight - el.clientHeight

    // Apply velocity → target, then decay
    if (Math.abs(showcaseVelocity) > 0.5) {
      showcaseScrollTarget = Math.max(0, Math.min(maxScroll, showcaseScrollTarget + showcaseVelocity))
      showcaseVelocity *= 0.92
    } else {
      showcaseVelocity = 0
    }

    showcaseScrollCurrent += (showcaseScrollTarget - showcaseScrollCurrent) * 0.08
    if (Math.abs(showcaseScrollTarget - showcaseScrollCurrent) < 0.5) {
      showcaseScrollCurrent = showcaseScrollTarget
    }
    el.scrollTop = showcaseScrollCurrent
  }

  // Slide showcase card up as user scrolls the overlay
  if (stickyEl.value) {
    if (showPage && afterIntroEl.value) {
      const scrollY = showcaseScrollCurrent
      stickyEl.value.style.transform = `translateY(${-scrollY}px)`
    } else if (!cards.isInPhase9() || !showPage) {
      stickyEl.value.style.transform = ''
    }
  }
  if (showcaseInfoEl.value) {
    const infoOpacity = showPage ? 0 : Math.max(0, Math.min(1, (showcaseProgress - 0.3) / 0.4))
    showcaseInfoEl.value.style.opacity = String(infoOpacity)
    showcaseInfoEl.value.style.transform = `translateY(${(1 - infoOpacity) * 20}px)`
  }

  // Nav highlight: detect active section (use getBoundingClientRect — works with fixed overlay)
  if (showPage) {
    const sections = afterIntroEl.value?.querySelectorAll('[data-nav]')
    let found = 2
    if (sections) {
      const el = afterIntroEl.value
      const threshold = window.innerHeight * 0.4
      for (const sec of sections) {
        const rect = sec.getBoundingClientRect()
        if (rect.top <= threshold) found = Number(sec.dataset.nav)
      }
      // At the very bottom → Контакты
      if (el && el.scrollHeight - el.scrollTop - el.clientHeight < 50) {
        found = 3
      }
    }
    activeNav.value = found
  } else if (cards.isShowcaseOpen()) {
    activeNav.value = 2
  } else if (cards.isInPhase9() || cards.getProgress() >= 0.92) {
    activeNav.value = 1
  } else {
    activeNav.value = 0
  }
}

onMounted(() => {
  mouseTracking.start()
  timeline.create({
    introEl: introEl.value,
    headerEl: headerEl.value,
    stageEl: stageEl.value,
    centerEl: centerEl.value,
    bottomEl: bottomEl.value,
    thumbEls: thumbEls.value,
    cur: cards.cur,
    onScrollProgress: cards.setProgress,
    onReady: () => gsap.ticker.add(tickFn),
  })

  // Mount GL glass-card overlay & preload textures
  if (glCardLayer.gl && stageEl.value) {
    glCardLayer.mount(stageEl.value)
    for (let i = 0; i < thumbnails.length; i++) {
      glCardLayer.loadTexture(i, thumbnails[i].src)
    }
  }

  window.addEventListener('touchstart', onTouchStart, { passive: true, capture: true })
  window.addEventListener('touchmove', onTouchMove, { passive: false, capture: true })
  window.addEventListener('touchend', onTouchEnd, { passive: true, capture: true })
  window.addEventListener('wheel', onWheel, { passive: false, capture: true })
})

onBeforeUnmount(() => {
  window.removeEventListener('touchstart', onTouchStart, { capture: true })
  window.removeEventListener('touchmove', onTouchMove, { capture: true })
  window.removeEventListener('touchend', onTouchEnd, { capture: true })
  window.removeEventListener('wheel', onWheel, { capture: true })
  timeline.destroy()
  gsap.ticker.remove(tickFn)
  mouseTracking.stop()
  glCardLayer.destroy()
})
</script>

<style>
.intro {
  position: relative;
  height: 100vh;
  z-index: 50;
  background: #fafafa;
}

.after-intro {
  display: none;
}

.showcase-spacer {
  height: 100vh;
}

.intro-sticky {
  height: 100vh;
  overflow: hidden;
}

/* ── Header ── */
.intro-header {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 100;
  padding: 2rem 3rem;
  pointer-events: none;
}

.intro-nav {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 3rem;

}

.intro-nav a {
  font-size: 0.7rem;
  font-weight: 400;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: #1a1a1a;
  text-decoration: none;
  opacity: 0.45;
  transition: opacity 0.3s;
}

.intro-nav a:hover,
.intro-nav a.active {
  opacity: 1;
}

/* ── Thumbnail stage ── */
.intro-stage {
  position: absolute;
  inset: 0;
  z-index: 1;
  perspective: 1500px;
}

.thumb {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 50px;
  height: 72px;
  margin-left: -25px;
  margin-top: -36px;
  border-radius: 6px;
  will-change: auto;
  transform-style: preserve-3d;
  backface-visibility: visible;
  outline: 1px solid transparent;
}

.thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: inherit;
  display: block;
}

/* Glass highlight overlay */
.thumb-highlight {
  position: absolute;
  inset: 0;
  border-radius: inherit;
  pointer-events: none;
  background:
    linear-gradient(
      135deg,
      rgba(255, 255, 255, 0.35) 0%,
      rgba(255, 255, 255, 0.08) 30%,
      transparent 50%,
      rgba(255, 255, 255, 0.03) 80%,
      rgba(255, 255, 255, 0.12) 100%
    );
  box-shadow: none;
}

.thumb--glass .thumb-highlight {
  background: none;
}



/* ── Phase 9 cascade cards (hidden until click) ── */
.p9-wrapper {
  position: absolute;
  inset: 0;
  perspective: none;
}

.p9-thumb {
  opacity: 0;
  pointer-events: none;
  cursor: pointer;
}

/* ── Center text ── */
.intro-center {
  position: absolute;
  inset: 0;
  z-index: 2;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  pointer-events: none;
  opacity: 0;
}

.intro-logo {
  width: clamp(101px, 18vw, 101px);
  height: auto;
  margin-bottom: 1.2rem;
}

.intro-sub {

  font-size: 0.75rem;
  font-weight: 300;
  letter-spacing: 0.22em;
  text-transform: uppercase;
  color: rgba(26, 26, 26, 0.3);
}

/* ── Arc description text ── */
.intro-arc-text {
  position: absolute;
  bottom: 10%;
  left: 0;
  right: 0;
  z-index: 2;
  display: flex;
  justify-content: center;
  pointer-events: none;
  opacity: 0;
}

.intro-arc-text p {

  font-size: 0.7rem;
  letter-spacing: 0.18em;
  line-height: 1.8;
  text-transform: uppercase;
  text-align: center;
  max-width: 480px;
  margin: 0;
}

.arc-word {
  font-weight: 300;
  color: rgba(26, 26, 26, 0.35);
  transition: font-weight 0.3s, color 0.3s;
}

.arc-word::after {
  content: ' ';
}

/* ── Bottom text ── */
.intro-bottom {
  position: absolute;
  bottom: 8%;
  left: 0;
  right: 0;
  z-index: 2;
  text-align: center;
  pointer-events: none;
}

.bottom-title-stack {
  position: relative;
  margin-bottom: 7px;
}

.bottom-title {
  font-size: clamp(0.8rem, 1.4vw, 1.05rem);
  font-weight: 200;
  letter-spacing: 0.08em;
  color: #1a1a1a;
}

.bottom-title-philosophy {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  font-weight: 100;
}

.bottom-sub {
  font-size: 0.65rem;
  font-weight: 300;
  letter-spacing: 0.3em;
  text-transform: uppercase;
  color: rgba(26, 26, 26, 0.35);
}

/* ── Showcase info ── */
.showcase-info {
  position: absolute;
  bottom: 8%;
  left: 0;
  right: 0;
  z-index: 10;
  text-align: center;
  pointer-events: none;
  opacity: 0;
}

.showcase-title {

  font-weight: 300;
  font-size: clamp(1.1rem, 2.4vw, 1.8rem);
  letter-spacing: -0.01em;
  color: #1a1a1a;
  margin: 0 0 1rem;
}

.showcase-meta {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.7rem;

  font-size: 0.68rem;
  font-weight: 300;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: rgba(26, 26, 26, 0.4);
  margin-bottom: 2rem;
}

.showcase-dot {
  width: 3px;
  height: 3px;
  border-radius: 50%;
  background: rgba(26, 26, 26, 0.2);
}

.showcase-scroll-hint {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;

  font-size: 0.6rem;
  font-weight: 300;
  letter-spacing: 0.25em;
  text-transform: uppercase;
  color: rgba(26, 26, 26, 0.25);
}

.showcase-scroll-hint svg {
  animation: showcase-bounce 2s ease-in-out infinite;
}

@keyframes showcase-bounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(5px); }
}


/* ── Responsive ── */
@media (max-width: 1023px) {
  .thumb {
    width: 40px;
    height: 58px;
    margin-left: -20px;
    margin-top: -29px;
    border-radius: 5px;
  }
}

@media (max-width: 640px) {
  .intro-nav {
    gap: 1.5rem;
  }

  .intro-nav a {
    font-size: 0.6rem;
  }

  .intro-brand {
    font-size: 0.7rem;
  }

  .thumb {
    width: 32px;
    height: 46px;
    margin-left: -16px;
    margin-top: -23px;
    border-radius: 4px;
  }
}
</style>
