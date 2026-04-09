import mongoose, { Schema, Document } from 'mongoose';

export interface IPerson extends Document {
  name: string;
  address: string;
  mobile: string;
  idProofType?: string;
  idProofNumber?: string;
  relationToOwner: string;
  createdAt: Date;
  updatedAt: Date;
}

const PersonSchema: Schema = new Schema(
  {
    name: {
      type: String,
      required: [true, 'Person name is required'],
      trim: true,
    },
    address: {
      type: String,
      required: [true, 'Address is required'],
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
      trim: true,
      enum: ['Aadhar Card', 'PAN Card', 'Driving License', 'Passport', 'Voter ID', 'Other', ''],
    },
    idProofNumber: {
      type: String,
      trim: true,
    },
    relationToOwner: {
      type: String,
      required: [true, 'Relation to owner is required'],
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

// Index for faster searches
PersonSchema.index({ mobile: 1 });
PersonSchema.index({ name: 1 });

export default mongoose.model<IPerson>('Person', PersonSchema);
