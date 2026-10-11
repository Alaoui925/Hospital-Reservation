import { useEffect, useState } from 'react'
import Avatar from '../../components/common/Avatar.jsx'
import Button from '../../components/common/Button.jsx'
import ConfirmDialog from '../../components/common/ConfirmDialog.jsx'
import Input from '../../components/common/Input.jsx'
import Select from '../../components/common/Select.jsx'
import DashboardHeader from '../../components/dashboard/DashboardHeader.jsx'
import { Icon } from '../../components/common/Icon.jsx'
import { useAuth } from '../../hooks/useAuth.js'
import { useToast } from '../../context/NotificationContext.jsx'
import * as authService from '../../services/authService.js'
import { BLOOD_GROUPS, GENDERS, ROLE_LABELS } from '../../utils/constants.js'
import { ageFromDob, formatDate } from '../../utils/formatDate.js'
import { validateProfile } from '../../utils/validation.js'

const FIELDS = [
  'name',
  'email',
  'phone',
  'dob',
  'gender',
  'bloodGroup',
  'address',
  'insuranceProvider',
  'insuranceNumber',
  'emergencyContact',
]

const pickProfile = (user) =>
  Object.fromEntries(FIELDS.map((key) => [key, user?.[key] ?? '']))

export default function PatientProfile() {
  const { user, updateProfile } = useAuth()
  const toast = useToast()

  const [values, setValues] = useState(() => pickProfile(user))
  const [errors, setErrors] = useState({})
  const [saving, setSaving] = useState(false)

  const [passwords, setPasswords] = useState({ currentPassword: '', newPassword: '', confirm: '' })
  const [passwordErrors, setPasswordErrors] = useState({})
  const [changing, setChanging] = useState(false)

  const [confirmDelete, setConfirmDelete] = useState(false)

  // Keep the form in sync if the user object is refreshed elsewhere.
  useEffect(() => {
    setValues(pickProfile(user))
  }, [user])

  const setField = (key) => (event) =>
    setValues((prev) => ({ ...prev, [key]: event.target.value }))

  const setPasswordField = (key) => (event) =>
    setPasswords((prev) => ({ ...prev, [key]: event.target.value }))

  const handleSave = async (event) => {
    event.preventDefault()
    const result = validateProfile(values)
    setErrors(result.errors)
    if (!result.valid) return

    setSaving(true)
    try {
      await updateProfile(values)
      toast.success('Profile updated', 'Your details have been saved.')
    } catch (error) {
      toast.error('Could not save', error.message)
    } finally {
      setSaving(false)
    }
  }

  const handlePassword = async (event) => {
    event.preventDefault()
    const nextErrors = {}
    if (!passwords.currentPassword) nextErrors.currentPassword = 'Enter your current password.'
    if (!passwords.newPassword || passwords.newPassword.length < 6)
      nextErrors.newPassword = 'Use at least 6 characters.'
    if (passwords.confirm !== passwords.newPassword)
      nextErrors.confirm = 'Passwords do not match.'
    setPasswordErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) return

    setChanging(true)
    try {
      await authService.changePassword(user.id, {
        currentPassword: passwords.currentPassword,
        newPassword: passwords.newPassword,
      })
      setPasswords({ currentPassword: '', newPassword: '', confirm: '' })
      toast.success('Password changed', 'Use your new password next time you sign in.')
    } catch (error) {
      setPasswordErrors({ ...(error.fields || {}), form: error.message })
      toast.error('Could not change password', error.message)
    } finally {
      setChanging(false)
    }
  }

  const handleDelete = async () => {
    await authService.deleteAccount(user.id)
    toast.info('Account deleted', 'Goodbye — take care of yourself.')
    window.location.href = '/'
  }

  return (
    <>
      <DashboardHeader
        title="My profile"
        subtitle="Keep your contact and medical details up to date."
      />

      <div className="detail-layout">
        <div className="stack">
          <form className="card" onSubmit={handleSave} noValidate>
            <div className="card-header">
              <h3>Personal details</h3>
              <Button type="submit" size="sm" icon="check" loading={saving}>
                Save changes
              </Button>
            </div>
            <div className="card-body">
              <div className="form-grid">
                <Input
                  label="Full name"
                  name="profile-name"
                  required
                  value={values.name}
                  onChange={setField('name')}
                  error={errors.name}
                />
                <Input
                  label="Email address"
                  name="profile-email"
                  type="email"
                  required
                  value={values.email}
                  onChange={setField('email')}
                  error={errors.email}
                  hint="Used for appointment confirmations."
                />
                <Input
                  label="Phone number"
                  name="profile-phone"
                  value={values.phone}
                  onChange={setField('phone')}
                  error={errors.phone}
                />
                <Input
                  label="Date of birth"
                  name="profile-dob"
                  type="date"
                  max={new Date().toISOString().slice(0, 10)}
                  value={values.dob}
                  onChange={setField('dob')}
                  error={errors.dob}
                />
                <Select
                  label="Gender"
                  name="profile-gender"
                  placeholder="Prefer not to say"
                  options={GENDERS.map((g) => ({ value: g, label: g }))}
                  value={values.gender}
                  onChange={setField('gender')}
                />
                <Select
                  label="Blood group"
                  name="profile-blood"
                  placeholder="Not known"
                  options={BLOOD_GROUPS.map((b) => ({ value: b, label: b }))}
                  value={values.bloodGroup}
                  onChange={setField('bloodGroup')}
                />
                <Input
                  wrapperClassName="span-2"
                  label="Home address"
                  name="profile-address"
                  value={values.address}
                  onChange={setField('address')}
                  error={errors.address}
                />
              </div>
            </div>
          </form>

          <form className="card" onSubmit={handleSave} noValidate>
            <div className="card-header">
              <h3>Insurance &amp; emergency contact</h3>
            </div>
            <div className="card-body">
              <div className="form-grid">
                <Input
                  label="Insurance provider"
                  name="profile-insurance"
                  value={values.insuranceProvider}
                  onChange={setField('insuranceProvider')}
                />
                <Input
                  label="Policy number"
                  name="profile-policy"
                  value={values.insuranceNumber}
                  onChange={setField('insuranceNumber')}
                />
                <Input
                  wrapperClassName="span-2"
                  label="Emergency contact"
                  name="profile-emergency"
                  placeholder="Name · phone number"
                  value={values.emergencyContact}
                  onChange={setField('emergencyContact')}
                />
              </div>
              <div className="row-between">
                <span className="text-xs text-muted">
                  We only contact your emergency contact in an emergency.
                </span>
                <Button type="submit" size="sm" variant="secondary" icon="check" loading={saving}>
                  Save
                </Button>
              </div>
            </div>
          </form>

          <form className="card" onSubmit={handlePassword} noValidate>
            <div className="card-header">
              <h3>Change password</h3>
            </div>
            <div className="card-body">
              {passwordErrors.form && (
                <div className="alert alert-danger">
                  <Icon name="alert-circle" size={18} />
                  <span>{passwordErrors.form}</span>
                </div>
              )}
              <div className="form-grid">
                <Input
                  wrapperClassName="span-2"
                  label="Current password"
                  name="current-password"
                  type="password"
                  value={passwords.currentPassword}
                  onChange={setPasswordField('currentPassword')}
                  error={passwordErrors.currentPassword}
                />
                <Input
                  label="New password"
                  name="new-password"
                  type="password"
                  value={passwords.newPassword}
                  onChange={setPasswordField('newPassword')}
                  error={passwordErrors.newPassword}
                />
                <Input
                  label="Confirm new password"
                  name="confirm-password"
                  type="password"
                  value={passwords.confirm}
                  onChange={setPasswordField('confirm')}
                  error={passwordErrors.confirm}
                />
              </div>
              <Button type="submit" icon="lock" loading={changing}>
                Update password
              </Button>
            </div>
          </form>
        </div>

        <aside className="sticky-aside stack-sm">
          <div className="card card-pad text-center">
            <Avatar src={user?.avatar} name={user?.name} size="lg" className="mx-auto" />
            <h3 style={{ marginTop: 14, marginBottom: 2 }}>{user?.name}</h3>
            <p className="text-sm text-muted mb-1">{user?.email}</p>
            <span className="badge badge-brand">{ROLE_LABELS[user?.role]}</span>
            <hr className="divider" />
            <ul className="text-sm" style={{ textAlign: 'left', listStyle: 'none' }}>
              <li className="row-between mb-1">
                <span className="text-muted">Member since</span>
                <strong>{user?.createdAt ? formatDate(user.createdAt) : '—'}</strong>
              </li>
              <li className="row-between mb-1">
                <span className="text-muted">Age</span>
                <strong>{ageFromDob(values.dob) ?? '—'}</strong>
              </li>
              <li className="row-between">
                <span className="text-muted">Blood group</span>
                <strong>{values.bloodGroup || '—'}</strong>
              </li>
            </ul>
          </div>

          <div className="card card-pad">
            <h3 style={{ fontSize: 'var(--text-lg)' }}>Danger zone</h3>
            <p className="text-sm text-muted">
              Deleting your account removes your profile and appointment history. This
              cannot be undone.
            </p>
            <Button variant="danger" block icon="trash" onClick={() => setConfirmDelete(true)}>
              Delete my account
            </Button>
          </div>
        </aside>
      </div>

      <ConfirmDialog
        open={confirmDelete}
        title="Delete your account?"
        description="All of your appointments and personal details will be permanently removed."
        confirmLabel="Delete account"
        cancelLabel="Keep my account"
        tone="danger"
        onConfirm={handleDelete}
        onCancel={() => setConfirmDelete(false)}
      />
    </>
  )
}
