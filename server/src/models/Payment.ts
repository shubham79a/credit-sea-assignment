import { Schema, model, type Document, type Model, type Types } from 'mongoose';

export interface IPayment {
  loan: Types.ObjectId;
  borrower: Types.ObjectId;
  /** Bank UTR — globally unique across all payments. */
  utr: string;
  amount: number;
  paidAt: Date;
  recordedBy: Types.ObjectId; // collection executive
  createdAt: Date;
  updatedAt: Date;
}

export type PaymentDocument = Document<Types.ObjectId, object, IPayment> & IPayment;
type PaymentModel = Model<IPayment>;

const paymentSchema = new Schema<IPayment, PaymentModel>(
  {
    loan: { type: Schema.Types.ObjectId, ref: 'Loan', required: true, index: true },
    borrower: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    utr: { type: String, required: true, trim: true, uppercase: true, unique: true },
    amount: { type: Number, required: true, min: 0.01 },
    paidAt: { type: Date, required: true },
    recordedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  {
    timestamps: true,
    toJSON: {
      transform(_doc, ret: Record<string, unknown>) {
        ret.id = String(ret._id);
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  },
);

export const Payment = model<IPayment, PaymentModel>('Payment', paymentSchema);
