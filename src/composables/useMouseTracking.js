import { MOUSE_EASE } from '@/animation/constants'

export function useMouseTracking() {
  const mouse = { x: 0, y: 0 }
  const smoothMouse = { x: 0, y: 0 }

  function onMouseMove(e) {
    mouse.x = (e.clientX / window.innerWidth - 0.5) * 2
    mouse.y = (e.clientY / window.innerHeight - 0.5) * 2
  }

  function update() {
    smoothMouse.x += (mouse.x - smoothMouse.x) * MOUSE_EASE
    smoothMouse.y += (mouse.y - smoothMouse.y) * MOUSE_EASE
  }

  function start() {
    window.addEventListener('mousemove', onMouseMove)
  }

  function stop() {
    window.removeEventListener('mousemove', onMouseMove)
  }

  return { mouse, smoothMouse, update, start, stop }
}
