import mongoose, { Schema, Document } from 'mongoose';

export interface IStation extends Document {
  name: string;
  address: string;
  contactNumber: string;
  email: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const StationSchema: Schema = new Schema(
  {
    name: {
      type: String,
      required: [true, 'Station name is required'],
      trim: true,
      unique: true,
    },
    address: {
      type: String,
      required: [true, 'Station address is required'],
      trim: true,
    },
    contactNumber: {
      type: String,
      required: [true, 'Contact number is required'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      trim: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address'],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Index for faster queries
StationSchema.index({ name: 1 });
StationSchema.index({ isActive: 1 });

export default mongoose.model<IStation>('Station', StationSchema);
