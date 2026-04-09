const callbacks = new Set()
let rafId = null
let running = false
let paused = false

export function onFrame(fn) {
  callbacks.add(fn)
  return () => callbacks.delete(fn)
}

export function startLoop() {
  if (running) return
  running = true

  document.addEventListener('visibilitychange', onVisibility)

  let prev = performance.now()

  function tick(now) {
    if (!running) return
    if (paused) {
      rafId = requestAnimationFrame(tick)
      prev = now
      return
    }

    const raw = (now - prev) / 1000
    // Clamp dt to avoid huge jumps after tab switch or lag spike
    const dt = Math.min(raw, 0.1)
    prev = now

    for (const fn of callbacks) {
      fn({ time: now / 1000, dt })
    }

    rafId = requestAnimationFrame(tick)
  }

  rafId = requestAnimationFrame(tick)
}

export function stopLoop() {
  running = false
  if (rafId !== null) {
    cancelAnimationFrame(rafId)
    rafId = null
  }
  document.removeEventListener('visibilitychange', onVisibility)
}

function onVisibility() {
  paused = document.hidden
}
