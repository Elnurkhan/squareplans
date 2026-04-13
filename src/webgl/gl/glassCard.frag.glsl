precision highp float;

uniform sampler2D uTex;
uniform float uTime;
uniform float uAlpha;
uniform float uAspect;     // card width / height in pixels
uniform vec2 uResolution;  // canvas size in pixels

varying vec2 vUv;
varying float vFaceId;     // 0 = front, 1 = back, 2 = right, 3 = left, 4 = top, 5 = bottom
varying vec3 vNormalW;     // card-rotated normal

// ── SDF rounded rectangle ──
float sdfRoundBox(vec2 p, vec2 b, float r) {
  vec2 d = abs(p) - b + r;
  return length(max(d, 0.0)) - r;
}

// ── Hash-based noise ──
float hash(vec2 p) {
  vec3 p3 = fract(vec3(p.xyx) * 0.1031);
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.x + p3.y) * p3.z);
}

const float CORNER_R = 0.075; // UV-space radius, matches geometry R

void main() {
  // ── Side faces: extend the photo's edge along the depth, lit ──
  if (vFaceId > 0.5) {
    vec3 n = normalize(vNormalW);
    vec3 lightDir = normalize(vec3(0.35, -0.65, 0.7));
    float diff = max(dot(n, lightDir), 0.0);

    // Back face (faceId == 1) — mesh is already rounded
    if (vFaceId < 1.5) {
      vec3 base = vec3(0.08, 0.08, 0.09);
      gl_FragColor = vec4(base * (0.55 + 0.7 * diff), uAlpha);
      return;
    }

    // Side faces: sample the nearest edge pixel of the photo
    vec2 uvC = clamp(vUv, 0.002, 0.998);
    vec3 texCol = texture2D(uTex, uvC).rgb;
    texCol *= (0.30 + 0.40 * diff);
    gl_FragColor = vec4(texCol, uAlpha);
    return;
  }

  vec2 p = (vUv - 0.5) * 2.0 * vec2(uAspect, 1.0);
  vec2 halfSize = vec2(uAspect, 1.0);

  // ── 1. Mesh is a rounded-rect fan — no alpha clip needed ──
  float cAlpha = 1.0;

  // ── 2. Edge factor (p-space for fresnel/bevel effects) ──
  float d = sdfRoundBox(p, halfSize, CORNER_R * 2.0);
  float bevelWidth = 0.15;
  float edgeFactor = 1.0 - smoothstep(0.0, bevelWidth, -d);
  float fresnel = pow(edgeFactor, 2.0);

  // ── 3. Sample texture (no refraction) ──
  vec2 uv = vUv;

  // ── 5. Frosted blur — 13-tap Poisson, very subtle (front face is solid now) ──
  float blurRadius = 0.0015;
  vec2 blurScale = vec2(blurRadius / uAspect, blurRadius);

  // Chromatic aberration — radial from center
  vec2 caDir = normalize(vUv - 0.5 + 0.0001);
  float caStrength = fresnel * 0.004;
  vec2 caR = caDir * caStrength;
  vec2 caB = -caDir * caStrength;

  const int SAMPLES = 13;
  vec2 poisson[13];
  poisson[0]  = vec2( 0.0,       0.0);
  poisson[1]  = vec2( 0.527837, -0.085868);
  poisson[2]  = vec2(-0.040088,  0.536087);
  poisson[3]  = vec2(-0.670445, -0.179949);
  poisson[4]  = vec2( 0.109934, -0.634286);
  poisson[5]  = vec2( 0.339017,  0.341491);
  poisson[6]  = vec2(-0.355627,  0.259405);
  poisson[7]  = vec2( 0.735980,  0.361572);
  poisson[8]  = vec2(-0.284848, -0.485358);
  poisson[9]  = vec2( 0.066384,  0.877160);
  poisson[10] = vec2(-0.819232,  0.308676);
  poisson[11] = vec2( 0.491170, -0.588983);
  poisson[12] = vec2(-0.584052, -0.637672);

  // Temporal jitter — removes banding
  float angle = hash(gl_FragCoord.xy + fract(uTime * 0.1)) * 6.2831853;
  float ca = cos(angle), sa = sin(angle);
  mat2 jitter = mat2(ca, sa, -sa, ca);

  vec3 accum = vec3(0.0);
  for (int i = 0; i < 13; i++) {
    vec2 off = jitter * poisson[i] * blurScale;
    accum.r += texture2D(uTex, uv + off + caR).r;
    accum.g += texture2D(uTex, uv + off).g;
    accum.b += texture2D(uTex, uv + off + caB).b;
  }
  vec3 color = accum / float(SAMPLES);

  // ── 6. Glass tint ──
  vec3 tint = vec3(1.02, 1.0, 0.97);
  color = mix(color, color * tint, 0.08);

  // ── 7. Surface grain — film-like micro-texture ──
  float grain = hash(gl_FragCoord.xy * 0.7 + fract(uTime * 0.2) * 100.0);
  grain = (grain - 0.5) * 0.025;
  color += grain * mix(0.3, 1.0, fresnel);

  // ── 8. Directional lighting — soft top-left source ──
  float lightDir = (1.0 - vUv.x) * 0.3 + (1.0 - vUv.y) * 0.7;
  color *= mix(0.94, 1.05, lightDir);

  // ── 9. Bottom-right shadow — receding edge ──
  float shadowBR = smoothstep(0.0, 0.08, 1.0 - vUv.x) * smoothstep(0.0, 0.08, 1.0 - vUv.y);
  color *= mix(0.85, 1.0, shadowBR);

  // ── 10. Animated specular — two orbiting light spots ──
  vec2 lp1 = vec2(sin(uTime * 0.15), cos(uTime * 0.2)) * 0.35 + 0.5;
  vec2 lp2 = vec2(sin(uTime * -0.25 + 1.5), cos(uTime * 0.18 - 0.5)) * 0.35 + 0.5;
  float spec1 = smoothstep(0.45, 0.0, distance(vUv, lp1)) * 0.12;
  float spec2 = smoothstep(0.5, 0.0, distance(vUv, lp2)) * 0.07;
  color += vec3(1.0, 0.99, 0.96) * (spec1 + spec2);

  // ── 11. Contrast lift ──
  color = color * 0.93 + 0.035;

  // ── 12. Final composite ──
  gl_FragColor = vec4(color, cAlpha * uAlpha * 0.97);
}
