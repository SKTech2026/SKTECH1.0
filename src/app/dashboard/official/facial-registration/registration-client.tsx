"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";

export default function FacialRegistrationClient() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [status, setStatus] = useState("Ready to start the camera.");
  const [busy, setBusy] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [frames, setFrames] = useState<string[]>([]);
  const [complete, setComplete] = useState(false);

  useEffect(() => () => streamRef.current?.getTracks().forEach((track) => track.stop()), []);

  async function startCamera() {
    setStatus("Requesting camera access…");
    setPreview(null);
    setFrames([]);
    streamRef.current?.getTracks().forEach((track) => track.stop());
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user", width: 640, height: 480 }, audio: false });
      streamRef.current = stream;
      if (videoRef.current) { videoRef.current.srcObject = stream; await videoRef.current.play(); }
      setStatus("Center your face. Blink and slowly turn your head during capture.");
    } catch { setStatus("Camera unavailable or permission denied. Retry, or select a short video recorded on this device."); }
  }

  function capture(video: HTMLVideoElement) {
    const canvas = document.createElement("canvas");
    canvas.width = 640;
    canvas.height = 480;
    canvas.getContext("2d")?.drawImage(video, 0, 0, 640, 480);
    return canvas.toDataURL("image/jpeg", 0.82);
  }

  async function captureCamera() {
    const video = videoRef.current;
    if (!video || !streamRef.current || video.readyState < 2) return;
    setBusy(true);
    const samples: string[] = [];
    for (let i = 0; i < 6; i++) {
      setStatus(`Capturing face movement ${i + 1} of 6…`);
      samples.push(capture(video));
      await new Promise((resolve) => setTimeout(resolve, 450));
    }
    setFrames(samples);
    setPreview(samples[0]);
    setBusy(false);
    setStatus("Review the preview, then submit. Retake if your face is unclear.");
  }

  async function loadVideo(file: File) {
    if (!file.type.startsWith("video/") || file.size > 25 * 1024 * 1024) { setStatus("Choose a video under 25 MB."); return; }
    setBusy(true);
    setStatus("Reading your video locally…");
    const url = URL.createObjectURL(file);
    const video = document.createElement("video");
    video.muted = true;
    video.playsInline = true;
    video.src = url;
    try {
      await new Promise<void>((resolve, reject) => { video.onloadedmetadata = () => resolve(); video.onerror = () => reject(new Error("Invalid video")); });
      if (!Number.isFinite(video.duration) || video.duration < 2) throw new Error("Record at least two seconds of face movement.");
      const samples: string[] = [];
      for (let i = 0; i < 6; i++) {
        video.currentTime = Math.min(video.duration - 0.1, (i + 1) * video.duration / 7);
        await new Promise<void>((resolve, reject) => { video.onseeked = () => resolve(); video.onerror = () => reject(new Error("Could not read video frame.")); });
        samples.push(capture(video));
      }
      setFrames(samples);
      setPreview(samples[0]);
      setStatus("Review the preview, then submit. Blink or head movement must be visible in the video.");
    } catch (error) { setStatus(error instanceof Error ? error.message : "Could not read video."); }
    finally { URL.revokeObjectURL(url); setBusy(false); }
  }

  async function submit() {
    if (frames.length < 2) return;
    setBusy(true);
    setStatus("Checking face quality and movement…");
    try {
      const response = await fetch("/api/face/register", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ imageBase64: frames[0], livenessFrames: frames }) });
      const result = await response.json() as { success?: boolean; error?: string };
      if (!response.ok || !result.success) throw new Error(result.error || "Face registration failed.");
      setComplete(true);
      setStatus("Face registration completed.");
      streamRef.current?.getTracks().forEach((track) => track.stop());
    } catch (error) { setStatus(error instanceof Error ? error.message : "Face registration failed. Please retry."); }
    finally { setBusy(false); }
  }

  return <main className="mx-auto max-w-2xl space-y-5 p-6">
    <h1 className="text-2xl font-semibold">Face registration</h1>
    <p>Use the camera or upload a short video of yourself blinking and slowly turning your head.</p>
    <video ref={videoRef} autoPlay muted playsInline className="w-full rounded-lg bg-black" aria-label="Live camera preview" />
    {preview && <Image src={preview} alt="Captured face preview" width={640} height={480} unoptimized className="max-h-64 rounded-lg" />}
    <p role="status" aria-live="polite">{status}</p>
    {!complete && <div className="flex flex-wrap gap-3">
      <button type="button" disabled={busy} onClick={startCamera} className="rounded bg-blue-700 px-4 py-2 text-white">Start or retry camera</button>
      <button type="button" disabled={busy || !streamRef.current} onClick={captureCamera} className="rounded bg-blue-700 px-4 py-2 text-white">Capture movement</button>
      <label className="rounded border px-4 py-2">Upload short video<input type="file" accept="video/*" className="block text-sm" disabled={busy} onChange={(event) => { const file = event.target.files?.[0]; if (file) void loadVideo(file); }} /></label>
      <button type="button" disabled={busy || frames.length < 2} onClick={submit} className="rounded bg-green-700 px-4 py-2 text-white">Submit face registration</button>
    </div>}
    <p className="text-sm">Keep your face centered in good light. Blurry, dark, multiple-face, and static recordings are rejected. Your preview clears when you leave.</p>
  </main>;
}
