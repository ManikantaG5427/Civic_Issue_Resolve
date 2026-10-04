import mongoose from 'mongoose';

const issueCategorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Category name is required'],
      unique: true,
      trim: true,
      minlength: [2, 'Category name must be at least 2 characters long'],
      maxlength: [100, 'Category name cannot exceed 100 characters'],
    },
    code: {
      type: String,
      required: [true, 'Category code is required'],
      unique: true,
      trim: true,
      uppercase: true,
      match: [/^[A-Z0-9_-]{2,20}$/, 'Category code must be 2-20 alphanumeric characters'],
    },
    description: {
      type: String,
      trim: true,
      default: '',
      maxlength: [500, 'Description cannot exceed 500 characters'],
    },
    defaultDepartment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Department',
      required: [true, 'Default department reference is required'],
      index: true,
    },
    defaultPriority: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical'],
      default: 'medium',
    },
    estimatedSlaHours: {
      type: Number,
      default: 48,
      min: [1, 'Estimated SLA hours must be at least 1'],
      max: [720, 'Estimated SLA hours cannot exceed 720'],
    },
    requiresProofImage: {
      type: Boolean,
      default: true,
    },
    icon: {
      type: String,
      default: 'alert-circle',
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

issueCategorySchema.index({ isActive: 1, defaultDepartment: 1 });

const IssueCategory = mongoose.model('IssueCategory', issueCategorySchema);

export default IssueCategory;
