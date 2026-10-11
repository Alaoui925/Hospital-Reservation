import Button from '../../components/common/Button.jsx'
import { Icon } from '../../components/common/Icon.jsx'

const STATS = [
  { value: '1978', label: 'Founded' },
  { value: '180+', label: 'Beds' },
  { value: '8', label: 'Departments' },
  { value: '120k', label: 'Patients cared for' },
]

const VALUES = [
  {
    icon: 'heart',
    title: 'Compassion first',
    text: 'We treat people, not just conditions. Every decision starts with listening carefully.',
  },
  {
    icon: 'shield',
    title: 'Clinical excellence',
    text: 'Evidence-based medicine, audited continuously and delivered by specialists.',
  },
  {
    icon: 'users',
    title: 'Partnership',
    text: 'Patients and families are part of the care team, informed at every step.',
  },
  {
    icon: 'activity',
    title: 'Continuous improvement',
    text: 'We measure outcomes and refine our pathways so care keeps getting better.',
  },
]

const FACILITIES = [
  { icon: 'stethoscope', title: 'Outpatient clinics', text: 'Eight specialty clinics with same-week appointments.' },
  { icon: 'activity', title: 'Diagnostic imaging', text: 'CT, MRI, ultrasound and digital radiography on site.' },
  { icon: 'thermometer', title: '24/7 emergency', text: 'A fully staffed emergency department, open every day.' },
  { icon: 'briefcase', title: 'Surgical theatres', text: 'Six modern theatres supporting day-case and inpatient surgery.' },
  { icon: 'book', title: 'Laboratory', text: 'Accredited pathology lab with same-day results for most tests.' },
  { icon: 'pill', title: 'Pharmacy', text: 'On-site pharmacy and medication review service.' },
]

const MILESTONES = [
  { year: '1978', text: 'MediCare opens as a small community clinic with 12 beds.' },
  { year: '1995', text: 'Cardiology and neurology departments are established.' },
  { year: '2010', text: 'The current 180-bed medical campus opens on Riverside Park.' },
  { year: '2019', text: 'Video consultations and remote follow-ups become available.' },
  { year: '2024', text: 'Online appointment booking launches for all departments.' },
]

export default function About() {
  return (
    <>
      <section className="section-sm" style={{ background: 'var(--surface-alt)', borderBottom: '1px solid var(--border)' }}>
        <div className="container">
          <div className="text-center">
            <span className="eyebrow">About the hospital</span>
            <h1>Care that has grown with Springfield for over four decades</h1>
            <p className="section-subtitle">
              From a twelve-bed community clinic to a 180-bed multi-specialty hospital,
              our purpose has never changed: look after our neighbours well.
            </p>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="grid grid-2" style={{ alignItems: 'center', gap: 48 }}>
            <div className="prose">
              <span className="eyebrow">Our story</span>
              <h2>Built around patients, not buildings</h2>
              <p>
                MediCare Hospital began in 1978 when a group of local physicians decided
                that Springfield deserved a hospital where families felt welcomed rather
                than processed. That founding idea still guides us today.
              </p>
              <p>
                We now run eight specialty departments covering everything from newborn
                health checks to complex cardiac and orthopedic procedures. Alongside the
                clinical work, we invest heavily in the things that make care easier to
                access: transparent pricing, short waiting lists and straightforward
                online booking.
              </p>
              <ul>
                <li>Board-certified consultants in every department</li>
                <li>Accredited laboratory and diagnostic imaging</li>
                <li>Interpreters and multilingual staff available on request</li>
                <li>Wheelchair-accessible buildings and parking</li>
              </ul>
              <Button to="/doctors" icon="stethoscope" className="mt-2">
                Meet our doctors
              </Button>
            </div>

            <div className="panel">
              <div className="grid grid-2" style={{ gap: 18 }}>
                {STATS.map((stat) => (
                  <div key={stat.label} className="text-center card-pad card">
                    <div
                      style={{
                        fontSize: 'var(--text-3xl)',
                        fontWeight: 700,
                        color: 'var(--brand-700)',
                      }}
                    >
                      {stat.value}
                    </div>
                    <div className="stat-label">{stat.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="section" style={{ background: 'var(--surface-alt)' }}>
        <div className="container">
          <div className="text-center">
            <span className="eyebrow">Mission &amp; values</span>
            <h2 className="section-title">What we stand for</h2>
            <p className="section-subtitle">
              Our mission is simple: to provide outstanding, accessible healthcare that
              our community can rely on at any hour.
            </p>
          </div>
          <div className="grid grid-4">
            {VALUES.map((value) => (
              <div key={value.title} className="tile">
                <div className="tile-icon">
                  <Icon name={value.icon} size={24} />
                </div>
                <h3>{value.title}</h3>
                <p>{value.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="text-center">
            <span className="eyebrow">Facilities</span>
            <h2 className="section-title">Everything under one roof</h2>
            <p className="section-subtitle">
              Modern equipment and specialist teams, so most patients are diagnosed and
              treated without being sent elsewhere.
            </p>
          </div>
          <div className="grid grid-3">
            {FACILITIES.map((item) => (
              <div key={item.title} className="card card-pad">
                <div className="row" style={{ gap: 14, alignItems: 'flex-start' }}>
                  <span className="tile-icon" style={{ margin: 0, flex: '0 0 auto' }}>
                    <Icon name={item.icon} size={22} />
                  </span>
                  <div>
                    <h3 style={{ fontSize: 'var(--text-lg)' }}>{item.title}</h3>
                    <p className="text-sm text-muted mb-0">{item.text}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section" style={{ background: 'var(--surface-alt)' }}>
        <div className="container container-narrow">
          <div className="text-center">
            <span className="eyebrow">Milestones</span>
            <h2 className="section-title">Four decades of growth</h2>
          </div>
          <div className="timeline mt-3">
            {MILESTONES.map((item) => (
              <div key={item.year} className="timeline-item">
                <strong style={{ color: 'var(--brand-700)' }}>{item.year}</strong>
                <p className="text-sm text-muted mb-0">{item.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="cta-band">
            <div>
              <h2>Come and see us</h2>
              <p>
                Our reception team is happy to answer questions about services, insurance
                and preparing for your visit.
              </p>
            </div>
            <div className="row-wrap">
              <Button to="/contact" variant="light" size="lg" icon="mail">
                Contact the hospital
              </Button>
              <Button to="/departments" variant="light" size="lg" icon="building">
                View departments
              </Button>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
