import { useCallback, useEffect, useState } from 'react'
import Avatar from '../../components/common/Avatar.jsx'
import Button from '../../components/common/Button.jsx'
import ConfirmDialog from '../../components/common/ConfirmDialog.jsx'
import EmptyState from '../../components/common/EmptyState.jsx'
import Input from '../../components/common/Input.jsx'
import Loader from '../../components/common/Loader.jsx'
import DashboardHeader from '../../components/dashboard/DashboardHeader.jsx'
import { useToast } from '../../context/NotificationContext.jsx'
import * as adminService from '../../services/adminService.js'
import { formatDateShort } from '../../utils/formatDate.js'

export default function AdminPatients() {
  const toast = useToast()
  const [patients, setPatients] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [toDelete, setToDelete] = useState(null)
  const [deleting, setDeleting] = useState(false)

  const load = useCallback(async () => {
    const list = await adminService.getPatients({ search })
    setPatients(list)
  }, [search])

  useEffect(() => {
    let active = true
    load()
      .catch(() => {})
      .finally(() => active && setLoading(false))
    return () => {
      active = false
    }
  }, [load])

  const handleDelete = async () => {
    if (!toDelete) return
    setDeleting(true)
    try {
      await adminService.deleteUser(toDelete.id)
      toast.success('Patient removed', `${toDelete.name}'s records were deleted.`)
      setToDelete(null)
      await load()
    } catch (error) {
      toast.error('Could not delete', error.message)
    } finally {
      setDeleting(false)
    }
  }

  if (loading) return <Loader label="Loading patients…" />

  return (
    <>
      <DashboardHeader
        title="Patient records"
        subtitle="View every registered patient and their visit history."
      />

      <div className="filters-bar" style={{ gridTemplateColumns: '1.5fr auto' }}>
        <Input
          label="Search"
          name="admin-patient-search"
          icon="search"
          placeholder="Name or email"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
        <div className="row" style={{ alignItems: 'flex-end' }}>
          <Button variant="secondary" icon="refresh" onClick={load}>
            Refresh
          </Button>
        </div>
      </div>

      <div className="card">
        {patients.length === 0 ? (
          <EmptyState
            icon="users"
            title="No patients found"
            description="Try a different search term, or new registrations will appear here."
          />
        ) : (
          <div className="table-wrap table-scroll">
            <table className="data">
              <thead>
                <tr>
                  <th>Patient</th>
                  <th>Phone</th>
                  <th>Appointments</th>
                  <th>Last visit</th>
                  <th>Registered</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {patients.map((patient) => (
                  <tr key={patient.id}>
                    <td>
                      <div className="cell-user">
                        <Avatar src={patient.avatar} name={patient.name} size="sm" />
                        <span>
                          <strong>{patient.name}</strong>
                          <span>{patient.email}</span>
                        </span>
                      </div>
                    </td>
                    <td>{patient.phone || '—'}</td>
                    <td>
                      <span className="badge badge-brand">{patient.appointments}</span>
                    </td>
                    <td>{patient.lastVisit ? formatDateShort(patient.lastVisit) : '—'}</td>
                    <td>{patient.createdAt ? formatDateShort(patient.createdAt.slice(0, 10)) : '—'}</td>
                    <td>
                      <div className="row" style={{ gap: 6, justifyContent: 'flex-end' }}>
                        <Button
                          size="sm"
                          variant="ghost"
                          icon="trash"
                          onClick={() => setToDelete(patient)}
                        >
                          Delete
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <ConfirmDialog
        open={Boolean(toDelete)}
        onCancel={() => setToDelete(null)}
        onConfirm={handleDelete}
        title={`Remove ${toDelete?.name}?`}
        description="The patient's account and full appointment history are permanently deleted."
        confirmLabel="Delete patient"
        loading={deleting}
      />
    </>
  )
}