"use client";

import { ReactNode, useEffect } from "react";
import { useRouter } from "next/navigation";

type LiveRefreshWrapperProps = {
  children: ReactNode;
};

export default function LiveRefreshWrapper({
  children,
}: LiveRefreshWrapperProps) {
  const router = useRouter();

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      router.refresh();
    }, 5000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [router]);

  return <>{children}</>;
}
