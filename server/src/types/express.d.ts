import type { Role } from '../constants/roles';

/** The authenticated principal attached to `req.user` by the auth middleware. */
export interface AuthUser {
  id: string;
  role: Role;
  email: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}
