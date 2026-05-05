"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";

type InteractiveLogoProps = {
  className?: string;
  src?: string;
  alt?: string;
  darkMode?: boolean;
};

const RESET_MS = 1350;

export default function InteractiveLogo({
  className = "",
  src = "/login-logo.png",
  alt = "SKTech Logo",
  darkMode = false,
}: InteractiveLogoProps) {
  const [isAnimating, setIsAnimating] = useState(false);
  const [runId, setRunId] = useState(0);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const playAnimation = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    setRunId((previous) => previous + 1);
    setIsAnimating(true);

    timeoutRef.current = setTimeout(() => {
      setIsAnimating(false);
      timeoutRef.current = null;
    }, RESET_MS);
  }, []);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return (
    <button
      type="button"
      onClick={playAnimation}
      aria-label="Play SKTech logo animation"
      className={`interactive-logo ${darkMode ? "is-dark" : "is-light"} ${
        isAnimating ? "is-active" : ""
      } ${className}`}
    >
      <span key={runId} className="interactive-logo__stage">
        <Image
          src={src}
          alt={alt}
          width={720}
          height={400}
          priority
          className="interactive-logo__image"
        />

        <span className="interactive-logo__ambient-glow" />
        <span className="interactive-logo__spark spark-1" />
        <span className="interactive-logo__spark spark-2" />
        <span className="interactive-logo__spark spark-3" />
        <span className="interactive-logo__spark spark-4" />
      </span>
    </button>
  );
}
