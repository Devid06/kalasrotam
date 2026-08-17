import { getContent } from './content.jsx'

/** Builds a wa.me link with a pre-written message.
 *  Reads the number from the live content, so changing it in the admin panel
 *  updates every WhatsApp button on the site at once. */
export function waLink(message) {
  const { contact } = getContent()
  return `https://wa.me/${contact.whatsapp}?text=${encodeURIComponent(message)}`
}

export const rupees = (n) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n)

/* ── Message templates ───────────────────────────────────────────────────────
   Every WhatsApp button opens a chat with the context already typed in, so the
   visitor never has to explain which piece they mean and you never have to ask. */

export function buyMessage(art) {
  return [
    `Hello Kalasrotam 👋`,
    ``,
    `I would like to buy "${art.title}".`,
    `• ${art.medium}`,
    `• ${art.size}`,
    `• ${rupees(art.price)}`,
    ``,
    `Is it still available?`,
  ].join('\n')
}

export function enquiryMessage(form) {
  const lines = [
    `Hello Kalasrotam 👋`,
    ``,
    `I would like to commission a piece.`,
    ``,
    `Name: ${form.name}`,
    `Phone: ${form.phone}`,
  ]
  if (form.email) lines.push(`Email: ${form.email}`)
  lines.push(`Medium: ${form.medium}`, `Size: ${form.size}`, `Budget: ${form.budget}`)
  if (form.message) lines.push(``, `About the piece:`, form.message)
  return lines.join('\n')
}

export function generalMessage() {
  return `Hello Kalasrotam 👋 I found your website and wanted to ask about your work.`
}

export function reviewMessage() {
  return [
    `Hello Kalasrotam 👋`,
    ``,
    `I would like to leave a review.`,
    ``,
    `What you made for me:`,
    `My review:`,
    ``,
    `(You are welcome to put this on the website.)`,
  ].join('\n')
}

export function listMessage(form) {
  return [
    `Hello Kalasrotam 👋`,
    ``,
    `Please add me to your list for new work.`,
    `Name: ${form.name}`,
    `Phone: ${form.phone}`,
    form.email ? `Email: ${form.email}` : null,
  ]
    .filter(Boolean)
    .join('\n')
}
