<template>
  <main class="dom-layer">
    <slot />
  </main>
</template>

<style>
.dom-layer {
  position: relative;
  z-index: 10;
  pointer-events: none;
}

.dom-layer .section {
  height: 100vh;
  pointer-events: auto;
  contain: layout style paint;
}
</style>
