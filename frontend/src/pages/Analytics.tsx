import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  api,
  type AnalyticsResponse,
  type AnalyticsOverviewResponse,
} from '../utils/api';
import styles from './Analytics.module.css';

type DateRange = '7d' | '30d' | '90d' | 'custom';

export default function Analytics() {
  const { shortCode } = useParams<{ shortCode?: string }>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [data, setData] = useState<AnalyticsResponse | AnalyticsOverviewResponse | null>(null);
  const [dateRange, setDateRange] = useState<DateRange>('7d');

  useEffect(() => {
    fetchAnalytics();
  }, [shortCode, dateRange]);

  const getDateRange = () => {
    const now = new Date();
    let from: Date;

    switch (dateRange) {
      case '7d':
        from = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        from = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case '90d':
        from = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      default:
        from = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    }

    return { from: from.toISOString(), to: now.toISOString() };
  };

  const fetchAnalytics = async () => {
    setLoading(true);
    setError('');

    try {
      const { from, to } = getDateRange();
      if (shortCode) {
        const result = await api.getAnalytics(shortCode, { from, to });
        setData(result);
      } else {
        const result = await api.getAnalyticsOverview({ from, to, limit: 10 });
        setData(result);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load analytics');
    } finally {
      setLoading(false);
    }
  };

  const isSpecificUrl = (d: AnalyticsResponse | AnalyticsOverviewResponse): d is AnalyticsResponse => {
    return 'shortCode' in d && 'originalUrl' in d;
  };

  const formatNumber = (num: number): string => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const getMaxClicks = (timeline: { date: string; clicks: number }[]) => {
    return Math.max(...timeline.map((t) => t.clicks), 1);
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  if (loading) {
    return (
      <div className={styles.analytics}>
        <div className="container">
          <div className={styles.loading}>
            <svg className={styles.spinner} width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 12a9 9 0 1 1-6.219-8.56" />
            </svg>
            <p>Loading analytics...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.analytics}>
        <div className="container">
          <div className={styles.error}>
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <h3>Error loading analytics</h3>
            <p>{error}</p>
            <button onClick={fetchAnalytics} className={styles.retryButton}>
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className={styles.analytics}>
        <div className="container">
          <div className={styles.empty}>
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M3 3v18h18" />
              <path d="M18.7 8l-5.1 5.2-2.8-2.7L7 14.3" />
            </svg>
            <h3>No analytics data</h3>
            <p>There's no data available for this time period.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.analytics}>
      <div className="container">
        <motion.div
          className={styles.header}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className={styles.headerLeft}>
            <h1 className={styles.title}>
              {isSpecificUrl(data) ? 'URL Analytics' : 'Analytics Overview'}
            </h1>
            {isSpecificUrl(data) && (
              <p className={styles.urlInfo}>
                <span className={styles.shortCodeBadge}>{data.shortCode}</span>
                <span className={styles.originalUrl}>{data.originalUrl}</span>
              </p>
            )}
          </div>
          <div className={styles.headerActions}>
            <div className={styles.dateRangePicker}>
              {(['7d', '30d', '90d'] as DateRange[]).map((range) => (
                <button
                  key={range}
                  className={`${styles.dateRangeButton} ${dateRange === range ? styles.active : ''}`}
                  onClick={() => setDateRange(range)}
                >
                  {range === '7d' ? 'Last 7 days' : range === '30d' ? 'Last 30 days' : 'Last 90 days'}
                </button>
              ))}
            </div>
          </div>
        </motion.div>

        <motion.div
          className={styles.statsGrid}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <div className={styles.statCard}>
            <div className={styles.statIcon}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
            </div>
            <div className={styles.statContent}>
              <span className={styles.statValue}>{formatNumber(data.totalClicks)}</span>
              <span className={styles.statLabel}>Total Clicks</span>
            </div>
          </div>

          {isSpecificUrl(data) && (
            <div className={styles.statCard}>
              <div className={styles.statIcon}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="2" y1="12" x2="22" y2="12" />
                  <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                </svg>
              </div>
              <div className={styles.statContent}>
                <span className={styles.statValue}>{data.uniqueCountries}</span>
                <span className={styles.statLabel}>Countries</span>
              </div>
            </div>
          )}

          {!isSpecificUrl(data) && (
            <div className={styles.statCard}>
              <div className={styles.statIcon}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                  <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                </svg>
              </div>
              <div className={styles.statContent}>
                <span className={styles.statValue}>{(data as AnalyticsOverviewResponse).totalUrls}</span>
                <span className={styles.statLabel}>Total URLs</span>
              </div>
            </div>
          )}

          <div className={styles.statCard}>
            <div className={styles.statIcon}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
                <line x1="8" y1="21" x2="16" y2="21" />
                <line x1="12" y1="17" x2="12" y2="21" />
              </svg>
            </div>
            <div className={styles.statContent}>
              <span className={styles.statValue}>
                {data.browsers[0]?.name || 'N/A'}
              </span>
              <span className={styles.statLabel}>Top Browser</span>
            </div>
          </div>

          <div className={styles.statCard}>
            <div className={styles.statIcon}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="5" y="2" width="14" height="20" rx="2" ry="2" />
                <line x1="12" y1="18" x2="12.01" y2="18" />
              </svg>
            </div>
            <div className={styles.statContent}>
              <span className={styles.statValue}>
                {data.devices[0]?.type || 'N/A'}
              </span>
              <span className={styles.statLabel}>Top Device</span>
            </div>
          </div>
        </motion.div>

        <motion.div
          className={styles.chartCard}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <h2 className={styles.cardTitle}>Clicks Over Time</h2>
          <div className={styles.timelineChart}>
            {data.timeline.length === 0 ? (
              <div className={styles.noData}>No data for this period</div>
            ) : (
              <>
                <div className={styles.chartBars}>
                  {data.timeline.map((entry, index) => (
                    <div key={entry.date} className={styles.barContainer}>
                      <div
                        className={styles.bar}
                        style={{
                          height: `${(entry.clicks / getMaxClicks(data.timeline)) * 100}%`,
                          animationDelay: `${index * 50}ms`,
                        }}
                        title={`${entry.clicks} clicks`}
                      />
                      <span className={styles.barLabel}>{formatDate(entry.date)}</span>
                    </div>
                  ))}
                </div>
                <div className={styles.chartYAxis}>
                  <span>{formatNumber(getMaxClicks(data.timeline))}</span>
                  <span>{formatNumber(Math.floor(getMaxClicks(data.timeline) / 2))}</span>
                  <span>0</span>
                </div>
              </>
            )}
          </div>
        </motion.div>

        <div className={styles.chartsRow}>
          <motion.div
            className={styles.chartCard}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <h2 className={styles.cardTitle}>Browser Distribution</h2>
            <div className={styles.pieChartContainer}>
              {data.browsers.length === 0 ? (
                <div className={styles.noData}>No browser data</div>
              ) : (
                <>
                  <div className={styles.donutChart}>
                    <svg viewBox="0 0 100 100" className={styles.donutSvg}>
                      {(() => {
                        let offset = 0;
                        const colors = ['var(--color-accent)', 'var(--color-primary)', '#6366f1', '#8b5cf6', '#a855f7'];
                        return data.browsers.slice(0, 5).map((browser, i) => {
                          const percentage = browser.percentage;
                          const circumference = 2 * Math.PI * 40;
                          const strokeDasharray = `${(percentage / 100) * circumference} ${circumference}`;
                          const rotation = offset * 3.6 - 90;
                          offset += percentage;
                          return (
                            <circle
                              key={browser.name}
                              cx="50"
                              cy="50"
                              r="40"
                              fill="none"
                              stroke={colors[i]}
                              strokeWidth="12"
                              strokeDasharray={strokeDasharray}
                              transform={`rotate(${rotation} 50 50)`}
                              className={styles.donutSegment}
                            />
                          );
                        });
                      })()}
                    </svg>
                    <div className={styles.donutCenter}>
                      <span className={styles.donutValue}>{data.browsers.length}</span>
                      <span className={styles.donutLabel}>Browsers</span>
                    </div>
                  </div>
                  <div className={styles.legend}>
                    {data.browsers.slice(0, 5).map((browser, i) => {
                      const colors = ['var(--color-accent)', 'var(--color-primary)', '#6366f1', '#8b5cf6', '#a855f7'];
                      return (
                        <div key={browser.name} className={styles.legendItem}>
                          <span className={styles.legendColor} style={{ background: colors[i] }} />
                          <span className={styles.legendName}>{browser.name}</span>
                          <span className={styles.legendValue}>{browser.percentage}%</span>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </div>
          </motion.div>

          <motion.div
            className={styles.chartCard}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <h2 className={styles.cardTitle}>Device Types</h2>
            <div className={styles.barChartContainer}>
              {data.devices.length === 0 ? (
                <div className={styles.noData}>No device data</div>
              ) : (
                <div className={styles.horizontalBars}>
                  {data.devices.map((device) => (
                    <div key={device.type} className={styles.horizontalBarRow}>
                      <div className={styles.horizontalBarLabel}>
                        <span className={styles.deviceIcon}>
                          {device.type === 'Desktop' && (
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
                              <line x1="8" y1="21" x2="16" y2="21" />
                              <line x1="12" y1="17" x2="12" y2="21" />
                            </svg>
                          )}
                          {device.type === 'Mobile' && (
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <rect x="5" y="2" width="14" height="20" rx="2" ry="2" />
                              <line x1="12" y1="18" x2="12.01" y2="18" />
                            </svg>
                          )}
                          {device.type === 'Tablet' && (
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <rect x="4" y="2" width="16" height="20" rx="2" ry="2" />
                              <line x1="12" y1="18" x2="12.01" y2="18" />
                            </svg>
                          )}
                        </span>
                        {device.type}
                      </div>
                      <div className={styles.horizontalBarWrapper}>
                        <div
                          className={styles.horizontalBar}
                          style={{ width: `${device.percentage}%` }}
                        />
                      </div>
                      <div className={styles.horizontalBarValue}>
                        {formatNumber(device.clicks)} ({device.percentage}%)
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        </div>

        <div className={styles.chartsRow}>
          <motion.div
            className={styles.chartCard}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
          >
            <h2 className={styles.cardTitle}>Top Countries</h2>
            <div className={styles.countryList}>
              {data.countries.length === 0 ? (
                <div className={styles.noData}>No country data</div>
              ) : (
                data.countries.slice(0, 10).map((country, index) => (
                  <div key={country.code} className={styles.countryRow}>
                    <span className={styles.countryRank}>{index + 1}</span>
                    <span className={styles.countryName}>
                      {country.name}
                    </span>
                    <div className={styles.countryBarWrapper}>
                      <div
                        className={styles.countryBar}
                        style={{ width: `${country.percentage}%` }}
                      />
                    </div>
                    <span className={styles.countryValue}>
                      {formatNumber(country.clicks)}
                    </span>
                  </div>
                ))
              )}
            </div>
          </motion.div>

          {isSpecificUrl(data) && (
            <motion.div
              className={styles.chartCard}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.6 }}
            >
              <h2 className={styles.cardTitle}>Top Referrers</h2>
              <div className={styles.referrerList}>
                {data.referrers.length === 0 ? (
                  <div className={styles.noData}>No referrer data</div>
                ) : (
                  data.referrers.slice(0, 10).map((referrer) => (
                    <div key={referrer.domain} className={styles.referrerRow}>
                      <span className={styles.referrerIcon}>
                        {referrer.domain === 'Direct' ? (
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="12" cy="12" r="10" />
                            <path d="M12 8v4l3 3" />
                          </svg>
                        ) : (
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                            <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                          </svg>
                        )}
                      </span>
                      <span className={styles.referrerDomain}>{referrer.domain}</span>
                      <div className={styles.referrerBarWrapper}>
                        <div
                          className={styles.referrerBar}
                          style={{ width: `${referrer.percentage}%` }}
                        />
                      </div>
                      <span className={styles.referrerValue}>
                        {formatNumber(referrer.clicks)}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          )}

          {!isSpecificUrl(data) && (
            <motion.div
              className={styles.chartCard}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.6 }}
            >
              <h2 className={styles.cardTitle}>Top URLs</h2>
              <div className={styles.topUrlsList}>
                {(data as AnalyticsOverviewResponse).topUrls.length === 0 ? (
                  <div className={styles.noData}>No URL data</div>
                ) : (
                  (data as AnalyticsOverviewResponse).topUrls.map((url, index) => (
                    <Link
                      key={url.shortCode}
                      to={`/analytics/${url.shortCode}`}
                      className={styles.topUrlRow}
                    >
                      <span className={styles.topUrlRank}>{index + 1}</span>
                      <div className={styles.topUrlInfo}>
                        <span className={styles.topUrlCode}>{url.shortCode}</span>
                        <span className={styles.topUrlOriginal}>{url.originalUrl}</span>
                      </div>
                      <span className={styles.topUrlClicks}>{formatNumber(url.clicks)}</span>
                    </Link>
                  ))
                )}
              </div>
            </motion.div>
          )}
        </div>

        {isSpecificUrl(data) && data.topCities.length > 0 && (
          <motion.div
            className={styles.chartCard}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.7 }}
          >
            <h2 className={styles.cardTitle}>Top Cities</h2>
            <div className={styles.citiesGrid}>
              {data.topCities.map((city, index) => (
                <div key={`${city.city}-${city.country}`} className={styles.cityCard}>
                  <span className={styles.cityRank}>{index + 1}</span>
                  <div className={styles.cityInfo}>
                    <span className={styles.cityName}>{city.city}</span>
                    <span className={styles.cityCountry}>{city.country}</span>
                  </div>
                  <span className={styles.cityClicks}>{formatNumber(city.clicks)}</span>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
