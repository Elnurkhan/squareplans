<template>
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
            v-for="(_, i) in p9Thumbnails"
            :key="'p9-' + i"
            class="thumb p9-thumb"
            ref="p9ThumbEls"
            @click="handleP9Click(i)"
          >
            <img alt="" />
            <div class="thumb-highlight" />
          </div>
        </div>
      </div>

      <div class="intro-center" ref="centerEl">
        <img class="intro-logo" :src="`${$base}logo.svg`" alt="SQUAREPLANS" />
        <span class="intro-sub">{{ t('intro.scroll') }}</span>
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
          <div class="bottom-title bottom-title-project">{{ t('bottom.recent') }}</div>
          <div class="bottom-title bottom-title-philosophy" v-html="t('bottom.philosophy')"></div>
        </div>
        <div class="bottom-sub">{{ t('bottom.choose') }}</div>
      </div>

    </div>
  </div>

  <PhotoLightbox
    :visible="lightboxOpen"
    :photos="p9LightboxPhotos"
    :start-index="lightboxStartIdx"
    @close="lightboxOpen = false"
  />
</template>

<script setup>
import { ref, computed, inject, watch, onMounted, onBeforeUnmount } from 'vue'
import gsap from 'gsap'
import { useMouseTracking } from '@/composables/useMouseTracking'
import { useIntroTimeline } from '@/composables/useIntroTimeline'
import { useCardState } from '@/composables/useCardState'
import { useI18n } from '@/composables/useI18n'
import { usePageNavigation } from '@/composables/usePageNavigation'
import PhotoLightbox from '@/components/PhotoLightbox.vue'
import { GlassCardLayer } from '@/webgl/GlassCardLayer'

const lenisRef = inject('lenis')
const introComplete = inject('introComplete')

const introEl = ref(null)
const stickyEl = ref(null)
const stageEl = ref(null)
const thumbEls = ref([])
const p9ThumbEls = ref([])
const centerEl = ref(null)
const arcTextEl = ref(null)
const arcWordEls = ref([])
const bottomEl = ref(null)
const { t } = useI18n()

const arcLines = computed(() => [
  t('arc.line1'),
  t('arc.line2'),
  t('arc.line3'),
])

const mouseTracking = useMouseTracking()
const timeline = useIntroTimeline()
const cards = useCardState()
const glCardLayer = new GlassCardLayer()
const { currentPage, isAnimating, navigate } = usePageNavigation()

// When returning to the main page from an overlay, snap card cur→tgt on the
// next tick so we don't see a brief lerp catch-up (e.g. mobile address bar
// collapse changes viewport height while the overlay is up, which shifts
// targets a bit).
watch(currentPage, (n, prev) => {
  if (n === 1 && prev !== 1) cards.snap()
})

const { thumbnails, p9Thumbnails } = cards

// Mobile drag: horizontal for phase 8, free 2D for phase 9
let touchStartX = 0
let touchStartY = 0
let touchLocked = null
let dragPreventsClick = false

const lightboxOpen = ref(false)
const lightboxStartIdx = ref(0)
let p9ImagesLoaded = false

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
  if (currentPage.value !== 1) return
  if (window.innerWidth >= 1024) return
  const t = e.touches[0]
  touchStartX = t.clientX
  touchStartY = t.clientY
  touchLocked = null

  cards.startDrag(t.clientX, t.clientY)
}

function onTouchMove(e) {
  if (currentPage.value !== 1) return
  if (window.innerWidth >= 1024) return
  const t = e.touches[0]

  // Phase 9: diagonal drag, vertical swipe collapses cascade back to spread
  if (cards.isInPhase9()) {
    if (!touchLocked) {
      const dx = Math.abs(t.clientX - touchStartX)
      const dy = Math.abs(t.clientY - touchStartY)
      if (dx + dy > 8) touchLocked = dy > dx * 1.5 ? 'v9' : 'd'
    }
    if (touchLocked === 'v9') {
      const dy = t.clientY - touchStartY
      cards.scrollCascade(-dy * 0.4)
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
  const progress = cards.getProgress()
  const spreadScrollLocked = progress >= 0.96
  const scrollsDown = t.clientY < touchStartY
  if (!touchLocked) {
    const dx = Math.abs(t.clientX - touchStartX)
    const dy = Math.abs(t.clientY - touchStartY)
    if (dx + dy > 8) touchLocked = dx > dy ? 'h' : 'v'
  }
  if (spreadScrollLocked && scrollsDown && touchLocked !== 'h') {
    e.preventDefault()
  }
  if (touchLocked === 'h') {
    e.preventDefault()
    cards.moveDrag(t.clientX, t.clientY)
    dragPreventsClick = true
  } else if (touchLocked === 'v') {
    cards.endDrag()
  }
}

function onTouchEnd(e) {
  if (currentPage.value !== 1) return
  cards.endDrag()

  // Page-swipe gesture (mobile only): horizontal swipe-left when we're NOT
  // in a card-drag phase navigates forward to "О нас". Phase 8 (>= 0.92) and
  // phase 9 (cascade) own horizontal/diagonal touch — don't hijack them.
  const progress = cards.getProgress()
  if (
    window.innerWidth < 1024 &&
    progress < 0.92 &&
    !cards.isInPhase9() &&
    e && e.changedTouches && e.changedTouches[0]
  ) {
    const t = e.changedTouches[0]
    const dx = t.clientX - touchStartX
    const dy = t.clientY - touchStartY
    if (Math.abs(dx) > 60 && Math.abs(dy) < Math.abs(dx) * 0.6 && dx < 0) {
      navigate(2)
    }
  }

  touchLocked = null
}

function exitPhase9WithLenis() {
  const l = lenisRef.value
  if (l) l.start()
}

function onWheel(e) {
  if (currentPage.value !== 1) return
  // Block scroll during phase9 exit cooldown (absorb trackpad inertia)
  if (!cards.isInPhase9()) {
    if (cards.shouldBlockScroll()) {
      cards.recordWheel()
      e.preventDefault()
      e.stopImmediatePropagation()
    }
    return
  }

  cards.recordWheel()
  e.preventDefault()
  e.stopImmediatePropagation()

  cards.scrollCascade(e.deltaY)
  if (!cards.isInPhase9()) exitPhase9WithLenis()
}

function tickFn(time, deltaTime) {
  // Skip the entire intro render loop while an overlay page is active.
  // Cards live inside the main wrapper that's been swiped off-viewport, so
  // there's nothing to look at; saves ~24+21 lerps + DOM writes per frame.
  if (currentPage.value !== 1 && !isAnimating.value) return

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

  // Preload p9 images when approaching phase 9
  if (!p9ImagesLoaded && cards.getProgress() >= 0.85) {
    p9ImagesLoaded = true
    const els = p9ThumbEls.value
    for (let i = 0; i < p9Thumbnails.length && i < els.length; i++) {
      const img = els[i].querySelector('img')
      if (img && !img.src) img.src = p9Thumbnails[i].src
    }
  }

  if (stickyEl.value) {
    stickyEl.value.style.transform = ''
  }
}

onMounted(() => {
  mouseTracking.start()
  timeline.create({
    introEl: introEl.value,
    stageEl: stageEl.value,
    centerEl: centerEl.value,
    bottomEl: bottomEl.value,
    thumbEls: thumbEls.value,
    cur: cards.cur,
    onScrollProgress: (progress) => {
      cards.setProgress(progress)
      if (progress >= 0.99 && !introComplete.value) {
        introComplete.value = true
      }
    },
    onReady: () => {
      gsap.ticker.add(tickFn)
      introComplete.value = true
    },
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

.intro-sticky {
  height: 100vh;
  overflow: hidden;
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
  width: 150px;
  height: 216px;
  margin-left: -75px;
  margin-top: -108px;
  border-radius: 18px;
  transform-style: preserve-3d;
  backface-visibility: visible;
  outline: 1px solid transparent;
}

@media (min-width: 1024px) {
  .thumb { will-change: transform, opacity; }
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

@media (max-width: 1023px) {
  .intro-bottom { bottom: 52px; }
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

/* ── Responsive ── */
@media (max-width: 1023px) {
  .thumb {
    width: 120px;
    height: 174px;
    margin-left: -60px;
    margin-top: -87px;
    border-radius: 15px;
  }
}

@media (max-width: 640px) {
  .intro-brand {
    font-size: 0.7rem;
  }

  .thumb {
    width: 96px;
    height: 138px;
    margin-left: -48px;
    margin-top: -69px;
    border-radius: 12px;
  }
}
</style>
