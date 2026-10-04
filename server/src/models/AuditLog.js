import mongoose from 'mongoose';

const auditLogSchema = new mongoose.Schema(
  {
    actor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true,
    },
    actorName: {
      type: String,
      trim: true,
      default: 'System',
    },
    actorEmail: {
      type: String,
      trim: true,
      lowercase: true,
      default: '',
    },
    actorRole: {
      type: String,
      enum: ['citizen', 'field_worker', 'administrator', 'super_admin', 'system', 'guest'],
      default: 'system',
    },
    action: {
      type: String,
      required: [true, 'Audit action is required'],
      trim: true,
      index: true,
    },
    category: {
      type: String,
      enum: ['auth', 'issue', 'dispatch', 'config', 'security', 'sla', 'admin', 'system'],
      default: 'system',
      index: true,
    },
    targetEntity: {
      modelName: {
        type: String,
        trim: true,
        default: '',
      },
      entityId: {
        type: mongoose.Schema.Types.ObjectId,
        default: null,
      },
      identifier: {
        type: String,
        trim: true,
        default: '',
      },
    },
    status: {
      type: String,
      enum: ['success', 'warning', 'failure'],
      default: 'success',
    },
    details: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    ipAddress: {
      type: String,
      trim: true,
      default: '',
    },
    userAgent: {
      type: String,
      trim: true,
      default: '',
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

// High-performance compound indexes for compliance audits and security dashboards
auditLogSchema.index({ category: 1, createdAt: -1 });
auditLogSchema.index({ action: 1, createdAt: -1 });
auditLogSchema.index({ actor: 1, createdAt: -1 });
auditLogSchema.index({ 'targetEntity.entityId': 1, createdAt: -1 });
auditLogSchema.index({ createdAt: -1 });

const AuditLog = mongoose.model('AuditLog', auditLogSchema);

export default AuditLog;
