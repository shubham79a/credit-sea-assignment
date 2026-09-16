import type { Request, Response } from 'express';
import * as authService from '../services/auth.service';
import { sendSuccess } from '../utils/response';

export async function register(req: Request, res: Response): Promise<void> {
  const result = await authService.register(req.body);
  sendSuccess(res, result, 201, 'Account created successfully');
}

export async function login(req: Request, res: Response): Promise<void> {
  const result = await authService.login(req.body);
  sendSuccess(res, result, 200, 'Logged in successfully');
}

export async function me(req: Request, res: Response): Promise<void> {
  // `authenticate` guarantees req.user is present on this route.
  const user = await authService.getProfile(req.user!.id);
  sendSuccess(res, { user });
}
