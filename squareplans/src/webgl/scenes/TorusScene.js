import { Mesh, Torus, Program } from 'ogl'
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

    // Ripple distortion from mouse
    float d = length(pos.xy - uMouse * 0.8);
    float ripple = sin(d * 10.0 - uTime * 3.0) * exp(-d * 2.0) * 0.1 * uHover;
    pos += normal * ripple;

    vDistort = ripple;

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
    vec3 light = normalize(vec3(-0.5, 0.8, 1.0));
    float diffuse = dot(vNormal, light) * 0.5 + 0.5;

    vec3 baseColor = mix(vec3(0.05, 0.12, 0.1), vec3(0.2, 1.0, 0.6), diffuse);
    vec3 hoverTint = mix(baseColor, vec3(0.3, 1.0, 0.8), uHover * 0.25 + abs(vDistort) * 3.0);

    gl_FragColor = vec4(hoverTint, uAlpha);
  }
`

export class TorusScene {
  init(gl, root, camera) {
    this.camera = camera

    const geometry = new Torus(gl, { radius: 0.8, tube: 0.3, radialSegments: 32, tubularSegments: 64 })
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
      .fromTo(camera.position, { z: 8 }, { z: 4, duration: 1, ease: 'power1.inOut' }, 0)
      .fromTo(this.mesh.rotation, { x: Math.PI * 0.3, y: 0 }, { x: Math.PI * 1.3, y: Math.PI * 3, duration: 1, ease: 'none' }, 0)
      .fromTo(this.mesh.scale, { x: 1, y: 1, z: 1 }, { x: 1.3, y: 1.3, z: 1.3, duration: 1, ease: 'power1.out' }, 0)
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
