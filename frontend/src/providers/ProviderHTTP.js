class ProviderHTTP {
  constructor() {
    this.baseUrl = 'http://localhost:6943';
    this.token = document.cookie.split('; ').find(c => c.startsWith('jwt_token='))?.split('=')[1] || null;
  }

  async login(cred) {
    try {
      const res = await fetch(`${this.baseUrl}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cred),
      });
      if (!res.ok) throw new Error();

      const { token } = await res.json();
      this.token = token;
      document.cookie = `jwt_token=${token}; path=/; SameSite=Strict`;
      return true;
    } catch (e) {
      console.error('Login error:', e);
      return false;
    }
  }

  async register(cred) {
    try {
      cred.ppic = 'null';
      const res = await fetch(`${this.baseUrl}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cred),
      });

      if (!res.ok)
        return false;

      const { token } = await res.json();
      this.token = token;
      document.cookie = `jwt_token=${token}; path=/; SameSite=Strict`;
      return true;
    } catch {
      return false;
    }
  }

  async logout() {
    try {
      this.token = null;
      document.cookie = 'jwt_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
      return true;
    } catch (e) {
      console.error('Logout error:', e);
      throw e;
    }
  }

  async getUserProfile() {
    try {
      const res = await this.authFetch(`${this.baseUrl}/users/profile`);
      if (!res.ok) throw new Error();
      return await res.json();
    } catch (e) {
      console.error('Profile error:', e);
      throw e;
    }
  }

  async createRoom(name) {
    try {
      const res = await this.authFetch(`${this.baseUrl}/rooms`, {
        method: 'POST',
        body: JSON.stringify({ name }),
      });
      if (!res.ok) throw new Error();
      return await res.json();
    } catch (e) {
      console.error('Create room error:', e);
      throw e;
    }
  }

  async deleteRoom(id) {
    try {
      const res = await this.authFetch(`${this.baseUrl}/rooms/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error();
      return true;
    } catch (e) {
      console.error('Delete room error:', e);
      throw e;
    }
  }

  async uploadImage(id, dataUrl) {
    try {
      const res = await this.authFetch(`${this.baseUrl}/images/${id}`, {
        method: 'POST',
        body: JSON.stringify({ dataUrl }),
      });
      if (!res.ok) throw new Error();
      return true;
    } catch (e) {
      console.error('Image upload error:', e);
      throw e;
    }
  }

  async authFetch(url, opts = {}) {
    console.log("token")
    if (!this.token) throw new Error('No token');
    return fetch(url, {
      ...opts,
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${this.token}`, ...opts.headers },
    });
  }

  getToken() {
    return this.token;
  }

  isAuthenticated() {
    return !!this.token;
  }
}

export default ProviderHTTP;