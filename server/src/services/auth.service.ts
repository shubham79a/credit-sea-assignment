import { ROLES } from '../constants/roles';
import { User, type UserDocument } from '../models/User';
import { ApiError } from '../utils/ApiError';
import { signToken } from '../utils/jwt';
import type { LoginInput, RegisterInput } from '../validators/auth.validator';

export interface AuthResult {
  token: string;
  user: ReturnType<UserDocument['toJSON']>;
}

function buildAuthResult(user: UserDocument): AuthResult {
  const token = signToken({ sub: String(user._id), role: user.role, email: user.email });
  return { token, user: user.toJSON() };
}

/**
 * Public self-registration always creates a BORROWER. Executive accounts are
 * provisioned by the seed script (or an admin) — never through this endpoint.
 */
export async function register(input: RegisterInput): Promise<AuthResult> {
  const existing = await User.exists({ email: input.email });
  if (existing) {
    throw ApiError.conflict('An account with this email already exists');
  }

  const user = await User.create({ ...input, role: ROLES.BORROWER });
  return buildAuthResult(user);
}

export async function login(input: LoginInput): Promise<AuthResult> {
  const user = await User.findOne({ email: input.email }).select('+password');

  // Same message for unknown email and wrong password to avoid user enumeration.
  if (!user || !(await user.comparePassword(input.password))) {
    throw ApiError.unauthorized('Invalid email or password');
  }

  return buildAuthResult(user);
}

export async function getProfile(userId: string): Promise<UserDocument> {
  const user = await User.findById(userId);
  if (!user) {
    throw ApiError.notFound('User not found');
  }
  return user;
}
