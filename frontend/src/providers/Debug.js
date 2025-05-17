class LoginProvider {
  constructor(config = {}) {
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
        console.log(credentials)
      if (credentials.email === "test" && credentials.password === "test"){
        this.setToken("test");
        return true;
      }
      return false;
    } catch (error) {
      throw new Error(`Login error: ${error.message}`);
    }
  }

  // Регистрация нового пользователя
  async register(userData) {
    try {
      this.setToken("test");
      return { success: true };
    } catch (error) {
      throw new Error(`Registration error: ${error.message}`);
    }
  }

  // Выход из системы
  async logout() {
    try {
      this.setToken(null);
      return { success: true };
    } catch (error) {
      throw new Error(`Logout error: ${error.message}`);
    }
  }

  // Обновление токена
  async refreshToken() {
    try {
      this.setToken("test");
      return { success: true };
    } catch (error) {
      this.setToken(null);
      throw new Error(`Token refresh error: ${error.message}`);
    }
  }

  // Получение профиля пользователя
  async getUserProfile() {
    try {
      return {
        username: "Test user | NO AUTH SERVER",
        ppic: "cdn.myapp.com/user/88696988",
        rooms: [
            {
                id: "room-uuid-for-sync",
                name: "Test room | NO SYNC",
                isOwner: true,
            },
            {
                id: "room-uuid-for-sync-noowner",
                name: "Test room (Not owner) | NO SYNC",
                isOwner: false,
            }
        ]
      }
    } catch (error) {
      throw new Error(`Profile fetch error: ${error.message}`);
    }
  }
}

export default LoginProvider;