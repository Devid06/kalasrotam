import { useMemo, useState } from 'react'
import { useContent } from '../lib/content.jsx'
import { submitRemote, validateName, validatePhone, validateEmail } from '../lib/leads.js'
import { waLink, enquiryMessage } from '../lib/whatsapp.js'
import { Reveal, Field, WhatsAppIcon, CheckIcon } from './ui.jsx'

/* Built from content rather than declared at module scope: the dropdown options
   are editable in the admin panel, so the blank form has to be derived from
   whatever they currently are. */
function emptyForm(commission) {
  return {
    name: '',
    phone: '',
    email: '',
    medium: commission.mediumOptions[0],
    size: commission.sizeOptions[0],
    budget: commission.budgetOptions[0],
    message: '',
    company: '', // honeypot
  }
}

export default function Commission() {
  const { commission } = useContent()
  const EMPTY = useMemo(() => emptyForm(commission), [commission])
  const [form, setForm] = useState(EMPTY)
  const [errors, setErrors] = useState({})
  const [status, setStatus] = useState('idle') // idle | sending | done | error
  const [waHref, setWaHref] = useState('')

  const set = (key) => (e) => {
    const value = e.target.value
    setForm((f) => ({ ...f, [key]: value }))
    // Clear a field's error as soon as the visitor starts fixing it — leaving
    // red text under a field someone is actively correcting feels accusatory.
    setErrors((prev) => (prev[key] ? { ...prev, [key]: null } : prev))
  }

  const validate = () => {
    const next = {
      name: validateName(form.name),
      phone: validatePhone(form.phone),
      email: validateEmail(form.email, { required: false }),
    }
    Object.keys(next).forEach((k) => !next[k] && delete next[k])
    setErrors(next)
    return Object.keys(next).length === 0
  }

  const onSubmit = async (e) => {
    e.preventDefault()
    if (form.company) return // a bot filled the hidden field
    if (!validate()) {
      document.querySelector('.field--error input, .field--error select')?.focus()
      return
    }

    setStatus('sending')
    const href = waLink(enquiryMessage(form))

    try {
      await submitRemote({ ...form, type: 'commission-enquiry', company: undefined })
      setWaHref(href)
      setStatus('done')
      // Hand off to WhatsApp straight away. Popup blockers only allow this
      // because it is still within the click's user-gesture window.
      window.open(href, '_blank', 'noopener')
    } catch {
      // Even if saving fails, the visitor must still be able to reach you.
      setWaHref(href)
      setStatus('error')
    }
  }

  const done = status === 'done' || status === 'error'

  return (
    <section className="band commission" id="commission" aria-labelledby="commission-title">
      <div className="shell commission__grid">
        <div>
          <Reveal className="section-head">
            <p className="kicker">{commission.kicker}</p>
            <h2 className="section-title" id="commission-title">
              {commission.headline}
            </h2>
            <p className="section-lede">{commission.body}</p>
          </Reveal>

          <ol className="commission__steps">
            {commission.steps.map((s, i) => (
              <Reveal as="li" className="step" key={s.n} delay={i * 80}>
                <span className="step__n" aria-hidden="true">
                  {s.n}
                </span>
                <div>
                  <h3 className="step__title">{s.title}</h3>
                  <p className="step__body">{s.body}</p>
                </div>
              </Reveal>
            ))}
          </ol>
        </div>

        <Reveal delay={120}>
          <div className="enquiry">
            {done ? (
              <div className="form-done" role="status">
                <span className="form-done__mark">
                  <CheckIcon />
                </span>
                <h3 className="form-done__title">Enquiry ready</h3>
                <p className="form-done__body">
                  {status === 'error'
                    ? 'Your details could not be saved on this device, but the WhatsApp message is ready to send.'
                    : 'WhatsApp should have opened with your details already written out. Just press send.'}
                </p>
                <a href={waHref} target="_blank" rel="noopener noreferrer" className="btn btn--wa">
                  <WhatsAppIcon />
                  Open WhatsApp again
                </a>
                <button
                  type="button"
                  className="link-draw"
                  style={{ fontSize: 'var(--t-sm)', color: 'var(--stone)' }}
                  onClick={() => {
                    setForm(EMPTY)
                    setStatus('idle')
                  }}
                >
                  Send another enquiry
                </button>
              </div>
            ) : (
              <>
                <div className="enquiry__head">
                  <h3 className="enquiry__title">Start a commission</h3>
                  <p className="enquiry__sub">
                    No charge for asking, and no obligation after. Fills in a WhatsApp message you can review before
                    sending.
                  </p>
                </div>

                <form className="enquiry__form" onSubmit={onSubmit} noValidate>
                  <div className="honeypot" aria-hidden="true">
                    <label htmlFor="company">Company</label>
                    <input
                      id="company"
                      name="company"
                      tabIndex={-1}
                      autoComplete="off"
                      value={form.company}
                      onChange={set('company')}
                    />
                  </div>

                  <Field
                    label="Your name"
                    name="name"
                    required
                    autoComplete="name"
                    placeholder="Ravi Kulkarni"
                    value={form.name}
                    onChange={set('name')}
                    error={errors.name}
                  />

                  <div className="field-row">
                    <Field
                      label="WhatsApp number"
                      name="phone"
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
                      name="email"
                      type="email"
                      autoComplete="email"
                      placeholder="optional"
                      value={form.email}
                      onChange={set('email')}
                      error={errors.email}
                    />
                  </div>

                  <Field label="What would you like made" name="medium" as="select" value={form.medium} onChange={set('medium')}>
                    {commission.mediumOptions.map((o) => (
                      <option key={o}>{o}</option>
                    ))}
                  </Field>

                  <div className="field-row">
                    <Field label="Size" name="size" as="select" value={form.size} onChange={set('size')}>
                      {commission.sizeOptions.map((o) => (
                        <option key={o}>{o}</option>
                      ))}
                    </Field>
                    <Field label="Budget" name="budget" as="select" value={form.budget} onChange={set('budget')}>
                      {commission.budgetOptions.map((o) => (
                        <option key={o}>{o}</option>
                      ))}
                    </Field>
                  </div>

                  <Field
                    label="Tell me about the piece"
                    name="message"
                    as="textarea"
                    rows={3}
                    placeholder="Who or what is it of? Is it for an occasion? Any deadline I should know about?"
                    value={form.message}
                    onChange={set('message')}
                  />

                  <button type="submit" className="btn btn--wa btn--block" disabled={status === 'sending'}>
                    <WhatsAppIcon />
                    {status === 'sending' ? 'One moment…' : 'Send enquiry on WhatsApp'}
                  </button>

                  <p className="enquiry__note">{commission.note}</p>
                </form>
              </>
            )}
          </div>
        </Reveal>
      </div>
    </section>
  )
}
