import { useCallback, useEffect, useMemo, useState } from 'react'
import * as appointmentService from '../services/appointmentService.js'

const DEFAULT_PARAMS = {
  status: 'all',
  scope: 'all',
  search: '',
  sort: 'date-asc',
}

/**
 * Query appointments for a patient, a doctor or the whole hospital.
 *
 *   const { items, loading, params, updateParams, refetch } =
 *     useAppointments({ patientId: user.id, scope: 'upcoming' })
 */
export function useAppointments(scope = {}) {
  const { patientId, doctorId, ...rest } = scope
  const [params, setParams] = useState({ ...DEFAULT_PARAMS, ...rest })
  const [state, setState] = useState({ items: [], loading: true, error: null })

  const key = JSON.stringify({ patientId, doctorId, ...params })

  const load = useCallback(async () => {
    setState((s) => ({ ...s, loading: true, error: null }))
    try {
      const items = await appointmentService.queryAppointments({
        patientId,
        doctorId,
        ...params,
      })
      setState({ items, loading: false, error: null })
    } catch (error) {
      setState({ items: [], loading: false, error })
    }
  }, [patientId, doctorId, params])

  useEffect(() => {
    let active = true
    setState((s) => ({ ...s, loading: true }))
    appointmentService
      .queryAppointments({ patientId, doctorId, ...params })
      .then((items) => active && setState({ items, loading: false, error: null }))
      .catch((error) => active && setState({ items: [], loading: false, error }))
    return () => {
      active = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key])

  const updateParams = useCallback((patch) => {
    setParams((prev) => ({ ...prev, ...patch }))
  }, [])

  return useMemo(
    () => ({ ...state, params, updateParams, refetch: load }),
    [state, params, updateParams, load],
  )
}

/** Stats summary (counts by status) for a patient or doctor. */
export function useAppointmentStats(scope = {}) {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const key = JSON.stringify(scope)

  useEffect(() => {
    let active = true
    setLoading(true)
    appointmentService
      .getAppointmentStats(scope)
      .then((s) => active && setStats(s))
      .finally(() => active && setLoading(false))
    return () => {
      active = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key])

  return { stats, loading, refetch: () => setStats((s) => s) }
}

/** Perform a mutation and re-run `load` afterwards. */
export function useAppointmentActions(onDone) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)

  const run = useCallback(
    async (fn, ...args) => {
      setBusy(true)
      setError(null)
      try {
        const result = await fn(...args)
        onDone?.(result)
        return result
      } catch (err) {
        setError(err)
        throw err
      } finally {
        setBusy(false)
      }
    },
    [onDone],
  )

  return {
    busy,
    error,
    create: (payload) => run(appointmentService.createAppointment, payload),
    setStatus: (id, status, note) => run(appointmentService.updateAppointmentStatus, id, status, note),
    cancel: (id, reason) => run(appointmentService.cancelAppointment, id, reason),
    reschedule: (id, payload) => run(appointmentService.rescheduleAppointment, id, payload),
    remove: (id) => run(appointmentService.deleteAppointment, id),
  }
}

export default useAppointments
