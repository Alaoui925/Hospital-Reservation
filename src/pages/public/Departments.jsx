import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import Button from '../../components/common/Button.jsx'
import EmptyState from '../../components/common/EmptyState.jsx'
import Input from '../../components/common/Input.jsx'
import Loader from '../../components/common/Loader.jsx'
import { Icon } from '../../components/common/Icon.jsx'
import * as departmentService from '../../services/departmentService.js'
import { getDepartmentImage } from '../../utils/departmentImages.js'

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
          <div className="grid grid-auto">
            {filtered.map((dep) => {
              const image = getDepartmentImage(dep)
              return (
                <article
                  key={dep.id}
                  className={`card card-hover${image ? ' dept-card' : ''}`}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    ...(image ? { backgroundImage: `url("${image}")` } : null),
                  }}
                >
                  <div className="card-body grow">
                    <div className="row-between" style={{ alignItems: 'flex-start' }}>
                      <div className="tile-icon" style={{ marginBottom: 14 }}>
                        <Icon name={dep.icon} size={26} />
                      </div>
                      <span className="badge badge-brand">
                        {dep.doctorCount} {dep.doctorCount === 1 ? 'doctor' : 'doctors'}
                      </span>
                    </div>
                    <h3>{dep.name}</h3>
                    <p className="text-sm text-muted">{dep.description.slice(0, 150)}…</p>
                    <div className="row-wrap" style={{ gap: 6 }}>
                      {(dep.services || []).slice(0, 3).map((service) => (
                        <span key={service} className="badge badge-neutral">
                          {service}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="doctor-card-foot">
                    <span className="text-xs text-muted">
                      <Icon name="map-pin" size={13} /> {dep.floor}
                    </span>
                    <Button to={`/departments/${dep.slug}`} size="sm" iconRight="arrow-right">
                      Details
                    </Button>
                  </div>
                </article>
              )
            })}
          </div>
        )}
      </div>
    </section>
  )
}
