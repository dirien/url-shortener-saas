import { useState } from 'react';
import { motion } from 'framer-motion';
import styles from './Docs.module.css';

export default function Docs() {
  const [activeSection, setActiveSection] = useState('getting-started');

  const sections = [
    { id: 'getting-started', label: 'Getting Started' },
    { id: 'api', label: 'API Reference' },
    { id: 'rate-limits', label: 'Rate Limits' },
    { id: 'faq', label: 'FAQ' },
  ];

  return (
    <div className={styles.docs}>
      <div className="container">
        <motion.div
          className={styles.header}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className={styles.title}>Documentation</h1>
          <p className={styles.subtitle}>
            Everything you need to integrate Snip.ly into your workflow
          </p>
        </motion.div>

        <div className={styles.layout}>
          <motion.nav
            className={styles.sidebar}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <ul className={styles.navList}>
              {sections.map((section) => (
                <li key={section.id}>
                  <a
                    href={`#${section.id}`}
                    className={`${styles.navLink} ${activeSection === section.id ? styles.active : ''}`}
                    onClick={(e) => {
                      e.preventDefault();
                      setActiveSection(section.id);
                      document.getElementById(section.id)?.scrollIntoView({ behavior: 'smooth' });
                    }}
                  >
                    {section.label}
                  </a>
                </li>
              ))}
            </ul>
          </motion.nav>

          <motion.div
            className={styles.content}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            {/* Getting Started */}
            <section id="getting-started" className={styles.section}>
              <h2 className={styles.sectionTitle}>Getting Started</h2>
              <p className={styles.paragraph}>
                Welcome to Snip.ly! This guide will help you get started with our URL shortening service.
                Whether you're using our web interface or integrating via API, you'll be up and running in minutes.
              </p>

              <h3 className={styles.subsectionTitle}>Quick Start</h3>
              <ol className={styles.orderedList}>
                <li>Navigate to the <a href="/dashboard">Dashboard</a></li>
                <li>Paste your long URL into the input field</li>
                <li>Optionally, add a custom alias for your short link</li>
                <li>Click "Create Short URL" and you're done!</li>
              </ol>

              <h3 className={styles.subsectionTitle}>Using Custom Aliases</h3>
              <p className={styles.paragraph}>
                Custom aliases let you create branded, memorable short links. When creating a URL,
                simply enter your desired alias in the optional field. Aliases must:
              </p>
              <ul className={styles.unorderedList}>
                <li>Be 3-20 characters long</li>
                <li>Contain only letters, numbers, hyphens, and underscores</li>
                <li>Be unique (not already in use)</li>
              </ul>

              <div className={styles.callout}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="16" x2="12" y2="12" />
                  <line x1="12" y1="8" x2="12.01" y2="8" />
                </svg>
                <div>
                  <strong>Pro Tip:</strong> Use descriptive aliases that hint at the content.
                  For example, <code>spring-sale-2024</code> is better than <code>abc123</code>.
                </div>
              </div>
            </section>

            {/* API Reference */}
            <section id="api" className={styles.section}>
              <h2 className={styles.sectionTitle}>API Reference</h2>
              <p className={styles.paragraph}>
                Our REST API allows you to programmatically create and manage short URLs.
                All API endpoints are accessible via HTTPS and return JSON responses.
              </p>

              <h3 className={styles.subsectionTitle}>Base URL</h3>
              <div className={styles.codeBlock}>
                <code>https://your-domain.com/api</code>
              </div>

              {/* POST /shorten */}
              <div className={styles.endpoint}>
                <div className={styles.endpointHeader}>
                  <span className={styles.methodBadge + ' ' + styles.post}>POST</span>
                  <span className={styles.endpointPath}>/shorten</span>
                </div>
                <p className={styles.endpointDescription}>
                  Create a new short URL from a long URL.
                </p>

                <h4 className={styles.paramTitle}>Request Body</h4>
                <div className={styles.codeBlock}>
                  <pre>{`{
  "url": "https://example.com/very/long/url",
  "alias": "my-link"  // optional
}`}</pre>
                </div>

                <h4 className={styles.paramTitle}>Response (201 Created)</h4>
                <div className={styles.codeBlock}>
                  <pre>{`{
  "shortCode": "my-link",
  "originalUrl": "https://example.com/very/long/url"
}`}</pre>
                </div>

                <h4 className={styles.paramTitle}>Error Responses</h4>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>Status</th>
                      <th>Description</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>400</td>
                      <td>Invalid URL format or alias format</td>
                    </tr>
                    <tr>
                      <td>409</td>
                      <td>Alias already exists</td>
                    </tr>
                    <tr>
                      <td>500</td>
                      <td>Internal server error</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* GET /{shortCode} */}
              <div className={styles.endpoint}>
                <div className={styles.endpointHeader}>
                  <span className={styles.methodBadge + ' ' + styles.get}>GET</span>
                  <span className={styles.endpointPath}>/{'{shortCode}'}</span>
                </div>
                <p className={styles.endpointDescription}>
                  Redirect to the original URL. This endpoint returns a 301 redirect.
                </p>

                <h4 className={styles.paramTitle}>Path Parameters</h4>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>Parameter</th>
                      <th>Type</th>
                      <th>Description</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td><code>shortCode</code></td>
                      <td>string</td>
                      <td>The unique identifier for the short URL</td>
                    </tr>
                  </tbody>
                </table>

                <h4 className={styles.paramTitle}>Response (301 Redirect)</h4>
                <p className={styles.paragraph}>
                  Returns a 301 redirect to the original URL. The click count is automatically incremented.
                </p>
              </div>

              {/* GET /stats/{shortCode} */}
              <div className={styles.endpoint}>
                <div className={styles.endpointHeader}>
                  <span className={styles.methodBadge + ' ' + styles.get}>GET</span>
                  <span className={styles.endpointPath}>/stats/{'{shortCode}'}</span>
                </div>
                <p className={styles.endpointDescription}>
                  Get statistics for a short URL including click count and creation date.
                </p>

                <h4 className={styles.paramTitle}>Response (200 OK)</h4>
                <div className={styles.codeBlock}>
                  <pre>{`{
  "shortCode": "my-link",
  "originalUrl": "https://example.com/very/long/url",
  "clickCount": 42,
  "createdAt": "2024-01-15T10:30:00.000Z"
}`}</pre>
                </div>
              </div>
            </section>

            {/* Rate Limits */}
            <section id="rate-limits" className={styles.section}>
              <h2 className={styles.sectionTitle}>Rate Limits</h2>
              <p className={styles.paragraph}>
                To ensure fair usage and maintain service quality, we apply rate limits to API requests.
              </p>

              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Plan</th>
                    <th>Rate Limit</th>
                    <th>Burst Limit</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>Free</td>
                    <td>100 requests/hour</td>
                    <td>10 requests/second</td>
                  </tr>
                  <tr>
                    <td>Pro</td>
                    <td>10,000 requests/hour</td>
                    <td>100 requests/second</td>
                  </tr>
                  <tr>
                    <td>Enterprise</td>
                    <td>Unlimited</td>
                    <td>Custom</td>
                  </tr>
                </tbody>
              </table>

              <h3 className={styles.subsectionTitle}>Rate Limit Headers</h3>
              <p className={styles.paragraph}>
                All API responses include headers to help you track your rate limit status:
              </p>
              <div className={styles.codeBlock}>
                <pre>{`X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1705320000`}</pre>
              </div>

              <div className={styles.callout + ' ' + styles.warning}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                  <line x1="12" y1="9" x2="12" y2="13" />
                  <line x1="12" y1="17" x2="12.01" y2="17" />
                </svg>
                <div>
                  <strong>Important:</strong> Exceeding rate limits will result in a 429 Too Many Requests response.
                  Implement exponential backoff in your client to handle rate limiting gracefully.
                </div>
              </div>
            </section>

            {/* FAQ */}
            <section id="faq" className={styles.section}>
              <h2 className={styles.sectionTitle}>Frequently Asked Questions</h2>

              <div className={styles.faqList}>
                <div className={styles.faqItem}>
                  <h3 className={styles.faqQuestion}>How long do short URLs last?</h3>
                  <p className={styles.faqAnswer}>
                    By default, short URLs never expire. Pro and Enterprise plans have access to
                    expiration settings where you can set specific expiration dates for time-sensitive campaigns.
                  </p>
                </div>

                <div className={styles.faqItem}>
                  <h3 className={styles.faqQuestion}>Can I edit a short URL after creating it?</h3>
                  <p className={styles.faqAnswer}>
                    Currently, you cannot modify a short URL's destination after creation.
                    If you need to change the destination, delete the existing URL and create a new one.
                    Pro plans will soon support URL editing.
                  </p>
                </div>

                <div className={styles.faqItem}>
                  <h3 className={styles.faqQuestion}>Is there an API for bulk URL creation?</h3>
                  <p className={styles.faqAnswer}>
                    Yes! Enterprise plans include access to our bulk API endpoint which allows
                    you to create up to 1,000 URLs in a single request. Contact sales for details.
                  </p>
                </div>

                <div className={styles.faqItem}>
                  <h3 className={styles.faqQuestion}>How accurate are the analytics?</h3>
                  <p className={styles.faqAnswer}>
                    Our click tracking is real-time and highly accurate. Each redirect through
                    our service increments the click counter. Bot traffic is filtered on Pro and
                    Enterprise plans for more accurate human visitor counts.
                  </p>
                </div>

                <div className={styles.faqItem}>
                  <h3 className={styles.faqQuestion}>Do you support custom domains?</h3>
                  <p className={styles.faqAnswer}>
                    Yes, Enterprise plans support custom domains. You can use your own branded
                    domain for all short URLs. This requires DNS configuration and SSL certificate setup.
                  </p>
                </div>

                <div className={styles.faqItem}>
                  <h3 className={styles.faqQuestion}>What happens if I exceed my plan limits?</h3>
                  <p className={styles.faqAnswer}>
                    Free plans are hard-limited and will receive a 429 error when limits are exceeded.
                    Pro plans have soft limits with overage billing. Enterprise plans have custom
                    arrangements. We always notify you before you hit your limits.
                  </p>
                </div>
              </div>
            </section>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
