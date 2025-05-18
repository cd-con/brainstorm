export default class LoginProvider {
  constructor(config = {}) {
    this.baseUrl = config.baseUrl || 'https://api.example.com/auth';
    this.headers = {
      'Content-Type': 'application/json',
      ...config.headers,
    };
    this.token = localStorage.getItem('authToken') || null;
  }

  // Установка токена и сохранение в localStorage
  setToken(token) {
    this.token = token;
    if (token) {
      localStorage.setItem('authToken', token);
    } else {
      localStorage.removeItem('authToken');
    }
  }

  // Получение токена
  getToken() {
    return this.token;
  }

  // Проверка, авторизован ли пользователь
  isAuthenticated() {
    return !!this.token;
  }

  // Вход в систему
  async login(credentials) {
    try {
      const response = await fetch(`${this.baseUrl}/login`, {
        method: 'POST',
        headers: this.headers,
        body: JSON.stringify(credentials),
      });

      if (!response.ok) {
        throw new Error(`Login failed: ${response.statusText}`);
      }

      const data = await response.json();
      this.setToken(data.token);
      return data;
    } catch (error) {
      throw new Error(`Login error: ${error.message}`);
    }
  }

  // Регистрация нового пользователя
  async register(userData) {
    try {
      const response = await fetch(`${this.baseUrl}/register`, {
        method: 'POST',
        headers: this.headers,
        body: JSON.stringify(userData),
      });

      if (!response.ok) {
        throw new Error(`Registration failed: ${response.statusText}`);
      }

      const data = await response.json();
      this.setToken(data.token);
      return data;
    } catch (error) {
      throw new Error(`Registration error: ${error.message}`);
    }
  }

  // Выход из системы
  async logout() {
    try {
      const response = await fetch(`${this.baseUrl}/logout`, {
        method: 'POST',
        headers: {
          ...this.headers,
          Authorization: `Bearer ${this.token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Logout failed: ${response.statusText}`);
      }

      this.setToken(null);
      return { success: true };
    } catch (error) {
      throw new Error(`Logout error: ${error.message}`);
    }
  }

  // Обновление токена
  async refreshToken() {
    try {
      const response = await fetch(`${this.baseUrl}/refresh`, {
        method: 'POST',
        headers: {
          ...this.headers,
          Authorization: `Bearer ${this.token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Token refresh failed: ${response.statusText}`);
      }

      const data = await response.json();
      this.setToken(data.token);
      return data;
    } catch (error) {
      this.setToken(null);
      throw new Error(`Token refresh error: ${error.message}`);
    }
  }

  // Получение профиля пользователя
  async getUserProfile() {
    try {
      const response = await fetch(`${this.baseUrl}/profile`, {
        method: 'GET',
        headers: {
          ...this.headers,
          Authorization: `Bearer ${this.token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Profile fetch failed: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      throw new Error(`Profile fetch error: ${error.message}`);
    }
  }
}