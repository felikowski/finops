import { describe, expect, it } from 'vitest';
import { buildFocusColumnSelectSql, buildLineItemKeyExpr } from './focus-column-mapping';

describe('buildFocusColumnSelectSql', () => {
  const FOCUS_1_2_MANDATORY_HEADERS = [
    'BilledCost',
    'BillingAccountId',
    'BillingAccountName',
    'BillingCurrency',
    'BillingPeriodEnd',
    'BillingPeriodStart',
    'ChargeCategory',
    'ChargeDescription',
    'ChargePeriodEnd',
    'ChargePeriodStart',
    'Provider',
  ];

  it('coalesces both candidates, FOCUS 1.2 first, when both are present', () => {
    // Mirrors the old val()'s per-row fallback: a real export could have
    // Provider null on some rows and ProviderName populated, so both are
    // tried, not just "prefer 1.2 if the column exists at all".
    const headers = new Set([...FOCUS_1_2_MANDATORY_HEADERS, 'ProviderName']);
    const sql = buildFocusColumnSelectSql(headers);
    expect(sql).toContain(
      `COALESCE(NULLIF("Provider", 'NULL'), NULLIF("ProviderName", 'NULL')) AS "provider"`,
    );
  });

  it('falls back to the FOCUS 1.0 candidate when only that is present', () => {
    const headers = new Set(
      FOCUS_1_2_MANDATORY_HEADERS.filter((h) => h !== 'Provider').concat('ProviderName'),
    );
    const sql = buildFocusColumnSelectSql(headers);
    expect(sql).toContain(`NULLIF("ProviderName", 'NULL') AS "provider"`);
    expect(sql).not.toContain('"Provider"');
  });

  it('resolves an absent optional column to NULL instead of referencing it', () => {
    const headers = new Set(FOCUS_1_2_MANDATORY_HEADERS);
    const sql = buildFocusColumnSelectSql(headers);
    expect(sql).toContain('NULL AS "chargeClass"');
    expect(sql).not.toContain('"ChargeClass"');
  });

  it('applies a TRY_CAST for non-VARCHAR columns', () => {
    const headers = new Set(FOCUS_1_2_MANDATORY_HEADERS);
    const sql = buildFocusColumnSelectSql(headers);
    expect(sql).toContain(`TRY_CAST(NULLIF("BilledCost", 'NULL') AS DECIMAL(20,10)) AS "billedCost"`);
    expect(sql).toContain(`TRY_CAST(NULLIF("BillingPeriodStart", 'NULL') AS TIMESTAMP) AS "billingPeriodStart"`);
  });

  it('throws a clear error when a mandatory column has no matching header', () => {
    const headers = new Set(FOCUS_1_2_MANDATORY_HEADERS.filter((h) => h !== 'BilledCost'));
    expect(() => buildFocusColumnSelectSql(headers)).toThrow(/billedCost/);
    expect(() => buildFocusColumnSelectSql(headers)).toThrow(/BilledCost/);
  });
});

describe('buildLineItemKeyExpr', () => {
  it('produces a sha256 expression over the key field columns', () => {
    const expr = buildLineItemKeyExpr();
    expect(expr.startsWith(`sha256(concat_ws('|', `)).toBe(true);
    expect(expr.endsWith(')))')).toBe(true);
    expect(expr).toContain('"provider"::VARCHAR');
    expect(expr).toContain('"billingAccountId"::VARCHAR');
  });
});
