"use client";

import { Camera, ChevronLeft, ChevronRight, FileCheck2, UserCheck, Video, VideoOff } from "lucide-react";
import { OfficialPosition, SKFederationPosition, Sex } from "@prisma/client";
import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";

import {
  AdmissionProofUploadPayload,
  MunicipalityOption,
  OFFICIAL_POSITION_OPTIONS,
  SEX_OPTIONS,
  SKFED_POSITION_OPTIONS,
  SKOfficialAdmissionSubmissionPayload,
  SKOfficialFormPayload,
  calculateAge,
  formatEnumLabel,
  validateSKOfficialPayload,
} from "@/lib/sk-official";

type WizardInitialValues = Partial<SKOfficialFormPayload> & {
  proofDocumentUrl?: string | null;
  proofDocumentName?: string | null;
  proofDocumentType?: string | null;
};

type SKOfficialAdmissionWizardProps = {
  municipalities: MunicipalityOption[];
  initialValues?: WizardInitialValues;
  includeEmail?: boolean;
  requireEmail?: boolean;
  initialStep?: number;
  submitting?: boolean;
  submitLabel?: string;
  statusLabel?: string | null;
  profileOnly?: boolean;
  onSubmit: (payload: SKOfficialAdmissionSubmissionPayload) => Promise<void> | void;
};

const inputClass =
  "mt-1.5 w-full rounded-lg border border-glass-border bg-surface-elevated/60 px-3 py-2 text-sm text-foreground outline-none transition focus:border-accent/40";

const TOTAL_STEPS = 4;

type CameraState = "idle" | "capturing" | "captured" | "error";

function clampStep(value: number | undefined): number {
  if (!value || Number.isNaN(value)) return 1;
  if (value < 1) return 1;
  if (value > TOTAL_STEPS) return TOTAL_STEPS;
  return value;
}

function frameFromVideo(video: HTMLVideoElement): string | null {
  if (!video.videoWidth || !video.videoHeight) {
    return null;
  }

  const canvas = document.createElement("canvas");
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  const context = canvas.getContext("2d");
  if (!context) {
    return null;
  }

  context.drawImage(video, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL("image/jpeg", 0.9);
}

export default function SKOfficialAdmissionWizard({
  municipalities,
  initialValues,
  includeEmail = true,
  requireEmail = true,
  initialStep,
  submitting = false,
  submitLabel = "Submit Admission",
  statusLabel = null,
  profileOnly = false,
  onSubmit,
}: SKOfficialAdmissionWizardProps) {
  const totalSteps = profileOnly ? 1 : TOTAL_STEPS;
  const [step, setStep] = useState(profileOnly ? 1 : clampStep(initialStep));
  const [error, setError] = useState<string | null>(null);

  const [firstName, setFirstName] = useState(initialValues?.firstName ?? "");
  const [middleName, setMiddleName] = useState(initialValues?.middleName ?? "");
  const [lastName, setLastName] = useState(initialValues?.lastName ?? "");
  const [suffix, setSuffix] = useState(initialValues?.suffix ?? "");
  const [birthDate, setBirthDate] = useState(initialValues?.birthDate ?? "");
  const [sex, setSex] = useState<Sex | null>(initialValues?.sex ?? null);
  const [province, setProvince] = useState(initialValues?.province ?? "Oriental Mindoro");
  const [municipalityId, setMunicipalityId] = useState(initialValues?.municipalityId ?? "");
  const [barangayId, setBarangayId] = useState(initialValues?.barangayId ?? "");
  const [sitio, setSitio] = useState(initialValues?.sitio ?? "");
  const [position, setPosition] = useState<OfficialPosition>(
    initialValues?.position ?? "SK_CHAIRPERSON",
  );
  const [skFederationOfficer, setSkFederationOfficer] = useState(
    initialValues?.skFederationOfficer ?? false,
  );
  const [skFederationPosition, setSkFederationPosition] =
    useState<SKFederationPosition | null>(initialValues?.skFederationPosition ?? null);
  const [dateElected, setDateElected] = useState(initialValues?.dateElected ?? "");
  const [email, setEmail] = useState(initialValues?.email ?? "");
  const [contactNo, setContactNo] = useState(initialValues?.contactNo ?? "");
  const [address, setAddress] = useState(initialValues?.address ?? "");

  const [proofUpload, setProofUpload] = useState<AdmissionProofUploadPayload | null>(null);
  const [proofPreviewName, setProofPreviewName] = useState(
    initialValues?.proofDocumentName ?? "",
  );
  const [proofPreviewUrl, setProofPreviewUrl] = useState(initialValues?.proofDocumentUrl ?? "");

  const [cameraEnabled, setCameraEnabled] = useState(false);
  const [cameraState, setCameraState] = useState<CameraState>("idle");
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [faceImageBase64, setFaceImageBase64] = useState<string | null>(null);
  const [livenessFrames, setLivenessFrames] = useState<string[]>([]);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const age = useMemo(() => calculateAge(birthDate), [birthDate]);

  const selectedMunicipality = useMemo(
    () => municipalities.find((entry) => entry.id === municipalityId) ?? null,
    [municipalityId, municipalities],
  );

  const filteredMunicipalities = useMemo(() => {
    return municipalities
      .filter((entry) =>
        entry.province.toLowerCase().includes(province.trim().toLowerCase()),
      )
      .slice()
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [municipalities, province]);

  const filteredBarangays = useMemo(() => {
    if (!selectedMunicipality) return [];
    return selectedMunicipality.barangays
      .slice()
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [selectedMunicipality]);

  const selectedBarangay = useMemo(() => {
    if (!selectedMunicipality) return null;
    return selectedMunicipality.barangays.find((item) => item.id === barangayId) ?? null;
  }, [barangayId, selectedMunicipality]);

  const assembledPayload = useMemo<SKOfficialFormPayload>(
    () => ({
      firstName: firstName.trim(),
      middleName: middleName.trim() || null,
      lastName: lastName.trim(),
      suffix: suffix.trim() || null,
      birthDate,
      sex,
      province: province.trim(),
      municipalityId,
      barangayId,
      sitio: sitio.trim() || null,
      position,
      skFederationOfficer,
      skFederationPosition: skFederationOfficer ? skFederationPosition : null,
      dateElected,
      termEnd: initialValues?.termEnd ?? null,
      email: email.trim(),
      contactNo: contactNo.trim() || null,
      address: address.trim() || null,
    }),
    [
      firstName,
      middleName,
      lastName,
      suffix,
      birthDate,
      sex,
      province,
      municipalityId,
      barangayId,
      sitio,
      position,
      skFederationOfficer,
      skFederationPosition,
      dateElected,
      initialValues?.termEnd,
      email,
      contactNo,
      address,
    ],
  );

  const stopCamera = () => {
    if (streamRef.current) {
      for (const track of streamRef.current.getTracks()) {
        track.stop();
      }
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setCameraEnabled(false);
  };

  useEffect(() => {
    return () => {
      if (streamRef.current) {
        for (const track of streamRef.current.getTracks()) {
          track.stop();
        }
      }
    };
  }, []);

  const startCamera = async () => {
    setCameraError(null);
    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error("Camera API is not available in this browser.");
      }

      stopCamera();
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: { ideal: 960 }, height: { ideal: 540 } },
        audio: false,
      });

      const video = videoRef.current;
      if (!video) {
        for (const track of stream.getTracks()) {
          track.stop();
        }
        return;
      }

      streamRef.current = stream;
      video.srcObject = stream;
      await video.play();
      setCameraEnabled(true);
      setCameraState(faceImageBase64 ? "captured" : "idle");
    } catch (cameraStartError) {
      const message =
        cameraStartError instanceof Error
          ? cameraStartError.message
          : "Unable to access camera.";
      setCameraError(message);
      setCameraState("error");
    }
  };

  const captureFace = async () => {
    const video = videoRef.current;
    if (!video) return;

    setCameraState("capturing");
    setCameraError(null);
    setError(null);
    try {
      const capturedFrames: string[] = [];
      for (let index = 0; index < 4; index += 1) {
        const frame = frameFromVideo(video);
        if (frame) {
          capturedFrames.push(frame);
        }
        await new Promise((resolve) => setTimeout(resolve, 220));
      }

      if (capturedFrames.length < 2) {
        throw new Error("Unable to capture enough frames. Keep your face centered and retry.");
      }

      setFaceImageBase64(capturedFrames[capturedFrames.length - 1]);
      setLivenessFrames(capturedFrames);
      setCameraState("captured");
    } catch (captureError) {
      setCameraState("error");
      setCameraError(
        captureError instanceof Error
          ? captureError.message
          : "Unable to capture face.",
      );
    }
  };

  const handleProofFile = async (file: File | null) => {
    if (!file) {
      setProofUpload(null);
      setProofPreviewName("");
      setProofPreviewUrl("");
      return;
    }

    const allowed = [
      "image/jpeg",
      "image/png",
      "image/webp",
      "application/pdf",
    ];
    if (!allowed.includes(file.type)) {
      setError("Unsupported proof file. Use JPG, PNG, WEBP, or PDF.");
      return;
    }

    if (file.size > 6 * 1024 * 1024) {
      setError("Proof file is too large. Maximum size is 6MB.");
      return;
    }

    const dataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result ?? ""));
      reader.onerror = () => reject(new Error("Unable to read proof file."));
      reader.readAsDataURL(file);
    });

    setProofUpload({
      fileName: file.name,
      mimeType: file.type,
      dataUrl,
    });
    setProofPreviewName(file.name);
    setProofPreviewUrl(file.type === "application/pdf" ? "" : dataUrl);
    setError(null);
  };

  const validateStep = (targetStep: number): boolean => {
    if (targetStep <= 1) return true;

    const infoError = validateSKOfficialPayload(assembledPayload, { requireEmail });
    if (infoError) {
      setError(infoError);
      setStep(1);
      return false;
    }

    if (targetStep <= 2) return true;

    if (!proofUpload && !proofPreviewName) {
      setError("Upload proof of SK officer designation before proceeding.");
      setStep(2);
      return false;
    }

    if (targetStep <= 3) return true;

    if (!faceImageBase64 || livenessFrames.length < 2) {
      setError("Capture facial registration before reviewing submission.");
      setStep(3);
      return false;
    }

    return true;
  };

  const nextStep = () => {
    const targetStep = Math.min(totalSteps, step + 1);
    if (!validateStep(targetStep)) return;
    setError(null);
    setStep(targetStep);
  };

  const previousStep = () => {
    setError(null);
    setStep((current) => Math.max(1, current - 1));
  };

  const submit = async () => {
    if (!validateStep(totalSteps)) return;
    if (profileOnly) {
      setError(null);
      await onSubmit({
        ...assembledPayload,
        proofUpload: {
          fileName: "",
          mimeType: "",
          dataUrl: "",
        },
        faceCapture: {
          imageBase64: "",
          livenessFrames: [],
        },
      });
      return;
    }

    if (!proofUpload) {
      setError("Please re-upload proof document before final submission.");
      setStep(2);
      return;
    }
    if (!faceImageBase64 || livenessFrames.length < 2) {
      setError("Capture facial registration before final submission.");
      setStep(3);
      return;
    }

    setError(null);
    await onSubmit({
      ...assembledPayload,
      proofUpload,
      faceCapture: {
        imageBase64: faceImageBase64,
        livenessFrames,
      },
    });
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          {Array.from({ length: totalSteps }, (_, item) => item + 1).map((index) => (
            <button
              key={index}
              type="button"
              onClick={() => validateStep(index) && setStep(index)}
              className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
                step === index
                  ? "border border-accent/40 bg-accent/20 text-accent"
                  : "border border-glass-border bg-surface-elevated/40 text-muted"
              }`}
            >
              Step {index}
            </button>
          ))}
        </div>
        {statusLabel ? (
          <span className="rounded-full border border-accent/40 bg-accent/15 px-3 py-1 text-xs font-semibold text-accent">
            Current Status: {statusLabel}
          </span>
        ) : null}
      </div>

      {error ? (
        <p className="rounded-xl border border-rose-400/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
          {error}
        </p>
      ) : null}

      {step === 1 ? (
        <section className="max-h-[58vh] space-y-5 overflow-y-auto rounded-2xl border border-glass-border bg-surface-elevated/30 p-4 pr-2">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-accent">
              Step 1 of 4
            </p>
            <h4 className="mt-1 text-lg font-semibold text-foreground">Information Details</h4>
            <p className="text-sm text-muted">
              Fill in name, birthdate, address, municipality, barangay, and elected term details.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-4">
            <div>
              <label className="text-xs uppercase tracking-[0.14em] text-muted">Last Name</label>
              <input className={inputClass} value={lastName} onChange={(e) => setLastName(e.target.value)} />
            </div>
            <div>
              <label className="text-xs uppercase tracking-[0.14em] text-muted">First Name</label>
              <input className={inputClass} value={firstName} onChange={(e) => setFirstName(e.target.value)} />
            </div>
            <div>
              <label className="text-xs uppercase tracking-[0.14em] text-muted">Middle Name</label>
              <input className={inputClass} value={middleName} onChange={(e) => setMiddleName(e.target.value)} />
            </div>
            <div>
              <label className="text-xs uppercase tracking-[0.14em] text-muted">Suffix</label>
              <input className={inputClass} value={suffix} onChange={(e) => setSuffix(e.target.value)} placeholder="Jr., Sr., III" />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <label className="text-xs uppercase tracking-[0.14em] text-muted">Date of Birth</label>
              <input type="date" className={inputClass} value={birthDate} onChange={(e) => setBirthDate(e.target.value)} />
            </div>
            <div>
              <label className="text-xs uppercase tracking-[0.14em] text-muted">Age</label>
              <input className={inputClass} value={age ?? ""} disabled readOnly />
            </div>
            <div>
              <label className="text-xs uppercase tracking-[0.14em] text-muted">Sex</label>
              <select
                className={inputClass}
                value={sex ?? ""}
                onChange={(e) => setSex(e.target.value ? (e.target.value as Sex) : null)}
              >
                <option value="">Select sex</option>
                {SEX_OPTIONS.map((entry) => (
                  <option key={entry} value={entry}>
                    {formatEnumLabel(entry)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <label className="text-xs uppercase tracking-[0.14em] text-muted">Date Elected</label>
              <input type="date" className={inputClass} value={dateElected} onChange={(e) => setDateElected(e.target.value)} />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <label className="text-xs uppercase tracking-[0.14em] text-muted">Province</label>
              <input className={inputClass} value={province} onChange={(e) => setProvince(e.target.value)} />
            </div>
            <div>
              <label className="text-xs uppercase tracking-[0.14em] text-muted">Position</label>
              <select
                className={inputClass}
                value={position}
                onChange={(e) => setPosition(e.target.value as OfficialPosition)}
              >
                {OFFICIAL_POSITION_OPTIONS.map((entry) => (
                  <option key={entry} value={entry}>
                    {formatEnumLabel(entry)}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="flex items-center gap-3 pt-8 text-xs uppercase tracking-[0.14em] text-muted">
                <input
                  type="checkbox"
                  checked={skFederationOfficer}
                  onChange={(e) => {
                    setSkFederationOfficer(e.target.checked);
                    if (!e.target.checked) setSkFederationPosition(null);
                  }}
                />
                SK Federation Officer
              </label>
            </div>
            {includeEmail ? (
              <div>
                <label className="text-xs uppercase tracking-[0.14em] text-muted">
                  Email {requireEmail ? "" : "(Optional)"}
                </label>
                <input
                  type="email"
                  className={inputClass}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            ) : null}
          </div>

          {skFederationOfficer ? (
            <div>
              <label className="text-xs uppercase tracking-[0.14em] text-muted">SKFED Position</label>
              <select
                className={inputClass}
                value={skFederationPosition ?? ""}
                onChange={(e) =>
                  setSkFederationPosition(
                    e.target.value ? (e.target.value as SKFederationPosition) : null,
                  )
                }
              >
                <option value="">Select SKFED position</option>
                {SKFED_POSITION_OPTIONS.map((entry) => (
                  <option key={entry} value={entry}>
                    {formatEnumLabel(entry)}
                  </option>
                ))}
              </select>
            </div>
          ) : null}

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="text-xs uppercase tracking-[0.14em] text-muted">Municipality</label>
              <select
                className={inputClass}
                value={municipalityId}
                onChange={(e) => {
                  setMunicipalityId(e.target.value);
                  setBarangayId("");
                }}
              >
                <option value="">Select municipality</option>
                {filteredMunicipalities.map((entry) => (
                  <option key={entry.id} value={entry.id}>
                    {entry.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs uppercase tracking-[0.14em] text-muted">Barangay</label>
              <select
                className={inputClass}
                value={barangayId}
                onChange={(e) => setBarangayId(e.target.value)}
                disabled={!selectedMunicipality}
              >
                <option value="">
                  {selectedMunicipality ? "Select barangay" : "Select municipality first"}
                </option>
                {filteredBarangays.map((entry) => (
                  <option key={entry.id} value={entry.id}>
                    {entry.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="text-xs uppercase tracking-[0.14em] text-muted">Contact Number</label>
              <input className={inputClass} value={contactNo} onChange={(e) => setContactNo(e.target.value)} />
            </div>
            <div>
              <label className="text-xs uppercase tracking-[0.14em] text-muted">Address</label>
              <textarea rows={3} className={inputClass} value={address} onChange={(e) => setAddress(e.target.value)} />
            </div>
            <div>
              <label className="text-xs uppercase tracking-[0.14em] text-muted">Sitio</label>
              <input className={inputClass} value={sitio} onChange={(e) => setSitio(e.target.value)} />
            </div>
          </div>
        </section>
      ) : null}

      {step === 2 ? (
        <section className="max-h-[58vh] space-y-4 overflow-y-auto rounded-2xl border border-glass-border bg-surface-elevated/30 p-4 pr-2">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-accent">Step 2 of 4</p>
            <h4 className="mt-1 text-lg font-semibold text-foreground">Proof of Office</h4>
            <p className="text-sm text-muted">
              Upload proof that you are a legitimate SK officer (appointment, oath, certificate, or equivalent).
            </p>
          </div>

          <input
            type="file"
            accept=".jpg,.jpeg,.png,.webp,.pdf"
            onChange={(e) => void handleProofFile(e.target.files?.[0] ?? null)}
            className="block w-full text-sm text-foreground file:mr-4 file:rounded-lg file:border-0 file:bg-accent file:px-4 file:py-2 file:text-sm file:font-semibold file:text-accent-foreground hover:file:opacity-90"
          />

          {proofPreviewName ? (
            <div className="rounded-xl border border-emerald-400/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
              Uploaded: <span className="font-semibold">{proofPreviewName}</span>
            </div>
          ) : (
            <div className="rounded-xl border border-amber-400/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
              No proof uploaded yet.
            </div>
          )}

          {proofPreviewUrl ? (
            <Image
              src={proofPreviewUrl}
              alt="Proof preview"
              width={560}
              height={320}
              unoptimized
              className="max-h-56 w-auto rounded-xl border border-glass-border object-contain"
            />
          ) : null}
        </section>
      ) : null}

      {step === 3 ? (
        <section className="max-h-[58vh] space-y-4 overflow-y-auto rounded-2xl border border-glass-border bg-surface-elevated/30 p-4 pr-2">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-accent">Step 3 of 4</p>
            <h4 className="mt-1 text-lg font-semibold text-foreground">Facial Registration</h4>
            <p className="text-sm text-muted">
              Capture your face for biometric attendance validation. Keep your face centered and well lit.
            </p>
          </div>

          <div className="relative overflow-hidden rounded-2xl border border-glass-border bg-black/70">
            <video ref={videoRef} className="aspect-video w-full object-cover" muted autoPlay playsInline />
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
              <div className="h-[58%] w-[44%] rounded-[28px] border-2 border-cyan-300/70 shadow-[0_0_30px_rgba(56,189,248,0.3)]" />
            </div>
            <div className="absolute left-4 top-4 rounded-full border border-white/20 bg-black/50 px-3 py-1 text-xs font-semibold text-white/90">
              Live Camera
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {cameraEnabled ? (
              <button
                type="button"
                onClick={stopCamera}
                className="inline-flex items-center gap-2 rounded-lg border border-glass-border bg-surface-elevated px-4 py-2 text-sm font-semibold text-foreground transition hover:bg-surface"
              >
                <VideoOff className="h-4 w-4" />
                Disable Camera
              </button>
            ) : (
              <button
                type="button"
                onClick={() => void startCamera()}
                className="inline-flex items-center gap-2 rounded-lg border border-glass-border bg-surface-elevated px-4 py-2 text-sm font-semibold text-foreground transition hover:bg-surface"
              >
                <Video className="h-4 w-4" />
                Enable Camera
              </button>
            )}

            <button
              type="button"
              disabled={!cameraEnabled || cameraState === "capturing"}
              onClick={() => void captureFace()}
              className="inline-flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-accent-foreground transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Camera className="h-4 w-4" />
              {cameraState === "capturing" ? "Capturing..." : "Capture Face"}
            </button>
          </div>

          {cameraError ? (
            <p className="rounded-xl border border-rose-400/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
              {cameraError}
            </p>
          ) : null}

          {cameraState === "captured" && faceImageBase64 ? (
            <div className="rounded-xl border border-emerald-400/30 bg-emerald-500/10 p-3">
              <p className="mb-2 text-sm font-semibold text-emerald-200">
                Face capture ready ({livenessFrames.length} frames).
              </p>
              <Image
                src={faceImageBase64}
                alt="Face preview"
                width={400}
                height={300}
                unoptimized
                className="max-h-48 w-auto rounded-lg border border-glass-border object-contain"
              />
            </div>
          ) : null}
        </section>
      ) : null}

      {step === 4 ? (
        <section className="max-h-[58vh] space-y-4 overflow-y-auto rounded-2xl border border-glass-border bg-surface-elevated/30 p-4 pr-2">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-accent">Step 4 of 4</p>
            <h4 className="mt-1 text-lg font-semibold text-foreground">Review & Submit</h4>
            <p className="text-sm text-muted">
              Review all details before final admission submission.
            </p>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <div className="rounded-xl border border-glass-border bg-surface p-3">
              <p className="text-xs uppercase tracking-[0.14em] text-muted">Full Name</p>
              <p className="mt-1 text-sm text-foreground">
                {[firstName, middleName, lastName, suffix].filter(Boolean).join(" ")}
              </p>
            </div>
            <div className="rounded-xl border border-glass-border bg-surface p-3">
              <p className="text-xs uppercase tracking-[0.14em] text-muted">Birth Date / Age / Sex</p>
              <p className="mt-1 text-sm text-foreground">
                {birthDate || "N/A"} / {age ?? "N/A"} / {sex ? formatEnumLabel(sex) : "N/A"}
              </p>
            </div>
            <div className="rounded-xl border border-glass-border bg-surface p-3">
              <p className="text-xs uppercase tracking-[0.14em] text-muted">Municipality / Barangay</p>
              <p className="mt-1 text-sm text-foreground">
                {selectedMunicipality?.name ?? "N/A"} / {selectedBarangay?.name ?? "N/A"}
              </p>
            </div>
            <div className="rounded-xl border border-glass-border bg-surface p-3">
              <p className="text-xs uppercase tracking-[0.14em] text-muted">Position</p>
              <p className="mt-1 text-sm text-foreground">{formatEnumLabel(position)}</p>
            </div>
            <div className="rounded-xl border border-glass-border bg-surface p-3">
              <p className="text-xs uppercase tracking-[0.14em] text-muted">Date Elected / SKFED</p>
              <p className="mt-1 text-sm text-foreground">{dateElected || "N/A"}</p>
              <p className="mt-1 text-xs text-muted">
                {skFederationOfficer
                  ? `SKFED: ${formatEnumLabel(skFederationPosition)}`
                  : "Not a SKFED officer"}
              </p>
            </div>
            <div className="rounded-xl border border-glass-border bg-surface p-3">
              <p className="text-xs uppercase tracking-[0.14em] text-muted">Proof + Face</p>
              <p className="mt-1 text-sm text-foreground">
                <span className="inline-flex items-center gap-1">
                  <FileCheck2 className="h-4 w-4 text-emerald-300" /> {proofPreviewName || "Missing proof"}
                </span>
              </p>
              <p className="mt-1 text-sm text-foreground">
                <span className="inline-flex items-center gap-1">
                  <UserCheck className="h-4 w-4 text-cyan-300" />{" "}
                  {faceImageBase64 ? "Face captured" : "Missing face capture"}
                </span>
              </p>
            </div>
          </div>
        </section>
      ) : null}

      <div className="flex flex-wrap items-center justify-between gap-2">
        <button
          type="button"
          onClick={previousStep}
          disabled={step === 1 || submitting}
          className="inline-flex items-center gap-1 rounded-lg border border-glass-border bg-surface-elevated/60 px-4 py-2 text-sm font-semibold text-foreground transition hover:bg-surface-elevated disabled:cursor-not-allowed disabled:opacity-60"
        >
          <ChevronLeft className="h-4 w-4" />
          Back
        </button>

        {step < totalSteps ? (
          <button
            type="button"
            onClick={nextStep}
            disabled={submitting}
            className="inline-flex items-center gap-1 rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-accent-foreground transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Next
            <ChevronRight className="h-4 w-4" />
          </button>
        ) : (
          <button
            type="button"
            onClick={() => void submit()}
            disabled={submitting}
            className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-accent-foreground transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? "Submitting..." : submitLabel}
          </button>
        )}
      </div>
    </div>
  );
}
