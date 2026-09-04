import { Role } from "@prisma/client";
import { CreateFaceLivenessSessionCommand, RekognitionClient } from "@aws-sdk/client-rekognition";
import { GetFederationTokenCommand, STSClient } from "@aws-sdk/client-sts";
import { NextResponse } from "next/server";

import { requireApiRole } from "@/lib/api-auth";

export const dynamic = "force-dynamic";

type LivenessSessionRecord = {
  userId: string;
  expiresAt: number;
  consumed: boolean;
};

const SESSION_TTL_MS = 10 * 60 * 1000;
const FEDERATION_NAME_PREFIX = "skface";

function createFederationName() {
  const randomId = crypto.randomUUID().replace(/-/g, "").slice(0, 20);
  return `${FEDERATION_NAME_PREFIX}-${randomId}`;
}

function getAwsRegion() {
  const region = process.env.AWS_REGION?.trim();
  if (!region) {
    throw new Error("AWS_REGION is not configured.");
  }
  return region;
}

function getLivenessStore() {
  const globalStore = globalThis as typeof globalThis & {
    __sktechFaceLivenessSessions?: Map<string, LivenessSessionRecord>;
  };

  if (!globalStore.__sktechFaceLivenessSessions) {
    globalStore.__sktechFaceLivenessSessions = new Map<string, LivenessSessionRecord>();
  }

  const now = Date.now();
  for (const [sessionId, record] of globalStore.__sktechFaceLivenessSessions.entries()) {
    if (record.expiresAt <= now || record.consumed) {
      globalStore.__sktechFaceLivenessSessions.delete(sessionId);
    }
  }

  return globalStore.__sktechFaceLivenessSessions;
}

export async function POST() {
  try {
    const guard = await requireApiRole([Role.OFFICIAL]);
    if (guard.error) {
      return guard.error;
    }

    const region = getAwsRegion();
    const rekognition = new RekognitionClient({ region });
    const sts = new STSClient({ region });

    const livenessSession = await rekognition.send(
      new CreateFaceLivenessSessionCommand({
        Settings: {
          AuditImagesLimit: 0,
        },
      }),
    );

    if (!livenessSession.SessionId) {
      throw new Error("AWS did not return a liveness session id.");
    }

    getLivenessStore().set(livenessSession.SessionId, {
      userId: guard.session.user.id,
      expiresAt: Date.now() + SESSION_TTL_MS,
      consumed: false,
    });

    const credentials = await sts.send(
      new GetFederationTokenCommand({
        Name: createFederationName(),
        DurationSeconds: 900,
        Policy: JSON.stringify({
          Version: "2012-10-17",
          Statement: [
            {
              Effect: "Allow",
              Action: "rekognition:StartFaceLivenessSession",
              Resource: "*",
            },
          ],
        }),
      }),
    );

    if (
      !credentials.Credentials?.AccessKeyId ||
      !credentials.Credentials.SecretAccessKey ||
      !credentials.Credentials.SessionToken
    ) {
      throw new Error("AWS did not return temporary liveness credentials.");
    }

    return NextResponse.json({
      sessionId: livenessSession.SessionId,
      region,
      credentials: {
        accessKeyId: credentials.Credentials.AccessKeyId,
        secretAccessKey: credentials.Credentials.SecretAccessKey,
        sessionToken: credentials.Credentials.SessionToken,
        expiration: credentials.Credentials.Expiration?.toISOString() ?? null,
      },
    });
  } catch (error) {
    if (process.env.NODE_ENV !== "production") {
      console.error("POST /api/face/liveness/session error:", error);
    }
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to prepare secure face scan. Please try again.",
      },
      { status: 500 },
    );
  }
}
