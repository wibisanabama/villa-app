"use client";
import { useCallback, useEffect, useState } from "react";
import { api } from "@/lib/api";

export function useApiResource<T>(path: string) {
  const [data, setData] = useState<T | null>(null); const [error, setError] = useState(""); const [loading, setLoading] = useState(true); const [version, setVersion] = useState(0);
  useEffect(() => {
    let active = true;
    api<T>(path).then((value) => { if (active) { setData(value); setError(""); } }).catch((caught: unknown) => { if (active) setError(caught instanceof Error ? caught.message : "Data tidak dapat dimuat."); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [path, version]);
  const reload = useCallback(() => { setLoading(true); setVersion((value) => value + 1); }, []);
  return { data, error, loading, reload };
}

