<template>
  <section class="page-overlay page-about" :class="{ 'is-active': isActive }" ref="rootEl" data-lenis-prevent>
    <div class="about-scroll">
      <header class="badge reveal" style="--i: 0">
        <span class="badge-mark" aria-hidden="true">◆</span>
        <span class="badge-text">
          Выпускник Московского архитектурного<br>института с&nbsp;отличием
        </span>
      </header>

      <div class="about-grid">
        <figure class="photo-col reveal" style="--i: 1">
          <img
            class="founder-photo"
            :src="`${$base}about/Rectangle%2090.png`"
            alt="Илья — архитектор-дизайнер и&nbsp;основатель студии SquarePlans"
            loading="lazy"
          />
        </figure>

        <div class="text-col">
          <h1 class="title reveal" style="--i: 2">
            Илья&nbsp;— архитектор-дизайнер<br>
            и&nbsp;основатель студии&nbsp;<img class="brand-logo" :src="`${$base}logo.svg`" alt="SquarePlans" />
          </h1>

          <p class="lede reveal" style="--i: 3">
            Мой подход&nbsp;– это&nbsp;не&nbsp;просто про&nbsp;эстетику,
            а&nbsp;про&nbsp;жизнь внутри пространства. Я&nbsp;привык глубоко
            погружаться в&nbsp;ритм и&nbsp;привычки заказчика, чтобы создавать
            интерьер, который работает на&nbsp;вас: усиливает комфорт,
            отражает характер и&nbsp;становится естественным продолжением
            вашей повседневности.
          </p>

          <h2 class="quote reveal" style="--i: 4">
            Каждый проект нашей студии&nbsp;— это&nbsp;не&nbsp;шаблонное
            решение, а&nbsp;точное отражение вас и&nbsp;вашего образа жизни.
          </h2>

          <p class="lede reveal" style="--i: 5">
            Поэтому нас выбирают клиенты, которые готовы доверить нам
            своё пространство, стиль и&nbsp;время.
          </p>

          <div class="stat-row reveal" style="--i: 6">
            <span class="stat-num">25+</span>
            <span class="stat-label">Реализованных интерьеров</span>
          </div>

          <section class="mission-section reveal" style="--i: 7">
            <h3 class="mission-title">Миссия</h3>
            <div class="mission-grid">
              <p class="mission-text">
                Воплощать идеи в&nbsp;реальность так,<br>
                чтобы результат превзошёл ожидания.
              </p>
              <p class="mission-text mission-right">
                Создаём пространства и&nbsp;образы,<br>
                которые становятся частью жизни<br>
                наших клиентов
              </p>
            </div>
          </section>
        </div>
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
const isActive = computed(() => currentPage.value === 2)

useSwipeNavigation(rootEl)

onMounted(() => {
  // Park overlay off-viewport on the right before any nav happens.
  gsap.set(rootEl.value, { xPercent: 100 })
  registerPage(2, rootEl.value)
})
onBeforeUnmount(() => registerPage(2, null))
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
}
.page-overlay.is-active {
  z-index: 100;
  pointer-events: auto;
}

.about-scroll {
  max-width: 1600px;
  margin: 0 auto;
  height: 100%;
  padding: 5.5rem 33px 3rem;
  box-sizing: border-box;
  display: grid;
  grid-template-rows: auto 1fr;
  gap: 2.5rem;
}

/* ── Badge ── */
.badge {
  display: flex;
  align-items: center;
  gap: 0.7rem;
  font-size: 0.78rem;
  line-height: 1.5;
  color: rgba(20, 20, 26, 0.95);
  max-width: 320px;
  font-weight: 400;
}
.badge-mark {
  color: #14131a;
  font-size: 0.7rem;
  flex-shrink: 0;
}
.badge-text {
  flex: 1;
  font-weight: 200;
}

/* ── Two-column hero — fills remaining height (100vh layout) ── */
.about-grid {
  display: grid;
  grid-template-columns: 1fr 1.05fr;
  gap: 4rem;
  align-items: stretch;
  min-height: 0;
}

.photo-col {
  margin: 0;
  height: 100%;
  min-height: 0;
  overflow: hidden;
}

.founder-photo {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
  background: linear-gradient(135deg, #c5b8a6 0%, #8a7d6c 100%);
}

.text-col {
  display: flex;
  flex-direction: column;
  /* No flex gap — every gap between siblings is set explicitly via
     adjacent-sibling margins so each pair can have its own spacing. */
  min-height: 0;
}

.title {
  font-family: 'Petrov Sans Trial', Georgia, serif;
  font-weight: 300;
  font-size: clamp(1.8rem, 2.5vw, 2.5rem);
  line-height: 1.2;
  letter-spacing: -0.005em;
  color: #14131a;
  margin: 0;
}
.title .brand-logo {
  display: inline-block;
  height: 0.7em;
  width: auto;
  vertical-align: baseline;
}

.lede {
  font-size: clamp(0.85rem, 0.95vw, 0.95rem);
  line-height: 1.2;
  font-weight: 200;
  color: rgba(20, 20, 26, 0.72);
  margin: 0;
  max-width: 540px;
}
/* Explicit per-pair gaps in the text column. */
.title + .lede { margin-top: 12px; }
.lede + .quote { margin-top: 36px; }
.quote + .lede { margin-top: 12px; }
/* Both auto: free vertical space splits equally before & after stat-row,
   centering it between the lede above and the mission-section below.
   Mission still ends up flush with the bottom of the photo. */
.lede + .stat-row { margin-top: auto; }
.stat-row + .mission-section { margin-top: auto; }

.quote {
  font-family: 'Petrov Sans Trial', Georgia, serif;
  font-weight: 200;
  font-size: clamp(1.15rem, 1.6vw, 1.55rem);
  line-height: 1.28;
  letter-spacing: -0.005em;
  color: #14131a;
  margin: 0;
  max-width: 640px;
}

.stat-row {
  display: flex;
  align-items: baseline;
  gap: 1rem;
}
.stat-num {
  font-family: 'Petrov Sans Trial', Georgia, serif;
  font-size: clamp(2rem, 2.8vw, 2.6rem);
  font-weight: 200;
  line-height: 1;
  color: #14131a;
  letter-spacing: -0.1em;
  font-feature-settings: 'tnum';
}

.stat-label {
  font-size: 0.85rem;
  line-height: 1.3;
  color: rgba(20, 20, 26, 0.7);
  font-weight: 300;
}

/* ── Mission (sits at bottom of text column via `.stat-row + .mission-section`) ── */
.mission-title {
  font-family: 'Petrov Sans Trial', Georgia, serif;
  font-size: clamp(1.15rem, 1.5vw, 1.5rem);
  font-weight: 300;
  margin: 0 0 0.8rem;
  letter-spacing: -0.005em;
}
.mission-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 2rem;
}
.mission-text {
  font-size: clamp(0.85rem, 0.95vw, 0.95rem);
  line-height: 1.4;
  color: rgba(20, 20, 26, 0.85);
  margin: 0;
  font-weight: 200;
}
.mission-right {
  text-align: left;
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
  from { opacity: 0; transform: translateY(24px); }
  to   { opacity: 1; transform: translateY(0); }
}

/* ── Responsive ── */
@media (max-width: 1024px) {
  /* On narrow screens 100vh + two columns can't fit — fall back to a normal
     vertical stack with internal scroll. */
  .page-overlay {
    overflow-y: auto;
    overflow-x: hidden;
    -webkit-overflow-scrolling: touch;
    overscroll-behavior: contain;
  }
  .page-overlay::-webkit-scrollbar { width: 0; height: 0; }
  .page-overlay { scrollbar-width: none; }

  .about-scroll {
    height: auto;
    padding: 5rem 33px 4rem;
    grid-template-rows: auto auto auto;
    gap: 2rem;
  }
  .about-grid {
    grid-template-columns: 1fr;
    gap: 2rem;
    align-items: start;
  }
  .photo-col {
    height: auto;
  }
  .founder-photo {
    height: auto;
    aspect-ratio: 4 / 5;
  }
  .text-col {
    justify-content: flex-start;
  }
  /* Disable staggered reveal animation on mobile — content is shown instantly. */
  .is-active .reveal {
    animation: none;
  }
  .mission-grid {
    grid-template-columns: 1fr;
    gap: 1.4rem;
    margin-left: 0;
  }
  .mission-right {
    text-align: left;
  }
}

@media (max-width: 640px) {
  .about-scroll {
    padding: 4.5rem 33px 3rem;
  }
  .badge {
    font-size: 0.72rem;
  }
  .text-col {
    gap: 1.4rem;
  }
}
</style>
