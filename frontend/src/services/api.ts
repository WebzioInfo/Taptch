import type { ApiResponse } from '../types';
import { env } from '../config/env';

const API_BASE_URL = env.apiUrl;

export class ApiClient {
  private static async request<T>(
    endpoint: string,
    options: RequestInit = {},
  ): Promise<T> {
    const base = (API_BASE_URL || '').replace(/\/+$/, '');
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;

    let url: string;
    if (base) {
      if (base.endsWith('/api') && cleanEndpoint.startsWith('/api/')) {
        url = `${base.slice(0, -4)}${cleanEndpoint}`;
      } else {
        url = `${base}${cleanEndpoint}`;
      }
    } else {
      url = cleanEndpoint;
    }

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...((options.headers as Record<string, string>) || {}),
    };

    const config: RequestInit = {
      ...options,
      headers,
      credentials: 'include', // Automatically passes better-auth.session_token cookie
    };

    const response = await fetch(url, config);

    if (response.status === 204) {
      return {} as T;
    }

    let json: ApiResponse<T>;
    const rawText = await response.text();
    try {
      json = JSON.parse(rawText);
    } catch {
      throw new Error(rawText || `Request failed with HTTP status ${response.status}`);
    }

    if (!response.ok || json.success === false) {
      const errorMsg = json.error?.message || `Request failed with status ${response.status}`;
      throw new Error(errorMsg);
    }

    return (json.data !== undefined ? json.data : (json as unknown as T));
  }

  static get<T>(endpoint: string, headers?: Record<string, string>): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET', headers });
  }

  static post<T>(endpoint: string, body?: unknown, headers?: Record<string, string>): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
      headers,
    });
  }

  static patch<T>(endpoint: string, body?: unknown, headers?: Record<string, string>): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PATCH',
      body: body ? JSON.stringify(body) : undefined,
      headers,
    });
  }

  static put<T>(endpoint: string, body?: unknown, headers?: Record<string, string>): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: body ? JSON.stringify(body) : undefined,
      headers,
    });
  }

  static delete<T>(endpoint: string, headers?: Record<string, string>): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE', headers });
  }
}
