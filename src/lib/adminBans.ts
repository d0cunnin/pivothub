import { supabase } from "@/integrations/supabase/client";

export interface UserBan { id: string; user_id: string; email: string | null; reason: string; banned_at: string; ips: string[] }
export interface IpBan { ip: string; reason: string; user_id: string | null; banned_at: string; expires_at: string | null }
export interface UserIp { ip: string; source: string; lastSeen: string; count: number; banned: boolean }

/** Call the admin-ban function (admin + two-step verification required). */
export async function adminBan<T = any>(body: Record<string, unknown>): Promise<T> {
  const { data, error } = await supabase.functions.invoke("admin-ban", { body });
  if (error) {
    let message = error.message;
    try { const b = await (error as any).context?.json?.(); if (b?.error) message = b.error; } catch { /* keep default */ }
    throw new Error(message || "Request failed");
  }
  if (data?.error) throw new Error(data.error);
  return data as T;
}

const IP_RE = /^[0-9a-fA-F:.]{3,45}$/;
export const validIp = (ip: string) => IP_RE.test(ip.trim()) && (ip.includes(".") || ip.includes(":"));
