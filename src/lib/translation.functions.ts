import { createServerFn } from '@tanstack/react-start';
import { getRequest } from '@tanstack/react-start/server';
import { requireSupabaseAuth } from '@/integrations/supabase/auth-middleware';
import { z } from 'zod';
import { buildReportCharts, type ChartAnalysis } from './report-charts';
import { applyTranslation, translationSource, REPORT_LANGUAGES, type TranslationPresentation } from './report-translation';

export const translateReport = createServerFn({ method: 'POST' }).middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => z.object({ reportId: z.string().uuid(), language: z.enum(['fr', 'es', 'pt', 'de']) }).parse(data))
  .handler(async ({ context, data }) => {
    const allowed = await context.supabase.rpc('feature_allowed', { _feature: 'translation' });
    if (allowed.error || !allowed.data) throw new Error('Report translation requires an active eligible membership and session.');
    const active = await context.supabase.from('analyses').select('analysis,period_label,updated_at,companies(name,currency)').eq('id', data.reportId).eq('user_id', context.userId).eq('status', 'completed').maybeSingle();
    if (active.error) throw new Error('Unable to read your report.');
    const saved = active.data ? null : await context.supabase.from('saved_reports').select('analysis,period_label,company,created_at').eq('id', data.reportId).eq('user_id', context.userId).maybeSingle();
    const row = active.data ?? saved?.data;
    if (!row?.analysis) throw new Error('Completed report not found.');
    const report = row.analysis as Record<string, unknown>;
    const company = active.data?.companies ?? saved?.data?.company as { name?: string; currency?: string } | null;
    const protectedNames = [company?.name ?? '', company?.currency ?? ''].filter(Boolean);
    const bytes = new TextEncoder().encode(JSON.stringify({ report, company, period: row.period_label }));
    const version = Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', bytes))).map(v => v.toString(16).padStart(2, '0')).join('');
    const cached = await context.supabase.from('report_translations').select('presentation').eq('user_id', context.userId).eq('report_id', data.reportId).eq('source_version', version).eq('language', data.language).maybeSingle();
    if (cached.error) throw new Error('Unable to read saved translations.');
    if (cached.data) return cached.data.presentation as unknown as TranslationPresentation;
    const source = translationSource(report, buildReportCharts(report as ChartAnalysis, row.period_label ?? undefined), protectedNames);
    const key = process.env['LOVABLE_API_KEY'];
    if (!key) throw new Error('Translation service is not configured.');
    const { translateEntries } = await import('./translation-ai.server');
    let entries;
    try { entries = await translateEntries(getRequest(), key, REPORT_LANGUAGES[data.language], source.entries, protectedNames); }
    catch (error) {
      const status = error && typeof error === 'object' && 'statusCode' in error ? error.statusCode : undefined;
      if (status === 402 || status === 403 || status === 429) throw new Error(`Translation service access is paused (${status}). Contact the application owner; the English report remains available.`);
      throw new Error('Translation could not be completed. The English report remains available.');
    }
    const presentation = applyTranslation(source, entries, data.language, protectedNames);
    const session = await context.supabase.rpc('session_active');
    if (session.error || !session.data) throw new Error('Session expired. Sign in again.');
    const { supabaseAdmin } = await import('@/integrations/supabase/client.server');
    const result = await supabaseAdmin.from('report_translations').upsert({ user_id: context.userId, report_id: data.reportId, source_version: version, language: data.language, presentation: presentation as never }, { onConflict: 'user_id,report_id,source_version,language' });
    if (result.error) throw new Error('Translation completed but could not be saved.');
    return presentation;
  });