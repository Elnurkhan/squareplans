<template>
  <Teleport to="body">
    <Transition name="lightbox">
      <div v-if="visible" class="lightbox-overlay" @click.self="close">
        <button class="lightbox-close" @click="close" aria-label="Закрыть">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <line x1="2" y1="2" x2="18" y2="18" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
            <line x1="18" y1="2" x2="2" y2="18" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
          </svg>
        </button>

        <button class="lightbox-arrow lightbox-prev" @click="prev" aria-label="Предыдущее фото">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <polyline points="15,4 7,12 15,20" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </button>

        <div class="lightbox-main" @touchstart="onSwipeStart" @touchend="onSwipeEnd">
          <img :src="currentSrc" :key="currentIndex" alt="" class="lightbox-image" />
        </div>

        <button class="lightbox-arrow lightbox-next" @click="next" aria-label="Следующее фото">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <polyline points="9,4 17,12 9,20" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </button>

        <div class="lightbox-thumbs">
          <div class="lightbox-thumbs-track" ref="thumbsTrackEl">
            <button
              v-for="(thumb, i) in photos"
              :key="i"
              class="lightbox-thumb"
              :class="{ active: i === currentIndex }"
              @click="currentIndex = i"
            >
              <img :src="thumb.src" alt="" />
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { ref, computed, watch, nextTick, onMounted, onBeforeUnmount } from 'vue'

const props = defineProps({
  visible: Boolean,
  photos: Array,
  startIndex: { type: Number, default: 0 },
})

const emit = defineEmits(['close'])

const currentIndex = ref(0)
const thumbsTrackEl = ref(null)

const currentSrc = computed(() => {
  if (!props.photos || !props.photos.length) return ''
  return props.photos[currentIndex.value]?.src || ''
})

watch(() => props.visible, (val) => {
  if (val) {
    currentIndex.value = props.startIndex
    document.body.style.overflow = 'hidden'
  } else {
    document.body.style.overflow = ''
  }
})

watch(currentIndex, async () => {
  await nextTick()
  const track = thumbsTrackEl.value
  if (!track) return
  const active = track.querySelector('.lightbox-thumb.active')
  if (active) {
    active.scrollIntoView({ inline: 'center', block: 'nearest', behavior: 'smooth' })
  }
})

function close() {
  emit('close')
}

function prev() {
  if (!props.photos) return
  currentIndex.value = (currentIndex.value - 1 + props.photos.length) % props.photos.length
}

function next() {
  if (!props.photos) return
  currentIndex.value = (currentIndex.value + 1) % props.photos.length
}

// Swipe support for mobile
let swipeStartX = 0
function onSwipeStart(e) {
  swipeStartX = e.touches[0].clientX
}
function onSwipeEnd(e) {
  const dx = e.changedTouches[0].clientX - swipeStartX
  if (Math.abs(dx) > 50) {
    dx > 0 ? prev() : next()
  }
}

function onKeydown(e) {
  if (!props.visible) return
  if (e.key === 'Escape') close()
  if (e.key === 'ArrowLeft') prev()
  if (e.key === 'ArrowRight') next()
}

onMounted(() => {
  window.addEventListener('keydown', onKeydown)
})

onBeforeUnmount(() => {
  window.removeEventListener('keydown', onKeydown)
  document.body.style.overflow = ''
})
</script>

<style>
.lightbox-overlay {
  position: fixed;
  inset: 0;
  z-index: 9999;
  background: rgba(255, 255, 255, 0.97);
  display: flex;
  align-items: center;
  justify-content: center;
}

@media (min-width: 1024px) {
  .lightbox-overlay {
    background: rgba(255, 255, 255, 0.92);
    backdrop-filter: blur(20px);
  }
}

.lightbox-close {
  position: absolute;
  top: 1.2rem;
  right: 1.2rem;
  z-index: 3;
  width: 40px;
  height: 40px;
  border: none;
  background: none;
  color: #1a1a1a;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0.5;
  transition: opacity 0.2s;
}

.lightbox-close:hover {
  opacity: 1;
}

.lightbox-arrow {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  z-index: 3;
  width: 48px;
  height: 48px;
  border: none;
  background: none;
  color: #1a1a1a;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 1;
  transition: opacity 0.2s;
}

.lightbox-arrow:hover {
  opacity: 0.8;
}

.lightbox-prev {
  left: 0.8rem;
}

.lightbox-next {
  right: 0.8rem;
}

.lightbox-main {
  max-width: calc(100vw - 140px);
  max-height: calc(100vh - 140px);
  display: flex;
  align-items: center;
  justify-content: center;
}

.lightbox-image {
  max-width: 100%;
  max-height: calc(100vh - 140px);
  object-fit: contain;
  border-radius: 12px;
  box-shadow: 0 8px 40px rgba(0, 0, 0, 0.1);
  user-select: none;
}

.lightbox-thumbs {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 3;
  padding: 0.8rem 1rem;
  overflow: hidden;
}

.lightbox-thumbs-track {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  overflow-x: auto;
  scrollbar-width: none;
  -ms-overflow-style: none;
  padding: 4px 0;
}

.lightbox-thumbs-track::-webkit-scrollbar {
  display: none;
}

.lightbox-thumb {
  flex-shrink: 0;
  width: 44px;
  height: 44px;
  border: none;
  padding: 0;
  background: none;
  cursor: pointer;
  border-radius: 4px;
  overflow: hidden;
  opacity: 0.5;
  transition: opacity 0.2s, outline-color 0.2s;
  outline: 2px solid transparent;
  outline-offset: 1px;
}

.lightbox-thumb.active {
  opacity: 1;
  outline-color: rgba(26, 26, 26, 0.3);
}

.lightbox-thumb:hover {
  opacity: 0.85;
}

.lightbox-thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

/* Transition */
.lightbox-enter-active {
  transition: opacity 0.25s ease;
}
.lightbox-leave-active {
  transition: opacity 0.2s ease;
}
.lightbox-enter-from,
.lightbox-leave-to {
  opacity: 0;
}

/* Mobile */
@media (max-width: 1023px) {
  .lightbox-close {
    top: 0.8rem;
    right: 0.8rem;
    width: 32px;
    height: 32px;
  }

  .lightbox-close svg {
    width: 16px;
    height: 16px;
  }

  .lightbox-main {
    max-width: calc(100vw - 80px);
    max-height: calc(100vh - 120px);
  }

  .lightbox-image {
    max-height: calc(100vh - 120px);
    border-radius: 10px;
  }

  .lightbox-arrow {
    width: 36px;
    height: 36px;
  }

  .lightbox-arrow svg {
    width: 18px;
    height: 18px;
  }

  .lightbox-prev {
    left: 0.3rem;
  }

  .lightbox-next {
    right: 0.3rem;
  }

  .lightbox-thumbs {
    padding: 0.5rem 0.8rem;
  }

  .lightbox-thumbs-track {
    justify-content: flex-start;
    gap: 4px;
  }

  .lightbox-thumb {
    width: 36px;
    height: 36px;
    border-radius: 3px;
  }
}
</style>
