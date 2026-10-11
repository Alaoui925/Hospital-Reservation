import { ApiError, request, store, uid } from './api.js'

/** Read/query the department catalogue (specialties). */

function withCounts(departments) {
  const doctors = store.all('doctors')
  return departments.map((dep) => ({
    ...dep,
    doctorCount: doctors.filter((d) => d.departmentId === dep.id && d.status !== 'inactive')
      .length,
  }))
}

export async function getDepartments({ search } = {}) {
  return request(() => {
    let list = withCounts(store.all('departments'))
    if (search) {
      const q = search.toLowerCase()
      list = list.filter(
        (d) =>
          d.name.toLowerCase().includes(q) ||
          d.short.toLowerCase().includes(q) ||
          d.description.toLowerCase().includes(q),
      )
    }
    return list.sort((a, b) => a.name.localeCompare(b.name))
  })
}

export async function getDepartmentById(id) {
  return request(() => {
    const dep = store.findById('departments', id)
    if (!dep) throw new ApiError('Department not found.', { status: 404 })
    return withCounts([dep])[0]
  })
}

export async function getDepartmentBySlug(slug) {
  return request(() => {
    const dep = store.findBy('departments', (d) => d.slug === slug)
    if (!dep) throw new ApiError('Department not found.', { status: 404 })
    return withCounts([dep])[0]
  })
}

/** Doctors that belong to a department, sorted by rating. */
export async function getDepartmentDoctors(departmentId) {
  return request(() =>
    store
      .find('doctors', (d) => d.departmentId === departmentId)
      .sort((a, b) => b.rating - a.rating),
  )
}

export async function createDepartment(payload) {
  return request(() => {
    const slug = String(payload.name)
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
    const duplicate = store.findBy('departments', (d) => d.slug === slug)
    if (duplicate) {
      throw new ApiError('A department with this name already exists.', {
        status: 409,
        fields: { name: 'Already exists.' },
      })
    }
    return store.insert('departments', {
      id: uid('dep'),
      slug,
      icon: payload.icon || 'hospital',
      color: payload.color || '#0d9488',
      services: payload.services || [],
      headDoctorId: payload.headDoctorId || null,
      phone: payload.phone || '',
      floor: payload.floor || '',
      ...payload,
      name: String(payload.name).trim(),
    })
  })
}

export async function updateDepartment(id, patch) {
  return request(() => {
    const updated = store.update('departments', id, patch)
    if (!updated) throw new ApiError('Department not found.', { status: 404 })
    return updated
  })
}

export async function deleteDepartment(id) {
  return request(() => {
    const assigned = store.find('doctors', (d) => d.departmentId === id)
    if (assigned.length > 0) {
      throw new ApiError(
        `Cannot delete: ${assigned.length} doctor(s) are still assigned to this department.`,
        { status: 409 },
      )
    }
    store.remove('departments', id)
    return { success: true }
  })
}
