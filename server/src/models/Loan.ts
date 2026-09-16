import { Schema, model, type Document, type Model, type Types } from 'mongoose';
import { ALL_LOAN_STATUSES, LOAN_RULES, LOAN_STATUS, type LoanStatus } from '../constants/loan';

/** One entry per status change — the audit trail used by every dashboard module. */
export interface IStatusHistoryEntry {
  from: LoanStatus | null;
  to: LoanStatus;
  by: Types.ObjectId; // user who triggered it (borrower for APPLIED)
  at: Date;
  reason?: string; // e.g. rejection reason
}

export interface ILoan {
  user: Types.ObjectId;
  application: Types.ObjectId;
  principal: number;
  tenureDays: number;
  interestRate: number; // snapshot of the rate at application time
  interest: number;
  totalRepayment: number;
  amountPaid: number;
  status: LoanStatus;
  statusHistory: IStatusHistoryEntry[];
  createdAt: Date;
  updatedAt: Date;
}

export interface ILoanVirtuals {
  /** totalRepayment − amountPaid */
  outstanding: number;
}

export type LoanDocument = Document<Types.ObjectId, object, ILoan> & ILoan & ILoanVirtuals;
type LoanModel = Model<ILoan, object, object, ILoanVirtuals>;

const statusHistorySchema = new Schema<IStatusHistoryEntry>(
  {
    from: { type: String, enum: [...ALL_LOAN_STATUSES, null], default: null },
    to: { type: String, enum: ALL_LOAN_STATUSES, required: true },
    by: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    at: { type: Date, required: true, default: Date.now },
    reason: { type: String, trim: true, maxlength: 500 },
  },
  { _id: false },
);

const loanSchema = new Schema<ILoan, LoanModel, object, object, ILoanVirtuals>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    application: { type: Schema.Types.ObjectId, ref: 'Application', required: true },
    principal: {
      type: Number,
      required: true,
      min: LOAN_RULES.MIN_AMOUNT,
      max: LOAN_RULES.MAX_AMOUNT,
    },
    tenureDays: {
      type: Number,
      required: true,
      min: LOAN_RULES.MIN_TENURE_DAYS,
      max: LOAN_RULES.MAX_TENURE_DAYS,
    },
    interestRate: { type: Number, required: true },
    interest: { type: Number, required: true, min: 0 },
    totalRepayment: { type: Number, required: true, min: 0 },
    amountPaid: { type: Number, required: true, default: 0, min: 0 },
    status: {
      type: String,
      enum: ALL_LOAN_STATUSES,
      default: LOAN_STATUS.APPLIED,
      required: true,
      index: true,
    },
    statusHistory: { type: [statusHistorySchema], default: [] },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform(_doc, ret: Record<string, unknown>) {
        ret.id = String(ret._id);
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  },
);

loanSchema.virtual('outstanding').get(function outstanding(this: ILoan) {
  return Math.round((this.totalRepayment - this.amountPaid + Number.EPSILON) * 100) / 100;
});

export const Loan = model<ILoan, LoanModel>('Loan', loanSchema);
