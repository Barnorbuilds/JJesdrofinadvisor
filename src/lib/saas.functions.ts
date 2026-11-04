import { createServerFn } from '@tanstack/react-start';
import { requireSupabaseAuth } from '@/integrations/supabase/auth-middleware';
import { z } from 'zod';

export const getMembership = createServerFn({ method: 'GET' })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const session = await supabase.rpc('session_active');
    if (session.error) throw new Error('Session verification unavailable. Please try again.');
    if (!session.data) throw new Error('Session expired. Sign in again.');
    const since = new Date(); since.setUTCDate(1); since.setUTCHours(0, 0, 0, 0);
    const results = await Promise.all([
      supabase.from('user_roles').select('role').eq('user_id', userId),
      supabase.from('subscription_plans').select('*').order('id'),
      supabase.from('subscriptions').select('*, subscription_plans(*)').eq('user_id', userId).maybeSingle(),
      supabase.from('usage_events').select('kind,state').eq('user_id', userId).gte('created_at', since.toISOString()),
      supabase.from('app_settings').select('*').eq('id', 'global').maybeSingle(),
    ]);
    for (const result of results) if (result.error) throw new Error(result.error.message);
    return { roles: results[0].data ?? [], plans: results[1].data ?? [], subscription: results[2].data, usage: results[3].data ?? [], settings: results[4].data };
  });

export const savePlan = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({
    id: z.enum(['free', 'professional', 'business']), name: z.string().min(1).max(80),
    price_amount: z.number().nonnegative().nullable(), currency: z.string().length(3).nullable(),
    analysis_limit: z.number().int().nonnegative().nullable(), report_limit: z.number().int().nonnegative().nullable(), company_limit: z.number().int().positive().nullable(),
    active: z.boolean(), features: z.object({ translation: z.boolean(), pdf: z.boolean(), advanced_reports: z.boolean(), history: z.boolean() }),
  }).parse(d))
  .handler(async ({ context, data }) => {
    const session = await context.supabase.rpc('session_active');
    if (session.error || !session.data) throw new Error('Session expired. Sign in again.');
    const { data: allowed, error } = await context.supabase.rpc('has_role', { _user_id: context.userId, _role: 'super_admin' });
    if (error || !allowed) throw new Error('Only a Super Administrator can configure plans.');
    const result = await context.supabase.rpc('admin_save_plan', { _plan: { ...data, currency: data.currency?.toUpperCase() ?? null } });
    if (result.error) throw new Error(result.error.message);
    return { ok: true };
  });

export const resetOwnInformation = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ confirmation: z.literal('RESET MY UPLOADED INFORMATION') }).parse(d))
  .handler(async ({ context }) => {
    const allowed = await context.supabase.rpc('reset_own_information');
    if (allowed.error) throw new Error(allowed.error.message);
    let removed = 0;
    for (const bucket of ['statements', 'company-logos']) {
      const paths: string[] = [];
      const walk = async (folder: string) => {
        for (let offset = 0; ; offset += 100) {
          const list = await context.supabase.storage.from(bucket).list(folder, { limit: 100, offset });
          if (list.error) throw new Error('Analysis data reset and reports preserved; uploaded-file cleanup is incomplete. Retry to finish.');
          for (const entry of list.data ?? []) {
            const path = `${folder}/${entry.name}`;
            if (!entry.id) await walk(path); else paths.push(path);
          }
          if ((list.data?.length ?? 0) < 100) break;
        }
      };
      await walk(context.userId);
      for (let i = 0; i < paths.length; i += 100) {
        const result = await context.supabase.storage.from(bucket).remove(paths.slice(i, i + 100));
        if (result.error) throw new Error('Analysis data reset and reports preserved; file cleanup is incomplete. Retry to finish.');
        removed += result.data.length;
      }
    }
    return { removed };
  });