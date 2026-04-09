import mongoose, { Schema, Document } from 'mongoose';

export enum VehicleType {
  GEAR = 'gear',
  NON_GEAR = 'non_gear',
}

export enum VehicleStatus {
  PENDING = 'pending',
  COMPLETED = 'completed',
  DELIVERED = 'delivered',
}

export enum DocumentType {
  RC = 'rc',
  ID_PROOF_OWNER = 'id_proof_owner',
  ID_PROOF_PERSON = 'id_proof_person',
}

export interface IVehicleDocument {
  type: DocumentType;
  cloudinaryUrl: string;
  cloudinaryPublicId: string;
  uploadedAt: Date;
}

export interface IPayment {
  amount: number;
  description: string;
  createdAt: Date;
  createdBy: mongoose.Types.ObjectId;
}

export interface IVehicle extends Document {
  serialNumber: string;
  vehicleType: VehicleType;
  companyBrand: string;
  modelNumber?: string;
  registrationNumber: string;
  engineNumber?: string;
  chassisNumber?: string;
  kmDriven?: number;
  description?: string;
  ownerId: mongoose.Types.ObjectId;
  dropOffPersonId?: mongoose.Types.ObjectId;
  pickUpPersonId?: mongoose.Types.ObjectId;
  dateSubmitted: Date;
  dateCollected?: Date;
  status: VehicleStatus;
  stationId: mongoose.Types.ObjectId;
  documents: IVehicleDocument[];
  advancePayment: number;
  payments: IPayment[];
  nextServiceDate?: Date;
  serviceReminderDate?: Date;
  serviceReminderStatus: 'pending' | 'completed';
  createdBy: mongoose.Types.ObjectId;
  updatedBy?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const PaymentSchema = new Schema(
  {
    amount: { type: Number, required: true },
    description: { type: String, default: '' },
    createdAt: { type: Date, default: Date.now },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { _id: true }
);

const VehicleSchema: Schema = new Schema(
  {
    serialNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    vehicleType: {
      type: String,
      enum: Object.values(VehicleType),
      required: [true, 'Vehicle type is required'],
    },
    companyBrand: {
      type: String,
      required: [true, 'Company/Brand is required'],
      trim: true,
    },
    modelNumber: {
      type: String,
      trim: true,
    },
    registrationNumber: {
      type: String,
      required: [true, 'Registration number is required'],
      trim: true,
      uppercase: true,
    },
    engineNumber: {
      type: String,
      trim: true,
      uppercase: true,
    },
    chassisNumber: {
      type: String,
      trim: true,
      uppercase: true,
    },
    kmDriven: {
      type: Number,
      min: 0,
    },
    description: {
      type: String,
      trim: true,
    },
    ownerId: {
      type: Schema.Types.ObjectId,
      ref: 'Owner',
      required: [true, 'Owner is required'],
    },
    dropOffPersonId: {
      type: Schema.Types.ObjectId,
      ref: 'Person',
    },
    pickUpPersonId: {
      type: Schema.Types.ObjectId,
      ref: 'Person',
    },
    dateSubmitted: {
      type: Date,
      required: [true, 'Submission date is required'],
      default: Date.now,
    },
    dateCollected: {
      type: Date,
    },
    status: {
      type: String,
      enum: Object.values(VehicleStatus),
      default: VehicleStatus.PENDING,
    },
    stationId: {
      type: Schema.Types.ObjectId,
      ref: 'Station',
      required: [true, 'Station is required'],
    },
    documents: [
      {
        type: {
          type: String,
          enum: Object.values(DocumentType),
          required: true,
        },
        cloudinaryUrl: {
          type: String,
          required: true,
        },
        cloudinaryPublicId: {
          type: String,
          required: true,
        },
        uploadedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    advancePayment: {
      type: Number,
      default: 0,
      min: 0,
    },
    payments: [PaymentSchema],
    nextServiceDate: {
      type: Date,
    },
    serviceReminderDate: {
      type: Date,
    },
    serviceReminderStatus: {
      type: String,
      enum: ['pending', 'completed'],
      default: 'pending',
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    updatedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for faster searches and queries
VehicleSchema.index({ serialNumber: 1 });
VehicleSchema.index({ registrationNumber: 1 });
VehicleSchema.index({ status: 1 });
VehicleSchema.index({ stationId: 1 });
VehicleSchema.index({ createdAt: -1 });
VehicleSchema.index({ dateSubmitted: -1 });
VehicleSchema.index({ ownerId: 1 });

// Compound indexes for common queries
VehicleSchema.index({ stationId: 1, status: 1 });
VehicleSchema.index({ stationId: 1, createdAt: -1 });
VehicleSchema.index({ serviceReminderDate: 1, serviceReminderStatus: 1 });

export default mongoose.model<IVehicle>('Vehicle', VehicleSchema);
