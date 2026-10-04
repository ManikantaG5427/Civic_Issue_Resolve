import AuditLog from '../models/AuditLog.js';

/**
 * Enterprise Audit Trail Logger
 * Asynchronously writes structured audit logs to MongoDB without blocking the main event loop.
 */
export const recordAuditLog = async ({
  actor = null,
  actorName = 'System',
  actorEmail = '',
  actorRole = 'system',
  action,
  category = 'system',
  targetEntity = {},
  details = {},
  ipAddress = '',
  userAgent = '',
  status = 'success',
}) => {
  try {
    const log = new AuditLog({
      actor: actor?._id || actor || null,
      actorName: actor?.name || actorName,
      actorEmail: actor?.email || actorEmail,
      actorRole: actor?.role || actorRole,
      action,
      category,
      targetEntity: {
        modelName: targetEntity.modelName || '',
        entityId: targetEntity.entityId || null,
        identifier: targetEntity.identifier || '',
      },
      status,
      details,
      ipAddress,
      userAgent,
    });

    await log.save();
    return log;
  } catch (error) {
    // Non-blocking log failure handler to preserve request pipeline continuity
    console.error('AuditLog persistence failed:', error.message);
    return null;
  }
};

export default {
  recordAuditLog,
};
