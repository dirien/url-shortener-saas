const API_BASE = '/api';

export interface UrlEntry {
  shortCode: string;
  originalUrl: string;
  clickCount: number;
  createdAt: string;
}

export interface ShortenResponse {
  shortCode: string;
  originalUrl: string;
}

export interface StatsResponse {
  shortCode: string;
  originalUrl: string;
  clickCount: number;
  createdAt: string;
}

export interface AnalyticsBrowser {
  name: string;
  clicks: number;
  percentage: number;
}

export interface AnalyticsDevice {
  type: string;
  clicks: number;
  percentage: number;
}

export interface AnalyticsCountry {
  code: string;
  name: string;
  clicks: number;
  percentage: number;
}

export interface AnalyticsReferrer {
  domain: string;
  clicks: number;
  percentage: number;
}

export interface AnalyticsCity {
  city: string;
  country: string;
  clicks: number;
}

export interface TimelineEntry {
  date: string;
  clicks: number;
}

export interface AnalyticsResponse {
  shortCode: string;
  originalUrl: string;
  totalClicks: number;
  uniqueCountries: number;
  period: {
    from: string;
    to: string;
  };
  timeline: TimelineEntry[];
  browsers: AnalyticsBrowser[];
  devices: AnalyticsDevice[];
  countries: AnalyticsCountry[];
  referrers: AnalyticsReferrer[];
  topCities: AnalyticsCity[];
}

export interface AnalyticsOverviewResponse {
  totalClicks: number;
  totalUrls: number;
  period: {
    from: string;
    to: string;
  };
  timeline: TimelineEntry[];
  topUrls: {
    shortCode: string;
    originalUrl: string;
    clicks: number;
  }[];
  browsers: AnalyticsBrowser[];
  devices: AnalyticsDevice[];
  countries: AnalyticsCountry[];
}

export const api = {
  async shorten(url: string, alias?: string): Promise<ShortenResponse> {
    const response = await fetch(`${API_BASE}/shorten`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ url, alias }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to shorten URL');
    }

    return response.json();
  },

  async list(): Promise<{ urls: UrlEntry[] }> {
    const response = await fetch(`${API_BASE}/urls`);

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch URLs');
    }

    return response.json();
  },

  async getStats(shortCode: string): Promise<StatsResponse> {
    const response = await fetch(`${API_BASE}/stats/${shortCode}`);

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch stats');
    }

    return response.json();
  },

  async delete(shortCode: string): Promise<void> {
    const response = await fetch(`${API_BASE}/${shortCode}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to delete URL');
    }
  },

  getRedirectUrl(shortCode: string): string {
    return `${API_BASE}/${shortCode}`;
  },

  async getAnalytics(
    shortCode: string,
    options?: { from?: string; to?: string; granularity?: 'hour' | 'day' | 'week' }
  ): Promise<AnalyticsResponse> {
    const params = new URLSearchParams();
    if (options?.from) params.append('from', options.from);
    if (options?.to) params.append('to', options.to);
    if (options?.granularity) params.append('granularity', options.granularity);

    const queryString = params.toString();
    const url = `${API_BASE}/analytics/${shortCode}${queryString ? `?${queryString}` : ''}`;

    const response = await fetch(url);

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch analytics');
    }

    return response.json();
  },

  async getAnalyticsOverview(
    options?: { from?: string; to?: string; granularity?: 'hour' | 'day' | 'week'; limit?: number }
  ): Promise<AnalyticsOverviewResponse> {
    const params = new URLSearchParams();
    if (options?.from) params.append('from', options.from);
    if (options?.to) params.append('to', options.to);
    if (options?.granularity) params.append('granularity', options.granularity);
    if (options?.limit) params.append('limit', options.limit.toString());

    const queryString = params.toString();
    const url = `${API_BASE}/analytics/overview${queryString ? `?${queryString}` : ''}`;

    const response = await fetch(url);

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch analytics overview');
    }

    return response.json();
  },
};
