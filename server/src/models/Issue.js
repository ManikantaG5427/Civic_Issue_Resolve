import mongoose from 'mongoose';

const timelineEntrySchema = new mongoose.Schema(
  {
    status: {
      type: String,
      required: true,
    },
    action: {
      type: String,
      required: true,
    },
    performedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    note: {
      type: String,
      trim: true,
      default: '',
    },
    visibility: {
      type: String,
      enum: ['public', 'internal'],
      default: 'public',
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: true }
);

const auditLogSchema = new mongoose.Schema(
  {
    action: {
      type: String,
      required: true,
    },
    performedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    previousState: mongoose.Schema.Types.Mixed,
    newState: mongoose.Schema.Types.Mixed,
    ipAddress: String,
    timestamp: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: true }
);

const issueSchema = new mongoose.Schema(
  {
    issueNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
    },
    title: {
      type: String,
      required: [true, 'Issue title is required'],
      trim: true,
      minlength: [5, 'Title must be at least 5 characters long'],
      maxlength: [120, 'Title cannot exceed 120 characters'],
    },
    description: {
      type: String,
      required: [true, 'Issue description is required'],
      trim: true,
      minlength: [15, 'Description must be at least 15 characters long'],
      maxlength: [2000, 'Description cannot exceed 2000 characters'],
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'IssueCategory',
      required: [true, 'Category is required'],
    },
    serviceArea: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ServiceArea',
      required: [true, 'Service area is required'],
    },
    department: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Department',
      default: null,
    },
    reporter: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Reporter reference is required'],
    },
    status: {
      type: String,
      enum: [
        'submitted',
        'under_review',
        'info_requested',
        'verified',
        'rejected',
        'assigned',
        'in_progress',
        'resolved_verification_pending',
        'closed',
        'reopened',
      ],
      default: 'submitted',
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical'],
      default: 'medium',
    },
    location: {
      address: {
        type: String,
        trim: true,
        default: 'Kukatpally, Hyderabad',
      },
      landmark: {
        type: String,
        required: [true, 'Landmark is required'],
        trim: true,
        maxlength: [150, 'Landmark cannot exceed 150 characters'],
      },
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point',
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        required: true,
        default: [78.3967, 17.4849],
      },
    },
    evidence: [
      {
        url: { type: String, required: true },
        filename: String,
        fileSize: Number,
        mimeType: String,
        stage: {
          type: String,
          enum: ['initial', 'progress', 'resolution', 'reopen'],
          default: 'initial',
        },
        uploadedAt: { type: Date, default: Date.now },
      },
    ],
    assignedWorker: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    assignedAt: {
      type: Date,
      default: null,
    },
    slaDeadline: {
      type: Date,
      default: null,
    },
    isEscalated: {
      type: Boolean,
      default: false,
    },
    timeline: [timelineEntrySchema],
    auditLogs: [auditLogSchema],
  },
  {
    timestamps: true,
  }
);

// 2dsphere index for location-based nearby duplicate queries and maps
issueSchema.index({ 'location.coordinates': '2dsphere' });
issueSchema.index({ reporter: 1, status: 1 });
issueSchema.index({ serviceArea: 1, status: 1 });
issueSchema.index({ assignedWorker: 1, status: 1 });

const Issue = mongoose.model('Issue', issueSchema);

export default Issue;
