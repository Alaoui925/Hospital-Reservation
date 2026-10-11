import { useEffect, useState } from 'react'
import Avatar from '../../components/common/Avatar.jsx'
import Button from '../../components/common/Button.jsx'
import Loader from '../../components/common/Loader.jsx'
import Select from '../../components/common/Select.jsx'
import { Icon } from '../../components/common/Icon.jsx'
import StatCard from '../../components/dashboard/StatCard.jsx'
import DashboardHeader from '../../components/dashboard/DashboardHeader.jsx'
import * as adminService from '../../services/adminService.js'
import { STATUS_META } from '../../utils/constants.js'
import { formatCurrency } from '../../utils/formatDate.js'

const MONTH_OPTIONS = [
  { value: '3', label: 'Last 3 months' },
  { value: '6', label: 'Last 6 months' },
  { value: '12', label: 'Last 12 months' },
]

export default function AdminReports() {
  const [reports, setReports] = useState(null)
  const [months, setMonths] = useState(6)
  const [loading, setLoading] = useState(true)

  const load = async (windowMonths = months) => {
    const result = await adminService.getReports({ months: windowMonths })
    setReports(result)
  }

  useEffect(() => {
    let active = true
    load()
      .catch(() => {})
      .finally(() => active && setLoading(false))
    return () => {
      active = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const changeMonths = async (event) => {
    const value = Number(event.target.value)
    setMonths(value)
    setLoading(true)
    await load(value)
    setLoading(false)
  }

  if (loading) return <Loader label="Crunching the numbers…" />

  const { series, statusBreakdown, departmentShare, doctorLoad, totals } = reports
  const maxSeries = Math.max(1, ...series.map((s) => s.total))
  const maxShare = Math.max(
    1,
    ...departmentShare.map((dep) => dep.count),
  )
  const maxLoad = Math.max(1, ...doctorLoad.map((d) => d.total))

  return (
    <>
      <DashboardHeader
        title="Reports & analytics"
        subtitle="Volume, outcomes and capacity across the hospital."
        actions={
          <div className="row-wrap" style={{ gap: 10 }}>
            <Select
              name="report-window"
              label="Window"
              options={MONTH_OPTIONS}
              value={String(months)}
              onChange={changeMonths}
            />
            <Button
              variant="secondary"
              icon="download"
              onClick={() => window.print()}
              style={{ alignSelf: 'flex-end' }}
            >
              Print
            </Button>
          </div>
        }
      />

      <div className="stat-grid">
        <StatCard icon="calendar" label="Appointments" value={totals.appointments} tone="brand" hint={`in the selected window`} />
        <StatCard icon="check-circle" label="Completed" value={totals.completed} tone="success" hint="Visits finished" />
        <StatCard icon="alert-circle" label="Cancelled" value={totals.cancelled} tone="danger" hint={`${totals.cancellationRate}% cancellation rate`} />
        <StatCard icon="dollar" label="Revenue" value={formatCurrency(totals.revenue)} tone="success" hint={`Avg. ${formatCurrency(totals.avgFee)} per visit`} />
      </div>

      <div className="card">
        <div className="card-header">
          <h3>Appointments per month</h3>
          <div className="row" style={{ gap: 14 }}>
            {['total', 'completed', 'cancelled'].map((key) => (
              <span key={key} className="text-xs text-muted" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                <span style={{ width: 10, height: 10, borderRadius: 3, background: key === 'total' ? 'var(--brand-500)' : key === 'completed' ? 'var(--success)' : 'var(--danger)' }} />
                {key}
              </span>
            ))}
          </div>
        </div>
        <div className="card-body">
          <div className="bar-chart">
            {series.map((point) => {
              const height = `${Math.max(6, (point.total / maxSeries) * 100)}%`
              return (
                <div key={point.key} className="bar-col" title={`${point.label}: ${point.total} total`}>
                  <em>{point.total}</em>
                  <div
                    className="bar"
                    style={{
                      height,
                      background: 'linear-gradient(180deg, var(--brand-400), var(--brand-600))',
                    }}
                  />
                  <span>{point.label}</span>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      <div className="grid grid-2 mt-3" style={{ gap: 18 }}>
        <div className="card">
          <div className="card-header">
            <h3>Status breakdown</h3>
            <span className="badge badge-neutral">{statusBreakdown.length} states</span>
          </div>
          <div className="card-body stack-sm" style={{ gap: 14 }}>
            {statusBreakdown.map(({ status, count }) => (
              <div key={status}>
                <div className="row-between mb-1">
                  <span className="text-sm" style={{ fontWeight: 600 }}>
                    {STATUS_META[status]?.label || status}
                  </span>
                  <span className="text-xs text-muted">
                    {count} · {totals.appointments ? Math.round((count / totals.appointments) * 100) : 0}%
                  </span>
                </div>
                <div className="progress">
                  <span
                    style={{
                      width: `${totals.appointments ? (count / totals.appointments) * 100 : 0}%`,
                      background:
                        status === 'completed'
                          ? 'var(--success)'
                          : status === 'cancelled'
                            ? 'var(--danger)'
                            : status === 'pending'
                              ? 'var(--warning)'
                              : undefined,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h3>Department share</h3>
            <span className="badge badge-neutral">{departmentShare.length} departments</span>
          </div>
          <div className="card-body stack-sm" style={{ gap: 14 }}>
            {departmentShare.map((dep) => (
              <div key={dep.name}>
                <div className="row-between mb-1">
                  <span className="text-sm" style={{ fontWeight: 600 }}>
                    <Icon name={dep.icon} size={15} /> {dep.name}
                  </span>
                  <span className="text-xs text-muted">{dep.count} visits</span>
                </div>
                <div className="progress">
                  <span style={{ width: `${(dep.count / maxShare) * 100}%`, background: dep.color }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="card mt-3">
        <div className="card-header">
          <h3>Doctor workload</h3>
          <span className="badge badge-neutral">{doctorLoad.length} doctors</span>
        </div>
        <div className="card-body">
          <div className="table-wrap table-scroll">
            <table className="data">
              <thead>
                <tr>
                  <th>Doctor</th>
                  <th>Department</th>
                  <th>Load</th>
                  <th style={{ textAlign: 'right' }}>Completed</th>
                  <th style={{ textAlign: 'right' }}>Revenue</th>
                </tr>
              </thead>
              <tbody>
                {doctorLoad.map((doc) => (
                  <tr key={doc.id}>
                    <td>
                      <div className="cell-user">
                        <Avatar src={doc.avatar} name={doc.name} size="sm" />
                        <strong>{doc.name}</strong>
                      </div>
                    </td>
                    <td>{doc.department}</td>
                    <td>
                      <div className="row" style={{ gap: 10 }}>
                        <div className="progress" style={{ width: 120 }}>
                          <span style={{ width: `${(doc.total / maxLoad) * 100}%` }} />
                        </div>
                        <span className="text-xs text-muted">{doc.total} visits</span>
                      </div>
                    </td>
                    <td className="text-right">{doc.completed}</td>
                    <td className="text-right" style={{ fontWeight: 700 }}>
                      {formatCurrency(doc.revenue)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  )
}