import { prisma } from "@/lib/db";
import type { Prisma } from "@prisma/client";

type AuditActor = { id?: string; displayName?: string; role?: string } | null | undefined;

export async function recordAudit(
  actor: AuditActor,
  entry: { action: string; entityType: string; entityId?: string | null; summary: string; metadata?: Prisma.InputJsonValue }
) {
  try {
    await prisma.auditLog.create({
      data: {
        actorUserId: actor?.id ?? null,
        actorName: actor?.displayName ?? "Sistem",
        actorRole: actor?.role ?? "SYSTEM",
        action: entry.action,
        entityType: entry.entityType,
        entityId: entry.entityId ?? null,
        summary: entry.summary,
        metadata: entry.metadata
      }
    });
  } catch (error) {
    console.error("Audit log could not be recorded", error);
  }
}
