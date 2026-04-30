export interface User {
  id: string;
  email: string;
  password_hash?: string;
  created_at: Date;
  updated_at: Date;
}

export interface Profile {
  id: string;
  email?: string;
  full_name?: string;
  avatar_url?: string;
  role: 'user' | 'seller';
  phone?: string;
  gender?: string;
  created_at: Date;
  updated_at: Date;
}

export interface JwtPayload {
  userId: string;
  email: string;
  role: string;
  provider?: string;
}

declare global {
  namespace Express {
    interface User extends JwtPayload {}
  }
}
