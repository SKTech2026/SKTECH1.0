import { IdTemplateAssetKind } from "@prisma/client";
import { NextResponse } from "next/server";

import { prisma } from "@/lib/db";
import {
  downloadIdTemplateImageAsset,
  isIdTemplateAssetObjectPath,
  resolveIdTemplateAssetMimeType,
} from "@/lib/id-template/id-template-asset-storage";

export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ assetId: string }> };

function imageErrorResponse(status = 404) {
  return new NextResponse(null, {
    status,
    headers: {
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}

export async function GET(_request: Request, context: RouteContext) {
  try {
    const { assetId } = await context.params;
    if (!assetId || assetId.length > 128) {
      return imageErrorResponse(400);
    }

    const asset = await prisma.idTemplateAsset.findFirst({
      where: {
        id: assetId,
        kind: IdTemplateAssetKind.IMAGE,
        template: {
          isActive: true,
          status: "ACTIVE",
        },
      },
      select: {
        objectPath: true,
        mimeType: true,
      },
    });

    if (!asset?.objectPath || !isIdTemplateAssetObjectPath(asset.objectPath)) {
      return imageErrorResponse(404);
    }

    const contentType = resolveIdTemplateAssetMimeType(asset.mimeType, asset.objectPath);
    if (!contentType) {
      return imageErrorResponse(415);
    }

    const image = await downloadIdTemplateImageAsset(asset.objectPath);
    const imageBytes = await image.arrayBuffer();
    if (imageBytes.byteLength === 0) {
      return imageErrorResponse(404);
    }

    return new NextResponse(Buffer.from(imageBytes), {
      status: 200,
      headers: {
        "Cache-Control": "public, max-age=3600, s-maxage=3600, stale-while-revalidate=86400",
        "Content-Type": contentType,
        "Content-Length": String(imageBytes.byteLength),
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    return imageErrorResponse(404);
  }
}
