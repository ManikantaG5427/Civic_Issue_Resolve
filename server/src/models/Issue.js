import mongoose from 'mongoose';

const timelineEntrySchema = new mongoose.Schema(
  {
    status: {
      type: String,
      required: true,
      trim: true,
    },
    action: {
      type: String,
      required: true,
      trim: true,
    },
    performedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
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
      trim: true,
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
        url: { type: String, required: true },
        filename: { type: String, default: '' },
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
      trim: true,
    },
    performedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    previousState: mongoose.Schema.Types.Mixed,
    newState: mongoose.Schema.Types.Mixed,
    ipAddress: { type: String, default: '' },
    timestamp: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: true }
);

const phaseSchema = new mongoose.Schema(
  {
    images: [
      {
        url: { type: String, required: true },
        filename: { type: String, default: '' },
        geoTag: { type: mongoose.Schema.Types.Mixed, default: null },
        uploadedAt: { type: Date, default: Date.now },
      },
    ],
    note: { type: String, trim: true, default: '' },
    startedAt: { type: Date, default: null },
    inProgressAt: { type: Date, default: null },
    completedAt: { type: Date, default: null },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  },
  { _id: false }
);

const issueSchema = new mongoose.Schema(
  {
    issueNumber: {
      type: String,
      required: [true, 'Issue tracking number is required'],
      unique: true,
      trim: true,
      uppercase: true,
      index: true,
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
      maxlength: [5000, 'Description cannot exceed 5000 characters'],
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'IssueCategory',
      required: [true, 'Category is required'],
      index: true,
    },
    serviceArea: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ServiceArea',
      required: [true, 'Service area is required'],
      index: true,
    },
    department: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Department',
      default: null,
      index: true,
    },
    reporter: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true,
    },
    guestReporter: {
      name: { type: String, trim: true, default: 'Citizen' },
      phone: { type: String, trim: true, default: '' },
      email: { type: String, trim: true, lowercase: true, default: '' },
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
        'work_completed',
        'evidence_submitted',
        'rework_required',
        'resolved_verification_pending',
        'closed',
        'reopened',
        'withdrawn',
      ],
      default: 'submitted',
      index: true,
    },
    verificationStatus: {
      type: String,
      enum: ['not_submitted', 'pending', 'approved', 'rejected', 'more_evidence_required', 'site_check_required'],
      default: 'not_submitted',
      index: true,
    },
    citizenResponseStatus: {
      type: String,
      enum: ['not_requested', 'pending', 'confirmed', 'disputed', 'no_response', 'undeliverable'],
      default: 'not_requested',
      index: true,
    },
    closureBasis: {
      type: String,
      enum: ['not_closed', 'citizen_confirmed', 'reviewer_verified_no_response', 'administrative_duplicate', 'administrative_closure', 'withdrawn'],
      default: 'not_closed',
      index: true,
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'urgent', 'critical'],
      default: 'medium',
      index: true,
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
      village: {
        type: String,
        trim: true,
        default: '',
      },
      mandal: {
        type: String,
        trim: true,
        default: '',
      },
      district: {
        type: String,
        trim: true,
        default: '',
      },
      city: {
        type: String,
        trim: true,
        default: '',
      },
      state: {
        type: String,
        trim: true,
        default: 'Telangana',
      },
      country: {
        type: String,
        trim: true,
        default: 'India',
      },
      pincode: {
        type: String,
        trim: true,
        default: '',
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
        validate: {
          validator: function (coords) {
            if (!Array.isArray(coords) || coords.length !== 2) return false;
            const [lng, lat] = coords;
            return lng >= -180 && lng <= 180 && lat >= -90 && lat <= 90;
          },
          message: 'Coordinates must be valid GeoJSON [longitude (-180 to 180), latitude (-90 to 90)]',
        },
      },
    },
    evidence: [
      {
        url: { type: String, required: true },
        filename: { type: String, default: '' },
        fileSize: { type: Number, default: 0 },
        mimeType: { type: String, default: 'image/jpeg' },
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
      index: true,
    },
    assignedAt: {
      type: Date,
      default: null,
    },
    // 3-Phase Work Execution Proof
    executionPhases: {
      startingPhase: { type: phaseSchema, default: () => ({}) },
      duringPhase: { type: phaseSchema, default: () => ({}) },
      completionPhase: { type: phaseSchema, default: () => ({}) },
    },
    slaDeadline: {
      type: Date,
      default: null,
    },
    isEscalated: {
      type: Boolean,
      default: false,
      index: true,
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
    verificationReview: {
      reviewer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null,
      },
      outcome: {
        type: String,
        enum: ['approved', 'rejected', 'rework_required', 'more_evidence_required', 'site_check_required', null],
        default: null,
      },
      reasonCode: {
        type: String,
        trim: true,
        default: '',
      },
      reviewerNote: {
        type: String,
        trim: true,
        default: '',
      },
      checklist: [
        {
          item: { type: String, required: true },
          checked: { type: Boolean, default: false },
          notes: { type: String, default: '' },
        },
      ],
      reviewedAt: {
        type: Date,
        default: null,
      },
    },
    citizenDispute: {
      reason: {
        type: String,
        trim: true,
        default: '',
      },
      comments: {
        type: String,
        trim: true,
        default: '',
      },
      disputedAt: {
        type: Date,
        default: null,
      },
      disputedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null,
      },
      photos: [
        {
          url: { type: String, required: true },
          filename: { type: String, default: '' },
          uploadedAt: { type: Date, default: Date.now },
        },
      ],
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
      index: true,
    },
    timeline: [timelineEntrySchema],
    auditLogs: [auditLogSchema],
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

// Virtual to determine if SLA is breached
issueSchema.virtual('isOverdue').get(function () {
  if (!this.slaDeadline) return false;
  const terminalStatuses = ['closed', 'rejected', 'withdrawn', 'resolved_verification_pending'];
  if (terminalStatuses.includes(this.status)) return false;
  return new Date() > new Date(this.slaDeadline);
});

// Enterprise indexing strategy for high performance
issueSchema.index({ 'location.coordinates': '2dsphere' });
issueSchema.index({
  title: 'text',
  description: 'text',
  issueNumber: 'text',
  'location.landmark': 'text',
  'location.address': 'text',
});

// Compound indexes for dashboard queries & filters
issueSchema.index({ status: 1, priority: 1, createdAt: -1 });
issueSchema.index({ serviceArea: 1, status: 1, createdAt: -1 });
issueSchema.index({ department: 1, status: 1, createdAt: -1 });
issueSchema.index({ assignedWorker: 1, status: 1, createdAt: -1 });
issueSchema.index({ 'assignedWorkers.worker': 1, status: 1 });
issueSchema.index({ reporter: 1, status: 1, createdAt: -1 });
issueSchema.index({ isEscalated: 1, slaDeadline: 1 });
issueSchema.index({ createdAt: -1 });

const Issue = mongoose.model('Issue', issueSchema);

export default Issue;
