import { iAmBusy } from '../utility/utils';

class ServerProvider {
  constructor() {
    this.baseUrl = 'http://localhost:6942';
    this.wsUrl = 'ws://localhost:6942';
    this.token = localStorage.getItem('jwt_token') || "i-hate-rgb-0-0-0-people";
    this.ws = null;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectInterval = 3000;
    this.callbacks = new Map();
    this.isConnected = false;
  }

  // Authentication Methods
  async login(credentials) {
    try {
      const response = await fetch(`${this.baseUrl}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
      });

      if (!response.ok) {
        throw new Error('Login failed');
      }

      const data = await response.json();
      this.token = data.token;
      localStorage.setItem('jwt_token', this.token);
      await this.connectWebSocket();
      return true;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    }
  }

  async logout() {
    try {
      if (this.ws) {
        this.ws.close();
      }
      this.token = null;
      localStorage.removeItem('jwt_token');
      this.isConnected = false;
      return true;
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    }
  }

  getToken() {
    return this.token;
  }

  // User Profile
  async getUserProfile() {
    try {
      const response = await this.authenticatedFetch(`${this.baseUrl}/users/profile`);
      if (!response.ok) throw new Error('Failed to fetch profile');
      return await response.json();
    } catch (error) {
      console.error('Profile fetch error:', error);
      throw error;
    }
  }

  // Room Management
  async createRoom(name) {
    try {
      const response = await this.authenticatedFetch(`${this.baseUrl}/rooms`, {
        method: 'POST',
        body: JSON.stringify({ name }),
      });
      if (!response.ok) throw new Error('Failed to create room');
      return await response.json();
    } catch (error) {
      console.error('Create room error:', error);
      throw error;
    }
  }

  async deleteRoom(roomId) {
    try {
      const response = await this.authenticatedFetch(`${this.baseUrl}/rooms/${roomId}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete room');
      return true;
    } catch (error) {
      console.error('Delete room error:', error);
      throw error;
    }
  }

  // WebSocket Connection
  async connectWebSocket() {
    if (!this.token) {
      throw new Error('No JWT token available');
    }

    return new Promise((resolve, reject) => {
      this.ws = new WebSocket(`${this.wsUrl}/ws?token=${this.token}`);

      this.ws.onopen = () => {
        this.isConnected = true;
        this.reconnectAttempts = 0;
        console.log('WebSocket connected');
        resolve();
      };

      this.ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        if (this.callbacks.has(data.type)) {
          this.callbacks.get(data.type)(data);
        }
      };

      this.ws.onclose = () => {
        this.isConnected = false;
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
          setTimeout(() => {
            this.reconnectAttempts++;
            this.connectWebSocket();
          }, this.reconnectInterval);
        }
      };

      this.ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        this.isConnected = false;
        reject(error);
      };
    });
  }

  // WebSocket Synchronization
  async syncUpdate(id, type, properties, revertCallback) {
    if (!this.isConnected) {
      await this.connectWebSocket();
    }

    return new Promise((resolve) => {
      const message = {
        id,
        type,
        properties,
        timestamp: Date.now(),
      };

      this.ws.send(JSON.stringify(message));

      // For simplicity, assuming server acknowledges updates
      // In a production environment, you'd want to wait for server confirmation
      resolve({ success: true });
    }).catch((error) => {
      iAmBusy(`Sync update failed: ${error.message}`);
      if (revertCallback) revertCallback();
      return { success: false, error: error.message };
    });
  }

  async uploadImage(id, dataUrl) {
    try {
      const response = await this.authenticatedFetch(`${this.baseUrl}/images/${id}`, {
        method: 'POST',
        body: JSON.stringify({ dataUrl }),
      });
      if (!response.ok) throw new Error('Failed to upload image');
      return true;
    } catch (error) {
      console.error('Image upload error:', error);
      throw error;
    }
  }

  // Register WebSocket callback for specific data types
  registerCallback(type, callback) {
    this.callbacks.set(type, callback);
  }

  // Helper method for authenticated fetch requests
  async authenticatedFetch(url, options = {}) {
    if (!this.token) {
      throw new Error('No JWT token available');
    }

    const headers = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${this.token}`,
      ...options.headers,
    };

    return fetch(url, {
      ...options,
      headers,
    });
  }

  // Check if user is authenticated
  isAuthenticated() {
    return !!this.token;
  }
}

export default ServerProvider;