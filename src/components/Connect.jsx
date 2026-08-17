import { useState } from 'react'
import { useContent } from '../lib/content.jsx'
import { submitRemote, validateName, validatePhone, validateEmail } from '../lib/leads.js'
import { waLink, listMessage } from '../lib/whatsapp.js'
import { Reveal, Field, CheckIcon, ArrowIcon, WhatsAppIcon, InstagramIcon } from './ui.jsx'

const EMPTY = { name: '', phone: '', email: '', company: '' }

export default function Connect() {
  const { connect, contact, socials } = useContent()
  const [form, setForm] = useState(EMPTY)
  const [errors, setErrors] = useState({})
  const [status, setStatus] = useState('idle')

  const set = (key) => (e) => {
    const value = e.target.value
    setForm((f) => ({ ...f, [key]: value }))
    setErrors((prev) => (prev[key] ? { ...prev, [key]: null } : prev))
  }

  const onSubmit = async (e) => {
    e.preventDefault()
    if (form.company) return

    const next = {
      name: validateName(form.name),
      phone: validatePhone(form.phone),
      email: validateEmail(form.email, { required: true }),
    }
    Object.keys(next).forEach((k) => !next[k] && delete next[k])
    setErrors(next)
    if (Object.keys(next).length) {
      document.querySelector('.connect__card .field--error input')?.focus()
      return
    }

    setStatus('sending')
    try {
      await submitRemote({ ...form, type: 'mailing-list', company: undefined })
      setStatus('done')
    } catch {
      setStatus('done') // The visitor did their part; never show them a failure.
    }
  }

  const rows = [
    { k: 'WhatsApp', v: contact.whatsappDisplay, href: waLink('Hello Kalasrotam 👋') },
    { k: 'Email', v: contact.email, href: `mailto:${contact.email}` },
    { k: 'Based in', v: contact.location, href: null },
    { k: 'Response time', v: contact.hours, href: null },
  ]

  // Instagram is where the work actually lives, so it is pulled out of the
  // generic list and given its own card. The rest stay as a plain row.
  const featured = socials.find((s) => s.featured)
  const others = socials.filter((s) => !s.featured)

  return (
    <section className="band connect" id="connect" aria-labelledby="connect-title">
      <div className="shell connect__grid">
        <div>
          <Reveal className="section-head" style={{ marginBottom: 0 }}>
            <p className="kicker">{connect.kicker}</p>
            <h2 className="section-title" id="connect-title">
              {connect.headline}
            </h2>
            <p className="section-lede">{connect.body}</p>
          </Reveal>

          <Reveal delay={80}>
            <p className="connect__promise">{connect.promise}</p>
          </Reveal>

          <Reveal delay={140}>
            <div className="contact-list">
              {rows.map((r) =>
                r.href ? (
                  <a
                    key={r.k}
                    className="contact-row"
                    href={r.href}
                    target={r.href.startsWith('http') ? '_blank' : undefined}
                    rel={r.href.startsWith('http') ? 'noopener noreferrer' : undefined}
                  >
                    <span className="contact-row__k">{r.k}</span>
                    <span className="contact-row__v">
                      {r.v} <ArrowIcon size={12} />
                    </span>
                  </a>
                ) : (
                  <div className="contact-row" key={r.k}>
                    <span className="contact-row__k">{r.k}</span>
                    <span className="contact-row__v">{r.v}</span>
                  </div>
                )
              )}
              {others.length > 0 && (
                <div className="contact-row">
                  <span className="contact-row__k">Also on</span>
                  <span className="contact-row__v" style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                    {others.map((s) => (
                      <a key={s.label} href={s.url} target="_blank" rel="noopener noreferrer" className="link-draw">
                        {s.label}
                      </a>
                    ))}
                  </span>
                </div>
              )}
            </div>
          </Reveal>

          {featured && (
            <Reveal delay={180}>
              <a className="insta" href={featured.url} target="_blank" rel="noopener noreferrer">
                <span className="insta__glyph" aria-hidden="true">
                  <InstagramIcon size={26} />
                </span>
                <span className="insta__text">
                  <span className="insta__handle">{featured.handle}</span>
                  {featured.blurb && <span className="insta__blurb">{featured.blurb}</span>}
                </span>
                <span className="insta__go" aria-hidden="true">
                  Follow
                  <ArrowIcon size={13} />
                </span>
              </a>
            </Reveal>
          )}
        </div>

        <Reveal delay={120}>
          <div className="connect__card">
            {status === 'done' ? (
              <div className="form-done" role="status">
                <span className="form-done__mark">
                  <CheckIcon />
                </span>
                <h3 className="form-done__title">You are on the list</h3>
                <p className="form-done__body">
                  Thank you, {form.name.split(' ')[0]}. You will hear from me before anything goes public.
                </p>
                <a
                  href={waLink(listMessage(form))}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn--wa btn--sm"
                >
                  <WhatsAppIcon />
                  Say hello on WhatsApp
                </a>
              </div>
            ) : (
              <>
                <div className="enquiry__head">
                  <h3 className="enquiry__title">Leave your details</h3>
                  <p className="enquiry__sub">Takes fifteen seconds. Unsubscribe by replying “stop” to any message.</p>
                </div>

                <form className="enquiry__form" onSubmit={onSubmit} noValidate>
                  <div className="honeypot" aria-hidden="true">
                    <label htmlFor="company-2">Company</label>
                    <input
                      id="company-2"
                      name="company"
                      tabIndex={-1}
                      autoComplete="off"
                      value={form.company}
                      onChange={set('company')}
                    />
                  </div>

                  <Field
                    label="Name"
                    name="list-name"
                    required
                    autoComplete="name"
                    placeholder="Your name"
                    value={form.name}
                    onChange={set('name')}
                    error={errors.name}
                  />
                  <Field
                    label="Mobile / WhatsApp"
                    name="list-phone"
                    type="tel"
                    required
                    inputMode="numeric"
                    autoComplete="tel"
                    placeholder="98765 43210"
                    value={form.phone}
                    onChange={set('phone')}
                    error={errors.phone}
                  />
                  <Field
                    label="Email"
                    name="list-email"
                    type="email"
                    required
                    autoComplete="email"
                    placeholder="you@example.com"
                    value={form.email}
                    onChange={set('email')}
                    error={errors.email}
                  />

                  <button type="submit" className="btn btn--block" disabled={status === 'sending'}>
                    {status === 'sending' ? 'One moment…' : 'Keep me posted'}
                    <ArrowIcon />
                  </button>
                </form>
              </>
            )}
          </div>
        </Reveal>
      </div>
    </section>
  )
}
