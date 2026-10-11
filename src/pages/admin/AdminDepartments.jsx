import { useCallback, useEffect, useState } from 'react'
import Button from '../../components/common/Button.jsx'
import ConfirmDialog from '../../components/common/ConfirmDialog.jsx'
import EmptyState from '../../components/common/EmptyState.jsx'
import Input from '../../components/common/Input.jsx'
import Loader from '../../components/common/Loader.jsx'
import Modal from '../../components/common/Modal.jsx'
import Select from '../../components/common/Select.jsx'
import DashboardHeader from '../../components/dashboard/DashboardHeader.jsx'
import { Icon } from '../../components/common/Icon.jsx'
import { useToast } from '../../context/NotificationContext.jsx'
import * as departmentService from '../../services/departmentService.js'
import * as doctorService from '../../services/doctorService.js'
import { DEPARTMENT_ICONS } from '../../utils/constants.js'
import { validateDepartment } from '../../utils/validation.js'

/** Old emoji values that may still live in seeded data. */
const LEGACY_ICONS = {
  '❤️': 'heartbeat',
  '🧸': 'baby',
  '✨': 'sparkle',
  '🧠': 'brain',
  '🦴': 'bone',
  '🦷': 'tooth',
  '👁️': 'eye',
  '🩺': 'stethoscope',
  '🏥': 'hospital',
}
const normalizeIcon = (icon) => LEGACY_ICONS[icon] || icon || 'hospital'

const pickDepartment = (dep) => ({
  name: dep?.name || '',
  short: dep?.short || '',
  description: dep?.description || '',
  icon: normalizeIcon(dep?.icon),
  color: dep?.color || '#0d9488',
  floor: dep?.floor || '',
  phone: dep?.phone || '',
  services: (dep?.services || []).join(', '),
  headDoctorId: dep?.headDoctorId || '',
})

export default function AdminDepartments() {
  const toast = useToast()
  const [departments, setDepartments] = useState([])
  const [doctors, setDoctors] = useState([])
  const [loading, setLoading] = useState(true)

  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [values, setValues] = useState(pickDepartment())
  const [errors, setErrors] = useState({})
  const [saving, setSaving] = useState(false)
  const [toDelete, setToDelete] = useState(null)
  const [deleting, setDeleting] = useState(false)

  const load = useCallback(async () => {
    const [list, doctorList] = await Promise.all([
      departmentService.getDepartments(),
      doctorService.getDoctors({ perPage: 200 }),
    ])
    setDepartments(list)
    setDoctors(doctorList.items)
  }, [])

  useEffect(() => {
    let active = true
    load()
      .catch(() => {})
      .finally(() => active && setLoading(false))
    return () => {
      active = false
    }
  }, [load])

  const openCreate = () => {
    setEditing(null)
    setValues(pickDepartment())
    setErrors({})
    setFormOpen(true)
  }

  const openEdit = (dep) => {
    setEditing(dep)
    setValues(pickDepartment(dep))
    setErrors({})
    setFormOpen(true)
  }

  const setField = (key) => (event) =>
    setValues((prev) => ({ ...prev, [key]: event.target.value }))

  const handleSubmit = async () => {
    const result = validateDepartment(values)
    setErrors(result.errors)
    if (!result.valid) return

    const payload = {
      ...values,
      services: values.services
        .split(',')
        .map((service) => service.trim())
        .filter(Boolean),
      headDoctorId: values.headDoctorId || null,
    }
    setSaving(true)
    try {
      if (editing) {
        await departmentService.updateDepartment(editing.id, payload)
        toast.success('Department updated', `${values.name} has been saved.`)
      } else {
        await departmentService.createDepartment(payload)
        toast.success('Department added', `${values.name} is now in the catalogue.`)
      }
      setFormOpen(false)
      await load()
    } catch (error) {
      toast.error('Could not save', error.message)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!toDelete) return
    setDeleting(true)
    try {
      await departmentService.deleteDepartment(toDelete.id)
      toast.success('Department removed', `${toDelete.name} was deleted.`)
      setToDelete(null)
      await load()
    } catch (error) {
      toast.error('Could not delete', error.message)
    } finally {
      setDeleting(false)
    }
  }

  if (loading) return <Loader label="Loading departments…" />

  return (
    <>
      <DashboardHeader
        title="Departments"
        subtitle="The specialty catalogue patients browse before booking."
        actions={
          <Button icon="plus" onClick={openCreate}>
            Add department
          </Button>
        }
      />

      {departments.length === 0 ? (
        <EmptyState
          icon="building"
          title="No departments yet"
          description="Add your first department to start assigning doctors to it."
          actionLabel="Add department"
          actionIcon="plus"
          onAction={openCreate}
        />
      ) : (
        <div className="grid grid-3" style={{ gap: 18 }}>
          {departments.map((dep) => (
            <div key={dep.id} className="card" style={{ borderTop: `3px solid ${dep.color}` }}>
              <div className="card-body">
                <div className="row-between" style={{ alignItems: 'flex-start' }}>
                  <Icon name={dep.icon} size={30} />
                  <span className="badge badge-brand">{dep.doctorCount} doctor{dep.doctorCount === 1 ? '' : 's'}</span>
                </div>
                <h3 className="mb-1" style={{ fontSize: 'var(--text-xl)' }}>
                  {dep.name}
                </h3>
                <p className="text-sm text-muted mt-0 mb-2">{dep.short}</p>
                <p className="text-sm text-muted mb-2" style={{ marginBottom: 12 }}>
                  {dep.description.length > 110
                    ? `${dep.description.slice(0, 110).trimEnd()}…`
                    : dep.description}
                </p>
                <div className="text-xs text-muted stack-sm" style={{ gap: 6 }}>
                  {dep.floor && (
                    <span className="row" style={{ gap: 6 }}>
                      <Icon name="map-pin" size={13} /> {dep.floor}
                    </span>
                  )}
                  {dep.phone && (
                    <span className="row" style={{ gap: 6 }}>
                      <Icon name="phone" size={13} /> {dep.phone}
                    </span>
                  )}
                </div>
                <div className="row-wrap mt-2" style={{ gap: 8 }}>
                  <Button size="sm" variant="secondary" icon="edit" onClick={() => openEdit(dep)}>
                    Edit
                  </Button>
                  <Button size="sm" variant="ghost" icon="trash" onClick={() => setToDelete(dep)}>
                    Delete
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        title={editing ? `Edit ${editing.name}` : 'Add a department'}
        size="lg"
        footer={
          <>
            <Button variant="secondary" onClick={() => setFormOpen(false)} disabled={saving}>
              Cancel
            </Button>
            <Button icon="check" onClick={handleSubmit} loading={saving}>
              {editing ? 'Save changes' : 'Create department'}
            </Button>
          </>
        }
      >
        <form onSubmit={(event) => event.preventDefault()} noValidate>
          <div className="form-grid">
            <Input
              label="Name"
              name="dept-name"
              required
              placeholder="e.g. Cardiology"
              value={values.name}
              onChange={setField('name')}
              error={errors.name}
            />
            <Input
              label="Short tagline"
              name="dept-short"
              placeholder="e.g. Heart & vascular care"
              value={values.short}
              onChange={setField('short')}
            />
          </div>
          <Input
            label="Description"
            name="dept-description"
            as="textarea"
            required
            rows={3}
            value={values.description}
            onChange={setField('description')}
            error={errors.description}
          />
          <div className="form-grid">
            <Select
              label="Icon"
              name="dept-icon"
              options={DEPARTMENT_ICONS}
              value={values.icon}
              onChange={setField('icon')}
            />
            <Input
              label="Accent colour"
              name="dept-color"
              type="color"
              value={values.color}
              onChange={setField('color')}
            />
          </div>
          <div className="form-grid">
            <Input
              label="Floor / location"
              name="dept-floor"
              placeholder="e.g. Building A · Floor 3"
              value={values.floor}
              onChange={setField('floor')}
            />
            <Input
              label="Phone"
              name="dept-phone"
              placeholder="+1 (555) 010-2100"
              value={values.phone}
              onChange={setField('phone')}
            />
          </div>
          <div className="form-grid">
            <Select
              label="Department head"
              name="dept-head"
              placeholder="None"
              options={doctors
                .filter((doc) => !editing || doc.departmentId === editing.id || doc.id === values.headDoctorId)
                .map((doc) => ({
                  value: doc.id,
                  label: `${doc.title} ${doc.name}`,
                }))}
              value={values.headDoctorId}
              onChange={setField('headDoctorId')}
            />
            <Input
              label="Core services (comma separated)"
              name="dept-services"
              placeholder="ECG, Stress testing, Cardiac rehab"
              value={values.services}
              onChange={setField('services')}
            />
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={Boolean(toDelete)}
        onCancel={() => setToDelete(null)}
        onConfirm={handleDelete}
        title={`Delete ${toDelete?.name}?`}
        description="You can only delete a department that has no doctors assigned to it."
        confirmLabel="Delete department"
        loading={deleting}
      />
    </>
  )
}