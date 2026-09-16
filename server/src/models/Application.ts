import { Schema, model, type Document, type Model, type Types } from 'mongoose';
import { EMPLOYMENT_MODES, type EmploymentMode } from '../constants/loan';
import type { BreResult } from '../services/bre.service';

export interface IPersonalDetails {
  fullName: string;
  pan: string;
  dateOfBirth: Date;
  monthlySalary: number;
  employmentMode: EmploymentMode;
}

export interface ISalarySlip {
  fileName: string; // name on disk: <userId>-<uuid>.<ext>
  originalName: string; // client's filename, display only
  mimeType: string;
  size: number; // bytes
  url: string; // public path, e.g. /uploads/<fileName>
  uploadedAt: Date;
}

/**
 * One Application per borrower. It carries the eligibility side of the journey
 * (personal details → BRE verdict → salary slip); the actual loan request is a
 * separate Loan document that references this.
 */
export interface IApplication {
  user: Types.ObjectId;
  personalDetails: IPersonalDetails;
  bre: BreResult;
  salarySlip?: ISalarySlip;
  createdAt: Date;
  updatedAt: Date;
}

export type ApplicationDocument = Document<Types.ObjectId, object, IApplication> & IApplication;
type ApplicationModel = Model<IApplication>;

const personalDetailsSchema = new Schema<IPersonalDetails>(
  {
    fullName: { type: String, required: true, trim: true },
    pan: { type: String, required: true, trim: true, uppercase: true },
    dateOfBirth: { type: Date, required: true },
    monthlySalary: { type: Number, required: true, min: 0 },
    employmentMode: { type: String, enum: EMPLOYMENT_MODES, required: true },
  },
  { _id: false },
);

const breFailureSchema = new Schema(
  {
    rule: { type: String, required: true },
    message: { type: String, required: true },
  },
  { _id: false },
);

const breSchema = new Schema<BreResult>(
  {
    passed: { type: Boolean, required: true },
    failures: { type: [breFailureSchema], default: [] },
    evaluatedAt: { type: Date, required: true },
  },
  { _id: false },
);

const salarySlipSchema = new Schema<ISalarySlip>(
  {
    fileName: { type: String, required: true },
    originalName: { type: String, required: true },
    mimeType: { type: String, required: true },
    size: { type: Number, required: true, min: 0 },
    url: { type: String, required: true },
    uploadedAt: { type: Date, required: true },
  },
  { _id: false },
);

const applicationSchema = new Schema<IApplication, ApplicationModel>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    personalDetails: { type: personalDetailsSchema, required: true },
    bre: { type: breSchema, required: true },
    salarySlip: { type: salarySlipSchema, required: false },
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

export const Application = model<IApplication, ApplicationModel>('Application', applicationSchema);
