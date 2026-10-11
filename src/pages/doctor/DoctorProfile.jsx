import { useEffect, useState } from 'react'
import Avatar from '../../components/common/Avatar.jsx'
import Button from '../../components/common/Button.jsx'
import Input from '../../components/common/Input.jsx'
import Loader from '../../components/common/Loader.jsx'
import DashboardHeader from '../../components/dashboard/DashboardHeader.jsx'
import { useAuth } from '../../hooks/useAuth.js'
import { useToast } from '../../context/NotificationContext.jsx'
import * as doctorService from '../../services/doctorService.js'
import { ROLE_LABELS } from '../../utils/constants.js'
import { formatCurrency } from '../../utils/formatDate.js'
import { validateProfile } from '../../utils/validation.js'

/**
 * Doctor profile editor.
 * Professional details (bio, fee, room, languages…) are saved to the doctor
 * record; contact details are saved to the account via authService.
 */
export default function DoctorProfile() {
  const { user, updateProfile } = useAuth()
  const toast = useToast()

  const [doctor, setDoctor] = useState(null)
  const [loading, setLoading] = useState(true)

  const [account, setAccount] = useState({ name: '', phone: '' })
  const [accountErrors, setAccountErrors] = useState({})
  const [savingAccount, setSavingAccount] = useState(false)

  const [profession, setProfession] = useState({
    specialty: '',
    qualifications: '',
    experienceYears: '',
    fee: '',
    room: '',
    languages: '',
    bio: '',
  })
  const [professionErrors, setProfessionErrors] = useState({})
  const [savingProfession, setSavingProfession] = useState(false)

  useEffect(() => {
    let active = true
    doctorService
      .getDoctorByUserId(user.id)
      .then((doc) => {
        if (!active || !doc) return
        setDoctor(doc)
        setAccount({ name: doc.name || '', phone: doc.phone || '' })
        setProfession({
          specialty: doc.specialty || '',
          qualifications: doc.qualifications || '',
          experienceYears: String(doc.experienceYears ?? ''),
          fee: String(doc.fee ?? ''),
          room: doc.room || '',
          languages: (doc.languages || []).join(', '),
          bio: doc.bio || '',
        })
      })
      .finally(() => active && setLoading(false))
    return () => {
      active = false
    }
  }, [user.id])

  const setAccountField = (key) => (event) =>
    setAccount((prev) => ({ ...prev, [key]: event.target.value }))

  const setProfessionField = (key) => (event) =>
    setProfession((prev) => ({ ...prev, [key]: event.target.value }))

  const handleAccountSubmit = async (event) => {
    event.preventDefault()
    const result = validateProfile({ ...account, email: user.email })
    setAccountErrors(result.errors)
    if (!result.valid) return

    setSavingAccount(true)
    try {
      await updateProfile({ name: account.name, phone: account.phone })
      const fresh = await doctorService.getDoctorByUserId(user.id)
      setDoctor(fresh)
      toast.success('Contact details saved', 'Your name and phone have been updated.')
    } catch (error) {
      toast.error('Could not save', error.message)
    } finally {
      setSavingAccount(false)
    }
  }

  const handleProfessionSubmit = async (event) => {
    event.preventDefault()
    const errors = {}
    if (!profession.specialty.trim()) errors.specialty = 'Add your specialty.'
    if (!profession.qualifications.trim()) errors.qualifications = 'Add your qualifications.'
    if (profession.fee === '' || Number(profession.fee) <= 0) errors.fee = 'Enter a fee greater than zero.'
    if (profession.experienceYears !== '' && Number(profession.experienceYears) < 0)
      errors.experienceYears = 'Cannot be negative.'
    if (!profession.bio.trim() || profession.bio.trim().length < 20)
      errors.bio = 'Write a short bio (20+ characters) so patients get to know you.'
    setProfessionErrors(errors)
    if (Object.keys(errors).length > 0) return

    setSavingProfession(true)
    try {
      await doctorService.updateDoctor(doctor.id, {
        specialty: profession.specialty.trim(),
        qualifications: profession.qualifications.trim(),
        experienceYears: Number(profession.experienceYears) || 0,
        fee: Number(profession.fee),
        room: profession.room.trim(),
        languages: profession.languages
          .split(',')
          .map((lang) => lang.trim())
          .filter(Boolean),
        bio: profession.bio.trim(),
      })
      toast.success('Professional profile saved', 'Patients will see your updated details.')
    } catch (error) {
      toast.error('Could not save', error.message)
    } finally {
      setSavingProfession(false)
    }
  }

  if (loading) return <Loader label="Loading your profile…" />

  const languages = doctor?.languages || []

  return (
    <>
      <DashboardHeader
        title="My profile"
        subtitle="Your public doctor listing and account details."
      />

      <div className="detail-layout">
        <div className="stack">
          <form onSubmit={handleAccountSubmit} noValidate>
            <div className="card">
              <div className="card-header">
                <h3>Contact details</h3>
                <Button type="submit" size="sm" icon="check" loading={savingAccount}>
                  Save
                </Button>
              </div>
              <div className="card-body">
                <div className="form-grid">
                  <Input
                    label="Full name"
                    name="doctor-name"
                    required
                    value={account.name}
                    onChange={setAccountField('name')}
                    error={accountErrors.name}
                  />
                  <Input
                    label="Email address"
                    name="doctor-email"
                    type="email"
                    value={user.email}
                    disabled
                    hint="Email is your sign-in — contact an administrator to change it."
                  />
                  <Input
                    wrapperClassName="span-2"
                    label="Phone number"
                    name="doctor-phone"
                    value={account.phone}
                    onChange={setAccountField('phone')}
                    error={accountErrors.phone}
                    hint="Shown to patients on your listing, so they can reach the clinic."
                  />
                </div>
              </div>
            </div>
          </form>

          <form onSubmit={handleProfessionSubmit} noValidate>
            <div className="card">
              <div className="card-header">
                <h3>Professional details</h3>
                <Button type="submit" size="sm" icon="check" loading={savingProfession}>
                  Save
                </Button>
              </div>
              <div className="card-body">
                <div className="form-grid">
                  <Input
                    label="Specialty"
                    name="doctor-specialty"
                    required
                    placeholder="e.g. Interventional Cardiologist"
                    value={profession.specialty}
                    onChange={setProfessionField('specialty')}
                    error={professionErrors.specialty}
                  />
                  <Input
                    label="Years of experience"
                    name="doctor-experience"
                    type="number"
                    min="0"
                    value={profession.experienceYears}
                    onChange={setProfessionField('experienceYears')}
                    error={professionErrors.experienceYears}
                  />
                  <Input
                    label="Qualification (credentials)"
                    name="doctor-qualifications"
                    required
                    placeholder="e.g. MBBS, MD (Cardiology)"
                    value={profession.qualifications}
                    onChange={setProfessionField('qualifications')}
                    error={professionErrors.qualifications}
                  />
                  <Input
                    label="Consultation fee (USD)"
                    name="doctor-fee"
                    type="number"
                    min="0"
                    required
                    value={profession.fee}
                    onChange={setProfessionField('fee')}
                    error={professionErrors.fee}
                  />
                  <Input
                    label="Office / room"
                    name="doctor-room"
                    placeholder="e.g. A-312"
                    value={profession.room}
                    onChange={setProfessionField('room')}
                  />
                  <Input
                    label="Languages spoken"
                    name="doctor-languages"
                    placeholder="English, Arabic…"
                    value={profession.languages}
                    onChange={setProfessionField('languages')}
                    hint="Comma separated — shown to patients."
                  />
                  <Input
                    wrapperClassName="span-2"
                    label="Short bio"
                    name="doctor-bio"
                    as="textarea"
                    required
                    value={profession.bio}
                    onChange={setProfessionField('bio')}
                    error={professionErrors.bio}
                    rows={4}
                  />
                </div>
              </div>
            </div>
          </form>
        </div>

        <aside className="sticky-aside stack-sm">
          <div className="card card-pad text-center">
            <Avatar src={doctor?.avatar} name={doctor?.name} size="lg" className="mx-auto" />
            <h3 style={{ marginTop: 14, marginBottom: 2 }}>
              {doctor?.title} {doctor?.name}
            </h3>
            <p className="text-sm text-muted mb-1">{doctor?.specialty || 'Consultant'}</p>
            <p className="text-xs text-muted mb-1">{doctor?.departmentName}</p>
            <span className="badge badge-brand">{ROLE_LABELS[user?.role]}</span>
            <hr className="divider" />
            <ul className="text-sm" style={{ textAlign: 'left', listStyle: 'none' }}>
              <li className="row-between mb-1">
                <span className="text-muted">Fee</span>
                <strong>{formatCurrency(doctor?.fee)}</strong>
              </li>
              <li className="row-between mb-1">
                <span className="text-muted">Room</span>
                <strong>{doctor?.room || '—'}</strong>
              </li>
              <li className="row-between mb-1">
                <span className="text-muted">Experience</span>
                <strong>{doctor?.experienceYears} yrs</strong>
              </li>
              <li className="row-between">
                <span className="text-muted">Languages</span>
                <strong>{languages.join(', ') || '—'}</strong>
              </li>
            </ul>
          </div>
        </aside>
      </div>
    </>
  )
}