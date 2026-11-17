import { prisma } from "@/lib/db";
import type { Prisma } from "@prisma/client";

type AuditActor = { id?: string; displayName?: string; role?: string } | null | undefined;

export async function recordAudit(
  actor: AuditActor,
  entry: { action: string; entityType: string; entityId?: string | null; summary: string; metadata?: Prisma.InputJsonValue }
) {
  const data = {
    actorUserId: actor?.id ?? null,
    actorName: actor?.displayName ?? "Sistem",
    actorRole: actor?.role ?? "SYSTEM",
    action: entry.action,
    entityType: entry.entityType,
    entityId: entry.entityId ?? null,
    summary: entry.summary,
    metadata: entry.metadata
  };
  try {
    await prisma.auditLog.create({
      data
    });
  } catch (error) {
    if (data.actorUserId && typeof error === "object" && error !== null && "code" in error && error.code === "P2003") {
      try {
        await prisma.auditLog.create({ data: { ...data, actorUserId: null } });
        return;
      } catch (retryError) {
        console.error("Audit log retry could not be recorded", retryError);
        return;
      }
    }
    console.error("Audit log could not be recorded", error);
  }
}
