/**
 * Form validation helpers.
 * Every `validate*` function receives a values object and returns
 * `{ valid: boolean, errors: Record<string, string> }`.
 */

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/
const PHONE_RE = /^[+()\-\s\d]{7,20}$/

export const isEmail = (value) => EMAIL_RE.test(String(value || '').trim())
export const isPhone = (value) => PHONE_RE.test(String(value || '').trim())
export const isRequired = (value) =>
  value !== null && value !== undefined && String(value).trim().length > 0

export function minLength(value, length) {
  return String(value || '').trim().length >= length
}

function buildErrors(checks) {
  const errors = {}
  for (const [field, message] of Object.entries(checks)) {
    if (message) errors[field] = message
  }
  return { valid: Object.keys(errors).length === 0, errors }
}

export function validateLogin(values = {}) {
  return buildErrors({
    email: !isRequired(values.email)
      ? 'Email is required.'
      : !isEmail(values.email)
        ? 'Enter a valid email address.'
        : '',
    password: !isRequired(values.password)
      ? 'Password is required.'
      : !minLength(values.password, 6)
        ? 'Password must be at least 6 characters.'
        : '',
  })
}

export function validateRegister(values = {}) {
  const errors = {}
  if (!isRequired(values.name)) errors.name = 'Full name is required.'
  else if (!minLength(values.name, 3)) errors.name = 'Name looks too short.'

  if (!isRequired(values.email)) errors.email = 'Email is required.'
  else if (!isEmail(values.email)) errors.email = 'Enter a valid email address.'

  if (values.phone && !isPhone(values.phone)) errors.phone = 'Enter a valid phone number.'

  if (!isRequired(values.password)) errors.password = 'Password is required.'
  else if (!minLength(values.password, 6)) errors.password = 'Use at least 6 characters.'

  if (values.confirmPassword !== undefined) {
    if (!isRequired(values.confirmPassword)) errors.confirmPassword = 'Confirm your password.'
    else if (values.confirmPassword !== values.password)
      errors.confirmPassword = 'Passwords do not match.'
  }

  if (values.acceptTerms === false) errors.acceptTerms = 'Please accept the terms to continue.'

  return { valid: Object.keys(errors).length === 0, errors }
}

export function validateAppointment(values = {}) {
  const errors = {}
  if (!isRequired(values.departmentId)) errors.departmentId = 'Choose a department.'
  if (!isRequired(values.doctorId)) errors.doctorId = 'Choose a doctor.'
  if (!isRequired(values.date)) errors.date = 'Pick an appointment date.'
  if (!isRequired(values.time)) errors.time = 'Select an available time slot.'
  if (!isRequired(values.reason)) errors.reason = 'Tell us the reason for the visit.'
  else if (!minLength(values.reason, 10))
    errors.reason = 'Please add a little more detail (10+ characters).'
  return { valid: Object.keys(errors).length === 0, errors }
}

export function validateProfile(values = {}) {
  const errors = {}
  if (!isRequired(values.name)) errors.name = 'Full name is required.'
  if (!isRequired(values.email)) errors.email = 'Email is required.'
  else if (!isEmail(values.email)) errors.email = 'Enter a valid email address.'
  if (values.phone && !isPhone(values.phone)) errors.phone = 'Enter a valid phone number.'
  return { valid: Object.keys(errors).length === 0, errors }
}

export function validateDoctor(values = {}) {
  const errors = {}
  if (!isRequired(values.name)) errors.name = 'Doctor name is required.'
  if (!isRequired(values.departmentId)) errors.departmentId = 'Assign a department.'
  if (!isRequired(values.email)) errors.email = 'Email is required.'
  else if (!isEmail(values.email)) errors.email = 'Enter a valid email address.'
  if (!isRequired(values.fee)) errors.fee = 'Consultation fee is required.'
  else if (Number(values.fee) <= 0) errors.fee = 'Fee must be greater than zero.'
  if (values.experienceYears !== undefined && Number(values.experienceYears) < 0)
    errors.experienceYears = 'Experience cannot be negative.'
  return { valid: Object.keys(errors).length === 0, errors }
}

/** Public doctor registration (application form). */
export function validateDoctorApplication(values = {}) {
  const errors = {}
  if (!isRequired(values.name)) errors.name = 'Full name is required.'
  else if (!minLength(values.name, 3)) errors.name = 'Name looks too short.'

  if (!isRequired(values.email)) errors.email = 'Email is required.'
  else if (!isEmail(values.email)) errors.email = 'Enter a valid email address.'

  if (values.phone && !isPhone(values.phone)) errors.phone = 'Enter a valid phone number.'

  if (!isRequired(values.password)) errors.password = 'Password is required.'
  else if (!minLength(values.password, 6)) errors.password = 'Use at least 6 characters.'

  if (!isRequired(values.confirmPassword)) errors.confirmPassword = 'Confirm your password.'
  else if (values.confirmPassword !== values.password) errors.confirmPassword = 'Passwords do not match.'

  if (!isRequired(values.departmentId)) errors.departmentId = 'Choose the department you are applying to.'
  if (!isRequired(values.specialty)) errors.specialty = 'Add your specialty (e.g. Paediatric cardiology).'
  if (!isRequired(values.qualifications)) errors.qualifications = 'Add your qualifications (e.g. MBBS, MD).'
  if (!isRequired(values.fee)) errors.fee = 'Set the consultation fee you will charge.'
  else if (Number(values.fee) <= 0) errors.fee = 'Fee must be greater than zero.'

  if (values.experienceYears !== undefined && Number(values.experienceYears) < 0)
    errors.experienceYears = 'Experience cannot be negative.'

  if (values.bio !== undefined && !isRequired(values.bio)) errors.bio = 'Write a short bio for your future listing.'

  if (values.acceptTerms === false) errors.acceptTerms = 'Please accept the terms to continue.'

  return { valid: Object.keys(errors).length === 0, errors }
}

export function validateDepartment(values = {}) {
  return buildErrors({
    name: !isRequired(values.name) ? 'Department name is required.' : '',
    description: !isRequired(values.description) ? 'Add a short description.' : '',
  })
}

export function validateContact(values = {}) {
  const errors = {}
  if (!isRequired(values.name)) errors.name = 'Your name is required.'
  if (!isRequired(values.email)) errors.email = 'Email is required.'
  else if (!isEmail(values.email)) errors.email = 'Enter a valid email address.'
  if (!isRequired(values.subject)) errors.subject = 'Add a subject.'
  if (!isRequired(values.message)) errors.message = 'Write your message.'
  else if (!minLength(values.message, 15)) errors.message = 'Please add a bit more detail.'
  return { valid: Object.keys(errors).length === 0, errors }
}

export function passwordStrength(password = '') {
  let score = 0
  if (password.length >= 6) score += 1
  if (password.length >= 10) score += 1
  if (/[A-Z]/.test(password)) score += 1
  if (/\d/.test(password)) score += 1
  if (/[^A-Za-z0-9]/.test(password)) score += 1
  const labels = ['Very weak', 'Weak', 'Fair', 'Good', 'Strong', 'Very strong']
  return { score, label: labels[score] }
}
