<template>
  <div class="pp" ref="rootEl">
    <div class="pp-body">

    <!-- ── Projects overview ── -->
    <section class="pp-projects-overview" ref="poSectionEl">
      <div class="pp-po-header">
        <div class="pp-po-left">
          <h2 class="pp-po-title">{{ t('pp.projects') }}</h2>
          <span class="pp-po-count" ref="countEl">0+</span>
        </div>
        <div class="pp-po-desc">
          <p>{{ t('pp.projects.desc') }}</p>
        </div>
      </div>
      <div class="pp-po-gallery">
        <div class="pp-po-img pp-po-side">
          <img :src="`${$base}projects/afi/1.jpg`" alt="" loading="lazy" />
        </div>
        <div class="pp-po-img pp-po-center" ref="poCenterImg">
          <img :src="`${$base}projects/level/1.jpg`" alt="" loading="lazy" />
        </div>
        <div class="pp-po-img pp-po-side">
          <img :src="`${$base}projects/mosfilm/001.jpg`" alt="" loading="lazy" />
        </div>
      </div>
    </section>

    <!-- ── Aesthetics sub-block ── -->
    <section class="pp-aesthetics">
      <div class="pp-ae-text">
        <div class="pp-ae-title rv">
          <p>{{ t('pp.aesthetics.title') }}</p>
        </div>
        <div class="pp-ae-desc rv" style="transition-delay:.15s">
          <p>{{ t('pp.aesthetics.desc') }}</p>
        </div>
      </div>
      <div class="pp-ae-photo rv rv-img" style="transition-delay:.2s">
        <img :src="`${$base}projects/n35/1.jpg`" alt="" loading="lazy" />
      </div>
    </section>

    <!-- ── Mission ── -->
    <section class="pp-mission">
      <span class="pp-mission-label rv">{{ t('pp.mission') }}</span>
      <h2 class="pp-mission-quote rv" style="transition-delay:.1s">
        {{ t('pp.mission.quote') }}
      </h2>
      <div class="pp-mission-photo rv rv-img" style="transition-delay:.2s">
        <img :src="`${$base}projects/n100/2.jpg`" alt="" loading="lazy" />
      </div>
    </section>

    </div><!-- /.pp-body -->

    <!-- ── Hero banner (sticky, revealed behind content) ── -->
    <section class="pp-banner" ref="bannerEl">
      <div class="pp-banner-img rv rv-img" ref="bannerImgEl">
        <img :src="`${$base}projects/afi/3.jpg`" alt="" loading="lazy" />
        <p class="pp-banner-text" v-html="t('pp.banner.text')"></p>
      </div>
    </section>

    <!-- ── Footer ── -->
    <footer class="pp-footer" data-nav="3">
      <div class="pp-footer-inner">
        <div class="pp-footer-col">
          <img class="pp-footer-brand" :src="`${$base}logo.svg`" alt="SQUAREPLANS" />
          <span class="pp-footer-copy">{{ t('pp.footer.copy') }}</span>
        </div>
        <div class="pp-footer-col">
          <a href="https://www.instagram.com/squareplans?igsh=MXRjbTBoaGp6d2ZpZw==">Instagram</a>
          <a href="https://t.me/squareplans">Telegram</a>
          <a href="#">squareplans@gmail.com</a>
        </div>
        <div class="pp-footer-col pp-footer-col-right">
          <div class="pp-footer-lang" @click="langOpen = !langOpen">
            <span class="pp-footer-lang-current">{{ lang }} ↓</span>
            <ul v-if="langOpen" class="pp-footer-lang-menu">
              <li @click.stop="setLang('Ru'); langOpen = false">Ru</li>
              <li @click.stop="setLang('En'); langOpen = false">En</li>
            </ul>
          </div>
          <span class="pp-footer-dev">{{ t('pp.footer.dev') }}</span>
        </div>
      </div>
    </footer>

  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useI18n } from '@/composables/useI18n'

gsap.registerPlugin(ScrollTrigger)

const { lang, t, setLang } = useI18n()
const langOpen = ref(false)
const rootEl = ref(null)
const countEl = ref(null)
const poCenterImg = ref(null)
const poSectionEl = ref(null)
const bannerEl = ref(null)
const bannerImgEl = ref(null)
let observer = null
let poObserver = null
let poTl = null
let bannerTick = null

const moreProjects = [
  { id: 1, src: 'https://picsum.photos/seed/proj1/600/750', title: 'Лофт в Красном Октябре' },
  { id: 2, src: 'https://picsum.photos/seed/proj2/600/750', title: 'Вилла в Барвихе' },
  { id: 3, src: 'https://picsum.photos/seed/proj3/600/750', title: 'Пентхаус Сити' },
  { id: 4, src: 'https://picsum.photos/seed/proj4/600/750', title: 'Апартаменты Остоженка' },
]

onMounted(() => {
  // Reveal system for other sections (aesthetics, mission, etc.)
  observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          entry.target.classList.add('vis')
          observer.unobserve(entry.target)
        }
      }
    },
    { threshold: 0.08 }
  )
  rootEl.value?.querySelectorAll('.rv').forEach((el) => observer.observe(el))

  // ── Projects overview: smooth GSAP reveal (berch.ch style) ──
  if (poSectionEl.value) {
    const title = poSectionEl.value.querySelector('.pp-po-title')
    const count = countEl.value
    const desc = poSectionEl.value.querySelector('.pp-po-desc')
    const sideImgs = poSectionEl.value.querySelectorAll('.pp-po-side')
    const centerImg = poCenterImg.value

    // Initial hidden states
    gsap.set([title, count], { y: 70, opacity: 0 })
    gsap.set(desc, { y: 50, opacity: 0 })
    gsap.set(sideImgs, { clipPath: 'inset(100% 0 0 0)' })
    gsap.set(centerImg, { clipPath: 'inset(100% 0 0 0)' })

    poObserver = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue
          poObserver.disconnect()

          poTl = gsap.timeline()

          // Title slides up — slow, smooth
          poTl.to(title, {
            y: 0, opacity: 1,
            duration: 1.5,
            ease: 'power3.out',
          })
          // Count follows with slight overlap
          .to(count, {
            y: 0, opacity: 1,
            duration: 1.5,
            ease: 'power3.out',
          }, 0.12)
          // Description fades up
          .to(desc, {
            y: 0, opacity: 1,
            duration: 1.3,
            ease: 'power3.out',
          }, 0.3)
          // Gallery images reveal with clip-path — staggered
          .to(sideImgs[0], {
            clipPath: 'inset(0% 0 0 0)',
            duration: 1.6,
            ease: 'power4.out',
          }, 0.5)
          .to(centerImg, {
            clipPath: 'inset(0% 0 0 0)',
            duration: 1.6,
            ease: 'power4.out',
          }, 0.65)
          .to(sideImgs[1], {
            clipPath: 'inset(0% 0 0 0)',
            duration: 1.6,
            ease: 'power4.out',
          }, 0.8)

          // Count-up: 0 → 25 integrated into the flow
          const state = { v: 0 }
          gsap.to(state, {
            v: 25,
            duration: 2,
            delay: 0.3,
            ease: 'power2.out',
            onUpdate: () => {
              if (count) count.textContent = Math.round(state.v) + '+'
            },
          })
        }
      },
      { threshold: 0.05 }
    )
    poObserver.observe(poSectionEl.value)
  }

  // ── Banner: darken → clear + text parallax based on pp-body scroll ──
  if (bannerImgEl.value && rootEl.value) {
    const overlay = bannerImgEl.value
    const bannerText = bannerImgEl.value.querySelector('.pp-banner-text')
    const body = rootEl.value.querySelector('.pp-body')

    const bannerImg = bannerImgEl.value.querySelector('img')

    bannerTick = () => {
      if (!body) return
      const rect = body.getBoundingClientRect()
      const vh = window.innerHeight
      // t = 0 when body bottom covers the viewport, t = 1 when fully scrolled past
      const t = Math.max(0, Math.min(1, 1 - rect.bottom / vh))

      // Dimming overlay
      overlay.style.setProperty('--banner-dim', String(1 - t))

      // Text parallax: moves slower than scroll (lags behind → depth feel)
      if (bannerText) {
        const textY = (1 - t) * 80
        bannerText.style.transform = `translateY(${textY}px)`
        bannerText.style.opacity = String(Math.min(1, t * 1.8))
      }

      // Image counter-parallax: subtle upward shift (faster layer)
      if (bannerImg) {
        const imgY = (1 - t) * -25
        bannerImg.style.transform = `translateY(${imgY}px) scale(1.08)`
      }
    }
    gsap.ticker.add(bannerTick)
  }
})

onBeforeUnmount(() => {
  observer?.disconnect()
  poObserver?.disconnect()
  if (bannerTick) gsap.ticker.remove(bannerTick)
  poTl?.kill()
})

defineExpose({ rootEl })
</script>

<style>
/* ── Base ── */
.pp {
  color: #1a1a1a;

  --pad: clamp(1.5rem, 8vw, 10rem);
  --accent: #b8a590;
  background: #fafafa;
}

/* ── Reveal system ── */
.rv {
  opacity: 0;
  transform: translateY(36px);
  transition: opacity 0.9s cubic-bezier(0.19, 1, 0.22, 1),
              transform 0.9s cubic-bezier(0.19, 1, 0.22, 1);
}
.rv.rv-img {
  transform: translateY(28px) scale(0.985);
  transition: opacity 1s cubic-bezier(0.19, 1, 0.22, 1),
              transform 1s cubic-bezier(0.19, 1, 0.22, 1);
}
.rv.vis {
  opacity: 1;
  transform: translateY(0) scale(1);
}

/* ══════════════════
   PROJECTS OVERVIEW
   ══════════════════ */
.pp-projects-overview {
  padding: clamp(5rem, 12vw, 10rem) 0 0;
  background: #fafafa;
}

.pp-po-header {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0;
  align-items: flex-start;
  margin-bottom: clamp(2.5rem, 5vw, 4rem);
}

.pp-po-left {
  display: contents;
}

.pp-po-title {

  font-weight: 300;
  font-size: clamp(2.2rem, 5vw, 4rem);
  letter-spacing: -0.01em;
  color: #1a1a1a;
  margin: 0;
  padding-left: clamp(1.5rem, 4vw, 4rem);
}

.pp-po-count {

  font-weight: 300;
  font-size: clamp(2.2rem, 5vw, 4rem);
  letter-spacing: -0.01em;
  color: #1a1a1a;
}

.pp-po-desc {
  padding-top: 0.5rem;
  padding-right: 0;
}

.pp-po-desc p {
  font-size: clamp(0.78rem, 1vw, 0.9rem);
  font-weight: 300;
  line-height: 1.85;
  letter-spacing: 0.02em;
  color: rgba(26, 26, 26, 0.5);
  margin: 0;
}

.pp-po-gallery {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0;
  align-items: end;
}

.pp-po-img {
  overflow: hidden;
}

.pp-po-center,
.pp-po-side {
  will-change: clip-path;
  overflow: hidden;
}

.pp-po-img:nth-child(1) {
  aspect-ratio: 1 / 1;
}

.pp-po-img:nth-child(2) {
  aspect-ratio: 1 / 0.95;
}

.pp-po-img:nth-child(3) {
  aspect-ratio: 1 / 1.1;
}

.pp-po-img img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

/* ══════════════════
   AESTHETICS
   ══════════════════ */
.pp-aesthetics {
  padding: clamp(5rem, 10vw, 8rem) 0 clamp(4rem, 8vw, 8rem);
  background: #fafafa;
}

.pp-ae-text {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 0;
  align-items: start;
  margin-bottom: clamp(2.5rem, 5vw, 4rem);
}

.pp-ae-title {
  grid-column: 2;
}

.pp-ae-desc {
  grid-column: 3;
}

.pp-ae-title p {

  font-size: clamp(0.85rem, 1.2vw, 1rem);
  font-weight: 300;
  font-style: italic;
  letter-spacing: 0.02em;
  color: rgba(26, 26, 26, 0.6);
  margin: 0;
}

.pp-ae-desc p {
  font-size: clamp(0.78rem, 1vw, 0.9rem);
  font-weight: 300;
  line-height: 1.85;
  letter-spacing: 0.02em;
  color: rgba(26, 26, 26, 0.5);
  margin: 0;
}

.pp-ae-photo {
  margin-left: calc(100% * 2 / 3);
  width: calc(100% / 3);
  border-radius: 8px;
  overflow: hidden;
}

.pp-ae-photo img {
  width: 100%;
  display: block;
  object-fit: cover;
}

/* ══════════════════
   MISSION
   ══════════════════ */
.pp-mission {
  padding: 75px var(--pad) clamp(4rem, 8vw, 8rem);
  background: #fafafa;
  text-align: center;
}

.pp-mission-label {
  display: block;
  font-size: 0.6rem;
  font-weight: 400;
  letter-spacing: 0.35em;
  text-transform: uppercase;
  color: var(--accent);
  margin-bottom: 1.5rem;
}

.pp-mission-quote {

  font-weight: 300;
  font-size: clamp(1.3rem, 2.8vw, 2rem);
  line-height: 1.3;
  letter-spacing: 0.01em;
  color: #1a1a1a;
  max-width: 680px;
  margin: 0 auto clamp(2.5rem, 5vw, 4rem);
}

.pp-mission-photo {
  max-width: 440px;
  margin: 0 auto;
  border-radius: 8px;
  overflow: hidden;
}

.pp-mission-photo img {
  width: 100%;
  display: block;
  object-fit: cover;
}

/* ══════════════════════
   FULL-BLEED IMAGE
   ══════════════════════ */
.pp-bleed {
  width: 100%;
  overflow: hidden;
  background: #fafafa;
}

.pp-bleed img {
  width: 100%;
  display: block;
  object-fit: cover;
}

section.pp-bleed {
  padding: 0 var(--pad);
  background: #fafafa;
}

section.pp-bleed img {
  border-radius: 10px;
  max-height: 75vh;
}

/* ══════════════════
   ABOUT
   ══════════════════ */
.pp-about {
  padding: clamp(5rem, 12vw, 10rem) var(--pad);
  background: #fafafa;
}

.pp-about-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: clamp(2rem, 6vw, 6rem);
  align-items: start;
}

.pp-heading {

  font-weight: 300;
  font-size: clamp(1.4rem, 3vw, 2.4rem);
  letter-spacing: -0.01em;
  color: #1a1a1a;
  margin: 0;
}

.pp-about-right p {
  font-size: clamp(0.82rem, 1.1vw, 0.95rem);
  font-weight: 300;
  line-height: 1.95;
  letter-spacing: 0.02em;
  color: rgba(26, 26, 26, 0.55);
  margin: 0 0 1.4rem;
}

.pp-about-right p:last-child {
  margin-bottom: 0;
}

/* ══════════════════
   SPECS
   ══════════════════ */
.pp-specs {
  padding: 0 var(--pad);
  margin-bottom: clamp(4rem, 8vw, 8rem);
  background: #fafafa;
}

.pp-rule {
  height: 1px;
  background: rgba(26, 26, 26, 0.1);
}

.pp-specs-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 1rem;
  padding: clamp(2.5rem, 5vw, 4rem) 0;
}

.pp-spec {
  text-align: center;
}

.pp-spec-val {

  font-weight: 700;
  font-size: clamp(2.2rem, 4.5vw, 4rem);
  line-height: 1;
  color: #1a1a1a;
  display: block;
}

.pp-spec-unit {

  font-weight: 300;
  font-size: clamp(0.7rem, 1vw, 0.85rem);
  letter-spacing: 0.15em;
  text-transform: uppercase;
  color: var(--accent);
  margin-left: 0.3rem;
}

.pp-spec-label {
  display: block;
  margin-top: 0.6rem;
  font-size: 0.65rem;
  font-weight: 300;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: rgba(26, 26, 26, 0.35);
}

/* ══════════════════
   GALLERY
   ══════════════════ */
.pp-gallery {
  padding: 0 var(--pad);
  margin-bottom: clamp(4rem, 8vw, 8rem);
  background: #fafafa;
}

.pp-gallery-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: clamp(0.8rem, 2vw, 1.5rem);
  align-items: stretch;
}

.pp-gallery-tall {
  border-radius: 10px;
  overflow: hidden;
}

.pp-gallery-tall img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.pp-gallery-stack {
  display: flex;
  flex-direction: column;
  gap: clamp(0.8rem, 2vw, 1.5rem);
}

.pp-gallery-item {
  flex: 1;
  border-radius: 10px;
  overflow: hidden;
}

.pp-gallery-item img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

/* ══════════════════
   DETAIL
   ══════════════════ */
.pp-detail {
  margin-bottom: clamp(4rem, 8vw, 8rem);
  background: #fafafa;
}

.pp-detail .pp-bleed img {
  max-height: 60vh;
}

.pp-detail-caption {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.6rem;
  padding: 1.2rem var(--pad) 0;
  font-size: 0.65rem;
  font-weight: 300;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: rgba(26, 26, 26, 0.35);
}

.pp-dash {
  opacity: 0.4;
  font-weight: 300;
}

/* ══════════════════
   QUOTE
   ══════════════════ */
.pp-quote {
  padding: clamp(6rem, 14vw, 14rem) var(--pad);
  text-align: center;
  background: #fafafa;
}

.pp-quote-inner {
  max-width: 680px;
  margin: 0 auto;
}

.pp-quote-label {
  display: block;
  font-size: 0.6rem;
  font-weight: 400;
  letter-spacing: 0.35em;
  text-transform: uppercase;
  color: var(--accent);
  margin-bottom: 2.5rem;
}

.pp-quote blockquote {

  font-weight: 300;
  font-style: italic;
  font-size: clamp(1.3rem, 2.8vw, 2rem);
  line-height: 1.7;
  letter-spacing: 0.01em;
  color: rgba(26, 26, 26, 0.65);
  border: none;
  padding: 0;
  margin: 0;
}

/* ══════════════════
   MORE PROJECTS
   ══════════════════ */
.pp-more {
  padding: 0 var(--pad) clamp(4rem, 8vw, 8rem);
  background: #fafafa;
}

.pp-more-head {
  margin-bottom: clamp(2rem, 4vw, 3.5rem);
}

.pp-more-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: clamp(0.8rem, 2vw, 1.5rem);
}

.pp-card {
  cursor: pointer;
}

.pp-card-img {
  border-radius: 8px;
  overflow: hidden;
  aspect-ratio: 4 / 5;
}

.pp-card-img img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
  transition: transform 0.6s cubic-bezier(0.25, 0, 0.2, 1);
}

.pp-card:hover .pp-card-img img {
  transform: scale(1.05);
}

.pp-card-name {
  display: block;
  margin-top: 0.7rem;
  font-size: 0.68rem;
  font-weight: 300;
  letter-spacing: 0.08em;
  color: rgba(26, 26, 26, 0.5);
  transition: color 0.3s;
}

.pp-card:hover .pp-card-name {
  color: #1a1a1a;
}

/* ══════════════════
   BODY (content above banner)
   ══════════════════ */
.pp-body {
  position: relative;
  z-index: 2;
  background: #fafafa;
  padding-bottom: 150px;
}

/* ══════════════════
   BANNER (sticky reveal from behind)
   ══════════════════ */
.pp-banner {
  position: sticky;
  bottom: 0;
  z-index: 1;
}

.pp-banner-img {
  position: relative;
  overflow: hidden;
}

.pp-banner-img::before {
  content: '';
  position: absolute;
  inset: 0;
  background: #000;
  opacity: var(--banner-dim, 1);
  z-index: 1;
  pointer-events: none;
}

.pp-banner-img img {
  width: 100%;
  display: block;
  object-fit: cover;
  min-height: 50vh;
}

.pp-banner-text {
  position: absolute;
  bottom: clamp(2rem, 5vw, 4rem);
  left: clamp(2rem, 5vw, 4rem);
  z-index: 2;

  font-weight: 300;
  font-size: clamp(1.4rem, 3vw, 2.6rem);
  line-height: 1.2;
  color: #fafafa;
  margin: 0;
}

/* ══════════════════
   FOOTER
   ══════════════════ */
.pp-footer {
  background: #fafafa;
  color: #1a1a1a;
  padding: clamp(2rem, 4vw, 3rem) clamp(1.5rem, 4vw, 4rem);
  border-top: 1px solid rgba(26, 26, 26, 0.08);
}

.pp-footer-inner {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 2rem;
  align-items: start;
}

.pp-footer-col {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.pp-footer-col a {
  font-size: 0.85rem;
  font-weight: 300;
  color: rgba(26, 26, 26, 0.5);
  text-decoration: none;
  transition: color 0.3s;
}

.pp-footer-col a:hover {
  color: #1a1a1a;
}

.pp-footer-brand {
  width: clamp(80px, 12vw, 101px);
  height: auto;
}

.pp-footer-copy {
  font-size: 0.78rem;
  font-weight: 300;
  color: rgba(26, 26, 26, 0.35);
}

.pp-footer-col-right {
  align-items: flex-end;
  justify-content: space-between;
  align-self: stretch;
}

.pp-footer-lang {
  position: relative;
  font-size: 0.85rem;
  font-weight: 300;
  color: rgba(26, 26, 26, 0.5);
  cursor: pointer;
  user-select: none;
}

.pp-footer-lang-current {
  transition: color 0.3s;
}

.pp-footer-lang-current:hover {
  color: #1a1a1a;
}

.pp-footer-lang-menu {
  position: absolute;
  bottom: 100%;
  right: 0;
  list-style: none;
  margin: 0 0 0.4rem;
  padding: 0.3rem 0;
  background: #fafafa;
  border: 1px solid rgba(26, 26, 26, 0.1);
  border-radius: 4px;
  min-width: 60px;
}

.pp-footer-lang-menu li {
  padding: 0.3rem 0.8rem;
  font-size: 0.85rem;
  font-weight: 300;
  color: rgba(26, 26, 26, 0.5);
  cursor: pointer;
  transition: color 0.2s;
}

.pp-footer-lang-menu li:hover {
  color: #1a1a1a;
}

.pp-footer-dev {
  font-size: 0.78rem;
  font-weight: 300;
  color: rgba(26, 26, 26, 0.35);
}

/* ══════════════════
   RESPONSIVE
   ══════════════════ */
@media (max-width: 1023px) {
  .pp-about-grid {
    grid-template-columns: 1fr;
    gap: 2rem;
  }

  .pp-specs-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 2rem 1rem;
  }

  .pp-more-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 768px) {
  .pp {
    padding-left: 15px;
    padding-right: 15px;
  }

  .pp-po-header {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
    padding: 0 1rem;
  }

  .pp-po-title {
    padding-left: 0;
  }

  .pp-po-left {
    display: flex;
    align-items: baseline;
    gap: 1.5rem;
  }

  .pp-po-gallery {
    grid-template-columns: repeat(3, 1fr);
  }

  .pp-ae-text {
    grid-template-columns: 1fr;
    gap: 1.5rem;
    padding: 0 var(--pad);
  }

  .pp-ae-title {
    grid-column: auto;
  }

  .pp-ae-desc {
    grid-column: auto;
  }

  .pp-ae-photo {
    margin-left: 0;
    width: 100%;
  }

  .pp-gallery-grid {
    grid-template-columns: 1fr;
  }

  .pp-gallery-tall img {
    aspect-ratio: 4 / 3;
    height: auto;
  }

  .pp-footer-inner {
    grid-template-columns: 1fr 1fr;
    gap: 1.5rem;
  }

  .pp-footer-col-right {
    grid-column: 1 / -1;
    align-items: flex-start;
    flex-direction: row;
    justify-content: space-between;
  }
}

@media (max-width: 480px) {
  .pp-specs-grid {
    grid-template-columns: 1fr 1fr;
    gap: 1.5rem 0.5rem;
  }

  .pp-more-grid {
    grid-template-columns: 1fr 1fr;
    gap: 0.8rem;
  }

  section.pp-bleed {
    padding: 0 1rem;
  }
}
</style>
