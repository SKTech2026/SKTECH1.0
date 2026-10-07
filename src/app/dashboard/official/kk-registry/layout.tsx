import type { ReactNode } from "react";
import { DashboardBackButton } from "@/components/dashboard/feature-hub";
export default function Layout({ children }: { children: ReactNode }) { return <><DashboardBackButton href="/dashboard/official/kk-management" label="KK Management" current="KK Registry" />{children}</>; }
