import { Geometry, Mesh, Program } from 'ogl'

/**
 * Create an instanced mesh — renders many copies in a single draw call.
 *
 * Usage:
 *   const { mesh, update } = createInstancedMesh(gl, {
 *     geometry: baseGeometry,
 *     vertex: shaderSource,
 *     fragment: shaderSource,
 *     count: 100,
 *     attributes: {
 *       aOffset:   { size: 3 },    // vec3 per instance
 *       aScale:    { size: 1 },    // float per instance
 *       aRotation: { size: 3 },    // vec3 per instance
 *     },
 *   })
 *
 *   // Write per-instance data
 *   const offsets = mesh.geometry.attributes.aOffset.data
 *   offsets[i * 3 + 0] = x
 *   ...
 *   update('aOffset')
 */
export function createInstancedMesh(gl, {
  geometry: baseGeometry,
  vertex,
  fragment,
  count,
  attributes = {},
  uniforms = {},
  transparent = false,
}) {
  // Build combined attribute list: base geometry + instanced
  const geometryAttrs = {}

  // Copy base geometry attributes
  for (const [key, attr] of Object.entries(baseGeometry.attributes)) {
    geometryAttrs[key] = { ...attr }
  }

  // Add instanced attributes
  for (const [key, { size }] of Object.entries(attributes)) {
    const data = new Float32Array(count * size)
    geometryAttrs[key] = { size, instanced: 1, data }
  }

  const instancedGeometry = new Geometry(gl, geometryAttrs)

  const program = new Program(gl, {
    vertex,
    fragment,
    uniforms,
    transparent,
  })

  const mesh = new Mesh(gl, { geometry: instancedGeometry, program })
  mesh.instancedCount = count

  function update(attrName) {
    const attr = instancedGeometry.attributes[attrName]
    if (attr) attr.needsUpdate = true
  }

  function updateAll() {
    for (const key of Object.keys(attributes)) {
      update(key)
    }
  }

  return { mesh, program, update, updateAll }
}
