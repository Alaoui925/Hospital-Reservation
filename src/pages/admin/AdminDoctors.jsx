import { useCallback, useEffect, useState } from 'react'
import Avatar from '../../components/common/Avatar.jsx'
import Button from '../../components/common/Button.jsx'
import ConfirmDialog from '../../components/common/ConfirmDialog.jsx'
import Input from '../../components/common/Input.jsx'
import Loader from '../../components/common/Loader.jsx'
import Select from '../../components/common/Select.jsx'
import { Icon } from '../../components/common/Icon.jsx'
import DoctorFormModal from '../../components/doctors/DoctorFormModal.jsx'
import DashboardHeader from '../../components/dashboard/DashboardHeader.jsx'
import { useToast } from '../../context/NotificationContext.jsx'
import * as departmentService from '../../services/departmentService.js'
import * as doctorService from '../../services/doctorService.js'
import { formatCurrency } from '../../utils/formatDate.js'

export default function AdminDoctors() {
  const toast = useToast()
  const [list, setList] = useState([])
  const [departments, setDepartments] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [departmentId, setDepartmentId] = useState('all')

  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [saving, setSaving] = useState(false)
  const [toDelete, setToDelete] = useState(null)
  const [deleting, setDeleting] = useState(false)

  const load = useCallback(async () => {
    const [doctors, departmentsResult] = await Promise.all([
      doctorService.getDoctors({ perPage: 200, departmentId }),
      departmentService.getDepartments(),
    ])
    setList(doctors.items)
    setDepartments(departmentsResult)
    return doctors
  }, [departmentId])

  useEffect(() => {
    let active = true
    load()
      .catch(() => {})
      .finally(() => active && setLoading(false))
    return () => {
      active = false
    }
  }, [load])

  const filtered = search
    ? list.filter(
        (d) =>
          d.name.toLowerCase().includes(search.toLowerCase()) ||
          d.email.toLowerCase().includes(search.toLowerCase()) ||
          d.specialty.toLowerCase().includes(search.toLowerCase()),
      )
    : list

  const openCreate = () => {
    setEditing(null)
    setFormOpen(true)
  }

  const openEdit = (doctor) => {
    setEditing(doctor)
    setFormOpen(true)
  }

  const handleSubmit = async (payload) => {
    setSaving(true)
    try {
      if (editing) {
        await doctorService.updateDoctor(editing.id, payload)
        toast.success('Doctor updated', `${payload.name}'s record has been saved.`)
      } else {
        await doctorService.createDoctor(payload)
        toast.success('Doctor added', `${payload.name} can now sign in and receive bookings.`)
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
      await doctorService.deleteDoctor(toDelete.id)
      toast.success('Doctor removed', 'Their future appointments were cancelled.')
      setToDelete(null)
      await load()
    } catch (error) {
      toast.error('Could not delete', error.message)
    } finally {
      setDeleting(false)
    }
  }

  if (loading) return <Loader label="Loading doctor records…" />

  return (
    <>
      <DashboardHeader
        title="Manage doctors"
        subtitle="Add, edit and retire the medical staff shown to patients."
        actions={
          <Button icon="plus" onClick={openCreate}>
            Add doctor
          </Button>
        }
      />

      <div className="filters-bar" style={{ gridTemplateColumns: '1.5fr 1fr auto' }}>
        <Input
          label="Search"
          name="admin-doctor-search"
          icon="search"
          placeholder="Name, email or specialty"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
        <Select
          label="Department"
          name="admin-doctor-department"
          options={[
            { value: 'all', label: 'All departments' },
            ...departments.map((dep) => ({ value: dep.id, label: dep.name })),
          ]}
          value={departmentId}
          onChange={(event) => setDepartmentId(event.target.value)}
        />
        <div className="row" style={{ alignItems: 'flex-end' }}>
          <Button variant="secondary" icon="refresh" onClick={load}>
            Refresh
          </Button>
        </div>
      </div>

      <div className="card">
        <div className="table-wrap table-scroll">
          <table className="data">
            <thead>
              <tr>
                <th>Doctor</th>
                <th>Department</th>
                <th>Fee</th>
                <th>Rating</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan="6">
                    <p className="text-center text-muted mb-0" style={{ padding: 28 }}>
                      No doctors match your search.
                    </p>
                  </td>
                </tr>
              ) : (
                filtered.map((doctor) => (
                  <tr key={doctor.id}>
                    <td>
                      <div className="cell-user">
                        <Avatar src={doctor.avatar} name={doctor.name} size="sm" />
                        <span>
                          <strong>
                            {doctor.title} {doctor.name}
                          </strong>
                          <span>{doctor.specialty}</span>
                        </span>
                      </div>
                    </td>
                    <td>{doctor.departmentName}</td>
                    <td style={{ fontWeight: 700 }}>{formatCurrency(doctor.fee)}</td>
                    <td>
                      <span className="rating">
                        <Icon name="star" size={13} filled /> {doctor.rating?.toFixed(1)}
                      </span>
                    </td>
                    <td>
                      <span
                        className={`badge ${doctor.status === 'active' ? 'badge-success' : 'badge-neutral'}`}
                      >
                        {doctor.status}
                      </span>
                    </td>
                    <td>
                      <div className="row" style={{ gap: 6, justifyContent: 'flex-end' }}>
                        <Button size="sm" variant="secondary" icon="edit" onClick={() => openEdit(doctor)}>
                          Edit
                        </Button>
                        <Button size="sm" variant="ghost" icon="trash" onClick={() => setToDelete(doctor)}>
                          Delete
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <DoctorFormModal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        doctor={editing}
        departments={departments}
        saving={saving}
        onSubmit={handleSubmit}
      />

      <ConfirmDialog
        open={Boolean(toDelete)}
        onCancel={() => setToDelete(null)}
        onConfirm={handleDelete}
        title={`Remove ${toDelete?.title} ${toDelete?.name}?`}
        description="The doctor's account is deleted and any upcoming appointments are cancelled. This cannot be undone."
        confirmLabel="Remove doctor"
        loading={deleting}
      />
    </>
  )
}