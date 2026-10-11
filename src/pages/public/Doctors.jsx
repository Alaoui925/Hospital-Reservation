import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import DoctorFilters from '../../components/doctors/DoctorFilters.jsx'
import DoctorGrid from '../../components/doctors/DoctorGrid.jsx'
import { Icon } from '../../components/common/Icon.jsx'
import { useDoctors } from '../../hooks/useDoctors.js'
import * as departmentService from '../../services/departmentService.js'
import { DOCTORS_PER_PAGE } from '../../utils/constants.js'

export default function Doctors() {
  const [searchParams] = useSearchParams()
  const [departments, setDepartments] = useState([])

  // The URL query is only read once, to seed the initial filter state
  // (e.g. arriving from the homepage search bar or a department page).
  const { items, total, totalPages, page, loading, params, updateParams, reset } = useDoctors({
    search: searchParams.get('search') || '',
    departmentId: searchParams.get('department') || 'all',
    sort: 'rating',
    page: 1,
    perPage: DOCTORS_PER_PAGE,
  })

  useEffect(() => {
    let active = true
    departmentService
      .getDepartments()
      .then((list) => active && setDepartments(list))
    return () => {
      active = false
    }
  }, [])

  const pageNumbers = []
  for (let i = 1; i <= totalPages; i += 1) pageNumbers.push(i)

  return (
    <section className="section">
      <div className="container">
        <div className="page-head">
          <span className="eyebrow">Find a doctor</span>
          <h1>Search our specialists</h1>
          <p>
            Filter by specialty, compare experience and fees, then book the appointment
            that suits you best.
          </p>
        </div>

        <DoctorFilters
          params={params}
          onChange={updateParams}
          departments={departments}
          onReset={reset}
          resultCount={loading ? undefined : total}
        />

        <DoctorGrid
          doctors={items}
          loading={loading}
          onReset={reset}
          emptyTitle="No doctors match your search"
          emptyDescription="Try removing a filter, or search for a different specialty."
        />

        {!loading && total > params.perPage && (
          <nav className="pagination" aria-label="Pagination">
            <button
              type="button"
              className="page-btn"
              disabled={page <= 1}
              onClick={() => updateParams({ page: page - 1 })}
            >
              <Icon name="chevron-left" size={16} />
            </button>

            {pageNumbers.map((number) => (
              <button
                key={number}
                type="button"
                className={`page-btn ${number === page ? 'active' : ''}`}
                onClick={() => updateParams({ page: number })}
                aria-current={number === page ? 'page' : undefined}
              >
                {number}
              </button>
            ))}

            <button
              type="button"
              className="page-btn"
              disabled={page >= totalPages}
              onClick={() => updateParams({ page: page + 1 })}
            >
              <Icon name="chevron-right" size={16} />
            </button>
          </nav>
        )}
      </div>
    </section>
  )
}
