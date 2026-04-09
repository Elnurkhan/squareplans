import { Mesh, Box, Program } from 'ogl'
import gsap from 'gsap'
import vertex from './gl/cube.vert.glsl?raw'
import fragment from './gl/cube.frag.glsl?raw'

export class CubeScene {
  init(gl, root, camera) {
    this.camera = camera

    const geometry = new Box(gl, {
      width: 1, height: 1, depth: 1,
      widthSegments: 8, heightSegments: 8, depthSegments: 8,
    })
    const program = new Program(gl, {
      vertex,
      fragment,
      transparent: true,
      uniforms: {
        uAlpha: { value: 1 },
        uMouse: { value: [0, 0] },
        uHover: { value: 0 },
        uTime: { value: 0 },
      },
    })

    this.mesh = new Mesh(gl, { geometry, program })
    this.mesh.setParent(root)

    this.state = { alpha: 0 }
    this._time = 0

    this.tl = gsap.timeline({ paused: true })
      .fromTo(this.state, { alpha: 0 }, { alpha: 1, duration: 0.15, ease: 'power2.out' }, 0)
      .fromTo(camera.position, { z: 5 }, { z: 8, duration: 1, ease: 'none' }, 0)
      .fromTo(this.mesh.rotation, { x: 0, y: 0 }, { x: Math.PI * 2, y: Math.PI * 4, duration: 1, ease: 'none' }, 0)
      .to(this.state, { alpha: 0, duration: 0.15, ease: 'power2.in' }, 0.85)
  }

  update(_progress, dt, pointer) {
    this._time += dt
    const u = this.mesh.program.uniforms
    u.uAlpha.value = this.state.alpha
    u.uTime.value = this._time

    if (pointer) {
      u.uMouse.value[0] = pointer.smooth.x
      u.uMouse.value[1] = pointer.smooth.y
      u.uHover.value = pointer.hover.value
      pointer.setMeshes(this.mesh)
    }
  }

  destroy() {
    this.tl.kill()
    this.mesh.setParent(null)
  }
}
