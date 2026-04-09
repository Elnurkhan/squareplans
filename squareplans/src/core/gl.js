import { Renderer, Camera, Transform } from 'ogl'
import { TextureLoader } from './textures'

/**
 * Compute a safe device pixel ratio.
 * Caps at maxDpr, and lowers further on high-res mobile to prevent GPU overload.
 */
function safeDpr(maxDpr = 2) {
  const raw = window.devicePixelRatio || 1
  const isMobile = /Mobi|Android/i.test(navigator.userAgent)
  const cap = isMobile ? Math.min(maxDpr, 1.5) : maxDpr
  return Math.min(raw, cap)
}

export class WebGL {
  constructor(canvas, { fov = 45, near = 0.1, far = 100, maxDpr = 2 } = {}) {
    this.dpr = safeDpr(maxDpr)

    this.renderer = new Renderer({
      canvas,
      alpha: true,
      antialias: this.dpr <= 1.5,
      dpr: this.dpr,
    })

    this.gl = this.renderer.gl
    this.gl.clearColor(0, 0, 0, 0)

    this.scene = new Transform()

    this.camera = new Camera(this.gl, { fov, near, far })
    this.camera.position.set(0, 0, 5)

    this.textures = new TextureLoader(this.gl)

    // Debounced resize
    this._resizeTimer = null
    this._onResize = this._handleResize.bind(this)
    window.addEventListener('resize', this._onResize)
    this._applySize()
  }

  _handleResize() {
    clearTimeout(this._resizeTimer)
    this._resizeTimer = setTimeout(() => this._applySize(), 100)
  }

  _applySize() {
    const w = window.innerWidth
    const h = window.innerHeight
    this.renderer.setSize(w, h)
    this.camera.perspective({ aspect: w / h })
  }

  /** Force an immediate resize (skip debounce). */
  resize() {
    clearTimeout(this._resizeTimer)
    this._applySize()
  }

  render() {
    this.renderer.render({ scene: this.scene, camera: this.camera })
  }

  destroy() {
    clearTimeout(this._resizeTimer)
    window.removeEventListener('resize', this._onResize)
    this.textures.dispose()
  }
}
