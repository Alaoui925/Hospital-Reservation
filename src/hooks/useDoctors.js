import { useCallback, useEffect, useMemo, useState } from 'react'
import * as doctorService from '../services/doctorService.js'

const DEFAULT_PARAMS = {
  search: '',
  departmentId: 'all',
  sort: 'rating',
  page: 1,
  perPage: 6,
}

/**
 * Fetch + filter a page of doctors.
 *
 *   const { items, total, loading, params, updateParams, refetch } = useDoctors()
 */
export function useDoctors(initial = {}) {
  const [params, setParams] = useState({ ...DEFAULT_PARAMS, ...initial })
  const [state, setState] = useState({
    items: [],
    total: 0,
    page: 1,
    totalPages: 1,
    perPage: DEFAULT_PARAMS.perPage,
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const key = JSON.stringify(params)

  useEffect(() => {
    let active = true
    setLoading(true)
    setError(null)
    doctorService
      .getDoctors(params)
      .then((data) => {
        if (active) setState(data)
      })
      .catch((err) => {
        if (active) setError(err)
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
    // `key` captures every filter that should trigger a refetch.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key])

  const updateParams = useCallback((patch) => {
    setParams((prev) => {
      const resetsPage =
        patch.search !== undefined ||
        patch.departmentId !== undefined ||
        patch.sort !== undefined ||
        patch.maxFee !== undefined
      return { ...prev, ...patch, ...(resetsPage && patch.page === undefined ? { page: 1 } : {}) }
    })
  }, [])

  const reset = useCallback(() => setParams({ ...DEFAULT_PARAMS, ...initial }), [initial])

  const refetch = useCallback(() => {
    setParams((prev) => ({ ...prev }))
  }, [])

  return useMemo(
    () => ({ ...state, loading, error, params, updateParams, reset, refetch }),
    [state, loading, error, params, updateParams, reset, refetch],
  )
}

/** Single doctor lookup used by the details page. */
export function useDoctor(id) {
  const [doctor, setDoctor] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let active = true
    if (!id) return undefined
    setLoading(true)
    doctorService
      .getDoctorById(id)
      .then((d) => active && setDoctor(d))
      .catch((err) => active && setError(err))
      .finally(() => active && setLoading(false))
    return () => {
      active = false
    }
  }, [id])

  return { doctor, setDoctor, loading, error }
}

/**
 * Availability for one doctor on one date.
 * Returns the slots plus a setter for the currently selected date.
 */
export function useAvailability(doctorId, initialDate) {
  const [date, setDate] = useState(initialDate)
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    let active = true
    if (!doctorId || !date) return undefined
    setLoading(true)
    doctorService
      .getDoctorAvailability(doctorId, date)
      .then((result) => active && setData(result))
      .finally(() => active && setLoading(false))
    return () => {
      active = false
    }
  }, [doctorId, date])

  return { date, setDate, availability: data, loading }
}

export default useDoctors
