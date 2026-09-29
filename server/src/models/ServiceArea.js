import mongoose from 'mongoose';

const serviceAreaSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Service area name is required'],
      unique: true,
      trim: true,
    },
    code: {
      type: String,
      required: [true, 'Service area code is required'],
      unique: true,
      trim: true,
      uppercase: true,
    },
    city: {
      type: String,
      required: true,
      default: 'Hyderabad',
      trim: true,
    },
    state: {
      type: String,
      required: true,
      default: 'Telangana',
      trim: true,
    },
    pincodes: [
      {
        type: String,
        trim: true,
      },
    ],
    centerLocation: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point',
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        default: [78.3967, 17.4849], // Kukatpally coordinates
      },
    },
    description: {
      type: String,
      trim: true,
      default: '',
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

serviceAreaSchema.index({ centerLocation: '2dsphere' });

const ServiceArea = mongoose.model('ServiceArea', serviceAreaSchema);

export default ServiceArea;
