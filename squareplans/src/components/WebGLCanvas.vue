<template>
  <canvas ref="canvas" class="webgl-canvas" aria-hidden="true" />
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { WebGL } from '@/core/gl'
import { ScrollEngine } from '@/core/scroll'
import { SceneManager } from '@/core/scenes'
import { Pointer } from '@/core/pointer'
import { onFrame, startLoop, stopLoop } from '@/animation/loop'

const canvas = ref(null)

let webgl = null
let scroll = null
let scenes = null
let pointer = null
let cleanupFrame = null
let cleanupSection = null

let baseCameraZ = 5

onMounted(() => {
  webgl = new WebGL(canvas.value)
  scroll = new ScrollEngine()
  pointer = new Pointer(webgl.gl, webgl.camera)

  // Lazy-loaded scenes — only fetched when scrolled into view
  scenes = new SceneManager(webgl.gl, webgl.scene, webgl.camera)
    .add('hero', () => import('@/webgl/scenes/CubeScene'))
    .add('story', () => import('@/webgl/scenes/TorusScene'))
    .add('tech', () => import('@/webgl/scenes/ImageScene'))
    .add('contact', () => import('@/webgl/scenes/CubeScene'))

  scroll.observeSections('.section')

  cleanupSection = scroll.onSectionChange((index) => {
    pointer.clearMeshes()
    scenes.setScene(index)
  })

  scenes.setScene(scroll.activeIndex >= 0 ? scroll.activeIndex : 0)

  cleanupFrame = onFrame(({ dt }) => {
    scroll.tick(dt)
    pointer.tick(dt)

    scenes.update(scroll.localProgress, dt, pointer)

    baseCameraZ = webgl.camera.position.z
    webgl.camera.position.x = pointer.parallax.x
    webgl.camera.position.y = pointer.parallax.y
    webgl.camera.position.z = baseCameraZ

    webgl.render()
  })

  startLoop()
})

onBeforeUnmount(() => {
  stopLoop()
  cleanupFrame?.()
  cleanupSection?.()
  scenes?.destroy()
  pointer?.destroy()
  scroll?.destroy()
  webgl?.destroy()
})
</script>

<style>
.webgl-canvas {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 0;
  pointer-events: none;
}
</style>
