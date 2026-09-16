import type { Role } from '../constants/roles';
import type { ApplicationDocument } from '../models/Application';

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
      /** Set by `requireEligibleApplication` for post-BRE borrower routes. */
      application?: ApplicationDocument;
    }
  }
}
