import { prisma } from "@/lib/prisma";

let isTableEnsured = false;

export async function ensureLeaveTable() {
  if (isTableEnsured) return;
  try {
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "LeaveRequest" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "userId" TEXT NOT NULL,
        "type" TEXT NOT NULL DEFAULT 'SICK',
        "startDate" TEXT NOT NULL,
        "endDate" TEXT NOT NULL,
        "durationDays" INTEGER NOT NULL DEFAULT 1,
        "reason" TEXT NOT NULL,
        "emergencyContact" TEXT,
        "attachmentUrl" TEXT,
        "attachmentName" TEXT,
        "attachmentType" TEXT,
        "status" TEXT NOT NULL DEFAULT 'PENDING',
        "approvedBy" TEXT,
        "approvedAt" DATETIME,
        "reviewNotes" TEXT,
        "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "LeaveRequest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
      );
    `);
    isTableEnsured = true;
  } catch (err) {
    console.error("Auto ensure LeaveRequest table error:", err);
  }
}
