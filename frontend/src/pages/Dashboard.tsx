import { useState, useEffect, type FormEvent } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { api, type UrlEntry } from '../utils/api';
import styles from './Dashboard.module.css';

export default function Dashboard() {
  const [urls, setUrls] = useState<UrlEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [url, setUrl] = useState('');
  const [alias, setAlias] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  useEffect(() => {
    fetchUrls();
  }, []);

  const fetchUrls = async () => {
    try {
      const data = await api.list();
      setUrls(data.urls);
    } catch (err) {
      console.error('Failed to fetch URLs:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSubmitting(true);

    try {
      const result = await api.shorten(url, alias || undefined);
      setSuccess(`Created short URL: ${result.shortCode}`);
      setUrl('');
      setAlias('');
      fetchUrls();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create short URL');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (shortCode: string) => {
    try {
      await api.delete(shortCode);
      setUrls(urls.filter(u => u.shortCode !== shortCode));
    } catch (err) {
      console.error('Failed to delete URL:', err);
    }
  };

  const copyToClipboard = async (shortCode: string) => {
    const shortUrl = `${window.location.origin}/api/${shortCode}`;
    try {
      await navigator.clipboard.writeText(shortUrl);
      setCopiedCode(shortCode);
      setTimeout(() => setCopiedCode(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <div className={styles.dashboard}>
      <div className="container">
        <motion.div
          className={styles.header}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className={styles.title}>Dashboard</h1>
          <p className={styles.subtitle}>Create and manage your short URLs</p>
        </motion.div>

        <motion.div
          className={styles.createCard}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <h2 className={styles.cardTitle}>Create New Short URL</h2>
          <form onSubmit={handleSubmit} className={styles.form}>
            <div className={styles.formRow}>
              <div className={styles.inputGroup}>
                <label htmlFor="url" className={styles.label}>Long URL</label>
                <div className={styles.inputWrapper}>
                  <svg className={styles.inputIcon} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                    <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                  </svg>
                  <input
                    type="url"
                    id="url"
                    placeholder="https://example.com/your-very-long-url"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    required
                    className={styles.input}
                  />
                </div>
              </div>

              <div className={styles.inputGroup}>
                <label htmlFor="alias" className={styles.label}>
                  Custom Alias <span className={styles.optional}>(optional)</span>
                </label>
                <div className={styles.inputWrapper}>
                  <svg className={styles.inputIcon} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
                    <line x1="7" y1="7" x2="7.01" y2="7" />
                  </svg>
                  <input
                    type="text"
                    id="alias"
                    placeholder="my-custom-link"
                    value={alias}
                    onChange={(e) => setAlias(e.target.value)}
                    pattern="^[a-zA-Z0-9_-]{3,20}$"
                    className={styles.input}
                  />
                </div>
                <span className={styles.hint}>3-20 characters: letters, numbers, hyphens, underscores</span>
              </div>
            </div>

            <button type="submit" className={styles.submitButton} disabled={submitting}>
              {submitting ? (
                <>
                  <svg className={styles.spinner} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                  </svg>
                  Creating...
                </>
              ) : (
                <>
                  Create Short URL
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M5 12h14M12 5l7 7-7 7" />
                  </svg>
                </>
              )}
            </button>
          </form>

          <AnimatePresence>
            {error && (
              <motion.div
                className={styles.alert + ' ' + styles.alertError}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                {error}
              </motion.div>
            )}
            {success && (
              <motion.div
                className={styles.alert + ' ' + styles.alertSuccess}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                  <polyline points="22 4 12 14.01 9 11.01" />
                </svg>
                {success}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        <motion.div
          className={styles.urlsSection}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <div className={styles.urlsHeader}>
            <h2 className={styles.cardTitle}>Your URLs</h2>
            <span className={styles.urlCount}>{urls.length} links</span>
          </div>

          {loading ? (
            <div className={styles.loading}>
              <svg className={styles.spinner} width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 12a9 9 0 1 1-6.219-8.56" />
              </svg>
              <p>Loading your URLs...</p>
            </div>
          ) : urls.length === 0 ? (
            <div className={styles.empty}>
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
              </svg>
              <h3>No URLs yet</h3>
              <p>Create your first short URL using the form above.</p>
            </div>
          ) : (
            <div className={styles.urlsList}>
              <AnimatePresence>
                {urls.map((urlEntry, index) => (
                  <motion.div
                    key={urlEntry.shortCode}
                    className={styles.urlCard}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                  >
                    <div className={styles.urlMain}>
                      <div className={styles.shortUrl}>
                        <span className={styles.shortCode}>{urlEntry.shortCode}</span>
                        <button
                          className={styles.copyButton}
                          onClick={() => copyToClipboard(urlEntry.shortCode)}
                        >
                          {copiedCode === urlEntry.shortCode ? (
                            <>
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <polyline points="20 6 9 17 4 12" />
                              </svg>
                              Copied!
                            </>
                          ) : (
                            <>
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                              </svg>
                              Copy
                            </>
                          )}
                        </button>
                      </div>
                      <p className={styles.originalUrl}>{urlEntry.originalUrl}</p>
                    </div>

                    <div className={styles.urlMeta}>
                      <div className={styles.stat}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                          <circle cx="12" cy="12" r="3" />
                        </svg>
                        <span>{urlEntry.clickCount} clicks</span>
                      </div>
                      <div className={styles.stat}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                          <line x1="16" y1="2" x2="16" y2="6" />
                          <line x1="8" y1="2" x2="8" y2="6" />
                          <line x1="3" y1="10" x2="21" y2="10" />
                        </svg>
                        <span>{formatDate(urlEntry.createdAt)}</span>
                      </div>
                      <button
                        className={styles.deleteButton}
                        onClick={() => handleDelete(urlEntry.shortCode)}
                        aria-label="Delete URL"
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <polyline points="3 6 5 6 21 6" />
                          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                          <line x1="10" y1="11" x2="10" y2="17" />
                          <line x1="14" y1="11" x2="14" y2="17" />
                        </svg>
                      </button>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
