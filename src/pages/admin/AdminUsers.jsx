import { useCallback, useEffect, useState } from 'react'
import Avatar from '../../components/common/Avatar.jsx'
import Button from '../../components/common/Button.jsx'
import ConfirmDialog from '../../components/common/ConfirmDialog.jsx'
import EmptyState from '../../components/common/EmptyState.jsx'
import Input from '../../components/common/Input.jsx'
import Loader from '../../components/common/Loader.jsx'
import Select from '../../components/common/Select.jsx'
import DashboardHeader from '../../components/dashboard/DashboardHeader.jsx'
import { Icon } from '../../components/common/Icon.jsx'
import { useToast } from '../../context/NotificationContext.jsx'
import * as adminService from '../../services/adminService.js'
import { ROLE_LABELS, ROLES } from '../../utils/constants.js'
import { formatDateShort } from '../../utils/formatDate.js'

const ROLE_FILTERS = [
  { value: 'all', label: 'All roles' },
  { value: ROLES.PATIENT, label: ROLES.PATIENT },
  { value: ROLES.DOCTOR, label: ROLES.DOCTOR },
  { value: ROLES.ADMIN, label: ROLES.ADMIN },
]

const ROLE_BADGE = {
  [ROLES.PATIENT]: 'badge-info',
  [ROLES.DOCTOR]: 'badge-brand',
  [ROLES.ADMIN]: 'badge-warning',
}

export default function AdminUsers() {
  const toast = useToast()
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [role, setRole] = useState('all')
  const [toDelete, setToDelete] = useState(null)
  const [deleting, setDeleting] = useState(false)

  const load = useCallback(async () => {
    const list = await adminService.getUsers({ role, search })
    setUsers(list)
  }, [role, search])

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
      toast.success('User removed', `The account for ${toDelete.name} was deleted.`)
      setToDelete(null)
      await load()
    } catch (error) {
      toast.error('Could not delete', error.message)
    } finally {
      setDeleting(false)
    }
  }

  if (loading) return <Loader label="Loading user accounts…" />

  const counts = users.reduce(
    (acc, user) => ({ ...acc, [user.role]: (acc[user.role] || 0) + 1 }),
    {},
  )

  return (
    <>
      <DashboardHeader
        title="User accounts"
        subtitle="Everyone with access to the platform — patients, doctors and admins."
      />

      <div className="filters-bar" style={{ gridTemplateColumns: '1.5fr 1fr auto' }}>
        <Input
          label="Search"
          name="admin-user-search"
          icon="search"
          placeholder="Name or email"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
        <Select
          label="Role"
          name="admin-user-role"
          options={ROLE_FILTERS}
          value={role}
          onChange={(event) => setRole(event.target.value)}
        />
        <div className="row" style={{ alignItems: 'flex-end' }}>
          <Button variant="secondary" icon="refresh" onClick={load}>
            Refresh
          </Button>
        </div>
      </div>

      <div className="row-wrap mb-2" style={{ gap: 10 }}>
        {Object.entries(ROLE_LABELS).map(([roleKey, label]) => (
          <span key={roleKey} className="badge badge-neutral">
            {label}: {counts[roleKey] || 0}
          </span>
        ))}
      </div>

      <div className="card">
        {users.length === 0 ? (
          <EmptyState
            icon="users"
            title="No accounts found"
            description="Try a different search or role filter."
          />
        ) : (
          <div className="table-wrap table-scroll">
            <table className="data">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Role</th>
                  <th>Phone</th>
                  <th>Member since</th>
                  <th>Doctor link</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id}>
                    <td>
                      <div className="cell-user">
                        <Avatar src={user.avatar} name={user.name} size="sm" />
                        <span>
                          <strong>{user.name}</strong>
                          <span>{user.email}</span>
                        </span>
                      </div>
                    </td>
                    <td>
                      <span className={`badge ${ROLE_BADGE[user.role] || 'badge-neutral'}`}>
                        {ROLE_LABELS[user.role] || user.role}
                      </span>
                    </td>
                    <td>{user.phone || '—'}</td>
                    <td>{user.createdAt ? formatDateShort(user.createdAt.slice(0, 10)) : '—'}</td>
                    <td>
                      {user.doctorId ? (
                        <span className="row" style={{ gap: 6 }}>
                          <Icon name="stethoscope" size={14} />
                          <span className="text-xs text-muted">{user.doctorId}</span>
                        </span>
                      ) : (
                        <span className="text-xs text-muted">—</span>
                      )}
                    </td>
                    <td>
                      <div className="row" style={{ gap: 6, justifyContent: 'flex-end' }}>
                        <Button
                          size="sm"
                          variant="ghost"
                          icon="trash"
                          disabled={user.role === ROLES.ADMIN}
                          title={user.role === ROLES.ADMIN ? 'Administrators cannot be deleted' : undefined}
                          onClick={() => setToDelete(user)}
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
        title={`Delete ${toDelete?.name}?`}
        description="The account and any of the user's appointments are permanently removed."
        confirmLabel="Delete user"
        loading={deleting}
      />
    </>
  )
}