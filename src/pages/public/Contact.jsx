import { useState } from 'react'
import Button from '../../components/common/Button.jsx'
import Input from '../../components/common/Input.jsx'
import Select from '../../components/common/Select.jsx'
import { Icon } from '../../components/common/Icon.jsx'
import { useToast } from '../../context/NotificationContext.jsx'
import * as adminService from '../../services/adminService.js'
import { HOSPITAL } from '../../utils/constants.js'
import { validateContact } from '../../utils/validation.js'

const SUBJECTS = [
  { value: 'appointment', label: 'Appointment enquiry' },
  { value: 'billing', label: 'Billing & insurance' },
  { value: 'records', label: 'Medical records' },
  { value: 'feedback', label: 'Feedback & complaints' },
  { value: 'other', label: 'Something else' },
]

const EMPTY = { name: '', email: '', phone: '', subject: '', message: '' }

export default function Contact() {
  const toast = useToast()
  const [values, setValues] = useState(EMPTY)
  const [errors, setErrors] = useState({})
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)

  const setField = (key) => (event) =>
    setValues((prev) => ({ ...prev, [key]: event.target.value }))

  const handleSubmit = async (event) => {
    event.preventDefault()
    const result = validateContact(values)
    setErrors(result.errors)
    if (!result.valid) return

    setSending(true)
    try {
      const subjectLabel =
        SUBJECTS.find((item) => item.value === values.subject)?.label || values.subject
      await adminService.submitContactMessage({ ...values, subject: subjectLabel })
      setSent(true)
      setValues(EMPTY)
      toast.success('Message sent', 'Our reception team will reply within one business day.')
    } catch (error) {
      toast.error('Could not send', error.message || 'Please try again in a moment.')
    } finally {
      setSending(false)
    }
  }

  return (
    <>
      <section className="section-sm" style={{ background: 'var(--surface-alt)', borderBottom: '1px solid var(--border)' }}>
        <div className="container">
          <div className="page-head text-center">
            <span className="eyebrow">Get in touch</span>
            <h1>We are here to help</h1>
            <p>
              Reach the right team directly, or send us a message and we will get back to
              you within one business day.
            </p>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="detail-layout">
            <div className="card">
              <div className="card-header">
                <h3>Send us a message</h3>
              </div>
              <div className="card-body">
                {sent && (
                  <div className="alert alert-success">
                    <Icon name="check-circle" size={18} />
                    <span>
                      Thank you — your message has been received. We usually reply within
                      one business day.
                    </span>
                  </div>
                )}

                <form onSubmit={handleSubmit} noValidate>
                  <div className="form-grid">
                    <Input
                      label="Your name"
                      name="contact-name"
                      required
                      placeholder="Jane Doe"
                      value={values.name}
                      onChange={setField('name')}
                      error={errors.name}
                    />
                    <Input
                      label="Email address"
                      name="contact-email"
                      type="email"
                      required
                      placeholder="jane@example.com"
                      value={values.email}
                      onChange={setField('email')}
                      error={errors.email}
                    />
                    <Input
                      label="Phone (optional)"
                      name="contact-phone"
                      placeholder="+1 (555) 000-0000"
                      value={values.phone}
                      onChange={setField('phone')}
                      error={errors.phone}
                    />
                    <Select
                      label="Subject"
                      name="contact-subject"
                      required
                      placeholder="What is this about?"
                      options={SUBJECTS}
                      value={values.subject}
                      onChange={setField('subject')}
                      error={errors.subject}
                    />
                    <Input
                      as="textarea"
                      wrapperClassName="span-2"
                      label="Message"
                      name="contact-message"
                      required
                      placeholder="Tell us how we can help…"
                      value={values.message}
                      onChange={setField('message')}
                      error={errors.message}
                    />
                  </div>

                  <div className="row-between">
                    <span className="text-xs text-muted">
                      By submitting you agree to our privacy policy.
                    </span>
                    <Button type="submit" icon="send" loading={sending}>
                      Send message
                    </Button>
                  </div>
                </form>
              </div>
            </div>

            <aside className="stack-sm">
              <div className="card">
                <div className="card-header">
                  <h3>Contact details</h3>
                </div>
                <div className="card-body">
                  <ul className="info-list">
                    <li>
                      <span className="ico">
                        <Icon name="map-pin" size={18} />
                      </span>
                      <div>
                        <strong>Address</strong>
                        <span>{HOSPITAL.address}</span>
                      </div>
                    </li>
                    <li>
                      <span className="ico">
                        <Icon name="phone" size={18} />
                      </span>
                      <div>
                        <strong>Reception</strong>
                        <span>{HOSPITAL.phone}</span>
                      </div>
                    </li>
                    <li>
                      <span className="ico">
                        <Icon name="alert-circle" size={18} />
                      </span>
                      <div>
                        <strong>Emergency (24/7)</strong>
                        <span>{HOSPITAL.emergencyPhone}</span>
                      </div>
                    </li>
                    <li>
                      <span className="ico">
                        <Icon name="mail" size={18} />
                      </span>
                      <div>
                        <strong>Email</strong>
                        <span>{HOSPITAL.email}</span>
                      </div>
                    </li>
                  </ul>
                </div>
              </div>

              <div className="card">
                <div className="card-header">
                  <h3>Opening hours</h3>
                </div>
                <div className="card-body stack-sm">
                  {HOSPITAL.hours.map((slot) => (
                    <div key={slot.label} className="row-between text-sm">
                      <span className="text-muted">{slot.label}</span>
                      <strong>{slot.value}</strong>
                    </div>
                  ))}
                </div>
              </div>

              <div className="card card-pad">
                <h3 style={{ fontSize: 'var(--text-lg)' }}>Visiting us</h3>
                <p className="text-sm text-muted mb-0">
                  Free patient parking is available in the Riverside Medical Park car
                  park. The main entrance is step-free and clearly signposted from the
                  bus interchange.
                </p>
              </div>
            </aside>
          </div>
        </div>
      </section>
    </>
  )
}
