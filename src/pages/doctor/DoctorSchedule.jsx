import { useEffect, useMemo, useState } from 'react'
import AppointmentCard from '../../components/appointments/AppointmentCard.jsx'
import Button from '../../components/common/Button.jsx'
import Loader from '../../components/common/Loader.jsx'
import DashboardHeader from '../../components/dashboard/DashboardHeader.jsx'
import { Icon } from '../../components/common/Icon.jsx'
import { useAuth } from '../../hooks/useAuth.js'
import * as appointmentService from '../../services/appointmentService.js'
import * as doctorService from '../../services/doctorService.js'
import { WEEKDAYS, WEEKDAYS_SHORT } from '../../utils/constants.js'
import { formatTime, toISODate } from '../../utils/formatDate.js'

export default function DoctorSchedule() {
  const { user } = useAuth()
  const [appointments, setAppointments] = useState([])
  const [doctor, setDoctor] = useState(null)
  const [loading, setLoading] = useState(true)
  const [weekStart, setWeekStart] = useState(() => {
    const today = new Date()
    const firstDay = new Date(today)
    firstDay.setDate(today.getDate() - today.getDay()) // Sunday
    return firstDay
  })

  useEffect(() => {
    let active = true
    doctorService
      .getDoctorByUserId(user.id)
      .then(async (doc) => {
        if (!active) return
        setDoctor(doc)
        const list = await appointmentService.queryAppointments({
          doctorId: doc.id,
          scope: 'all',
          sort: 'date-asc',
        })
        if (active) setAppointments(list)
      })
      .finally(() => active && setLoading(false))
    return () => {
      active = false
    }
  }, [user.id])

  const week = useMemo(
    () =>
      Array.from({ length: 7 }, (_, offset) => {
        const date = new Date(weekStart)
        date.setDate(weekStart.getDate() + offset)
        const iso = toISODate(date)
        return {
          iso,
          weekday: WEEKDAYS[date.getDay()],
          short: WEEKDAYS_SHORT[date.getDay()],
          dayNumber: date.getDate(),
          isToday: iso === toISODate(new Date()),
          items: appointments.filter((a) => a.date === iso),
        }
      }),
    [weekStart, appointments],
  )

  if (loading) return <Loader label="Loading your schedule…" />

  return (
    <>
      <DashboardHeader
        title="Weekly schedule"
        subtitle="Everything on your calendar for the next seven days."
        actions={
          <div className="row-wrap">
            <Button
              variant="secondary"
              icon="chevron-left"
              onClick={() =>
                setWeekStart((d) => {
                  const next = new Date(d)
                  next.setDate(d.getDate() - 7)
                  return next
                })
              }
            >
              Prev
            </Button>
            <span className="text-sm text-muted" style={{ whiteSpace: 'nowrap' }}>
              {week[0].short} {week[0].dayNumber} – {week[6].short} {week[6].dayNumber}
            </span>
            <Button
              variant="secondary"
              iconRight="chevron-right"
              onClick={() => setWeekStart(new Date(weekStart.getFullYear(), weekStart.getMonth(), weekStart.getDate() + 7))}
            >
              Next
            </Button>
            <Button variant="ghost" icon="calendar" onClick={() => setWeekStart(new Date())}>
              This week
            </Button>
          </div>
        }
      />

      <div className="grid grid-2" style={{ gap: 16 }}>
        {week.map((day) => (
          <div
            key={day.iso}
            className="card"
            style={{
              borderColor: day.isToday ? 'var(--brand-400)' : undefined,
              boxShadow: day.isToday ? 'var(--ring)' : undefined,
            }}
          >
            <div className="card-header">
              <div>
                <h3>
                  {day.weekday}
                  {day.isToday && <span className="badge badge-brand ml-1">Today</span>}
                </h3>
                <span className="text-xs text-muted">
                  {doctor?.availableDays?.includes(new Date(day.iso + 'T00:00').getDay())
                    ? 'Clinic day'
                    : 'No clinic'}
                </span>
              </div>
              <span className="badge badge-neutral">{day.items.length} visit{day.items.length === 1 ? '' : 's'}</span>
            </div>
            <div className="card-body stack-sm" style={{ gap: 10 }}>
              {day.items.length === 0 ? (
                <p className="text-sm text-muted mb-0" style={{ padding: '8px 0' }}>
                  No appointments. This slot is free.
                </p>
              ) : (
                day.items.map((appt) => (
                  <div key={appt.id} className="row" style={{ gap: 12, alignItems: 'flex-start' }}>
                    <span className="text-sm" style={{ fontWeight: 700, color: 'var(--brand-700)', minWidth: 62 }}>
                      {formatTime(appt.time)}
                    </span>
                    <div className="grow">
                      <strong className="text-sm" style={{ display: 'block' }}>
                        {appt.patientName}
                      </strong>
                      <span className="text-xs text-muted">{appt.type === 'video' ? 'Video visit' : 'In person'}</span>
                    </div>
                    <span className={`badge badge-${appt.status === 'pending' ? 'warning' : appt.status === 'confirmed' ? 'success' : appt.status === 'cancelled' ? 'danger' : 'info'}`}>
                      {appt.status}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        ))}
      </div>
    </>
  )
}