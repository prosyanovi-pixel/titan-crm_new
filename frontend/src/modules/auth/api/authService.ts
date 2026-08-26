import { api } from "@/lib/api";

export interface LoginCredentials {
  identifier: string;
  password: string;
}

export interface LoginResponse {
  success: boolean;
  token?: string;
  user?: {
    id: string;
    name: string;
    email: string;
    nickname: string;
    role: string;
    initials: string;
    avatar: string;
  };
  error?: string;
}

export interface ForgotPasswordRequest {
  identifier: string;
  method?: "email" | "telegram";
}

export interface ForgotPasswordResponse {
  success: boolean;
  message?: string;
  error?: string;
  requireSelection?: boolean;
  options?: {
    email?: string;
    telegram?: string;
  };
}

export interface ResetPasswordRequest {
  token: string;
  newPassword: string;
}

export interface ResetPasswordResponse {
  success: boolean;
  message?: string;
  error?: string;
}

export const authService = {
  // Login
  login: async (credentials: LoginCredentials): Promise<LoginResponse> => {
    try {
      const response = await api.post("/auth/login", credentials) as Promise<LoginResponse>;
      return response;
    } catch (error) {
      console.error("Ошибка при входе:", error);
      throw error;
    }
  },

  // Forgot password
  forgotPassword: async (
    request: ForgotPasswordRequest
  ): Promise<ForgotPasswordResponse> => {
    try {
      const response = await api.post("/auth/forgot-password", request) as Promise<ForgotPasswordResponse>;
      return response;
    } catch (error) {
      console.error("Ошибка при восстановлении пароля:", error);
      throw error;
    }
  },

  // Reset password
  resetPassword: async (
    request: ResetPasswordRequest
  ): Promise<ResetPasswordResponse> => {
    try {
      const response = await api.post("/auth/reset-password", request) as Promise<ResetPasswordResponse>;
      return response;
    } catch (error) {
      console.error("Ошибка при сбросе пароля:", error);
      throw error;
    }
  },

  // Logout
  logout: (): void => {
    localStorage.removeItem("titan_token");
    localStorage.removeItem("titan_user_id");
    localStorage.removeItem("titan_user_role");
    localStorage.removeItem("titan_user_name");
    localStorage.removeItem("titan_user_email");
    window.location.href = "/login";
  },

  // Check if user is authenticated
  isAuthenticated: (): boolean => {
    const token = localStorage.getItem("titan_token");
    if (!token) return false;

    // Проверяем, не истёк ли JWT токен
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.exp * 1000 > Date.now();
    } catch {
      return false;
    }
  },

  // Get current user info from localStorage
  getCurrentUser: () => {
    return {
      id: localStorage.getItem("titan_user_id"),
      name: localStorage.getItem("titan_user_name"),
      email: localStorage.getItem("titan_user_email"),
      role: localStorage.getItem("titan_user_role"),
      avatar: localStorage.getItem("titan_user_avatar"),
    };
  },

  // Save user info to localStorage
  saveUserInfo: (user: LoginResponse["user"], token: string): void => {
    if (!user) return;
    console.log('[AuthService] saveUserInfo called with:', { userId: user.id, userName: user.name, tokenLength: token?.length });
    localStorage.setItem("titan_token", token);
    localStorage.setItem("titan_user_id", user.id);
    localStorage.setItem("titan_user_name", user.name);
    localStorage.setItem("titan_user_email", user.email);
    localStorage.setItem("titan_user_role", user.role);
    if (user.avatar) {
      localStorage.setItem("titan_user_avatar", user.avatar);
    } else {
      localStorage.removeItem("titan_user_avatar");
    }
    console.log('[AuthService] Verified localStorage after save:', {
      token: localStorage.getItem('titan_token') ? 'SAVED' : 'NOT SAVED',
      userId: localStorage.getItem('titan_user_id'),
      userRole: localStorage.getItem('titan_user_role')
    });
  },

  // Update specific user field in localStorage
  updateUserField: (field: string, value: string | null): void => {
    if (value === null) {
      localStorage.removeItem(`titan_user_${field}`);
    } else {
      localStorage.setItem(`titan_user_${field}`, value);
    }
    window.dispatchEvent(new Event('titan_user_updated'));
  },

  // Get current user permissions from backend
  getCurrentUserPermissions: async (): Promise<{ permissions: string[] }> => {
    try {
      return await api.get('/auth/me');
    } catch (error) {
      console.error('Failed to fetch user permissions:', error);
      throw error;
    }
  },
};
