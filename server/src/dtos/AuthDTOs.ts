export interface AuthUser {
  id: string;
  name: string | null;
  email: string | null;
  image?: string | null;
}

export interface SignupRequest {
  email: string;
  password: string;
  name?: string;
}

export interface SignupResponse {
  message: string;
  user: AuthUser;
}

export interface VerifyCredentialsRequest {
  email: string;
  password: string;
}

export interface VerifyCredentialsResponse {
  message: string;
  user: AuthUser;
}

export interface AuthErrorResponse {
  error: string;
}
