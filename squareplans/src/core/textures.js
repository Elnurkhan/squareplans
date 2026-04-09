import { Texture } from 'ogl'

/**
 * TextureLoader — compressed texture support with KTX2 + fallback.
 *
 * Probes available compressed texture extensions on init,
 * then picks the best format when loading.
 *
 * Usage:
 *   const loader = new TextureLoader(gl)
 *   const tex = await loader.load({
 *     ktx2: '/textures/hero.ktx2',
 *     fallback: '/textures/hero.jpg',
 *   })
 */
export class TextureLoader {
  constructor(gl) {
    this.gl = gl
    this._cache = new Map()
    this._extensions = this._probeExtensions()
  }

  _probeExtensions() {
    const gl = this.gl
    return {
      s3tc: gl.getExtension('WEBGL_compressed_texture_s3tc'),
      etc: gl.getExtension('WEBGL_compressed_texture_etc1'),
      etc2: gl.getExtension('WEBGL_compressed_texture_etc'),
      astc: gl.getExtension('WEBGL_compressed_texture_astc'),
      pvrtc: gl.getExtension('WEBGL_compressed_texture_pvrtc'),
    }
  }

  /** Map KTX2 vkFormat to a GL compressed format constant. */
  _resolveFormat(vkFormat) {
    // Common Vulkan format codes → WebGL compressed format
    const { s3tc, etc2, astc } = this._extensions

    if (s3tc) {
      if (vkFormat === 131) return s3tc.COMPRESSED_RGB_S3TC_DXT1_EXT
      if (vkFormat === 132) return s3tc.COMPRESSED_RGBA_S3TC_DXT1_EXT
      if (vkFormat === 133) return s3tc.COMPRESSED_RGBA_S3TC_DXT3_EXT
      if (vkFormat === 135) return s3tc.COMPRESSED_RGBA_S3TC_DXT5_EXT
    }

    if (etc2) {
      if (vkFormat === 147) return etc2.COMPRESSED_RGB8_ETC2
      if (vkFormat === 148) return etc2.COMPRESSED_SRGB8_ETC2
      if (vkFormat === 151) return etc2.COMPRESSED_RGBA8_ETC2_EAC
    }

    if (astc) {
      if (vkFormat === 157) return astc.COMPRESSED_RGBA_ASTC_4x4_KHR
      if (vkFormat === 159) return astc.COMPRESSED_RGBA_ASTC_6x6_KHR
      if (vkFormat === 161) return astc.COMPRESSED_RGBA_ASTC_8x8_KHR
    }

    return null
  }

  get supportsCompressed() {
    const e = this._extensions
    return !!(e.s3tc || e.etc || e.etc2 || e.astc)
  }

  /**
   * Load a texture. Tries KTX2 first if supported, falls back to image.
   * Results are cached by URL.
   */
  async load({ ktx2, fallback, ...textureOpts }) {
    const src = ktx2 && this.supportsCompressed ? ktx2 : fallback
    if (!src) throw new Error('TextureLoader: no valid source provided')

    if (this._cache.has(src)) return this._cache.get(src)

    const texture = new Texture(this.gl, textureOpts)

    if (src === ktx2) {
      await this._loadKTX2(texture, src)
    } else {
      await this._loadImage(texture, src)
    }

    this._cache.set(src, texture)
    return texture
  }

  async _loadKTX2(texture, url) {
    // Lazy-load ktx-parse only when KTX2 is actually needed
    const { read: readKTX2 } = await import('ktx-parse')
    const response = await fetch(url)
    const buffer = await response.arrayBuffer()
    const ktx = readKTX2(new Uint8Array(buffer))

    const glFormat = this._resolveFormat(ktx.vkFormat)
    if (!glFormat) {
      throw new Error(`TextureLoader: unsupported KTX2 vkFormat ${ktx.vkFormat}`)
    }

    const level = ktx.levels[0]
    const { pixelWidth, pixelHeight } = ktx

    const gl = this.gl
    gl.bindTexture(gl.TEXTURE_2D, texture.texture)
    gl.compressedTexImage2D(
      gl.TEXTURE_2D,
      0,
      glFormat,
      pixelWidth,
      pixelHeight,
      0,
      level.levelData,
    )

    // Upload additional mip levels if present
    for (let i = 1; i < ktx.levels.length; i++) {
      const mip = ktx.levels[i]
      const w = Math.max(1, pixelWidth >> i)
      const h = Math.max(1, pixelHeight >> i)
      gl.compressedTexImage2D(gl.TEXTURE_2D, i, glFormat, w, h, 0, mip.levelData)
    }

    if (ktx.levels.length > 1) {
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR)
    }

    texture.width = pixelWidth
    texture.height = pixelHeight
  }

  async _loadImage(texture, url) {
    return new Promise((resolve, reject) => {
      const img = new Image()
      img.crossOrigin = 'anonymous'
      img.onload = () => {
        texture.image = img
        resolve()
      }
      img.onerror = reject
      img.src = url
    })
  }

  dispose() {
    this._cache.clear()
  }
}
