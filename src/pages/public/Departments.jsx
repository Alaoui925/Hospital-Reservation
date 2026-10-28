import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import EmptyState from '../../components/common/EmptyState.jsx'
import Input from '../../components/common/Input.jsx'
import Loader from '../../components/common/Loader.jsx'
import { Icon } from '../../components/common/Icon.jsx'
import * as departmentService from '../../services/departmentService.js'

export default function Departments() {
  const [departments, setDepartments] = useState([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')

  useEffect(() => {
    let active = true
    departmentService
      .getDepartments()
      .then((list) => {
        if (active) setDepartments(list)
      })
      .finally(() => active && setLoading(false))
    return () => {
      active = false
    }
  }, [])

  const filtered = useMemo(() => {
    if (!query.trim()) return departments
    const q = query.toLowerCase()
    return departments.filter(
      (dep) =>
        dep.name.toLowerCase().includes(q) ||
        dep.short.toLowerCase().includes(q) ||
        dep.description.toLowerCase().includes(q) ||
        (dep.services || []).some((service) => service.toLowerCase().includes(q)),
    )
  }, [departments, query])

  return (
    <section className="section">
      <div className="container">
        <div className="page-head text-center">
          <span className="eyebrow">Departments</span>
          <h1>Specialist care across eight departments</h1>
          <p>
            Browse our departments, see the services they provide and book directly with
            the consultant you need.
          </p>
        </div>

        <div className="container-narrow" style={{ margin: '0 auto 32px' }}>
          <Input
            name="department-search"
            icon="search"
            placeholder="Search departments or services — e.g. cardiology, braces, migraine"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </div>

        {loading ? (
          <Loader label="Loading departments…" />
        ) : filtered.length === 0 ? (
          <div className="card">
            <EmptyState
              icon="building"
              title="No departments match your search"
              description="Try a different keyword, or browse the full list."
              actionLabel="Show everything"
              actionIcon="refresh"
              onAction={() => setQuery('')}
            />
          </div>
        ) : (
          <div className="specialty-grid">
            {filtered.map((dep) => (
              <Link className="specialty-card" key={dep.id} to={`/departments/${dep.slug}`}>
                <span className="specialty-icon">
                  <Icon name={dep.icon} size={26} />
                </span>
                <h3>{dep.name}</h3>
                <p>{dep.short}</p>
                <div className="specialty-bottom">
                  <span>
                    {dep.doctorCount} {dep.doctorCount === 1 ? 'specialist' : 'specialists'}
                  </span>
                  <span className="specialty-arrow" aria-hidden="true">
                    <Icon name="arrow-right" size={18} />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
