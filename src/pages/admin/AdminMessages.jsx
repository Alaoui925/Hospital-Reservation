import { useCallback, useEffect, useState } from 'react'
import Button from '../../components/common/Button.jsx'
import ConfirmDialog from '../../components/common/ConfirmDialog.jsx'
import EmptyState from '../../components/common/EmptyState.jsx'
import Loader from '../../components/common/Loader.jsx'
import DashboardHeader from '../../components/dashboard/DashboardHeader.jsx'
import { Icon } from '../../components/common/Icon.jsx'
import { useToast } from '../../context/NotificationContext.jsx'
import * as adminService from '../../services/adminService.js'
import { formatDate, formatTime } from '../../utils/formatDate.js'

export default function AdminMessages() {
  const toast = useToast()
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [toDelete, setToDelete] = useState(null)

  const load = useCallback(async () => {
    const list = await adminService.getContactMessages()
    setMessages(list)
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

  const toggleRead = async (message) => {
    setBusy(true)
    try {
      await adminService.updateContactMessage(message.id, { read: !message.read })
      setMessages((prev) =>
        prev.map((m) => (m.id === message.id ? { ...m, read: !m.read } : m)),
      )
    } catch (error) {
      toast.error('Could not update', error.message)
    } finally {
      setBusy(false)
    }
  }

  const handleDelete = async () => {
    if (!toDelete) return
    setBusy(true)
    try {
      await adminService.deleteContactMessage(toDelete.id)
      toast.success('Message deleted')
      setToDelete(null)
      await load()
    } catch (error) {
      toast.error('Could not delete', error.message)
    } finally {
      setBusy(false)
    }
  }

  if (loading) return <Loader label="Loading messages…" />

  const unread = messages.filter((m) => !m.read).length

  return (
    <>
      <DashboardHeader
        title="Contact messages"
        subtitle="Questions sent from the public contact form."
        actions={
          <span className="badge badge-brand">{unread} unread</span>
        }
      />

      {messages.length === 0 ? (
        <EmptyState
          icon="message"
          title="No messages yet"
          description="Submissions from the contact page will appear here."
        />
      ) : (
        <div className="stack" style={{ gap: 14 }}>
          {messages.map((message) => (
            <article
              key={message.id}
              className="card"
              style={{
                borderLeft: message.read ? undefined : '3px solid var(--brand-500)',
              }}
            >
              <div className="card-body">
                <div className="row-between" style={{ alignItems: 'flex-start' }}>
                  <div>
                    <h3 className="mb-0" style={{ fontSize: 'var(--text-lg)' }}>
                      {message.subject || 'No subject'}
                    </h3>
                    <p className="text-sm text-muted mt-1 mb-0">
                      <strong>{message.name}</strong> · {message.email}
                    </p>
                  </div>
                  <div className="row" style={{ gap: 8 }}>
                    <span className="text-xs text-muted">
                      {formatDate(message.createdAt)} · {formatTime(message.createdAt?.slice(11, 16))}
                    </span>
                    {!message.read && <span className="badge badge-warning">New</span>}
                  </div>
                </div>
                <p className="text-sm mt-2 mb-0" style={{ color: 'var(--ink-600)' }}>
                  {message.message}
                </p>
                <div className="row-wrap mt-2" style={{ gap: 8 }}>
                  <Button
                    size="sm"
                    variant="secondary"
                    icon={message.read ? 'eye' : 'check'}
                    loading={busy}
                    onClick={() => toggleRead(message)}
                  >
                    {message.read ? 'Mark as unread' : 'Mark as read'}
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    icon="trash"
                    onClick={() => setToDelete(message)}
                  >
                    Delete
                  </Button>
                  <a
                    className="btn btn-ghost btn-sm"
                    href={`mailto:${message.email}?subject=Re: ${encodeURIComponent(message.subject || 'Your message')}`}
                  >
                    <Icon name="send" size={14} /> Reply
                  </a>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      <ConfirmDialog
        open={Boolean(toDelete)}
        onCancel={() => setToDelete(null)}
        onConfirm={handleDelete}
        title="Delete this message?"
        description="The message and its sender details will be permanently removed."
        confirmLabel="Delete message"
        loading={busy}
      />
    </>
  )
}