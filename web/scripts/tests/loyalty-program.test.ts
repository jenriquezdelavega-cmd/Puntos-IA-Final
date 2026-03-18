import test from 'node:test';
import assert from 'node:assert/strict';

import {
  DEFAULT_REQUIRED_VISITS,
  MAX_REQUIRED_VISITS,
  parseOptionalRequiredVisits,
  sanitizeRequiredVisits,
} from '../../app/lib/loyalty-program.ts';

test('sanitizeRequiredVisits clamps values to the admin maximum', () => {
  assert.equal(sanitizeRequiredVisits(0), 1);
  assert.equal(sanitizeRequiredVisits(7), 7);
  assert.equal(sanitizeRequiredVisits(99), MAX_REQUIRED_VISITS);
});

test('sanitizeRequiredVisits falls back to the default when parsing fails', () => {
  assert.equal(sanitizeRequiredVisits(''), DEFAULT_REQUIRED_VISITS);
  assert.equal(sanitizeRequiredVisits('abc'), DEFAULT_REQUIRED_VISITS);
});

test('parseOptionalRequiredVisits preserves undefined and clamps numeric input', () => {
  assert.equal(parseOptionalRequiredVisits(undefined), undefined);
  assert.equal(parseOptionalRequiredVisits(''), undefined);
  assert.equal(parseOptionalRequiredVisits('15'), MAX_REQUIRED_VISITS);
});
