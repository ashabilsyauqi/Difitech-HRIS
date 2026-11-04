export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { parseDeliverableAttachments } from "@/lib/deliverable-utils";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const authUser = await getAuthenticatedUser(req);
    if (!authUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const resolvedParams = await Promise.resolve(params);
    const taskId = resolvedParams.id;

    if (!taskId) {
      return NextResponse.json({ error: "Task ID is required" }, { status: 400 });
    }

    const task = await prisma.task.findUnique({
      where: { id: taskId },
      select: {
        id: true,
        userId: true,
        deliverableAttachment: true,
      },
    });

    if (!task || !task.deliverableAttachment) {
      return NextResponse.json({ error: "Attachment not found" }, { status: 404 });
    }

    const attachments = parseDeliverableAttachments(task.deliverableAttachment);
    if (!attachments || attachments.length === 0) {
      return NextResponse.json({ error: "Attachment empty" }, { status: 404 });
    }

    const attachment = attachments[0];

    // If it's a direct URL (http/https), redirect
    if (attachment.startsWith("http://") || attachment.startsWith("https://")) {
      return NextResponse.redirect(attachment);
    }

    // If it's a data URI (e.g., data:image/jpeg;base64,xxxx)
    if (attachment.startsWith("data:")) {
      const matches = attachment.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
      if (matches && matches.length === 3) {
        const mimeType = matches[1];
        const base64Data = matches[2];
        const buffer = Buffer.from(base64Data, "base64");

        return new Response(buffer, {
          status: 200,
          headers: {
            "Content-Type": mimeType,
            "Content-Length": buffer.length.toString(),
            "Cache-Control": "public, max-age=86400, immutable",
          },
        });
      }
    }

    // Fallback: return JSON
    return NextResponse.json({ attachment });
  } catch (error: any) {
    console.error("Task attachment error:", error);
    return NextResponse.json({ error: "Failed to load attachment" }, { status: 500 });
  }
}
