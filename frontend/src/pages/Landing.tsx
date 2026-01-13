import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { api } from '../utils/api';
import styles from './Landing.module.css';

export default function Landing() {
  const navigate = useNavigate();
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await api.shorten(url);
      navigate('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const fadeUp = {
    initial: { opacity: 0, y: 30 },
    animate: { opacity: 1, y: 0 },
  };

  const stagger = {
    animate: {
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  return (
    <div className={styles.landing}>
      {/* Hero Section */}
      <section className={styles.hero}>
        <div className={styles.heroBackground}>
          <div className={styles.gradientOrb1} />
          <div className={styles.gradientOrb2} />
          <div className={styles.gridPattern} />
        </div>

        <motion.div
          className={`container ${styles.heroContent}`}
          initial="initial"
          animate="animate"
          variants={stagger}
        >
          <motion.span className={styles.badge} variants={fadeUp}>
            Trusted by 10,000+ users worldwide
          </motion.span>

          <motion.h1 className={styles.heroTitle} variants={fadeUp}>
            Shorten URLs.<br />
            <span className={styles.accent}>Amplify reach.</span>
          </motion.h1>

          <motion.p className={styles.heroSubtitle} variants={fadeUp}>
            Transform long, unwieldy links into memorable short URLs.
            Track clicks, analyze performance, and share with confidence.
          </motion.p>

          <motion.form
            className={styles.heroForm}
            onSubmit={handleSubmit}
            variants={fadeUp}
          >
            <div className={styles.inputWrapper}>
              <svg className={styles.inputIcon} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
              </svg>
              <input
                type="url"
                placeholder="Paste your long URL here..."
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                required
                className={styles.heroInput}
              />
            </div>
            <button type="submit" className={styles.heroButton} disabled={loading}>
              {loading ? 'Shortening...' : 'Shorten URL'}
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </button>
          </motion.form>
          {error && <p className={styles.error}>{error}</p>}

          <motion.div className={styles.heroStats} variants={fadeUp}>
            <div className={styles.stat}>
              <span className={styles.statNumber}>2.5M+</span>
              <span className={styles.statLabel}>Links created</span>
            </div>
            <div className={styles.statDivider} />
            <div className={styles.stat}>
              <span className={styles.statNumber}>99.9%</span>
              <span className={styles.statLabel}>Uptime</span>
            </div>
            <div className={styles.statDivider} />
            <div className={styles.stat}>
              <span className={styles.statNumber}>&lt;50ms</span>
              <span className={styles.statLabel}>Redirect speed</span>
            </div>
          </motion.div>
        </motion.div>
      </section>

      {/* Features Section */}
      <section className={styles.features} id="features">
        <div className="container">
          <motion.div
            className={styles.sectionHeader}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <span className={styles.sectionLabel}>Features</span>
            <h2 className={styles.sectionTitle}>Everything you need</h2>
            <p className={styles.sectionSubtitle}>
              Powerful tools to manage, track, and optimize your links.
            </p>
          </motion.div>

          <div className={styles.featuresGrid}>
            {[
              {
                icon: (
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
                  </svg>
                ),
                title: 'Lightning Fast',
                description: 'Our global CDN ensures your links redirect in milliseconds, providing the best user experience.',
              },
              {
                icon: (
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
                  </svg>
                ),
                title: 'Analytics Dashboard',
                description: 'Track clicks, geographic data, and referrers. Understand your audience and optimize campaigns.',
              },
              {
                icon: (
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                ),
                title: 'Custom Aliases',
                description: 'Create branded, memorable short links with custom aliases that reflect your brand identity.',
              },
              {
                icon: (
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                  </svg>
                ),
                title: 'Enterprise Security',
                description: 'Bank-level encryption and security protocols keep your data and links safe from threats.',
              },
              {
                icon: (
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                    <polyline points="22,6 12,13 2,6" />
                  </svg>
                ),
                title: 'API Access',
                description: 'Integrate with your existing tools and workflows using our comprehensive REST API.',
              },
              {
                icon: (
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" />
                    <polyline points="12 6 12 12 16 14" />
                  </svg>
                ),
                title: 'Link Expiration',
                description: 'Set expiration dates for time-sensitive campaigns. Links automatically deactivate when needed.',
              },
            ].map((feature, index) => (
              <motion.div
                key={index}
                className={styles.featureCard}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <div className={styles.featureIcon}>{feature.icon}</div>
                <h3 className={styles.featureTitle}>{feature.title}</h3>
                <p className={styles.featureDescription}>{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className={styles.pricing} id="pricing">
        <div className="container">
          <motion.div
            className={styles.sectionHeader}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <span className={styles.sectionLabel}>Pricing</span>
            <h2 className={styles.sectionTitle}>Simple, transparent pricing</h2>
            <p className={styles.sectionSubtitle}>
              Choose the plan that fits your needs. No hidden fees.
            </p>
          </motion.div>

          <div className={styles.pricingGrid}>
            {[
              {
                name: 'Free',
                price: '$0',
                period: 'forever',
                description: 'Perfect for personal projects and testing',
                features: [
                  '100 short links/month',
                  'Basic analytics',
                  'Standard redirects',
                  'Community support',
                ],
                cta: 'Get Started',
                highlighted: false,
              },
              {
                name: 'Pro',
                price: '$12',
                period: '/month',
                description: 'For professionals and growing businesses',
                features: [
                  'Unlimited short links',
                  'Advanced analytics',
                  'Custom aliases',
                  'API access',
                  'Priority support',
                  'Link expiration',
                ],
                cta: 'Start Free Trial',
                highlighted: true,
              },
              {
                name: 'Enterprise',
                price: 'Custom',
                period: '',
                description: 'For large teams with advanced needs',
                features: [
                  'Everything in Pro',
                  'Custom domain',
                  'SSO integration',
                  'Dedicated support',
                  'SLA guarantee',
                  'Custom integrations',
                ],
                cta: 'Contact Sales',
                highlighted: false,
              },
            ].map((plan, index) => (
              <motion.div
                key={index}
                className={`${styles.pricingCard} ${plan.highlighted ? styles.highlighted : ''}`}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                {plan.highlighted && <span className={styles.popularBadge}>Most Popular</span>}
                <h3 className={styles.planName}>{plan.name}</h3>
                <div className={styles.planPrice}>
                  <span className={styles.priceAmount}>{plan.price}</span>
                  <span className={styles.pricePeriod}>{plan.period}</span>
                </div>
                <p className={styles.planDescription}>{plan.description}</p>
                <ul className={styles.planFeatures}>
                  {plan.features.map((feature, i) => (
                    <li key={i}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                      {feature}
                    </li>
                  ))}
                </ul>
                <button className={`${styles.planButton} ${plan.highlighted ? styles.primaryButton : ''}`}>
                  {plan.cta}
                </button>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className={styles.testimonials}>
        <div className="container">
          <motion.div
            className={styles.sectionHeader}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <span className={styles.sectionLabel}>Testimonials</span>
            <h2 className={styles.sectionTitle}>Loved by teams worldwide</h2>
          </motion.div>

          <div className={styles.testimonialsGrid}>
            {[
              {
                quote: "Snip.ly transformed how we share content. The analytics alone have improved our campaign performance by 40%. It's become an essential tool for our marketing team.",
                author: 'Sarah Chen',
                role: 'Head of Marketing',
                company: 'TechFlow Inc.',
                avatar: 'SC',
              },
              {
                quote: "The API integration was seamless. We were up and running in less than an hour. Our developers love the clean documentation and reliable uptime.",
                author: 'Marcus Rodriguez',
                role: 'CTO',
                company: 'DataSync Labs',
                avatar: 'MR',
              },
              {
                quote: "Custom aliases have been a game-changer for our brand. Every link we share now reinforces our identity. The enterprise features are worth every penny.",
                author: 'Emily Watson',
                role: 'Brand Director',
                company: 'Elevate Agency',
                avatar: 'EW',
              },
            ].map((testimonial, index) => (
              <motion.div
                key={index}
                className={styles.testimonialCard}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <div className={styles.testimonialQuote}>
                  <svg className={styles.quoteIcon} width="32" height="32" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M11.3 8.3c-.3-.3-.7-.3-1 0l-.7.7V6.5c0-.4-.3-.8-.8-.8H6.5c-.4 0-.8.3-.8.8v5c0 .4.3.8.8.8h2c.4 0 .8-.3.8-.8v-.2l2 2c.3.3.7.3 1 0 .3-.3.3-.7 0-1l-1-1zm6 0c-.3-.3-.7-.3-1 0l-.7.7V6.5c0-.4-.3-.8-.8-.8h-2.3c-.4 0-.8.3-.8.8v5c0 .4.3.8.8.8h2c.4 0 .8-.3.8-.8v-.2l2 2c.3.3.7.3 1 0 .3-.3.3-.7 0-1l-1-1z"/>
                  </svg>
                  <p>{testimonial.quote}</p>
                </div>
                <div className={styles.testimonialAuthor}>
                  <div className={styles.avatar}>{testimonial.avatar}</div>
                  <div>
                    <p className={styles.authorName}>{testimonial.author}</p>
                    <p className={styles.authorRole}>{testimonial.role}, {testimonial.company}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className={styles.cta}>
        <div className="container">
          <motion.div
            className={styles.ctaContent}
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className={styles.ctaTitle}>Ready to get started?</h2>
            <p className={styles.ctaSubtitle}>
              Join thousands of users who trust Snip.ly for their link management needs.
            </p>
            <div className={styles.ctaButtons}>
              <button className={styles.ctaPrimary} onClick={() => navigate('/dashboard')}>
                Create Your First Link
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </button>
              <button className={styles.ctaSecondary} onClick={() => navigate('/docs')}>
                View Documentation
              </button>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
