attribute vec3 aPos;
attribute vec2 aUV;
attribute vec3 aNormal;
attribute float aFaceId;

uniform mat4 uMVP;
uniform mat4 uNormalMat; // card rotation only (Rx·Ry·Rz)

varying vec2 vUv;
varying float vFaceId;
varying vec3 vNormalW;

void main() {
  vUv = aUV;
  vFaceId = aFaceId;
  vNormalW = (uNormalMat * vec4(aNormal, 0.0)).xyz;
  gl_Position = uMVP * vec4(aPos, 1.0);
}
