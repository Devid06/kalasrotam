import { useContent } from '../lib/content.jsx'
import { waLink, reviewMessage } from '../lib/whatsapp.js'
import { Reveal, ArtImage, Stars, WhatsAppIcon } from './ui.jsx'

/* Trust section. Each card pairs the piece that was made with the words of the
   person it was made for — a review floating on its own is far less convincing
   than one attached to the thing it is about. */

export default function Reviews() {
  const { reviews, reviewsMeta } = useContent()

  return (
    <section className="band" id="reviews" aria-labelledby="reviews-title">
      <div className="shell">
        <Reveal className="section-head">
          <p className="kicker">{reviewsMeta.kicker}</p>
          <h2 className="section-title" id="reviews-title">
            {reviewsMeta.headline}
          </h2>
          <p className="section-lede">{reviewsMeta.body}</p>
        </Reveal>

        {reviewsMeta.sampleNotice && (
          <p className="sample-notice" role="note">
            <span className="sample-notice__tag">Sample</span>
            {reviewsMeta.sampleNoticeText}
          </p>
        )}

        <Reveal as="dl" className="reviews__trust">
          {reviewsMeta.trust.map((t) => (
            <div key={t.label}>
              <dt className="sr-only">{t.label}</dt>
              <dd style={{ margin: 0 }}>
                <span className="trust__v">{t.value}</span>
                <span className="trust__l">{t.label}</span>
              </dd>
            </div>
          ))}
        </Reveal>

        <div className="review-wall">
          {reviews.map((r, i) => (
            <Reveal as="figure" className="review" key={r.id} delay={(i % 3) * 90}>
              <div className="review__art">
                <ArtImage
                  src={r.image}
                  seed={r.seed}
                  variant={r.variant}
                  w={900}
                  h={600}
                  alt={`Commission for ${r.name} — ${r.piece}`}
                />
              </div>
              <div className="review__body">
                <Stars rating={r.rating} />
                <blockquote className="review__quote">{r.quote}</blockquote>
                <figcaption>
                  <p className="review__piece">{r.piece}</p>
                  <div className="review__who">
                    <span className="review__name">{r.name}</span>
                    <span className="review__city">{r.city}</span>
                  </div>
                </figcaption>
              </div>
            </Reveal>
          ))}
        </div>

        {/* Reviews are curated, not open. Customers send their words straight to
            you on WhatsApp and you add the ones you want in the admin panel —
            so nothing appears beside your work that you did not put there, and
            there is no open submission box for spam to find. */}
        <Reveal className="review-cta" delay={120}>
          <div>
            <h3 className="review-cta__title">{reviewsMeta.ctaTitle}</h3>
            <p className="review-cta__body">{reviewsMeta.ctaBody}</p>
          </div>
          <a
            href={waLink(reviewMessage())}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn--wa"
          >
            <WhatsAppIcon />
            {reviewsMeta.ctaLabel}
          </a>
        </Reveal>
      </div>
    </section>
  )
}
