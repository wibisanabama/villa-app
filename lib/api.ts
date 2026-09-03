import type { ApiFailure, ApiSuccess } from "@vilara/contracts";
import { createClient } from "./supabase/client";

export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000/api/v1";

export class ApiClientError extends Error {
  constructor(public code: string, message: string, public status: number, public fieldErrors?: Record<string, string[]>) {
    super(message);
  }
}

export async function api<T>(path: string, options: RequestInit = {}): Promise<T> {
  const { data: { session } } = await createClient().auth.getSession();
  const headers = new Headers(options.headers);
  if (!(options.body instanceof FormData)) headers.set("Content-Type", "application/json");
  if (session?.access_token) headers.set("Authorization", `Bearer ${session.access_token}`);
  const response = await fetch(`${API_URL}${path}`, { ...options, headers, cache: "no-store" });
  const body = await response.json().catch(() => null) as ApiSuccess<T> | ApiFailure | null;
  if (!response.ok || !body || "error" in body) {
    const failure = body && "error" in body ? body.error : undefined;
    throw new ApiClientError(failure?.code ?? "NETWORK_ERROR", failure?.message ?? "Permintaan tidak dapat diproses.", response.status, failure?.fieldErrors);
  }
  return body.data;
}

export async function publicApi<T>(path: string): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, { cache: "no-store" });
  if (!response.ok) throw new Error("Data tidak tersedia");
  const body = await response.json() as ApiSuccess<T>;
  return body.data;
}
