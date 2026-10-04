import mongoose from 'mongoose';

const pendingRegistrationSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
    },
    phone: {
      type: String,
      default: '',
    },
    role: {
      type: String,
      enum: ['citizen', 'field_worker', 'administrator'],
      default: 'citizen',
    },
    verificationCode: {
      type: String,
      required: true,
    },
    expiresAt: {
      type: Date,
      required: true,
      index: { expires: 0 }, // Automatically delete after expiry (MongoDB TTL index)
    },
  },
  {
    timestamps: true,
  }
);

const PendingRegistration = mongoose.model('PendingRegistration', pendingRegistrationSchema);

export default PendingRegistration;
