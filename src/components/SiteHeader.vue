<template>
  <header class="site-header" ref="headerEl">
    <nav class="site-nav">
      <a href="#" :class="{ active: currentPage === 1 }" @click.prevent="onNavClick(1)">{{ t('nav.projects') }}</a>
      <a href="#" :class="{ active: currentPage === 2 }" @click.prevent="onNavClick(2)">{{ t('nav.about') }}</a>
      <a href="#" :class="{ active: currentPage === 3 }" @click.prevent="onNavClick(3)">{{ t('nav.contacts') }}</a>
    </nav>
  </header>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import gsap from 'gsap'
import { useI18n } from '@/composables/useI18n'
import { usePageNavigation } from '@/composables/usePageNavigation'

const { t } = useI18n()
const { currentPage, navigate } = usePageNavigation()
const headerEl = ref(null)

function onNavClick(idx) {
  navigate(idx)
}

onMounted(() => {
  gsap.fromTo(
    headerEl.value,
    { opacity: 0, y: -30 },
    { opacity: 1, y: 0, duration: 0.6, ease: 'power3.out', delay: 0.1 },
  )
})
</script>

<style scoped>
.site-header {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 200;
  padding: 2rem 3rem;
  pointer-events: none;
}

.site-nav {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 3rem;
}

.site-nav a {
  font-size: 0.7rem;
  font-weight: 400;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: #1a1a1a;
  text-decoration: none;
  opacity: 0.45;
  transition: opacity 0.3s;
  pointer-events: auto;
  cursor: pointer;
}

.site-nav a:hover,
.site-nav a.active {
  opacity: 1;
}

@media (max-width: 640px) {
  .site-nav {
    gap: 1.5rem;
  }
  .site-nav a {
    font-size: 0.6rem;
  }
}
</style>
