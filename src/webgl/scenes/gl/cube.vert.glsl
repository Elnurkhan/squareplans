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
