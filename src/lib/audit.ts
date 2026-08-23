import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";

export async function logAudit({
  actorId,
  action,
  targetType,
  targetId,
  metadata,
}: {
  actorId?: string | null;
  action: string;
  targetType: string;
  targetId?: string | null;
  metadata?: Prisma.InputJsonValue;
}) {
  await prisma.auditLog.create({
    data: { actorId, action, targetType, targetId, metadata },
  });
}
