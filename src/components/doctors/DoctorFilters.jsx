import Button from '../common/Button.jsx'
import Input from '../common/Input.jsx'
import Select from '../common/Select.jsx'
import { SORT_OPTIONS } from '../../utils/constants.js'

/** Search / filter / sort bar for the doctor directory. */
export default function DoctorFilters({ params, onChange, departments = [], onReset, resultCount }) {
  const departmentOptions = [
    { value: 'all', label: 'All departments' },
    ...departments.map((dep) => ({ value: dep.id, label: dep.name })),
  ]

  return (
    <div className="filters-bar">
      <Input
        label="Search doctors"
        name="doctor-search"
        icon="search"
        placeholder="Name, specialty or qualification"
        value={params.search}
        onChange={(event) => onChange({ search: event.target.value })}
      />

      <Select
        label="Department"
        name="doctor-department"
        value={params.departmentId}
        options={departmentOptions}
        onChange={(event) => onChange({ departmentId: event.target.value })}
      />

      <Select
        label="Sort by"
        name="doctor-sort"
        value={params.sort}
        options={SORT_OPTIONS}
        onChange={(event) => onChange({ sort: event.target.value })}
      />

      <Button variant="secondary" icon="refresh" onClick={onReset}>
        Reset
      </Button>

      {typeof resultCount === 'number' && (
        <p className="text-sm text-muted mb-0" style={{ gridColumn: '1 / -1' }}>
          {resultCount} {resultCount === 1 ? 'doctor' : 'doctors'} match your search.
        </p>
      )}
    </div>
  )
}
