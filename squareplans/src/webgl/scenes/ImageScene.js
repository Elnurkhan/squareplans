import { createImagePlane } from '@/webgl/ImagePlane'
import gsap from 'gsap'

export class ImageScene {
  init(gl, root, camera) {
    this.camera = camera

    this.plane = createImagePlane(gl, {
      src: '/demo.jpg',
      width: 2.5,
      segments: 32,
      strength: 0.08,
    })

    this.plane.mesh.setParent(root)
    this._time = 0

    this.state = { alpha: 0 }

    this.tl = gsap.timeline({ paused: true })
      .fromTo(this.state, { alpha: 0 }, { alpha: 1, duration: 0.15, ease: 'power2.out' }, 0)
      .fromTo(camera.position, { z: 4 }, { z: 3, duration: 1, ease: 'power1.inOut' }, 0)
      .fromTo(this.plane.mesh.rotation, { y: -0.15, x: -0.05 }, { y: 0.15, x: 0.05, duration: 1, ease: 'none' }, 0)
      .to(this.state, { alpha: 0, duration: 0.15, ease: 'power2.in' }, 0.85)
  }

  update(_progress, dt, pointer) {
    this._time += dt
    this.plane.update(this._time)

    const u = this.plane.program.uniforms
    u.uAlpha.value = this.state.alpha

    if (pointer) {
      u.uMouse.value[0] = pointer.smooth.x
      u.uMouse.value[1] = pointer.smooth.y
      u.uHover.value = pointer.hover.value
      pointer.setMeshes(this.plane.mesh)
    }
  }

  destroy() {
    this.tl.kill()
    this.plane.mesh.setParent(null)
  }
}
