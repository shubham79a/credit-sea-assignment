import { LOAN_STATUS } from '../constants/loan';
import { Loan, type LoanDocument } from '../models/Loan';
import { Payment, type PaymentDocument } from '../models/Payment';
import type { AuthUser } from '../types/express';
import { ApiError } from '../utils/ApiError';
import type { RecordPaymentInput } from '../validators/payment.validator';
import { round2 } from './loan-calculator';
import { getLoanForRole, transitionLoan } from './loan.service';

const formatInr = (amount: number): string =>
  `₹${amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export async function listPayments(
  actor: AuthUser,
  loanId: string,
): Promise<{ loan: LoanDocument; payments: PaymentDocument[] }> {
  const loan = await getLoanForRole(actor, loanId);
  const payments = await Payment.find({ loan: loan._id }).sort({ paidAt: -1, createdAt: -1 });
  return { loan, payments };
}

/**
 * Records a repayment against a DISBURSED loan and auto-closes it when the
 * total paid reaches the total repayment.
 *
 * Ordering matters:
 *   1. Insert the Payment first — the unique index on `utr` is the duplicate guard (409).
 *   2. Atomically increment `amountPaid` ONLY if the loan is still DISBURSED and the
 *      payment doesn't overshoot ($expr guards the race between two executives).
 *   3. If step 2 finds no matching loan, delete the payment (compensation — no
 *      multi-document transaction needed, so this also works on a standalone Mongo).
 *   4. If paid == total, run the CLOSE transition, recording who closed it.
 */
export async function recordPayment(
  actor: AuthUser,
  loanId: string,
  input: RecordPaymentInput,
): Promise<{ payment: PaymentDocument; loan: LoanDocument; closed: boolean }> {
  const loan = await Loan.findById(loanId);
  if (!loan) throw ApiError.notFound('Loan not found');
  if (loan.status !== LOAN_STATUS.DISBURSED) {
    throw ApiError.conflict(`Payments can only be recorded on disbursed loans (loan is ${loan.status})`);
  }

  const amount = round2(input.amount);
  const outstanding = round2(loan.totalRepayment - loan.amountPaid);
  if (amount > outstanding) {
    throw ApiError.badRequest(`Payment exceeds the outstanding balance of ${formatInr(outstanding)}`);
  }

  const payment = await Payment.create({
    loan: loan._id,
    borrower: loan.user,
    utr: input.utr,
    amount,
    paidAt: input.paidAt,
    recordedBy: actor.id,
  });

  const updated = await Loan.findOneAndUpdate(
    {
      _id: loan._id,
      status: LOAN_STATUS.DISBURSED,
      $expr: { $lte: [{ $round: [{ $add: ['$amountPaid', amount] }, 2] }, '$totalRepayment'] },
    },
    { $inc: { amountPaid: amount } },
    { new: true },
  );

  if (!updated) {
    await Payment.deleteOne({ _id: payment._id });
    throw ApiError.conflict('Loan changed while recording the payment — please refresh and retry');
  }

  // Float drift guard: $inc can leave 0.30000000000000004; normalise to paise.
  const rounded = round2(updated.amountPaid);
  if (rounded !== updated.amountPaid) {
    updated.amountPaid = rounded;
    await updated.save();
  }

  const closed = rounded >= updated.totalRepayment;
  const finalLoan = closed ? await transitionLoan(loanId, 'CLOSE', actor) : await reload(loanId);

  return { payment, loan: finalLoan, closed };
}

async function reload(loanId: string): Promise<LoanDocument> {
  const loan = await Loan.findById(loanId)
    .populate('user', 'name email')
    .populate('application', 'personalDetails salarySlip bre.passed');
  if (!loan) throw ApiError.notFound('Loan not found');
  return loan;
}
