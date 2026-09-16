import type { Request, Response } from 'express';
import * as leadService from '../services/lead.service';
import { sendSuccess } from '../utils/response';

export async function list(_req: Request, res: Response): Promise<void> {
  const result = await leadService.getLeads();
  sendSuccess(res, result);
}
