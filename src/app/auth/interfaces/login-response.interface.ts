export interface LoginResponse {
  token: string;
  refreshToken: string;
  expirationToken: number;
  expirationRefreshToken: number;
}
