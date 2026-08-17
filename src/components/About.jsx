import { Fragment } from 'react'
import { useContent } from '../lib/content.jsx'
import { Reveal, ArtImage } from './ui.jsx'

export default function About() {
  const { artist, studio } = useContent()
  const { parts, line } = studio.etymology

  return (
    <section className="band about" id="about" aria-labelledby="about-title">
      <span className="about__watermark deva" aria-hidden="true">
        {studio.nameDevanagari}
      </span>

      <div className="shell about__grid">
        <Reveal className="about__portrait">
          <div className="frame">
            <ArtImage
              src={artist.portrait}
              seed="artist-portrait"
              variant="graphite"
              w={800}
              h={1000}
              alt={artist.portrait ? `${artist.name}, ${artist.role}` : 'Placeholder study — a photograph of the artist goes here'}
            />
          </div>
          <div className="about__badge">
            <span className="about__badge-name">{artist.name}</span>
            <span className="about__badge-role">{artist.role}</span>
          </div>
        </Reveal>

        <div>
          <Reveal className="section-head" delay={80}>
            <p className="kicker">The hand behind it</p>
            <h2 className="section-title" id="about-title">
              {artist.short}
            </h2>
          </Reveal>

          <Reveal className="about__body" delay={140}>
            {artist.story.map((p, i) => (
              <p key={i}>{p}</p>
            ))}

            {/* The name, taken apart. It explains the studio better than a
                paragraph of positioning copy would. */}
            <div className="etym">
              {parts.map((part, i) => (
                <Fragment key={part.word}>
                  <span className="etym__part">
                    <span className="etym__word deva">{part.word}</span>
                    <span className="etym__gloss">
                      {part.roman} — {part.meaning}
                    </span>
                  </span>
                  {i < parts.length - 1 && (
                    <span className="etym__plus" aria-hidden="true">
                      +
                    </span>
                  )}
                </Fragment>
              ))}
              <p className="etym__line">{line}</p>
            </div>

            <blockquote className="pullquote">{artist.philosophy}</blockquote>
            <p className="signature" aria-hidden="true">
              {artist.signature}
            </p>
          </Reveal>
        </div>
      </div>
    </section>
  )
}
