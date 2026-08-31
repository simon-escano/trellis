export interface User {
  id: string;
  email: string;
  createdAt: string;
  isGuest: boolean;
}

export interface AuthPayload {
  token: string;
  user: User;
}
