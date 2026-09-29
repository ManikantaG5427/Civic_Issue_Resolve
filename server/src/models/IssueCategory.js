import mongoose from 'mongoose';

const issueCategorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Category name is required'],
      unique: true,
      trim: true,
    },
    code: {
      type: String,
      required: [true, 'Category code is required'],
      unique: true,
      trim: true,
      uppercase: true,
    },
    description: {
      type: String,
      trim: true,
      default: '',
    },
    defaultDepartment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Department',
      required: [true, 'Default department reference is required'],
    },
    defaultPriority: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical'],
      default: 'medium',
    },
    estimatedSlaHours: {
      type: Number,
      default: 48,
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
    },
  },
  {
    timestamps: true,
  }
);

const IssueCategory = mongoose.model('IssueCategory', issueCategorySchema);

export default IssueCategory;
