import { Link } from 'react-router-dom'
import { FiArrowLeft } from 'react-icons/fi'
import { SiteFooter } from '../../components/SiteFooter'
import { infoData } from './infoData'

export function InfoPage({ slug }: { slug: string }) {
  const page = infoData[slug]
  if (!page) return null

  return (
    <div className="info-page">
      <div className="info-hero">
        <Link to="/" className="info-back"><FiArrowLeft size={16} /> Back to Home</Link>
        <h1>{page.title}</h1>
        <p>{page.subtitle}</p>
      </div>

      <div className="info-body">
        {page.sections.map((s, i) => (
          <section key={i} className="info-section">
            {s.heading && <h2>{s.heading}</h2>}
            {s.body && <p>{s.body}</p>}
            {s.list && (
              <ul className="info-list">
                {s.list.map((item, j) => <li key={j}>{item}</li>)}
              </ul>
            )}
            {s.cards && (
              <div className="info-cards">
                {s.cards.map((c, j) => (
                  <div key={j} className="info-card">
                    <h3>{c.title}</h3>
                    <p>{c.body}</p>
                  </div>
                ))}
              </div>
            )}
            {s.faq && (
              <div className="info-faq">
                {s.faq.map((f, j) => (
                  <details key={j} className="info-faq-item">
                    <summary>{f.q}</summary>
                    <p>{f.a}</p>
                  </details>
                ))}
              </div>
            )}
            {s.cta && (
              <div className="info-cta">
                <Link to={s.cta.to} className="btn btn-primary">{s.cta.label}</Link>
              </div>
            )}
          </section>
        ))}
      </div>

      <SiteFooter />
    </div>
  )
}