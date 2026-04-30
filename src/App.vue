<template>
  <SiteHeader />
  <div class="main-page" ref="mainPageEl">
    <IntroAnimation />
  </div>
  <AboutPage />
  <ContactsPage />
  <a href="#hero" class="skip-link">Skip to content</a>
  <DOMLayer>
  </DOMLayer>
  <div class="scroll-line" ref="scrollLineEl"></div>
</template>

<script setup>
import { ref, provide, onMounted, onUnmounted } from 'vue'
import Lenis from 'lenis'
import 'lenis/dist/lenis.css'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

import IntroAnimation from '@/components/IntroAnimation.vue'
import AboutPage from '@/components/AboutPage.vue'
import ContactsPage from '@/components/ContactsPage.vue'
import SiteHeader from '@/components/SiteHeader.vue'
import DOMLayer from '@/components/DOMLayer.vue'
import { usePageNavigation } from '@/composables/usePageNavigation'

gsap.registerPlugin(ScrollTrigger)

let lenis
let lenisTicker
const lenisRef = ref(null)
const scrollLineEl = ref(null)
const mainPageEl = ref(null)
const introComplete = ref(false)
provide('lenis', lenisRef)
provide('introComplete', introComplete)

const { setLenisGetter, registerPage } = usePageNavigation()
setLenisGetter(() => lenisRef.value)

onMounted(() => {
  registerPage(1, mainPageEl.value)
  const isMobile = window.innerWidth < 1024
  lenis = new Lenis({
    autoRaf: false,
    wheelMultiplier: 1.8,
    touchMultiplier: isMobile ? 7 : 5,
    lerp: isMobile ? 0.15 : 0.1,
  })
  lenis.on('scroll', (e) => {
    ScrollTrigger.update(e)
    if (scrollLineEl.value) {
      scrollLineEl.value.style.transform = `scaleY(${e.progress})`
    }
  })
  lenisTicker = (time) => lenis.raf(time * 1000)
  gsap.ticker.add(lenisTicker)
  gsap.ticker.lagSmoothing(0)
  lenisRef.value = lenis
})

onUnmounted(() => {
  registerPage(1, null)
  if (lenisTicker) gsap.ticker.remove(lenisTicker)
  lenisTicker = null
  lenis?.destroy()
  lenis = null
  lenisRef.value = null
})
</script>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html {
  scrollbar-width: none;
}
html::-webkit-scrollbar {
  display: none;
}

body {
  background: #0a0a0f;
  color: #e0e0e0;
  font-family: 'Petrov Sans Trial', system-ui, -apple-system, sans-serif;
  overflow-x: hidden;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

/* Main-page wrapper. Transform applied via GSAP from usePageNavigation.
   No CSS transition — GSAP handles the timing so it stays in sync with
   overlay animations. After returning to main, GSAP `clearProps`
   strips the transform and ScrollTrigger.refresh() rebuilds the pin. */

.scroll-line {
  position: fixed;
  top: 0;
  right: 0;
  width: 2px;
  height: 100vh;
  background: #1a1a1a;
  transform-origin: top center;
  transform: scaleY(0);
  z-index: 250;
  pointer-events: none;
}

.skip-link {
  position: fixed;
  top: -100%;
  left: 1rem;
  z-index: 100;
  padding: 0.5rem 1rem;
  background: #e0e0e0;
  color: #0a0a0f;
  text-decoration: none;
  font-size: 0.875rem;
  border-radius: 0 0 4px 4px;
}

.skip-link:focus {
  top: 0;
}
</style>
