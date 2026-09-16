import type { Request, Response } from 'express';
import type { LoanStatus } from '../constants/loan';
import * as loanService from '../services/loan.service';
import * as paymentService from '../services/payment.service';
import { sendSuccess } from '../utils/response';

// --- Borrower ---------------------------------------------------------------

export async function apply(req: Request, res: Response): Promise<void> {
  const loan = await loanService.applyForLoan(req.user!.id, req.body);
  sendSuccess(res, { loan }, 201, 'Loan application submitted');
}

export async function getMine(req: Request, res: Response): Promise<void> {
  const loans = await loanService.getMyLoans(req.user!.id);
  sendSuccess(res, { loans });
}

// --- Executives -------------------------------------------------------------

export async function list(req: Request, res: Response): Promise<void> {
  const status = req.query.status as LoanStatus; // validated by listLoansQuerySchema
  const loans = await loanService.listLoansForRole(req.user!, status);
  sendSuccess(res, { loans });
}

export async function getOne(req: Request, res: Response): Promise<void> {
  const loan = await loanService.getLoanForRole(req.user!, req.params.id as string);
  sendSuccess(res, { loan });
}

export async function summary(req: Request, res: Response): Promise<void> {
  const result = await loanService.getSummaryForRole(req.user!);
  sendSuccess(res, result);
}

export async function sanction(req: Request, res: Response): Promise<void> {
  const loan = await loanService.transitionLoan(req.params.id as string, 'SANCTION', req.user!);
  sendSuccess(res, { loan }, 200, 'Loan sanctioned');
}

export async function reject(req: Request, res: Response): Promise<void> {
  const loan = await loanService.transitionLoan(req.params.id as string, 'REJECT', req.user!, req.body.reason);
  sendSuccess(res, { loan }, 200, 'Loan rejected');
}

export async function disburse(req: Request, res: Response): Promise<void> {
  const loan = await loanService.transitionLoan(req.params.id as string, 'DISBURSE', req.user!);
  sendSuccess(res, { loan }, 200, 'Loan disbursed');
}

export async function listPayments(req: Request, res: Response): Promise<void> {
  const result = await paymentService.listPayments(req.user!, req.params.id as string);
  sendSuccess(res, result);
}

export async function recordPayment(req: Request, res: Response): Promise<void> {
  const result = await paymentService.recordPayment(req.user!, req.params.id as string, req.body);
  sendSuccess(res, result, 201, result.closed ? 'Payment recorded — loan fully repaid and closed' : 'Payment recorded');
}
