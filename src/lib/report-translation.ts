import type { ReportChart } from './report-charts';

export const REPORT_LANGUAGES = { en: 'English', fr: 'French', es: 'Spanish', pt: 'Portuguese', de: 'German' } as const;
export type ReportLanguage = keyof typeof REPORT_LANGUAGES;
export type TranslationEntry = { id: string; text: string };
export type TranslationPresentation = { report: Record<string, unknown>; charts: ReportChart[]; labels: Record<string, string>; language: ReportLanguage };
const immutableKeys = new Set(['currency', 'period', 'period_label', 'value', 'computation', 'formula', 'status', 'direction', 'severity']);
const numericTokens = (text: string) => text.match(/[+-]?\d+(?:[.,:/–-]\d+)*(?:\s?[%x])?/g) ?? [];
const label = (key: string) => key.replaceAll('_', ' ').replace(/\b\w/g, x => x.toUpperCase());

/** Only text leaves are supplied to AI. Financial fields never leave their source representation. */
export function translationSource(report: Record<string, unknown>, charts: ReportChart[], protectedNames: string[] = []) {
  const labels: Record<string, string> = { report: 'Financial Report', review: 'AI-assisted translation. Review before formal financial or regulatory use.' };
  const entries: TranslationEntry[] = [];
  const collect = (value: unknown, path: string, key = '') => {
    if (key === 'extracted' || key === 'summary_metrics' || immutableKeys.has(key)) return;
    if (typeof value === 'string' && value.trim() && !protectedNames.includes(value)) entries.push({ id: path, text: value });
    else if (Array.isArray(value)) value.forEach((v, i) => collect(v, `${path}/${i}`, key === 'labels' ? 'period' : ''));
    else if (value && typeof value === 'object') Object.entries(value).forEach(([k, v]) => { labels[k] ??= label(k); collect(v, `${path}/${k}`, k); });
  };
  collect(report, 'report'); collect(charts, 'charts');
  Object.entries(labels).forEach(([id, text]) => entries.push({ id: `labels/${id}`, text }));
  return { presentation: { report, charts, labels }, entries };
}

export function validateTranslation(source: TranslationEntry[], translated: TranslationEntry[], protectedNames: string[]) {
  if (source.length !== translated.length) throw new Error('Translation is incomplete. The English report is unchanged.');
  const byId = new Map(translated.map(e => [e.id, e.text]));
  if (byId.size !== source.length) throw new Error('Translation contains duplicate sections.');
  for (const entry of source) {
    const text = byId.get(entry.id);
    if (!text?.trim()) throw new Error('Translation is missing a report section.');
    if (JSON.stringify(numericTokens(entry.text)) !== JSON.stringify(numericTokens(text))) throw new Error('Translation changed a financial value and was rejected.');
    for (const name of protectedNames.filter(Boolean)) {
      const count = (s: string) => s.split(name).length - 1;
      if (count(entry.text) !== count(text)) throw new Error('Translation changed a protected name or currency and was rejected.');
    }
    const symbols = (s: string) => s.match(/[$€£¥₵]/g) ?? [];
    if (JSON.stringify(symbols(entry.text)) !== JSON.stringify(symbols(text))) throw new Error('Translation changed a currency symbol and was rejected.');
  }
  return byId;
}

export function applyTranslation(source: ReturnType<typeof translationSource>, translated: TranslationEntry[], language: ReportLanguage, protectedNames: string[]): TranslationPresentation {
  const texts = validateTranslation(source.entries, translated, protectedNames);
  const replace = (value: unknown, path: string): unknown => {
    if (typeof value === 'string') return texts.get(path) ?? value;
    if (Array.isArray(value)) return value.map((v, i) => replace(v, `${path}/${i}`));
    if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, replace(v, `${path}/${k}`)]));
    return value;
  };
  return { report: replace(source.presentation.report, 'report') as Record<string, unknown>, charts: replace(source.presentation.charts, 'charts') as ReportChart[], labels: replace(source.presentation.labels, 'labels') as Record<string, string>, language };
}