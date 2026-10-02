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
      required: false,
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

const commentSchema = new mongoose.Schema(
  {
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    authorName: {
      type: String,
      required: true,
    },
    authorRole: {
      type: String,
      enum: ['citizen', 'field_worker', 'administrator', 'super_admin'],
      required: true,
    },
    content: {
      type: String,
      required: [true, 'Comment content is required'],
      trim: true,
      minlength: [2, 'Comment must be at least 2 characters long'],
      maxlength: [2000, 'Comment cannot exceed 2000 characters'],
    },
    isInternal: {
      type: Boolean,
      default: false,
    },
    attachments: [
      {
        url: String,
        filename: String,
      },
    ],
    createdAt: {
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
      required: false,
      default: null,
    },
    guestReporter: {
      name: { type: String, trim: true, default: 'Citizen' },
      phone: { type: String, trim: true, default: '' },
      email: { type: String, trim: true, default: '' },
    },
    status: {
      type: String,
      enum: [
        'submitted',
        'in_review',
        'under_review',
        'info_requested',
        'verified',
        'rejected',
        'assigned',
        'in_progress',
        'resolved_verification_pending',
        'closed',
        'reopened',
        'withdrawn',
      ],
      default: 'submitted',
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'urgent', 'critical'],
      default: 'medium',
    },
    location: {
      address: {
        type: String,
        trim: true,
        default: 'Municipal Zone, Hyderabad',
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
        geoTag: {
          type: mongoose.Schema.Types.Mixed,
          default: null,
        },
        stage: {
          type: String,
          enum: ['initial', 'starting', 'during', 'progress', 'resolution', 'completion', 'reopen'],
          default: 'initial',
        },
        uploadedAt: { type: Date, default: Date.now },
      },
    ],
    isGpsVerified: {
      type: Boolean,
      default: false,
    },
    // Multi-Worker Assignment Roster
    assignedWorkers: [
      {
        worker: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
          required: true,
        },
        assignedAt: {
          type: Date,
          default: Date.now,
        },
        assignedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
        },
        role: {
          type: String,
          default: 'Lead Field Specialist',
        },
        note: {
          type: String,
          default: '',
        },
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
    // 3-Phase Work Execution Proof (Starting, During, Completion with Geo-Tagged Evidence)
    executionPhases: {
      startingPhase: {
        images: [
          {
            url: String,
            filename: String,
            geoTag: mongoose.Schema.Types.Mixed,
            uploadedAt: { type: Date, default: Date.now },
          },
        ],
        note: { type: String, default: '' },
        startedAt: { type: Date, default: null },
        updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      },
      duringPhase: {
        images: [
          {
            url: String,
            filename: String,
            geoTag: mongoose.Schema.Types.Mixed,
            uploadedAt: { type: Date, default: Date.now },
          },
        ],
        note: { type: String, default: '' },
        inProgressAt: { type: Date, default: null },
        updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      },
      completionPhase: {
        images: [
          {
            url: String,
            filename: String,
            geoTag: mongoose.Schema.Types.Mixed,
            uploadedAt: { type: Date, default: Date.now },
          },
        ],
        note: { type: String, default: '' },
        completedAt: { type: Date, default: null },
        updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      },
    },
    slaDeadline: {
      type: Date,
      default: null,
    },
    isEscalated: {
      type: Boolean,
      default: false,
    },
    feedback: {
      rating: {
        type: Number,
        min: 1,
        max: 5,
        default: null,
      },
      comment: {
        type: String,
        trim: true,
        default: '',
      },
      submittedAt: {
        type: Date,
        default: null,
      },
    },
    comments: [commentSchema],
    followers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    upvotes: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    duplicateOf: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Issue',
      default: null,
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
