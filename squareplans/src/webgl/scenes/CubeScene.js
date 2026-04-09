import { Mesh, Box, Program } from 'ogl'
import gsap from 'gsap'

const vertex = /* glsl */ `
  attribute vec3 position;
  attribute vec3 normal;

  uniform mat4 modelViewMatrix;
  uniform mat4 projectionMatrix;
  uniform mat3 normalMatrix;
  uniform vec2 uMouse;
  uniform float uHover;
  uniform float uTime;

  varying vec3 vNormal;
  varying float vDistort;

  void main() {
    vNormal = normalize(normalMatrix * normal);

    vec3 pos = position;

    // Mouse-reactive vertex distortion
    float mouseDist = length(pos.xy - uMouse * 0.5);
    float wave = sin(mouseDist * 6.0 - uTime * 2.0) * 0.08 * uHover;
    pos += normal * wave;

    vDistort = wave;

    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
  }
`

const fragment = /* glsl */ `
  precision highp float;

  uniform float uAlpha;
  uniform float uHover;

  varying vec3 vNormal;
  varying float vDistort;

  void main() {
    vec3 light = normalize(vec3(0.5, 1.0, 0.8));
    float diffuse = dot(vNormal, light) * 0.5 + 0.5;

    vec3 baseColor = mix(vec3(0.1, 0.1, 0.15), vec3(0.6, 0.4, 1.0), diffuse);
    vec3 hoverTint = mix(baseColor, vec3(0.8, 0.5, 1.0), uHover * 0.3 + vDistort * 2.0);

    gl_FragColor = vec4(hoverTint, uAlpha);
  }
`

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
