/**
 * GlassCardLayer — WebGL overlay that renders spread-phase cards
 * with a physically-inspired frosted glass fragment shader.
 *
 * Effects: Poisson-disc frosted blur (fresnel-driven), chromatic aberration,
 * glass refraction, surface noise grain, SDF rounded corners,
 * inner border glow, directional lighting, environment specular.
 */

import VERT from './gl/glassCard.vert.glsl?raw'
import FRAG from './gl/glassCard.frag.glsl?raw'

const DEG2RAD = Math.PI / 180

// ── Minimal 4×4 matrix helpers (column-major Float32Array[16]) ──

const _t = []
for (let i = 0; i < 10; i++) _t.push(new Float32Array(16))

// Card thickness in world (CSS) pixels — tweak freely
const CARD_THICKNESS = 9

function ident(o) { o.fill(0); o[0] = o[5] = o[10] = o[15] = 1; return o }

function mul(a, b, o) {
  for (let i = 0; i < 4; i++)
    for (let j = 0; j < 4; j++)
      o[j * 4 + i] =
        a[i] * b[j * 4] + a[4 + i] * b[j * 4 + 1] +
        a[8 + i] * b[j * 4 + 2] + a[12 + i] * b[j * 4 + 3]
  return o
}

function mat4Translate(o, x, y, z) {
  ident(o); o[12] = x; o[13] = y; o[14] = z; return o
}

function mat4Scale(o, sx, sy, sz) {
  o.fill(0); o[0] = sx; o[5] = sy; o[10] = sz; o[15] = 1; return o
}

function mat4RotX(o, r) {
  ident(o); const c = Math.cos(r), s = Math.sin(r)
  o[5] = c; o[6] = s; o[9] = -s; o[10] = c; return o
}

function mat4RotY(o, r) {
  ident(o); const c = Math.cos(r), s = Math.sin(r)
  o[0] = c; o[2] = -s; o[8] = s; o[10] = c; return o
}

function mat4RotZ(o, r) {
  ident(o); const c = Math.cos(r), s = Math.sin(r)
  o[0] = c; o[1] = s; o[4] = -s; o[5] = c; return o
}

function mat4Ortho(o, l, r, b, t, n, f) {
  o.fill(0)
  o[0] = 2 / (r - l)
  o[5] = 2 / (t - b)
  o[10] = -2 / (f - n)
  o[12] = -(r + l) / (r - l)
  o[13] = -(t + b) / (t - b)
  o[14] = -(f + n) / (f - n)
  o[15] = 1
  return o
}

/** CSS perspective(d) matrix — adds W = 1 - z/d for foreshortening */
function mat4CSSPersp(o, d) {
  ident(o); o[11] = -1 / d; return o
}

// ── GlassCardLayer ──────────────────────────────────────────────

export class GlassCardLayer {
  constructor() {
    this.canvas = document.createElement('canvas')
    this.canvas.className = 'gl-card-layer'
    this.canvas.style.cssText =
      'position:absolute;inset:0;width:100%;height:100%;pointer-events:none;z-index:2'

    const gl = this.canvas.getContext('webgl', {
      alpha: true,
      premultipliedAlpha: false,
      antialias: true,
      depth: true,
    })
    if (!gl) { this.gl = null; return }
    this.gl = gl

    this._prog = null
    this._loc = {}
    this._boxBuf = null
    this._boxIdx = null
    this._texMap = new Map()
    this._loading = new Set()
    this._proj = new Float32Array(16)
    this._mvp = new Float32Array(16)
    this._time = 0
    this._dpr = Math.min(window.devicePixelRatio || 1, 2)
    this._w = 0
    this._h = 0

    this._initShaders()
    this._initBox()
    gl.clearColor(0, 0, 0, 0)
    gl.enable(gl.BLEND)
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA)
    gl.enable(gl.DEPTH_TEST)
    gl.depthFunc(gl.LEQUAL)
  }

  /* ── shader setup ── */

  _compileShader(type, src) {
    const gl = this.gl
    const s = gl.createShader(type)
    gl.shaderSource(s, src)
    gl.compileShader(s)
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS))
      console.error('GL shader:', gl.getShaderInfoLog(s))
    return s
  }

  _initShaders() {
    const gl = this.gl
    const vs = this._compileShader(gl.VERTEX_SHADER, VERT)
    const fs = this._compileShader(gl.FRAGMENT_SHADER, FRAG)
    const prog = gl.createProgram()
    gl.attachShader(prog, vs)
    gl.attachShader(prog, fs)
    gl.linkProgram(prog)
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
      console.error('GL link:', gl.getProgramInfoLog(prog))
      return
    }
    this._prog = prog
    this._loc = {
      aPos:        gl.getAttribLocation(prog, 'aPos'),
      aUV:         gl.getAttribLocation(prog, 'aUV'),
      aNormal:     gl.getAttribLocation(prog, 'aNormal'),
      aFaceId:     gl.getAttribLocation(prog, 'aFaceId'),
      uMVP:        gl.getUniformLocation(prog, 'uMVP'),
      uNormalMat:  gl.getUniformLocation(prog, 'uNormalMat'),
      uTex:        gl.getUniformLocation(prog, 'uTex'),
      uTime:       gl.getUniformLocation(prog, 'uTime'),
      uAlpha:      gl.getUniformLocation(prog, 'uAlpha'),
      uAspect:     gl.getUniformLocation(prog, 'uAspect'),
      uResolution: gl.getUniformLocation(prog, 'uResolution'),
    }
  }

  _initBox() {
    const gl = this.gl
    // Rounded box: front/back are fan-meshed rounded rects (no SDF clip needed),
    // side strip follows the same perimeter. No depth conflicts at edges.
    // Per-vertex: pos(3) uv(2) normal(3) faceId(1) = 9 floats, stride 36.
    const R = 0.075   // corner radius in local coords
    const NC = 8      // segments per quarter-circle

    // ── Perimeter points (clockwise: TR → BR → BL → TL) ──
    const perim = []
    function addCorner(cx, cy, startAngle) {
      for (let i = 0; i <= NC; i++) {
        const a = startAngle + (i / NC) * (Math.PI / 2)
        perim.push({ x: cx + R * Math.cos(a), y: cy + R * Math.sin(a),
                      nx: Math.cos(a), ny: Math.sin(a) })
      }
    }
    addCorner( 0.5 - R, -0.5 + R, -Math.PI / 2)
    addCorner( 0.5 - R,  0.5 - R,  0)
    addCorner(-0.5 + R,  0.5 - R,  Math.PI / 2)
    addCorner(-0.5 + R, -0.5 + R,  Math.PI)

    const P = perim.length // 4*(NC+1) = 36

    // Vertex layout:
    //   Front fan:  [0] center + [1..P] perimeter          (P+1 verts, faceId=0)
    //   Back fan:   [P+1] center + [P+2..2P+1] perimeter   (P+1 verts, faceId=1)
    //   Side strip: [2P+2 .. 2P+2+2P-1]                    (2P verts,  faceId=2)
    const FB = P + 1
    const SB = 2 * (P + 1)
    const totalVerts = 2 * (P + 1) + 2 * P
    const data = new Float32Array(totalVerts * 9)
    let vi = 0
    function v(x, y, z, u, vv, nx, ny, nz, fid) {
      data[vi++] = x; data[vi++] = y; data[vi++] = z
      data[vi++] = u; data[vi++] = vv
      data[vi++] = nx; data[vi++] = ny; data[vi++] = nz
      data[vi++] = fid
    }

    // ── Front face fan (faceId 0) ──
    v(0, 0, 0.5,  0.5, 0.5,  0, 0, 1, 0) // center
    for (let i = 0; i < P; i++) {
      const { x, y } = perim[i]
      v(x, y, 0.5,  x + 0.5, y + 0.5,  0, 0, 1, 0)
    }

    // ── Back face fan (faceId 1, mirrored UVs) ──
    v(0, 0, -0.5,  0.5, 0.5,  0, 0, -1, 1) // center
    for (let i = 0; i < P; i++) {
      const { x, y } = perim[i]
      v(x, y, -0.5,  0.5 - x, y + 0.5,  0, 0, -1, 1)
    }

    // ── Side strip (faceId 2) ──
    for (let i = 0; i < P; i++) {
      const { x, y, nx, ny } = perim[i]
      const u = x + 0.5, uv = y + 0.5
      v(x, y,  0.5, u, uv, nx, ny, 0, 2)
      v(x, y, -0.5, u, uv, nx, ny, 0, 2)
    }

    // ── Indices ──
    const totalIdx = P * 3 + P * 3 + P * 6 // front fan + back fan + side quads
    const idx = new Uint16Array(totalIdx)
    let ii = 0

    // Front fan (CCW from +z)
    for (let i = 0; i < P; i++) {
      idx[ii++] = 0;  idx[ii++] = 1 + i;  idx[ii++] = 1 + (i + 1) % P
    }
    // Back fan (CW from -z = CCW when viewed from behind)
    for (let i = 0; i < P; i++) {
      idx[ii++] = FB;  idx[ii++] = FB + 1 + (i + 1) % P;  idx[ii++] = FB + 1 + i
    }
    // Side strip — closed-loop quads
    for (let i = 0; i < P; i++) {
      const n = (i + 1) % P
      const a = SB + i * 2, b = SB + i * 2 + 1
      const c = SB + n * 2, d = SB + n * 2 + 1
      idx[ii++] = a; idx[ii++] = c; idx[ii++] = b
      idx[ii++] = c; idx[ii++] = d; idx[ii++] = b
    }

    this._indexCount = totalIdx
    this._boxBuf = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, this._boxBuf)
    gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW)
    this._boxIdx = gl.createBuffer()
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this._boxIdx)
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, idx, gl.STATIC_DRAW)
  }

  /* ── lifecycle ── */

  mount(parent) {
    parent.appendChild(this.canvas)
    this.resize()
  }

  resize() {
    const p = this.canvas.parentElement
    if (!p) return
    const w = p.clientWidth, h = p.clientHeight
    if (w === this._w && h === this._h) return
    this._w = w; this._h = h
    this.canvas.width = w * this._dpr
    this.canvas.height = h * this._dpr
    // Ortho: Y-down (matching CSS convention)
    mat4Ortho(this._proj, -w / 2, w / 2, h / 2, -h / 2, -3000, 3000)
  }

  /* ── textures ── */

  /** Load a texture via a fresh Image with CORS (avoids tainting the canvas). */
  loadTexture(index, url) {
    if (this._texMap.has(index) || this._loading.has(index)) return
    this._loading.add(index)
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      const gl = this.gl
      const tex = gl.createTexture()
      gl.bindTexture(gl.TEXTURE_2D, tex)
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
      this._texMap.set(index, tex)
      this._loading.delete(index)
    }
    img.onerror = () => {
      console.warn(`[GlassCardLayer] image failed to load: ${url}`)
      this._loading.delete(index)
    }
    img.src = url
  }

  /* ── render ── */

  clear() {
    if (!this.gl) return
    const gl = this.gl
    gl.viewport(0, 0, this.canvas.width, this.canvas.height)
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)
  }

  /**
   * Render glass cards.
   * @param {Array} cards — [{ x, y, z, rx, ry, r, s, wx, o, index }]
   * @param {number} dt   — frame delta in seconds
   * @param {number} cw   — base card CSS width  (50 / 40 / 32)
   * @param {number} ch   — base card CSS height (72 / 58 / 46)
   */
  render(cards, dt, cw, ch) {
    if (!this.gl || !this._prog) return
    this._time += dt
    const gl = this.gl

    gl.viewport(0, 0, this.canvas.width, this.canvas.height)
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)
    gl.useProgram(this._prog)

    // Bind shared box geometry (pos[3] uv[2] normal[3] faceId[1] = 9 floats, stride 36)
    gl.bindBuffer(gl.ARRAY_BUFFER, this._boxBuf)
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this._boxIdx)
    const stride = 36
    gl.enableVertexAttribArray(this._loc.aPos)
    gl.vertexAttribPointer(this._loc.aPos, 3, gl.FLOAT, false, stride, 0)
    gl.enableVertexAttribArray(this._loc.aUV)
    gl.vertexAttribPointer(this._loc.aUV, 2, gl.FLOAT, false, stride, 12)
    gl.enableVertexAttribArray(this._loc.aNormal)
    gl.vertexAttribPointer(this._loc.aNormal, 3, gl.FLOAT, false, stride, 20)
    gl.enableVertexAttribArray(this._loc.aFaceId)
    gl.vertexAttribPointer(this._loc.aFaceId, 1, gl.FLOAT, false, stride, 32)

    gl.uniform1f(this._loc.uTime, this._time)
    gl.uniform2f(this._loc.uResolution, this.canvas.width, this.canvas.height)
    gl.uniform1i(this._loc.uTex, 0)
    gl.activeTexture(gl.TEXTURE0)

    for (const c of cards) {
      if (c.o < 0.01) continue
      const tex = this._texMap.get(c.index)
      if (!tex) continue

      const w = cw * c.s * c.wx
      const h = ch * c.s

      // Build rotation matrix R = Rx · Ry · Rz  →  _t[3] (reused as uNormalMat)
      mat4RotZ(_t[0], c.r * DEG2RAD)
      mat4RotY(_t[1], c.ry * DEG2RAD)
      mul(_t[1], _t[0], _t[2])            // Ry · Rz
      mat4RotX(_t[0], c.rx * DEG2RAD)
      mul(_t[0], _t[2], _t[3])            // R  →  _t[3]

      // S = scale(w, h, thickness)  →  _t[4]
      mat4Scale(_t[4], w, h, CARD_THICKNESS)

      // R · S  →  _t[5]
      mul(_t[3], _t[4], _t[5])

      // Persp · (R · S)  →  _t[6]
      mat4CSSPersp(_t[0], 1500)
      mul(_t[0], _t[5], _t[6])

      // T_world · Persp · R · S  →  _t[7]
      mat4Translate(_t[0], c.x, c.y, c.z)
      mul(_t[0], _t[6], _t[7])

      // proj · …  →  _mvp
      mul(this._proj, _t[7], this._mvp)

      gl.uniformMatrix4fv(this._loc.uMVP, false, this._mvp)
      gl.uniformMatrix4fv(this._loc.uNormalMat, false, _t[3])
      gl.uniform1f(this._loc.uAspect, w / h)
      gl.uniform1f(this._loc.uAlpha, c.o)
      gl.bindTexture(gl.TEXTURE_2D, tex)
      gl.drawElements(gl.TRIANGLES, this._indexCount, gl.UNSIGNED_SHORT, 0)
    }
  }

  /* ── cleanup ── */

  destroy() {
    const gl = this.gl
    if (!gl) return
    for (const tex of this._texMap.values()) gl.deleteTexture(tex)
    this._texMap.clear()
    if (this._boxBuf) gl.deleteBuffer(this._boxBuf)
    if (this._boxIdx) gl.deleteBuffer(this._boxIdx)
    if (this._prog) gl.deleteProgram(this._prog)
    this.canvas.remove()
  }
}
