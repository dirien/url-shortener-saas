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
};
