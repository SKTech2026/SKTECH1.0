import type { ReactNode } from "react";
import { DashboardBackButton } from "@/components/dashboard/feature-hub";
export default function Layout({ children }: { children: ReactNode }) { return <><DashboardBackButton href="/dashboard/admin/analytics" label="Overall Analytics" current="Provincial Analytics" />{children}</>; }
