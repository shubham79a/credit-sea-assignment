import type { Request, Response } from 'express';
import * as loanService from '../services/loan.service';
import { sendSuccess } from '../utils/response';

export async function apply(req: Request, res: Response): Promise<void> {
  const loan = await loanService.applyForLoan(req.user!.id, req.body);
  sendSuccess(res, { loan }, 201, 'Loan application submitted');
}

export async function getMine(req: Request, res: Response): Promise<void> {
  const loans = await loanService.getMyLoans(req.user!.id);
  sendSuccess(res, { loans });
}
