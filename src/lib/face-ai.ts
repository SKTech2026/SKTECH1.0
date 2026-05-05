const AI_SERVICE_URL = (
  process.env.AI_SERVICE_URL ??
  process.env.FACE_AI_BASE_URL ??
  ""
).trim();
const FACE_SECRET = (process.env.FACE_SECRET ?? "").trim();

function getAiServiceBaseUrl(): string {
  if (!AI_SERVICE_URL) {
    throw new Error("AI service URL is not configured. Set AI_SERVICE_URL.");
  }
  return AI_SERVICE_URL.replace(/\/+$/, "");
}

export type RegisterFacePayload = {
  userId: string;
  imageBase64: string;
  livenessFrames?: string[];
};

export type RegisterFaceResult = {
  userId: string;
  encryptedEmbedding: string;
  detectedFaces: number;
  livenessPassed: boolean;
  message: string;
};

export type VerifyFacePayload = {
  imageBase64: string;
  livenessFrames?: string[];
  threshold?: number;
};

export type VerifyFacesDetectedFace = {
  userId: string | null;
  fullName: string | null;
  role: string | null;
  municipality: string | null;
  confidence: number;
  distance: number;
  box: [number, number, number, number] | number[];
  isRegistered: boolean;
  isLive: boolean;
  label: string;
};

export type VerifyFacesResult = {
  faces: VerifyFacesDetectedFace[];
  totalFaces: number;
  matchedCount: number;
  threshold: number;
  livenessPassed: boolean;
  livenessScore: number;
  message: string;
};

async function postToAiService<T>(
  endpoint: string,
  payload: unknown,
  timeoutMs = 30000,
): Promise<T> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const baseUrl = getAiServiceBaseUrl();
    let response: Response;
    try {
      response = await fetch(`${baseUrl}${endpoint}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(FACE_SECRET ? { "x-face-secret": FACE_SECRET } : {}),
        },
        body: JSON.stringify(payload),
        signal: controller.signal,
        cache: "no-store",
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message.toLowerCase() : String(error).toLowerCase();
      if (message.includes("fetch failed") || message.includes("networkerror")) {
        throw new Error(
          process.env.NODE_ENV === "production"
            ? "Unable to reach AI facial service."
            : `Unable to reach AI facial service at ${baseUrl}.`,
        );
      }
      throw error;
    }

    const body = (await response.json()) as { detail?: string; message?: string };
    if (!response.ok) {
      throw new Error(body.detail ?? body.message ?? "AI service request failed.");
    }

    return body as T;
  } finally {
    clearTimeout(timeout);
  }
}

export function registerFaceEmbedding(
  payload: RegisterFacePayload,
): Promise<RegisterFaceResult> {
  return postToAiService<RegisterFaceResult>("/register-face", payload);
}

export function verifyFaceAgainstEmbeddings(
  payload: VerifyFacePayload,
): Promise<VerifyFacesResult> {
  return postToAiService<VerifyFacesResult>("/verify-faces", payload);
}
