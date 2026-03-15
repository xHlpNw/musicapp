export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  tokenType: string;
  expiresInSeconds: number;
  userId: number;
  username: string;
  avatarUrl?: string | null;
  /** Версия для cache-busting URL аватара (добавляется на клиенте) */
  avatarVersion?: number;
  admin?: boolean;
}

export interface UpdateProfileRequest {
  username: string;
}

export interface UpdatePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

export interface ErrorResponse {
  error: string;
  details?: { [key: string]: string };
}
