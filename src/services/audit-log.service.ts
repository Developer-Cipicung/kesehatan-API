import { prisma } from '../lib/prisma';
import { Prisma } from '../../prisma/generated-schema';

export class AuditLogService {
  async logAction(
    userId: string,
    posyanduId: string,
    action: 'CREATE' | 'UPDATE' | 'DELETE' | 'SUBMIT',
    entity: string,
    entityId: string,
    oldValue?: any,
    newValue?: any,
  ) {
    // Fire and forget (don't await) to not block the main request loop unnecessarily,
    // or we can await it if we want strict consistency. We will await it for simplicity.
    try {
      await prisma.auditLog.create({
        data: {
          user_id: userId,
          posyandu_id: posyanduId,
          action,
          entity,
          entity_id: entityId,
          old_value: oldValue ? (oldValue as Prisma.InputJsonValue) : Prisma.DbNull,
          new_value: newValue ? (newValue as Prisma.InputJsonValue) : Prisma.DbNull,
        },
      });
    } catch (error) {
      // In production, use Pino logger instead of console.error
      console.error('Failed to write audit log:', error);
    }
  }
}

export const auditLogService = new AuditLogService();
