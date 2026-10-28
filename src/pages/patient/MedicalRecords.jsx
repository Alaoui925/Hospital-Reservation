import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import Button from '../../components/common/Button.jsx'
import EmptyState from '../../components/common/EmptyState.jsx'
import Input from '../../components/common/Input.jsx'
import Loader from '../../components/common/Loader.jsx'
import { Icon } from '../../components/common/Icon.jsx'
import DashboardHeader from '../../components/dashboard/DashboardHeader.jsx'
import { useAuth } from '../../hooks/useAuth.js'
import * as recordService from '../../services/recordService.js'
import { formatDate } from '../../utils/formatDate.js'

export default function MedicalRecords() {
  const { user } = useAuth()
  const [records, setRecords] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    let active = true
    recordService
      .queryRecords({ patientId: user.id })
      .then((list) => active && setRecords(list))
      .finally(() => active && setLoading(false))
    return () => {
      active = false
    }
  }, [user.id])

  const filtered = records.filter((record) => {
    if (!search.trim()) return true
    const q = search.toLowerCase()
    return (
      record.diagnosis.toLowerCase().includes(q) ||
      record.doctorName.toLowerCase().includes(q) ||
      record.departmentName.toLowerCase().includes(q) ||
      record.report.some((med) => med.toLowerCase().includes(q))
    )
  })

  return (
    <>
      <DashboardHeader
        title="Medical records"
        subtitle="Diagnoses, prescriptions and care instructions from your completed visits."
      />

      <Input
        wrapperClassName="mb-3"
        name="records-search"
        icon="search"
        placeholder="Search by doctor, department, diagnosis or medication"
        value={search}
        onChange={(event) => setSearch(event.target.value)}
      />

      {loading ? (
        <Loader label="Loading medical records…" />
      ) : filtered.length === 0 ? (
        <div className="card">
          <EmptyState
            icon="clipboard-text"
            title={search ? 'No records match your search' : 'No medical records yet'}
            description={
              search
                ? 'Try a different term, or clear the search.'
                : 'When a doctor completes one of your visits, the visit report (diagnosis, prescription and advice) will appear here automatically.'
            }
            actionLabel={search ? 'Clear search' : 'Book an appointment'}
            actionIcon={search ? 'x' : 'calendar-plus'}
            onAction={search ? () => setSearch('') : undefined}
            actionTo={search ? undefined : '/patient/book'}
          />
        </div>
      ) : (
        <div className="stack">
          {filtered.map((record) => (
            <article key={record.id} className="card record-card">
              <div className="card-body">
                <div className="row" style={{ gap: 14, alignItems: 'flex-start', flexWrap: 'wrap' }}>
                  <span className="tile-icon" aria-hidden="true">
                    <Icon name={record.departmentIcon} size={24} />
                  </span>
                  <div className="grow">
                    <div className="row-between" style={{ flexWrap: 'wrap', gap: 8 }}>
                      <div>
                        <strong>Visit on {formatDate(record.visitDate)}</strong>
                        <p className="text-sm text-muted mb-0">
                          {record.departmentName} ·{' '}
                          <Link to="/patient/appointments" className="doctor-specialty">
                            {record.doctorName}
                          </Link>
                        </p>
                      </div>
                      {record.report.length > 0 && (
                        <span className="badge badge-brand">
                          <Icon name="pill" size={12} /> {record.report.length}{' '}
                          {record.report.length === 1 ? 'medication' : 'medications'}
                        </span>
                      )}
                    </div>

                    <div className="mt-3">
                      <h4 className="text-sm mb-1" style={{ textTransform: 'uppercase', letterSpacing: '.06em', color: 'var(--ink-500)' }}>
                        Diagnosis
                      </h4>
                      <p className="text-sm mb-0">{record.diagnosis}</p>
                    </div>

                    {record.report.length > 0 && (
                      <div className="mt-3">
                        <h4 className="text-sm mb-1" style={{ textTransform: 'uppercase', letterSpacing: '.06em', color: 'var(--ink-500)' }}>
                          Prescription
                        </h4>
                        <ul className="record-meds">
                          {record.report.map((med, index) => (
                            <li key={index}>
                              <span className="dot" />
                              {med}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {record.instructions && (
                      <div className="mt-3">
                        <h4 className="text-sm mb-1" style={{ textTransform: 'uppercase', letterSpacing: '.06em', color: 'var(--ink-500)' }}>
                          Care instructions
                        </h4>
                        <p className="text-sm text-muted mb-0">{record.instructions}</p>
                      </div>
                    )}

                    <div className="row-wrap mt-3" style={{ gap: 16 }}>
                      {record.followUpDate && (
                        <span className="badge badge-neutral">
                          <Icon name="calendar-check" size={13} /> Follow-up: {formatDate(record.followUpDate)}
                        </span>
                      )}
                      <span className="badge badge-neutral">
                        <Icon name="calendar-check" size={13} /> Report filed {formatDate(record.updatedAt)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </>
  )
}
