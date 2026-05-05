"use client";

import Image from "next/image";

type LogoSize = "sm" | "md" | "lg";
type LogoTheme = "light" | "dark";

type LogoProps = {
  size?: LogoSize;
  theme?: LogoTheme;
  className?: string;
  src?: string;
  alt?: string;
};

const sizeClass: Record<LogoSize, string> = {
  sm: "h-11 w-11",
  md: "h-14 w-14",
  lg: "h-20 w-20",
};

const imageSize: Record<LogoSize, number> = {
  sm: 44,
  md: 56,
  lg: 80,
};

export default function Logo({
  size = "md",
  theme = "dark",
  className = "",
  src = "/sk-tech-logo.png",
  alt = "SKTech Logo",
}: LogoProps) {
  const px = imageSize[size];
  const imageToneClass =
    theme === "dark"
      ? "drop-shadow-[0_6px_14px_rgba(2,6,23,0.45)]"
      : "drop-shadow-[0_2px_6px_rgba(15,23,42,0.18)]";

  return (
    <div className={`flex items-center justify-center ${sizeClass[size]} ${className}`}>
      <Image
        src={src}
        alt={alt}
        width={px}
        height={px}
        priority
        className={`h-full w-full scale-[2.25] object-contain transition-transform duration-200 hover:scale-[2.35] ${imageToneClass}`}
      />
    </div>
  );
}
