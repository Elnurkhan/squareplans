import { Raycast, Vec2 } from 'ogl'
import gsap from 'gsap'

/**
 * Pointer — smooth mouse tracking, parallax values, and hover raycasting.
 *
 * Coordinates:
 *   raw    — instant mouse position, normalized -1 to 1
 *   smooth — lerped position for parallax / camera
 *   hover  — 0 or 1, smoothly interpolated, for the closest hit mesh
 */
export class Pointer {
  constructor(gl, camera, { ease = 0.08, parallaxStrength = 0.3 } = {}) {
    this.gl = gl
    this.camera = camera
    this.ease = ease
    this.parallaxStrength = parallaxStrength

    // Normalized -1 to 1
    this.raw = new Vec2()
    this.smooth = new Vec2()

    // Parallax offset for camera
    this.parallax = { x: 0, y: 0 }

    // Hover state
    this.hover = { value: 0 }
    this.hitMesh = null
    this._meshes = []

    this._raycast = new Raycast()

    this._onMove = this._handleMove.bind(this)
    this._onLeave = this._handleLeave.bind(this)
    window.addEventListener('pointermove', this._onMove, { passive: true })
    window.addEventListener('pointerleave', this._onLeave, { passive: true })
  }

  /** Register meshes for hover raycasting. */
  setMeshes(meshes) {
    this._meshes = Array.isArray(meshes) ? meshes : [meshes]
  }

  clearMeshes() {
    this._meshes = []
    this._animateHover(0)
    this.hitMesh = null
  }

  _handleMove(e) {
    this.raw.x = (e.clientX / window.innerWidth) * 2 - 1
    this.raw.y = -(e.clientY / window.innerHeight) * 2 + 1
  }

  _handleLeave() {
    gsap.to(this.raw, { x: 0, y: 0, duration: 0.6, ease: 'power2.out' })
  }

  _animateHover(target) {
    gsap.to(this.hover, {
      value: target,
      duration: 0.4,
      ease: target > 0 ? 'power2.out' : 'power3.in',
      overwrite: true,
    })
  }

  /** Call once per frame. */
  tick(dt) {
    const lerpFactor = Math.min(this.ease * dt * 60, 1)

    this.smooth.x += (this.raw.x - this.smooth.x) * lerpFactor
    this.smooth.y += (this.raw.y - this.smooth.y) * lerpFactor

    // Parallax target
    this.parallax.x = this.smooth.x * this.parallaxStrength
    this.parallax.y = this.smooth.y * this.parallaxStrength

    // Raycast for hover
    if (this._meshes.length) {
      this._raycast.castMouse(this.camera, this.raw)
      const hits = this._raycast.intersectBounds(this._meshes)

      if (hits.length) {
        if (this.hitMesh !== hits[0]) {
          this.hitMesh = hits[0]
          this._animateHover(1)
        }
      } else if (this.hitMesh) {
        this.hitMesh = null
        this._animateHover(0)
      }
    }
  }

  destroy() {
    window.removeEventListener('pointermove', this._onMove)
    window.removeEventListener('pointerleave', this._onLeave)
    this._meshes = []
  }
}
