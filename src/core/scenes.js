/**
 * SceneManager — index-based WebGL scene switching with lazy loading.
 *
 * Scenes can be registered as:
 *   - A class:              mgr.add('hero', CubeScene)
 *   - A dynamic import:     mgr.add('hero', () => import('@/webgl/scenes/CubeScene'))
 *
 * For dynamic imports, the module must export the scene class as `default`
 * or as the first named export.
 */
export class SceneManager {
  constructor(gl, root, camera) {
    this.gl = gl
    this.root = root
    this.camera = camera
    this._entries = []
    this._activeIndex = -1
    this._active = null
    this._loading = false
  }

  /**
   * Register a scene.
   * @param {string} id
   * @param {Function} source — a class, or () => import('...')
   */
  add(id, source) {
    const isLazy = typeof source === 'function' && !source.prototype
    this._entries.push({
      id,
      instance: null,
      resolved: isLazy ? null : source,
      loader: isLazy ? source : null,
    })
    return this
  }

  get activeIndex() {
    return this._activeIndex
  }

  get activeId() {
    return this._active?.id ?? null
  }

  /** Resolve a lazy import to a scene class. */
  async _resolve(entry) {
    if (entry.resolved) return entry.resolved

    let mod
    try {
      mod = await entry.loader()
    } catch (err) {
      console.error(`[SceneManager] failed to load scene "${entry.id}":`, err)
      throw err
    }
    // Support `export default` or first named export
    const resolved = mod.default || Object.values(mod)[0]
    if (!resolved) {
      throw new Error(`[SceneManager] scene "${entry.id}" module has no default/named export`)
    }
    entry.resolved = resolved
    entry.loader = null
    return entry.resolved
  }

  /** Switch to a scene by index. Handles async loading transparently. */
  async setScene(index) {
    if (index === this._activeIndex) return
    if (index < 0 || index >= this._entries.length) return

    this._loading = true

    // Tear down current scene
    if (this._active?.instance) {
      this._active.instance.destroy()
      this._active.instance = null
    }

    const entry = this._entries[index]
    let SceneClass
    try {
      SceneClass = await this._resolve(entry)
    } catch {
      this._loading = false
      return
    }

    // Guard: another setScene call may have fired while we awaited
    if (this._activeIndex === index) {
      this._loading = false
      return
    }

    const instance = new SceneClass()
    entry.instance = instance
    instance.init(this.gl, this.root, this.camera)

    this._activeIndex = index
    this._active = entry
    this._loading = false
  }

  /** Update the active scene with local 0–1 progress and pointer. */
  update(progress, dt, pointer) {
    if (!this._active?.instance || this._loading) return

    const instance = this._active.instance

    if (instance.tl) {
      instance.tl.progress(progress)
    }

    instance.update(progress, dt, pointer)
  }

  destroy() {
    if (this._active?.instance) {
      this._active.instance.destroy()
      this._active.instance = null
    }
    this._active = null
    this._activeIndex = -1
    this._entries.length = 0
  }
}
