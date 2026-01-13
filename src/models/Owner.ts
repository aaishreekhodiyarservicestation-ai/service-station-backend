import mongoose, { Schema, Document } from 'mongoose';

export interface IOwner extends Document {
  name: string;
  address: string;
  mobile: string;
  idProofType: string;
  idProofNumber: string;
  createdAt: Date;
  updatedAt: Date;
}

const OwnerSchema: Schema = new Schema(
  {
    name: {
      type: String,
      required: [true, 'Owner name is required'],
      trim: true,
    },
    address: {
      type: String,
      required: [true, 'Owner address is required'],
      trim: true,
    },
    mobile: {
      type: String,
      required: [true, 'Mobile number is required'],
      trim: true,
      match: [/^[0-9]{10}$/, 'Please provide a valid 10-digit mobile number'],
    },
    idProofType: {
      type: String,
      required: [true, 'ID proof type is required'],
      trim: true,
      enum: ['Aadhar Card', 'PAN Card', 'Driving License', 'Passport', 'Voter ID', 'Other'],
    },
    idProofNumber: {
      type: String,
      required: [true, 'ID proof number is required'],
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

// Index for faster searches
OwnerSchema.index({ mobile: 1 });
OwnerSchema.index({ name: 1 });

export default mongoose.model<IOwner>('Owner', OwnerSchema);
