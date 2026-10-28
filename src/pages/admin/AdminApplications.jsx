import { useEffect, useState } from 'react'
import Avatar from '../../components/common/Avatar.jsx'
import Button from '../../components/common/Button.jsx'
import ConfirmDialog from '../../components/common/ConfirmDialog.jsx'
import EmptyState from '../../components/common/EmptyState.jsx'
import Input from '../../components/common/Input.jsx'
import Loader from '../../components/common/Loader.jsx'
import Select from '../../components/common/Select.jsx'
import DashboardHeader from '../../components/dashboard/DashboardHeader.jsx'
import { Icon } from '../../components/common/Icon.jsx'
import { useAuth } from '../../hooks/useAuth.js'
import { useToast } from '../../context/NotificationContext.jsx'
import * as applicationService from '../../services/applicationService.js'
import { formatCurrency, relativeTime } from '../../utils/formatDate.js'

const STATUS_FILTERS = [
  { value: 'pending', label: 'Under review' },
  { value: 'approved', label: 'Approved' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'all', label: 'All applications' },
]

/** Hospital administration review queue for doctor applications. */
export default function AdminApplications() {
  const { user } = useAuth()
  const toast = useToast()

  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [status, setStatus] = useState('pending')
  const [search, setSearch] = useState('')

  const [toApprove, setToApprove] = useState(null)
  const [toReject, setToReject] = useState(null)
  const [rejectionReason, setRejectionReason] = useState('')
  const [busy, setBusy] = useState(false)

  const load = () => applicationService.getApplications(status, search).then((list) => setItems(list))

  useEffect(() => {
    let active = true
    setLoading(true)
    applicationService
      .getApplications(status, search)
      .then((list) => active && setItems(list))
      .finally(() => active && setLoading(false))
    return () => {
      active = false
    }
  }, [status, search])

  const handleApprove = async () => {
    if (!toApprove) return
    setBusy(true)
    try {
      await applicationService.approveApplication(toApprove.id, { adminId: user.id })
      toast.success(
        'Doctor approved',
        `${toApprove.name} can now sign in with the password they chose at registration.`,
      )
      setToApprove(null)
      load()
    } catch (error) {
      toast.error('Approval failed', error.message)
    } finally {
      setBusy(false)
    }
  }

  const handleReject = async () => {
    if (!toReject) return
    setBusy(true)
    try {
      await applicationService.rejectApplication(toReject.id, rejectionReason)
      toast.info('Application rejected', 'The candidate will be asked to contact administration.')
      setToReject(null)
      setRejectionReason('')
      load()
    } catch (error) {
      toast.error('Rejection failed', error.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <DashboardHeader
        title="Doctor applications"
        subtitle="Review candidates who applied through the public registration form."
      />

      <div className="filters-bar" style={{ gridTemplateColumns: '1fr 1.4fr auto' }}>
        <Select
          label="Status"
          name="app-status"
          value={status}
          options={STATUS_FILTERS}
          onChange={(event) => setStatus(event.target.value)}
        />
        <Input
          label="Search"
          name="app-search"
          icon="search"
          placeholder="Name or email"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
      </div>

      {loading ? (
        <Loader label="Loading applications…" />
      ) : items.length === 0 ? (
        <div className="card">
          <EmptyState
            icon="user-plus"
            title={status === 'pending' ? 'The queue is clear' : 'No applications found'}
            description={
              status === 'pending'
                ? 'New doctor applications from the public registration form will appear here.'
                : 'Try another status filter or search term.'
            }
          />
        </div>
      ) : (
        <div className="stack">
          {items.map((app) => (
            <article key={app.id} className="card">
              <div className="card-body">
                <div className="row" style={{ gap: 14, alignItems: 'flex-start', flexWrap: 'wrap' }}>
                  <Avatar src={null} name={app.name} size="lg" />
                  <div className="grow">
                    <div className="row-between" style={{ flexWrap: 'wrap', gap: 8 }}>
                      <div>
                        <strong style={{ fontSize: 'var(--text-lg)' }}>Dr. {app.name}</strong>
                        <p className="application-email mb-0">
                          <Icon name="mail" size={13} /> {app.email}
                          {app.phone ? (
                            <>
                              {' · '}
                              <Icon name="phone" size={13} /> {app.phone}
                            </>
                          ) : null}
                        </p>
                      </div>
                      <div className="row-wrap" style={{ gap: 8 }}>
                        <span className="badge badge-neutral">{app.departmentName}</span>
                        {app.status === 'pending' && <span className="badge badge-warning">Under review</span>}
                        {app.status === 'approved' && <span className="badge badge-success">Approved</span>}
                        {app.status === 'rejected' && <span className="badge badge-danger">Rejected</span>}
                      </div>
                    </div>

                    <div className="row-wrap mt-2" style={{ gap: 10 }}>
                      <span className="text-sm text-muted">
                        <Icon name="award" size={14} /> {app.qualifications || '—'}
                      </span>
                      <span className="text-sm text-muted">
                        <Icon name="briefcase" size={14} /> {app.experienceYears} years
                      </span>
                      <span className="text-sm text-muted">
                        <Icon name="dollar" size={14} /> {formatCurrency(app.fee)}
                      </span>
                      <span className="text-sm text-muted">
                        <Icon name="clock" size={14} /> applied {relativeTime(app.createdAt)}
                      </span>
                    </div>
                    {app.bio && <p className="text-sm text-muted mt-2 mb-0">{app.bio}</p>}
                    {app.status === 'rejected' && app.rejectionReason && (
                      <p className="text-sm text-muted mt-2 mb-0">
                        <Icon name="alert-triangle" size={14} /> Reason: {app.rejectionReason}
                      </p>
                    )}

                    {app.status === 'pending' && (
                      <div className="row-wrap mt-3" style={{ gap: 10 }}>
                        <Button size="sm" variant="success" icon="check" onClick={() => setToApprove(app)}>
                          Approve &amp; provision
                        </Button>
                        <Button size="sm" variant="ghost" icon="x" onClick={() => setToReject(app)}>
                          Reject
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      <ConfirmDialog
        open={Boolean(toApprove)}
        title="Approve this doctor?"
        description={`${toApprove?.name} will get a doctor account with the password they chose, plus a public listing in ${toApprove?.departmentName}.`}
        confirmLabel="Approve doctor"
        onConfirm={handleApprove}
        onCancel={() => setToApprove(null)}
        loading={busy}
      />

      <ConfirmDialog
        open={Boolean(toReject)}
        title="Reject this application?"
        description="The candidate will see a generic rejection message on sign-in. You can add a short reason below."
        confirmLabel="Reject application"
        tone="danger"
        onConfirm={handleReject}
        onCancel={() => {
          setToReject(null)
          setRejectionReason('')
        }}
        loading={busy}
      >
        <Input
          as="textarea"
          label="Reason (optional)"
          name="reject-reason"
          placeholder="e.g. Outside the current hiring plan for this department."
          value={rejectionReason}
          onChange={(event) => setRejectionReason(event.target.value)}
          wrapperClassName="mt-2"
        />
      </ConfirmDialog>
    </>
  )
}
