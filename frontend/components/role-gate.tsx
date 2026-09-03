"use client";
import { useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import type { Profile } from "@vilara/contracts";
import { useApiResource } from "./use-api-resource";
import { ErrorNotice } from "./client-ui";

type Me = Profile & { capabilities: { is_owner: boolean; is_staff: boolean; is_admin: boolean } };
export function RoleGate({ role, children }: { role: "owner" | "staff" | "admin"; children: ReactNode }) {
  const router = useRouter(); const { data, error, loading } = useApiResource<Me>("/me");
  const allowed = data && (role === "owner" ? data.capabilities.is_owner : role === "staff" ? data.capabilities.is_staff : data.capabilities.is_admin);
  useEffect(() => { if (data && !allowed) router.replace(role === "owner" ? "/become-owner" : "/profile"); }, [allowed, data, role, router]);
  if (loading || (data && !allowed)) return <div className="shell page"><div className="skeleton" /></div>;
  if (error) return <div className="shell page"><ErrorNotice message={error} /></div>;
  return children;
}

