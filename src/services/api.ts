import { UserProfile, LeaderboardEntry } from '../types';

const TOKEN_KEY = 'gridbox_auth_token';
const LEGACY_TOKEN_KEY = 'dotgrid_auth_token';
const USER_KEY = 'gridbox_user';

export const api = {
  getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY) || localStorage.getItem(LEGACY_TOKEN_KEY);
  },

  setToken(token: string) {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(LEGACY_TOKEN_KEY, token);
  },

  clearToken() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(LEGACY_TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  },

  getUser(): UserProfile | null {
    try {
      const saved = localStorage.getItem(USER_KEY);
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  },

  setUser(user: UserProfile | null) {
    if (user) {
      localStorage.setItem(USER_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(USER_KEY);
    }
  },

  async register(data: {
    username: string;
    password: string;
    displayName?: string;
  }): Promise<{ token: string; user: UserProfile }> {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const json = await res.json();
    if (!res.ok) {
      throw new Error(json.error || 'Registration failed');
    }
    this.setToken(json.token);
    this.setUser(json.user);
    return json;
  },

  async login(data: {
    username: string;
    password: string;
  }): Promise<{ token: string; user: UserProfile }> {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const json = await res.json();
    if (!res.ok) {
      throw new Error(json.error || 'Login failed');
    }
    this.setToken(json.token);
    this.setUser(json.user);
    return json;
  },

  async loginWithGoogle(data?: {
    credential?: string;
    email?: string;
    name?: string;
    avatar?: string;
  }): Promise<{ token: string; user: UserProfile }> {
    const res = await fetch('/api/auth/google', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data || {}),
    });
    const json = await res.json();
    if (!res.ok) {
      throw new Error(json.error || 'Google sign-in failed');
    }
    this.setToken(json.token);
    this.setUser(json.user);
    return json;
  },

  async getMe(): Promise<UserProfile | null> {
    const token = this.getToken();
    if (!token) return null;
    try {
      const res = await fetch('/api/auth/me', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        // If 401 and we have cached user, keep user logged in locally unless explicitly logged out
        return this.getUser();
      }
      const data = await res.json();
      if (data.user) {
        this.setUser(data.user);
        return data.user;
      }
      return this.getUser();
    } catch {
      return this.getUser();
    }
  },

  async updateProfile(data: {
    displayName?: string;
    color?: string;
    avatar?: string;
  }): Promise<UserProfile> {
    const token = this.getToken();
    if (!token) throw new Error('Not authenticated');
    const res = await fetch('/api/auth/profile', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });
    const json = await res.json();
    if (!res.ok) {
      throw new Error(json.error || 'Failed to update profile');
    }
    this.setUser(json.user);
    return json.user;
  },

  async getLeaderboard(): Promise<LeaderboardEntry[]> {
    try {
      const res = await fetch('/api/leaderboard');
      const data = await res.json();
      return data.leaderboard || [];
    } catch {
      return [];
    }
  },
};
