<template>
  <section class="page-overlay page-contacts" :class="{ 'is-active': isActive }" ref="rootEl" data-lenis-prevent>
    <div class="contacts-stack">
      <p class="eyebrow reveal" style="--i: 0">Свяжитесь с&nbsp;нами</p>

      <h1 class="brand-title reveal" style="--i: 1">
        <img :src="`${$base}logo.svg`" alt="SquarePlans" />
      </h1>

      <div class="hero-row">
        <div class="half-photo reveal" style="--i: 2">
          <img
            :src="`${$base}Rectangle%2091.png`"
            alt="SquarePlans"
            loading="lazy"
          />
        </div>

        <dl class="contacts-list">
          <div class="row reveal" style="--i: 3">
            <dt>Телефон:</dt>
            <dd><a href="tel:+79000000000">+7 (985) 575-55-83</a></dd>
          </div>
          <div class="row reveal" style="--i: 4">
            <dt>E-mail:</dt>
            <dd><a href="mailto:squareplans@gmail.com">squareplans@gmail.com</a></dd>
          </div>
          <div class="row reveal" style="--i: 5">
            <dt>Соц.сети:</dt>
            <dd class="socials">
              <a href="https://www.instagram.com/squareplans?igsh=MXRjbTBoaGp6d2ZpZw==" target="_blank" rel="noopener noreferrer">Instagram</a>
              <a href="https://t.me/squareplans" target="_blank" rel="noopener noreferrer">Telegram</a>
            </dd>
          </div>
        </dl>
      </div>
    </div>
  </section>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import gsap from 'gsap'
import { usePageNavigation } from '@/composables/usePageNavigation'
import { useSwipeNavigation } from '@/composables/useSwipeNavigation'

const { currentPage, registerPage } = usePageNavigation()
const rootEl = ref(null)
const isActive = computed(() => currentPage.value === 3)

useSwipeNavigation(rootEl)

onMounted(() => {
  // Parked at +200% (one viewport beyond About) — see usePageNavigation row model.
  gsap.set(rootEl.value, { xPercent: 200 })
  registerPage(3, rootEl.value)
})
onBeforeUnmount(() => registerPage(3, null))
</script>

<style scoped>
.page-overlay {
  position: fixed;
  inset: 0;
  z-index: 90;
  background: #fafaf7;
  color: #14131a;
  pointer-events: none;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 100px 2rem 3rem;
  box-sizing: border-box;
}
.page-overlay.is-active {
  z-index: 100;
  pointer-events: auto;
}

.contacts-stack {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
  max-width: 640px;
}

.eyebrow {
  font-size: 0.78rem;
  font-weight: 200;
  color: rgba(20, 20, 26, 0.75);
  margin: 0 0 12px;
  letter-spacing: 0;
}

.brand-title {
  margin: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}
.brand-title img {
  display: block;
  width: 240px;
  height: auto;
}

/* Hero block: photo upper-left, text lower-right of the centre axis.
   Two-column / two-row grid leaves the diagonal empty so photo sits high
   on the left of the axis and the contact list drops low on the right. */
.hero-row {
  display: grid;
  grid-template-columns: auto auto;
  grid-template-rows: auto auto;
  column-gap: 1.6rem;
  row-gap: 40px;
  margin-top: 2rem;
}

/* Half-circle: full circle clipped by a half-width container.
   Image positioned left:0 → LEFT half of circle visible (round side on the
   left, flat edge on the right — the right edge sits flush with the centre
   axis of the layout). */
.half-photo {
  grid-column: 1;
  grid-row: 1;
  position: relative;
  width: clamp(110px, 13vw, 160px);
  height: clamp(220px, 26vw, 320px);
  overflow: hidden;
}
.half-photo img {
  position: absolute;
  top: 0;
  left: 0;
  width: 200%;
  height: 100%;
  border-radius: 50%;
  object-fit: cover;
  background: linear-gradient(135deg, #2a2520 0%, #14131a 100%);
  display: block;
}

.contacts-list {
  grid-column: 2;
  grid-row: 2;
  display: flex;
  flex-direction: column;
  gap: 1.4rem;
  margin: 0 0 0.4rem;
  text-align: left;
}
.row {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.contacts-list dt {
  font-size: 0.78rem;
  color: black;
  font-weight: 400;
  text-align: left;
  margin: 0;
}

.contacts-list dd {
  font-size: 0.95rem;
  color: #14131a;
  margin: 0;
  font-weight: 200;
}
.contacts-list dd a {
  color: inherit;
  text-decoration: none;
  transition: color 0.25s ease;
}
.contacts-list dd a:hover {
  color: rgba(20, 20, 26, 0.55);
}

.socials {
  display: flex;
  gap: 1.6rem;
}

/* ── Reveal ── */
.reveal {
  opacity: 1;
  transform: translateY(0);
}
.is-active .reveal {
  animation: revealUp 0.8s cubic-bezier(0.2, 0.7, 0.2, 1) both;
  animation-delay: calc(0.3s + var(--i, 0) * 0.07s);
}
@keyframes revealUp {
  from { opacity: 0; transform: translateY(20px); }
  to   { opacity: 1; transform: translateY(0); }
}

/* ── Responsive ── */
@media (max-width: 640px), (max-width: 1023px) and (max-height: 520px) and (orientation: landscape) {
  .page-overlay {
    padding: 5rem 1.5rem 2rem;
    overflow-y: auto;
    overflow-x: hidden;
    -webkit-overflow-scrolling: touch;
  }
  .contacts-stack {
    gap: 1.4rem;
  }
  .hero-row {
    gap: 1rem;
  }
  .half-photo {
    width: 80px;
    height: 170px;
  }
  .contacts-list {
    column-gap: 0.7rem;
  }
  .contacts-list dt {
    font-size: 0.78rem;
  }
  .contacts-list dd {
    font-size: 0.88rem;
  }
  .socials {
    gap: 1.1rem;
  }
}

@media (max-width: 1023px) and (max-height: 520px) and (orientation: landscape) {
  .page-overlay {
    align-items: flex-start;
    padding: 3.4rem 1.25rem 1rem;
  }

  .contacts-stack {
    gap: 0.7rem;
    max-width: 520px;
  }

  .eyebrow {
    margin-bottom: 0;
  }

  .brand-title img {
    width: 120px;
  }

  .hero-row {
    column-gap: 1rem;
    row-gap: 14px;
    margin-top: 0.5rem;
  }

  .half-photo {
    width: 52px;
    height: 108px;
  }

  .contacts-list {
    gap: 0.85rem;
    margin-bottom: 0;
  }

  .contacts-list dd {
    font-size: 0.82rem;
  }
}
</style>
