import { Link } from 'react-router-dom'

const footerColumns = [
  {
    title: 'Our Company',
    links: [
      { label: 'About Us', to: '/about' },
      { label: 'Careers', to: '/careers' },
      { label: 'Contact Us', to: '/contact' },
    ],
  },
  {
    title: 'New Customers',
    links: [
      { label: 'Open an Account', to: '/signup' },
      { label: 'Learn About Shipping', to: '/shipping' },
      { label: 'Get a Quote', to: '/quote' },
    ],
  },
  {
    title: 'Customer Support',
    links: [
      { label: 'Help Center', to: '/help' },
      { label: 'FAQs', to: '/faq' },
      { label: 'File a Claim', to: '/claim' },
    ],
  },
  {
    title: 'Resources',
    links: [
      { label: 'Mobile App', to: '/mobile-app' },
      { label: 'Developer Portal', to: '/developers' },
      { label: 'Supply Chain', to: '/supply-chain' },
    ],
  },
]

export function SiteFooter() {
  return (
    <footer className="gs-footer">
      <div className="gs-footer-main">
        <div className="gs-footer-grid">
          {footerColumns.map(col => (
            <div className="gs-footer-col" key={col.title}>
              <h4>{col.title}</h4>
              {col.links.map(link => (
                <Link to={link.to} key={link.to}>{link.label}</Link>
              ))}
            </div>
          ))}
        </div>
      </div>
      <div className="gs-footer-bottom">
        <div className="gs-footer-bottom-content">
          <span>&copy; GlobalSend {new Date().getFullYear()}</span>
          <div className="gs-footer-links">
            <Link to="/terms">Terms of Use</Link>
            <Link to="/privacy">Security &amp; Privacy</Link>
          </div>
        </div>
      </div>
    </footer>
  )
}