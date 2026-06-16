import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { affectsCompliance, isTnaRequirementFulfilled } from './tna-policy';

const asOf = new Date('2026-06-16T00:00:00Z');

describe('TNA fulfillment policy', () => {
  it('requires a valid certificate for once requirements', () => {
    assert.equal(isTnaRequirementFulfilled(
      { recurrence: 'once', intervalMonths: null, effectiveYear: null },
      [{ issueDate: new Date('2024-01-01'), expiryDate: null }],
      asOf,
    ), true);
    assert.equal(isTnaRequirementFulfilled(
      { recurrence: 'once', intervalMonths: null, effectiveYear: null },
      [{ issueDate: new Date('2024-01-01'), expiryDate: new Date('2025-01-01') }],
      asOf,
    ), false);
  });

  it('requires same target year for annual requirements', () => {
    assert.equal(isTnaRequirementFulfilled(
      { recurrence: 'annual', intervalMonths: null, effectiveYear: 2026 },
      [{ issueDate: new Date('2026-02-01'), expiryDate: new Date('2027-02-01') }],
      asOf,
    ), true);
    assert.equal(isTnaRequirementFulfilled(
      { recurrence: 'annual', intervalMonths: null, effectiveYear: 2026 },
      [{ issueDate: new Date('2025-12-01'), expiryDate: new Date('2027-02-01') }],
      asOf,
    ), false);
  });

  it('supports interval month requirements without expiry dates', () => {
    assert.equal(isTnaRequirementFulfilled(
      { recurrence: 'interval_months', intervalMonths: 24, effectiveYear: null },
      [{ issueDate: new Date('2025-01-01'), expiryDate: null }],
      asOf,
    ), true);
    assert.equal(isTnaRequirementFulfilled(
      { recurrence: 'interval_months', intervalMonths: 6, effectiveYear: null },
      [{ issueDate: new Date('2025-01-01'), expiryDate: null }],
      asOf,
    ), false);
  });

  it('only mandatory requirements affect compliance', () => {
    assert.equal(affectsCompliance('mandatory'), true);
    assert.equal(affectsCompliance('development'), false);
  });
});
