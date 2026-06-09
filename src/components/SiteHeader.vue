<template>
  <header class="site-header" ref="headerEl">
    <a
      href="#"
      class="site-logo-link"
      :class="{ 'is-hidden': isLogoHidden }"
      :style="{ pointerEvents: isHeaderDisabled ? 'none' : 'auto' }"
      aria-label="SquarePlans"
      @click.prevent="onLogoClick"
    >
      <img :src="`${$base}logo.svg`" alt="SquarePlans" />
    </a>
    <nav class="site-nav">
      <a href="#" :class="{ active: currentPage === 1 }" :style="{ pointerEvents: isHeaderDisabled ? 'none' : 'auto' }" @click.prevent="onNavClick(1)">{{ t('nav.projects') }}</a>
      <a href="#" :class="{ active: currentPage === 2 }" :style="{ pointerEvents: isHeaderDisabled ? 'none' : 'auto' }" @click.prevent="onNavClick(2)">{{ t('nav.about') }}</a>
      <a href="#" :class="{ active: currentPage === 3 }" :style="{ pointerEvents: isHeaderDisabled ? 'none' : 'auto' }" @click.prevent="onNavClick(3)">{{ t('nav.contacts') }}</a>
    </nav>
  </header>
</template>

<script setup>
import { ref, inject, computed, onMounted, onBeforeUnmount } from 'vue'
import gsap from 'gsap'
import { useI18n } from '@/composables/useI18n'
import { usePageNavigation } from '@/composables/usePageNavigation'

const { t } = useI18n()
const { currentPage, navigate } = usePageNavigation()
const introComplete = inject('introComplete')
const headerEl = ref(null)
const isLogoHidden = ref(false)

const isHeaderDisabled = computed(() => currentPage.value === 1 && !introComplete.value)

function onNavClick(idx) {
  navigate(idx)
}

function onLogoClick() {
  if (currentPage.value !== 1) navigate(1)
  window.dispatchEvent(new CustomEvent('intro:go-circle'))
}

function onCascadeState(e) {
  isLogoHidden.value = Boolean(e.detail?.active)
}

onMounted(() => {
  window.addEventListener('intro:cascade-state', onCascadeState)
  gsap.fromTo(
    headerEl.value,
    { opacity: 0, y: -30 },
    { opacity: 1, y: 0, duration: 0.6, ease: 'power3.out', delay: 0.1 },
  )
})

onBeforeUnmount(() => {
  window.removeEventListener('intro:cascade-state', onCascadeState)
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

.site-logo-link {
  position: absolute;
  top: 50%;
  left: 3rem;
  display: flex;
  align-items: center;
  line-height: 0;
  opacity: 0.9;
  transform: translateY(-50%);
  transition: opacity 0.3s;
  pointer-events: auto;
}

.site-logo-link:hover {
  opacity: 1;
}

.site-logo-link.is-hidden {
  opacity: 0;
  pointer-events: none;
}

.site-logo-link img {
  display: block;
  width: 101px;
  height: auto;
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
  .site-header {
    padding: 1.4rem 1rem;
  }
  .site-logo-link {
    left: 1rem;
  }
  .site-logo-link img {
    width: 68px;
  }
  .site-nav {
    gap: 1.1rem;
  }
  .site-nav a {
    font-size: 0.56rem;
    letter-spacing: 0.12em;
  }
}
</style>
