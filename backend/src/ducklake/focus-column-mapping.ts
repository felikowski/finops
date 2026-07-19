/**
 * FOCUS 1.0/1.2 CSV column mapping for the DuckLake ingestion push-down —
 * the SQL-generation equivalent of the old row-by-row `mapRecord()`/
 * `KEY_FIELDS` in billing.service.ts (removed once this landed). Kept in its
 * own file so the SQL-building logic is unit-testable without touching a
 * real DuckDB/S3/Postgres connection.
 */

export type FocusColumnType = 'VARCHAR' | 'DECIMAL(20,10)' | 'TIMESTAMP' | 'JSON';

export interface FocusColumnDef {
  /** Target DuckLake column name (matches the old Postgres entity 1:1). */
  column: string;
  /** Candidate CSV header names, in priority order (FOCUS 1.2 first, then 1.0 fallbacks). */
  candidates: string[];
  type: FocusColumnType;
  /** Mandatory FOCUS columns must resolve to at least one present candidate. */
  mandatory?: boolean;
}

export const FOCUS_COLUMNS: FocusColumnDef[] = [
  // ─── Mandatory ────────────────────────────────────────────────────────
  { column: 'billedCost', candidates: ['BilledCost'], type: 'DECIMAL(20,10)', mandatory: true },
  { column: 'billingAccountId', candidates: ['BillingAccountId'], type: 'VARCHAR', mandatory: true },
  { column: 'billingAccountName', candidates: ['BillingAccountName'], type: 'VARCHAR', mandatory: true },
  { column: 'billingCurrency', candidates: ['BillingCurrency'], type: 'VARCHAR', mandatory: true },
  { column: 'billingPeriodEnd', candidates: ['BillingPeriodEnd'], type: 'TIMESTAMP', mandatory: true },
  { column: 'billingPeriodStart', candidates: ['BillingPeriodStart'], type: 'TIMESTAMP', mandatory: true },
  { column: 'chargeCategory', candidates: ['ChargeCategory'], type: 'VARCHAR', mandatory: true },
  { column: 'chargeClass', candidates: ['ChargeClass'], type: 'VARCHAR' },
  { column: 'chargeDescription', candidates: ['ChargeDescription'], type: 'VARCHAR', mandatory: true },
  { column: 'chargePeriodEnd', candidates: ['ChargePeriodEnd'], type: 'TIMESTAMP', mandatory: true },
  { column: 'chargePeriodStart', candidates: ['ChargePeriodStart'], type: 'TIMESTAMP', mandatory: true },
  { column: 'provider', candidates: ['Provider', 'ProviderName'], type: 'VARCHAR', mandatory: true },

  // ─── Conditional / recommended ───────────────────────────────────────
  { column: 'availabilityZone', candidates: ['AvailabilityZone'], type: 'VARCHAR' },
  { column: 'billingAccountType', candidates: ['BillingAccountType'], type: 'VARCHAR' },
  { column: 'capacityReservationId', candidates: ['CapacityReservationId'], type: 'VARCHAR' },
  { column: 'capacityReservationStatus', candidates: ['CapacityReservationStatus'], type: 'VARCHAR' },
  { column: 'chargeFrequency', candidates: ['ChargeFrequency'], type: 'VARCHAR' },
  { column: 'commitmentDiscountCategory', candidates: ['CommitmentDiscountCategory'], type: 'VARCHAR' },
  { column: 'commitmentDiscountId', candidates: ['CommitmentDiscountId'], type: 'VARCHAR' },
  { column: 'commitmentDiscountName', candidates: ['CommitmentDiscountName'], type: 'VARCHAR' },
  { column: 'commitmentDiscountQuantity', candidates: ['CommitmentDiscountQuantity'], type: 'DECIMAL(20,10)' },
  { column: 'commitmentDiscountStatus', candidates: ['CommitmentDiscountStatus'], type: 'VARCHAR' },
  { column: 'commitmentDiscountType', candidates: ['CommitmentDiscountType'], type: 'VARCHAR' },
  { column: 'commitmentDiscountUnit', candidates: ['CommitmentDiscountUnit'], type: 'VARCHAR' },
  { column: 'consumedQuantity', candidates: ['ConsumedQuantity'], type: 'DECIMAL(20,10)' },
  { column: 'consumedUnit', candidates: ['ConsumedUnit'], type: 'VARCHAR' },
  { column: 'contractedCost', candidates: ['ContractedCost'], type: 'DECIMAL(20,10)' },
  { column: 'contractedUnitPrice', candidates: ['ContractedUnitPrice'], type: 'DECIMAL(20,10)' },
  { column: 'effectiveCost', candidates: ['EffectiveCost'], type: 'DECIMAL(20,10)' },
  { column: 'invoiceId', candidates: ['InvoiceId'], type: 'VARCHAR' },
  { column: 'invoiceIssuer', candidates: ['InvoiceIssuer', 'InvoiceIssuerName'], type: 'VARCHAR' },
  { column: 'listCost', candidates: ['ListCost'], type: 'DECIMAL(20,10)' },
  { column: 'listUnitPrice', candidates: ['ListUnitPrice'], type: 'DECIMAL(20,10)' },
  { column: 'pricingCategory', candidates: ['PricingCategory'], type: 'VARCHAR' },
  { column: 'pricingCurrency', candidates: ['PricingCurrency'], type: 'VARCHAR' },
  { column: 'pricingCurrencyContractedUnitPrice', candidates: ['PricingCurrencyContractedUnitPrice'], type: 'DECIMAL(20,10)' },
  { column: 'pricingCurrencyEffectiveCost', candidates: ['PricingCurrencyEffectiveCost'], type: 'DECIMAL(20,10)' },
  { column: 'pricingCurrencyListUnitPrice', candidates: ['PricingCurrencyListUnitPrice'], type: 'DECIMAL(20,10)' },
  { column: 'pricingQuantity', candidates: ['PricingQuantity'], type: 'DECIMAL(20,10)' },
  { column: 'pricingUnit', candidates: ['PricingUnit'], type: 'VARCHAR' },
  { column: 'publisher', candidates: ['Publisher', 'PublisherName'], type: 'VARCHAR' },
  { column: 'regionId', candidates: ['RegionId'], type: 'VARCHAR' },
  { column: 'regionName', candidates: ['RegionName'], type: 'VARCHAR' },
  { column: 'resourceId', candidates: ['ResourceId'], type: 'VARCHAR' },
  { column: 'resourceName', candidates: ['ResourceName'], type: 'VARCHAR' },
  { column: 'resourceType', candidates: ['ResourceType'], type: 'VARCHAR' },
  { column: 'serviceCategory', candidates: ['ServiceCategory'], type: 'VARCHAR' },
  { column: 'serviceName', candidates: ['ServiceName'], type: 'VARCHAR' },
  { column: 'serviceSubcategory', candidates: ['ServiceSubcategory'], type: 'VARCHAR' },
  { column: 'skuId', candidates: ['SkuId'], type: 'VARCHAR' },
  { column: 'skuMeter', candidates: ['SkuMeter'], type: 'VARCHAR' },
  { column: 'skuPriceDetails', candidates: ['SkuPriceDetails'], type: 'VARCHAR' },
  { column: 'skuPriceId', candidates: ['SkuPriceId'], type: 'VARCHAR' },
  { column: 'subAccountId', candidates: ['SubAccountId'], type: 'VARCHAR' },
  { column: 'subAccountName', candidates: ['SubAccountName'], type: 'VARCHAR' },
  { column: 'subAccountType', candidates: ['SubAccountType'], type: 'VARCHAR' },
  { column: 'tags', candidates: ['Tags'], type: 'JSON' },
];

/**
 * The dimensions that identify *what* is being charged — mirrors the old
 * `KEY_FIELDS` in billing.service.ts exactly. Two rows with the same values
 * across these columns are the same line item; a re-pull upserts the value
 * columns (costs, quantities, ...) onto it via MERGE INTO rather than
 * inserting a duplicate.
 */
export const KEY_FIELD_COLUMNS: string[] = [
  'provider',
  'billingAccountId',
  'subAccountId',
  'billingCurrency',
  'billingPeriodStart',
  'billingPeriodEnd',
  'chargePeriodStart',
  'chargePeriodEnd',
  'chargeCategory',
  'chargeClass',
  'chargeDescription',
  'chargeFrequency',
  'pricingCategory',
  'pricingCurrency',
  'pricingUnit',
  'consumedUnit',
  'resourceId',
  'resourceType',
  'regionId',
  'availabilityZone',
  'serviceCategory',
  'serviceName',
  'serviceSubcategory',
  'skuId',
  'skuMeter',
  'skuPriceId',
  'commitmentDiscountId',
  'commitmentDiscountType',
  'capacityReservationId',
  'invoiceId',
];

export function quoteIdent(name: string): string {
  return `"${name.replace(/"/g, '""')}"`;
}

export function sqlLiteral(value: string): string {
  return `'${value.replace(/'/g, "''")}'`;
}

/**
 * Builds the inner SELECT's column list, mapping each FOCUS target column to
 * whichever candidate CSV header is actually present (FOCUS 1.2 name first,
 * then 1.0 fallbacks) — the SQL-generation equivalent of the old `val()`
 * helper's tolerant dynamic lookup. A CSV column that doesn't exist can't be
 * referenced in DuckDB SQL without a binder error, so this only ever emits
 * references to headers confirmed present in `availableHeaders`.
 *
 * Throws if a *mandatory* FOCUS column has no matching header at all —
 * conditional/recommended columns silently resolve to `NULL` instead.
 */
export function buildFocusColumnSelectSql(availableHeaders: Set<string>): string {
  const columnExprs = FOCUS_COLUMNS.map((def) => {
    const present = def.candidates.filter((c) => availableHeaders.has(c));
    if (present.length === 0) {
      if (def.mandatory) {
        throw new Error(
          `Missing mandatory FOCUS column "${def.column}" — expected one of: ${def.candidates.join(', ')}`,
        );
      }
      return `NULL AS ${quoteIdent(def.column)}`;
    }

    const parts = present.map((c) => `NULLIF(${quoteIdent(c)}, ${sqlLiteral('NULL')})`);
    const coalesced = parts.length === 1 ? parts[0] : `COALESCE(${parts.join(', ')})`;
    const expr = def.type === 'VARCHAR' ? coalesced : `TRY_CAST(${coalesced} AS ${def.type})`;
    return `${expr} AS ${quoteIdent(def.column)}`;
  });

  return columnExprs.join(',\n  ');
}

/**
 * The dedup key expression, computed in an outer SELECT over the mapped
 * columns (so it can reference their plain aliases directly, rather than
 * repeating each candidate-fallback expression). Doesn't need to match the
 * old Postgres sha256(JSON.stringify(...)) byte-for-byte — DuckLake has its
 * own separate table, this key only needs to be internally consistent.
 */
export function buildLineItemKeyExpr(): string {
  const parts = KEY_FIELD_COLUMNS.map((c) => `COALESCE(${quoteIdent(c)}::VARCHAR, '')`);
  return `sha256(concat_ws('|', ${parts.join(', ')}))`;
}
