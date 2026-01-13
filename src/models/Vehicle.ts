import mongoose, { Schema, Document } from 'mongoose';

export enum VehicleType {
  BIKE = 'bike',
  CAR = 'car',
  TRUCK = 'truck',
  OTHER = 'other',
}

export enum VehicleStatus {
  IN_SERVICE = 'in_service',
  DELIVERED = 'delivered',
  PENDING = 'pending',
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

export interface IVehicle extends Document {
  serialNumber: string;
  vehicleType: VehicleType;
  companyBrand: string;
  registrationNumber: string;
  engineNumber: string;
  chassisNumber: string;
  ownerId: mongoose.Types.ObjectId;
  dropOffPersonId?: mongoose.Types.ObjectId;
  pickUpPersonId?: mongoose.Types.ObjectId;
  dateSubmitted: Date;
  dateCollected?: Date;
  status: VehicleStatus;
  stationId: mongoose.Types.ObjectId;
  documents: IVehicleDocument[];
  createdBy: mongoose.Types.ObjectId;
  updatedBy?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

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
    registrationNumber: {
      type: String,
      required: [true, 'Registration number is required'],
      trim: true,
      uppercase: true,
    },
    engineNumber: {
      type: String,
      required: [true, 'Engine number is required'],
      trim: true,
      uppercase: true,
    },
    chassisNumber: {
      type: String,
      required: [true, 'Chassis number is required'],
      trim: true,
      uppercase: true,
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

export default mongoose.model<IVehicle>('Vehicle', VehicleSchema);
