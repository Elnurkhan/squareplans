<template>
  <IntroAnimation />
  <a href="#hero" class="skip-link">Skip to content</a>
  <Navigation />
  <DOMLayer>
  </DOMLayer>
</template>

<script setup>
import { onMounted, onUnmounted } from 'vue'
import Lenis from 'lenis'
import 'lenis/dist/lenis.css'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

import IntroAnimation from '@/components/IntroAnimation.vue'
import WebGLCanvas from '@/components/WebGLCanvas.vue'
import Navigation from '@/components/Navigation.vue'
import DOMLayer from '@/components/DOMLayer.vue'
import HeroSection from '@/components/HeroSection.vue'
import StorySection from '@/components/StorySection.vue'
import TechSection from '@/components/TechSection.vue'
import ContactSection from '@/components/ContactSection.vue'

gsap.registerPlugin(ScrollTrigger)

let lenis

onMounted(() => {
  lenis = new Lenis({ autoRaf: false })
  lenis.on('scroll', ScrollTrigger.update)
  gsap.ticker.add((time) => lenis.raf(time * 1000))
  gsap.ticker.lagSmoothing(0)
})

onUnmounted(() => {
  lenis?.destroy()
})
</script>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  background: #0a0a0f;
  color: #e0e0e0;
  font-family: system-ui, -apple-system, sans-serif;
  overflow-x: hidden;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
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
