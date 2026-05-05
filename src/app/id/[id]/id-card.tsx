"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import QRCode from "qrcode";
import { SKOfficial } from "@prisma/client";

interface IDCardComponentProps {
  official: SKOfficial;
}

export default function IDCardComponent({ official }: IDCardComponentProps) {
  const [isFlipped, setIsFlipped] = useState(false);
  const [qrCode, setQrCode] = useState<string>("");

  useEffect(() => {
    const configuredBaseUrl = (process.env.NEXT_PUBLIC_BASE_URL ?? "")
      .trim()
      .replace(/\/+$/, "");
    const runtimeBaseUrl = typeof window !== "undefined" ? window.location.origin : "";
    const baseUrl = configuredBaseUrl || runtimeBaseUrl;
    const qrUrl = `${baseUrl}/id/${official.id}`;

    QRCode.toDataURL(qrUrl, {
      errorCorrectionLevel: "H",
      type: "image/png",
      width: 200,
      margin: 1,
      color: {
        dark: "#000000",
        light: "#FFFFFF",
      },
    })
      .then((url) => setQrCode(url))
      .catch((err) => {
        if (process.env.NODE_ENV !== "production") {
          console.error("QR Code generation error:", err);
        }
      });
  }, [official.id]);

  const fullName = `${official.firstName} ${official.lastName}`;
  const termStartDate = new Date(official.termStart).toLocaleDateString(
    "en-US",
    { year: "numeric", month: "long", day: "numeric" }
  );

  const roleColor: Record<string, string> = {
    CHAIRPERSON: "from-amber-500 to-orange-600",
    SECRETARY: "from-blue-500 to-cyan-600",
    TREASURER: "from-green-500 to-emerald-600",
    KAGAWAD: "from-purple-500 to-pink-600",
    OTHER: "from-gray-500 to-slate-600",
  };

  const statusColor = official.status === "ACTIVE" ? "bg-green-500" : "bg-red-500";
  const gradientClass = roleColor[official.role] || "from-gray-500 to-slate-600";

  return (
    <div className="flex flex-col items-center justify-center gap-8 w-full max-w-md">
      {/* 3D Flip Card Container */}
      <div
        className="w-full aspect-[9/16] cursor-pointer perspective"
        onClick={() => setIsFlipped(!isFlipped)}
        style={{
          perspective: "1000px",
        }}
      >
        <div
          style={{
            transformStyle: "preserve-3d",
            transform: isFlipped ? "rotateY(180deg)" : "rotateY(0deg)",
            transition: "transform 0.6s",
          }}
          className="w-full h-full"
        >
          {/* Front - Official Card */}
          <div
            style={{
              backfaceVisibility: "hidden",
            }}
            className={`w-full h-full bg-gradient-to-br ${gradientClass} rounded-2xl shadow-2xl p-6 flex flex-col justify-between overflow-hidden relative`}
          >
            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-10">
              <div className="absolute top-0 right-0 w-40 h-40 bg-white rounded-full blur-3xl" />
              <div className="absolute bottom-0 left-0 w-40 h-40 bg-white rounded-full blur-3xl" />
            </div>

            {/* Content */}
            <div className="relative z-10">
              {/* Header */}
              <div className="mb-8">
                <h1 className="text-3xl font-bold text-white mb-2">SK ID</h1>
                <div className="h-1 w-16 bg-white rounded-full opacity-60" />
              </div>

              {/* Full Name */}
              <div className="mb-6">
                <p className="text-white text-sm opacity-80 mb-1">NAME</p>
                <h2 className="text-2xl font-bold text-white break-words">
                  {fullName}
                </h2>
              </div>

              {/* Role */}
              <div className="mb-8">
                <p className="text-white text-sm opacity-80 mb-2">POSITION</p>
                <span className="bg-white bg-opacity-20 backdrop-blur-sm text-white px-4 py-2 rounded-lg font-semibold text-sm inline-block">
                  {official.role}
                </span>
              </div>

              {/* QR Code */}
              <div className="flex justify-center mb-6">
                {qrCode && (
                  <div className="bg-white p-3 rounded-lg shadow-lg">
                    <Image
                      src={qrCode}
                      alt="QR Code"
                      width={160}
                      height={160}
                      className="h-40 w-40"
                      unoptimized
                    />
                  </div>
                )}
              </div>

              {/* Tap to Flip */}
              <p className="text-white text-xs opacity-60 text-center">
                Tap to flip
              </p>
            </div>

            {/* Status Badge */}
            <div className="absolute top-6 right-6 z-20">
              <div className={`${statusColor} w-4 h-4 rounded-full animate-pulse`} />
            </div>
          </div>

          {/* Back - Contact Info */}
          <div
            style={{
              backfaceVisibility: "hidden",
              transform: "rotateY(180deg)",
            }}
            className="w-full h-full bg-gradient-to-br from-slate-700 via-slate-800 to-slate-900 rounded-2xl shadow-2xl p-6 flex flex-col justify-between overflow-hidden relative"
          >
            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-10">
              <div className="absolute top-0 right-0 w-40 h-40 bg-white rounded-full blur-3xl" />
              <div className="absolute bottom-0 left-0 w-40 h-40 bg-white rounded-full blur-3xl" />
            </div>

            {/* Content */}
            <div className="relative z-10">
              <h2 className="text-2xl font-bold text-white mb-6">
                Contact Information
              </h2>

              {/* Contact No */}
              {official.contactNo && (
                <div className="mb-5">
                  <p className="text-slate-300 text-xs opacity-80 mb-1">
                    CONTACT
                  </p>
                  <p className="text-white font-semibold break-all">
                    {official.contactNo}
                  </p>
                </div>
              )}

              {/* Email */}
              {official.email && (
                <div className="mb-5">
                  <p className="text-slate-300 text-xs opacity-80 mb-1">
                    EMAIL
                  </p>
                  <p className="text-white font-semibold break-all text-sm">
                    {official.email}
                  </p>
                </div>
              )}

              {/* Address */}
              {official.address && (
                <div className="mb-5">
                  <p className="text-slate-300 text-xs opacity-80 mb-1">
                    ADDRESS
                  </p>
                  <p className="text-white font-semibold text-sm break-words">
                    {official.address}
                  </p>
                </div>
              )}

              {/* Status */}
              <div className="mb-5">
                <p className="text-slate-300 text-xs opacity-80 mb-1">STATUS</p>
                <span
                  className={`${
                    official.status === "ACTIVE"
                      ? "bg-green-500"
                      : "bg-red-500"
                  } text-white px-3 py-1 rounded-full text-xs font-semibold inline-block`}
                >
                  {official.status}
                </span>
              </div>

              {/* Term Dates */}
              <div>
                <p className="text-slate-300 text-xs opacity-80 mb-1">
                  TERM START
                </p>
                <p className="text-white font-semibold">{termStartDate}</p>
              </div>
            </div>

            {/* Tap to Flip */}
            <p className="text-slate-400 text-xs text-center mt-6">
              Tap to flip back
            </p>
          </div>
        </div>
      </div>

      {/* Info Text */}
      <div className="text-center text-slate-300 text-sm">
        <p>Click or tap the card to flip</p>
      </div>
    </div>
  );
}
