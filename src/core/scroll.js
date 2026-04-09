import gsap from 'gsap'

export class ScrollEngine {
  constructor({ ease = 0.08 } = {}) {
    this.target = 0
    this.current = 0
    this.progress = 0
    this.velocity = 0
    this.ease = ease

    // Section tracking
    this.sections = []
    this.activeIndex = -1
    this.localProgress = 0

    this._listeners = new Set()
    this._sectionListeners = new Set()
    this._onScroll = this._update.bind(this)

    window.addEventListener('scroll', this._onScroll, { passive: true })
    this._update()
  }

  /**
   * Observe DOM sections for per-section progress tracking.
   * Call once after the DOM is mounted.
   */
  observeSections(selector = '.section') {
    this.sections = Array.from(document.querySelectorAll(selector))
    this._update()
  }

  _update() {
    const limit = document.documentElement.scrollHeight - window.innerHeight
    this.target = limit > 0 ? window.scrollY / limit : 0
  }

  _computeSection() {
    if (!this.sections.length) return

    const scrollY = window.scrollY
    const vh = window.innerHeight
    const center = scrollY + vh * 0.5

    let index = 0
    let local = 0

    for (let i = 0; i < this.sections.length; i++) {
      const el = this.sections[i]
      const top = el.offsetTop
      const height = el.offsetHeight

      if (center >= top && center < top + height) {
        index = i
        local = Math.min(Math.max((center - top) / height, 0), 1)
        break
      }

      // Past the last section
      if (i === this.sections.length - 1) {
        index = i
        local = 1
      }
    }

    this.localProgress = local

    if (index !== this.activeIndex) {
      const prev = this.activeIndex
      this.activeIndex = index

      for (const fn of this._sectionListeners) {
        fn(index, prev)
      }
    }
  }

  /** Call once per frame to lerp toward the target. */
  tick(dt) {
    const prev = this.current
    this.current += (this.target - this.current) * Math.min(this.ease * dt * 60, 1)
    this.velocity = this.current - prev

    if (Math.abs(this.target - this.current) < 1e-5) {
      this.current = this.target
      this.velocity = 0
    }

    this.progress = this.current

    this._computeSection()

    for (const fn of this._listeners) {
      fn(this.progress, this.velocity)
    }
  }

  /** Subscribe to smoothed scroll updates. Returns unsubscribe fn. */
  on(fn) {
    this._listeners.add(fn)
    return () => this._listeners.delete(fn)
  }

  /** Subscribe to section change events. Returns unsubscribe fn. */
  onSectionChange(fn) {
    this._sectionListeners.add(fn)
    return () => this._sectionListeners.delete(fn)
  }

  /** Bind a paused GSAP timeline to global scroll progress. */
  bindTimeline(tl) {
    tl.pause()
    return this.on((progress) => {
      tl.progress(progress)
    })
  }

  /** Create + bind a GSAP timeline in one call. */
  timeline(build) {
    const tl = gsap.timeline({ paused: true })
    build(tl)
    const unsub = this.bindTimeline(tl)
    return { tl, unsub }
  }

  destroy() {
    window.removeEventListener('scroll', this._onScroll)
    this._listeners.clear()
    this._sectionListeners.clear()
    this.sections = []
  }
}
