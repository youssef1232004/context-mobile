// Auth form types
export interface LoginFormValues {
  email: string;
  password: string;
}

export interface RegisterFormValues {
  fullName: string;
  username: string;
  email: string;
  password: string;
  persona: 'general' | 'professional' | 'student' | 'developer';
}

// API response types
export interface AuthUser {
  id: string;
  fullName: string;
  username: string;
  email: string;
  persona: 'general' | 'professional' | 'student' | 'developer';
  avatar?: string;
  createdAt?: string;
}

export interface AuthResponse {
  success: boolean;
  token: string;
  user: AuthUser;
}

export interface ProfileUpdateData {
  fullName?: string;
  username?: string;
  email?: string;
  password?: string;
  currentPassword?: string;
  persona?: string;
}
