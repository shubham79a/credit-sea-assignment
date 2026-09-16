import jwt, { type SignOptions } from 'jsonwebtoken';
import { env } from '../config/env';
import type { Role } from '../constants/roles';

/** Payload embedded in every access token. Kept minimal on purpose. */
export interface JwtPayload {
  sub: string; // user id
  role: Role;
  email: string;
}

export function signToken(payload: JwtPayload): string {
  return jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN as SignOptions['expiresIn'],
  });
}

export function verifyToken(token: string): JwtPayload {
  const decoded = jwt.verify(token, env.JWT_SECRET);
  if (typeof decoded === 'string' || !decoded.sub || !decoded.role) {
    throw new jwt.JsonWebTokenError('Malformed token payload');
  }
  return {
    sub: decoded.sub,
    role: decoded.role as Role,
    email: decoded.email as string,
  };
}
