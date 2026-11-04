import { createServerFn } from '@tanstack/react-start';
import { requireSupabaseAuth } from '@/integrations/supabase/auth-middleware';
import { z } from 'zod';
export type AdminUser = { id: string; email: string; created_at: string; suspended: boolean; roles: string[]; analysis_used: number; report_used: number; subscription: { plan_id: string | null; status: string; expires_at: string | null } | null };
export type AdminOverview = { users: AdminUser[]; audit: Array<{ action: string; target_id: string | null; created_at: string }>; super_admin: boolean };
export const getAdministration = createServerFn({ method: 'GET' }).middleware([requireSupabaseAuth]).handler(async ({ context }) => {
  const result = await context.supabase.rpc('admin_overview');
  if (result.error) throw new Error('Administrator access required.');
  return result.data as unknown as AdminOverview;
});
export const setSuspension = createServerFn({ method: 'POST' }).middleware([requireSupabaseAuth]).inputValidator((d: unknown) => z.object({ userId: z.string().uuid(), suspended: z.boolean() }).parse(d)).handler(async ({ context, data }) => {
  const result = await context.supabase.rpc('admin_set_suspension', { _user: data.userId, _suspended: data.suspended });
  if (result.error) throw new Error(result.error.message); return { ok: true };
});
export const setRole = createServerFn({ method: 'POST' }).middleware([requireSupabaseAuth]).inputValidator((d: unknown) => z.object({ userId: z.string().uuid(), role: z.enum(['super_admin', 'admin', 'user']) }).parse(d)).handler(async ({ context, data }) => {
  const result = await context.supabase.rpc('admin_set_role', { _user: data.userId, _role: data.role });
  if (result.error) throw new Error(result.error.message); return { ok: true };
});
export const configureInactivity = createServerFn({ method: 'POST' }).middleware([requireSupabaseAuth]).inputValidator((d: unknown) => z.object({ minutes: z.number().int().min(2).max(480) }).parse(d)).handler(async ({ context, data }) => {
  const result = await context.supabase.rpc('configure_security', { _minutes: data.minutes });
  if (result.error) throw new Error(result.error.message); return { ok: true };
});