import mongoose from 'mongoose';

const serviceAreaSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Service area name is required'],
      unique: true,
      trim: true,
      minlength: [2, 'Service area name must be at least 2 characters long'],
      maxlength: [100, 'Service area name cannot exceed 100 characters'],
    },
    code: {
      type: String,
      required: [true, 'Service area code is required'],
      unique: true,
      trim: true,
      uppercase: true,
      match: [/^[A-Z0-9_-]{2,20}$/, 'Service area code must be 2-20 alphanumeric characters'],
    },
    village: {
      type: String,
      trim: true,
      default: '',
      maxlength: [100, 'Village name cannot exceed 100 characters'],
    },
    mandal: {
      type: String,
      trim: true,
      default: '',
      maxlength: [100, 'Mandal/Tehsil name cannot exceed 100 characters'],
    },
    district: {
      type: String,
      trim: true,
      default: '',
      maxlength: [100, 'District name cannot exceed 100 characters'],
    },
    city: {
      type: String,
      required: [true, 'City/Town is required'],
      default: 'Hyderabad',
      trim: true,
      maxlength: [60, 'City name cannot exceed 60 characters'],
    },
    state: {
      type: String,
      required: [true, 'State is required'],
      default: 'Telangana',
      trim: true,
      maxlength: [60, 'State name cannot exceed 60 characters'],
    },
    country: {
      type: String,
      default: 'India',
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
        default: [78.3967, 17.4849],
        validate: {
          validator: function (coords) {
            if (!Array.isArray(coords) || coords.length !== 2) return false;
            const [lng, lat] = coords;
            return lng >= -180 && lng <= 180 && lat >= -90 && lat <= 90;
          },
          message: 'Center coordinates must be valid GeoJSON [longitude, latitude]',
        },
      },
    },
    description: {
      type: String,
      trim: true,
      default: '',
      maxlength: [500, 'Description cannot exceed 500 characters'],
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (doc, ret) => {
        delete ret.__v;
        return ret;
      },
    },
    toObject: {
      virtuals: true,
    },
  }
);

// High-speed indices for jurisdiction resolution and spatial queries
serviceAreaSchema.index({ centerLocation: '2dsphere' });
serviceAreaSchema.index({ isActive: 1, district: 1, mandal: 1 });
serviceAreaSchema.index({ pincodes: 1 });
serviceAreaSchema.index({ isActive: 1, city: 1 });

const ServiceArea = mongoose.model('ServiceArea', serviceAreaSchema);

export default ServiceArea;
