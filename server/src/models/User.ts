import { Schema, model, type Document, type Model, type Types } from 'mongoose';
import bcrypt from 'bcryptjs';
import { ALL_ROLES, ROLES, type Role } from '../constants/roles';

export interface IUser {
  name: string;
  email: string;
  password: string;
  role: Role;
  createdAt: Date;
  updatedAt: Date;
}

export interface IUserMethods {
  comparePassword(candidate: string): Promise<boolean>;
}

export type UserDocument = Document<Types.ObjectId, object, IUser> & IUser & IUserMethods;
type UserModel = Model<IUser, object, IUserMethods>;

const userSchema = new Schema<IUser, UserModel, IUserMethods>(
  {
    name: { type: String, required: true, trim: true, minlength: 2, maxlength: 100 },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    // Never returned by default — must be explicitly selected for login.
    password: { type: String, required: true, minlength: 6, select: false },
    role: { type: String, enum: ALL_ROLES, default: ROLES.BORROWER, index: true },
  },
  {
    timestamps: true,
    toJSON: {
      transform(_doc, ret: Record<string, unknown>) {
        ret.id = String(ret._id);
        delete ret._id;
        delete ret.__v;
        delete ret.password;
        return ret;
      },
    },
  },
);

// Hash the password whenever it is created or changed.
userSchema.pre('save', async function hashPassword() {
  if (!this.isModified('password')) return;
  this.password = await bcrypt.hash(this.password, 10);
});

userSchema.methods.comparePassword = function comparePassword(candidate: string) {
  return bcrypt.compare(candidate, this.password);
};

export const User = model<IUser, UserModel>('User', userSchema);
