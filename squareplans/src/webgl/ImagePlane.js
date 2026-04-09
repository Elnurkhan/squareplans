import { Mesh, Plane, Program, Texture } from 'ogl'

const vertex = /* glsl */ `
  attribute vec3 position;
  attribute vec2 uv;

  uniform mat4 modelViewMatrix;
  uniform mat4 projectionMatrix;
  uniform float uTime;
  uniform float uStrength;
  uniform vec2 uMouse;
  uniform float uHover;

  varying vec2 vUv;

  void main() {
    vUv = uv;

    vec3 pos = position;

    // Wave distortion along the surface
    float wave = sin(pos.x * 3.0 + uTime * 0.8) * cos(pos.y * 2.0 + uTime * 0.6);
    pos.z += wave * uStrength;

    // Slight twist on the edges
    float edge = smoothstep(0.0, 0.5, abs(pos.x));
    pos.z += edge * sin(uTime * 0.5) * uStrength * 0.5;

    // Mouse-reactive bulge
    float mouseDist = length(uv - (uMouse * 0.5 + 0.5));
    float bulge = exp(-mouseDist * mouseDist * 8.0) * uHover * 0.15;
    pos.z += bulge;

    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
  }
`

const fragment = /* glsl */ `
  precision highp float;

  uniform sampler2D tMap;
  uniform float uAlpha;
  uniform vec2 uMouse;
  uniform float uHover;

  varying vec2 vUv;

  void main() {
    // Chromatic aberration on hover
    float shift = uHover * 0.005;
    vec2 mouseDir = normalize(vUv - (uMouse * 0.5 + 0.5) + 0.001);

    float r = texture2D(tMap, vUv + mouseDir * shift).r;
    float g = texture2D(tMap, vUv).g;
    float b = texture2D(tMap, vUv - mouseDir * shift).b;

    gl_FragColor = vec4(r, g, b, uAlpha);
  }
`

export function createImagePlane(gl, { src, width = 2, height, segments = 32, strength = 0.08 } = {}) {
  const texture = new Texture(gl)

  const img = new Image()
  img.crossOrigin = 'anonymous'
  img.onload = () => {
    texture.image = img

    if (!height) {
      const aspect = img.naturalWidth / img.naturalHeight
      geometry.remove()
      const h = width / aspect
      const newGeo = new Plane(gl, { width, height: h, widthSegments: segments, heightSegments: segments })
      mesh.geometry = newGeo
    }
  }
  img.src = src

  const planeHeight = height || width * 0.625
  const geometry = new Plane(gl, { width, height: planeHeight, widthSegments: segments, heightSegments: segments })

  const program = new Program(gl, {
    vertex,
    fragment,
    transparent: true,
    uniforms: {
      tMap: { value: texture },
      uTime: { value: 0 },
      uStrength: { value: strength },
      uAlpha: { value: 1 },
      uMouse: { value: [0, 0] },
      uHover: { value: 0 },
    },
  })

  const mesh = new Mesh(gl, { geometry, program })

  function update(time) {
    program.uniforms.uTime.value = time
  }

  return { mesh, program, texture, update }
}
