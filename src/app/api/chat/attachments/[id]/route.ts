import { NextResponse } from "next/server";

import { ChatAuthError, requireChatUser, requireConversationAccess } from "@/lib/chat-auth";
import { CHAT_ATTACHMENTS_BUCKET } from "@/lib/chat-storage";
import { prisma } from "@/lib/db";
import { createSupabaseAdminClient } from "@/utils/supabase/admin";

export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

function safeDownloadName(fileName: string) {
  return fileName.replace(/[\r\n"]/g, "_");
}

export async function GET(_request: Request, context: RouteContext) {
  try {
    const current = await requireChatUser();
    const { id } = await context.params;
    const attachment = await prisma.chatAttachment.findUnique({
      where: { id },
      include: {
        message: {
          select: {
            conversationId: true,
            id: true,
            conversation: {
              select: {
                municipalityId: true,
              },
            },
          },
        },
      },
    });

    if (!attachment) {
      return NextResponse.json({ error: "Attachment not found." }, { status: 404 });
    }

    await requireConversationAccess(current, attachment.message.conversationId);

    const expectedPrefix = `${current.municipalityId}/${attachment.message.conversationId}/${attachment.message.id}/`;
    if (
      attachment.message.conversation.municipalityId !== current.municipalityId ||
      !attachment.objectPath.startsWith(expectedPrefix)
    ) {
      throw new ChatAuthError("Attachment is not available.", 403);
    }

    const supabase = createSupabaseAdminClient();
    const { data, error } = await supabase.storage
      .from(CHAT_ATTACHMENTS_BUCKET)
      .download(attachment.objectPath);

    if (error || !data) {
      return NextResponse.json({ error: "Attachment not found." }, { status: 404 });
    }

    return new Response(data, {
      status: 200,
      headers: {
        "Content-Type": attachment.mimeType,
        "Content-Length": String(attachment.sizeBytes),
        "Content-Disposition": `attachment; filename="${safeDownloadName(attachment.fileName)}"`,
        "Cache-Control": "private, max-age=60",
      },
    });
  } catch (error) {
    const status = error instanceof ChatAuthError ? error.status : 500;
    const message = error instanceof Error ? error.message : "Failed to download attachment.";
    return NextResponse.json({ error: message }, { status });
  }
}
