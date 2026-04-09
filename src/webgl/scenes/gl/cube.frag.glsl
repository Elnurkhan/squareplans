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
