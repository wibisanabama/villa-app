import type { ReactNode } from "react";
import { AppShell } from "@/components/app-shell";
import { RoleGate } from "@/components/role-gate";
export default function DashboardLayout({children}:{children:ReactNode}){return <RoleGate role="owner"><AppShell mode="owner">{children}</AppShell></RoleGate>}
