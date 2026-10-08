import type { ReactNode } from "react";
import { LanguageProvider } from "@/components/i18n/LanguageProvider";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return <LanguageProvider>{children}</LanguageProvider>;
}
