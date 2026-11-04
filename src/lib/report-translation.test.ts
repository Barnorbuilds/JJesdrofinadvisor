import { describe, expect, it } from 'vitest';
import { applyTranslation, translationSource, validateTranslation } from './report-translation';
describe('financial report translation', () => {
  it('retains amounts, ratios, formulas, dates and company names', () => {
    const report = { executive_summary: 'Acme revenue is ₵1,200 in 2026, up 10%.', extracted: { currency: 'GHS', income_statement: { revenue: 1200, period: '2026' } }, ratios: [{ name: 'Current Ratio', value: '1.5', formula: 'Assets / Liabilities', computation: '150 / 100 = 1.5', interpretation: 'Coverage is 1.5x.' }] };
    const source = translationSource(report, [], ['Acme', 'GHS']);
    const translated = source.entries.map(e => ({ ...e, text: e.text.replace('revenue is', 'revenu est').replace('Coverage is', 'Couverture est') }));
    const output = applyTranslation(source, translated, 'fr', ['Acme', 'GHS']);
    expect(output.report.extracted).toEqual(report.extracted);
    expect((output.report.ratios as typeof report.ratios)[0].value).toBe('1.5');
    expect((output.report.ratios as typeof report.ratios)[0].computation).toBe('150 / 100 = 1.5');
    expect(report.executive_summary).toBe('Acme revenue is ₵1,200 in 2026, up 10%.');
  });
  it('rejects a changed percentage', () => { expect(() => validateTranslation([{ id: 'a', text: 'Up 10%.' }], [{ id: 'a', text: 'Hausse 11%.' }], [])).toThrow(); });
  it('rejects a changed company name', () => { expect(() => validateTranslation([{ id: 'a', text: 'Acme is solvent.' }], [{ id: 'a', text: 'Other est solvable.' }], ['Acme'])).toThrow(); });
  it('rejects omitted sections', () => { expect(() => validateTranslation([{ id: 'a', text: 'Advice' }], [], [])).toThrow(); });
});