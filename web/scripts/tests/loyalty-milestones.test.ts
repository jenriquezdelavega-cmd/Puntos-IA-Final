import test from 'node:test';
import assert from 'node:assert/strict';

import {
  buildMilestonesPayloadForSave,
  validateMilestonesPayload,
} from '../../app/lib/loyalty-milestones.ts';

test('validateMilestonesPayload allows a single final milestone at required visits', () => {
  const result = validateMilestonesPayload(
    [
      { visitTarget: 3, reward: 'Agua', emoji: '💧' },
      { visitTarget: 10, reward: 'Premio final', emoji: '🏆' },
    ],
    10,
  );

  assert.equal(result.ok, true);
  if (!result.ok) return;

  assert.deepEqual(
    result.milestones.map(({ visitTarget, reward, emoji, isFinal }) => ({ visitTarget, reward, emoji, isFinal })),
    [
      { visitTarget: 3, reward: 'Agua', emoji: '💧', isFinal: false },
      { visitTarget: 10, reward: 'Premio final', emoji: '🏆', isFinal: true },
    ],
  );
});

test('validateMilestonesPayload rejects milestones beyond the final target', () => {
  const result = validateMilestonesPayload(
    [
      { visitTarget: 11, reward: 'Postre', emoji: '🍰' },
      { visitTarget: 10, reward: 'Premio final', emoji: '🏆' },
    ],
    10,
  );

  assert.deepEqual(result, {
    ok: false,
    message: 'El premio intermedio (visita 11) no puede ser mayor a la meta final (10).',
  });
});

test('buildMilestonesPayloadForSave keeps the final milestone when removing an intermediate one', () => {
  const result = buildMilestonesPayloadForSave({
    milestones: [
      { visitTarget: '4', reward: 'Agua', emoji: '💧' },
      { visitTarget: '7', reward: 'Postre', emoji: '🍰' },
    ],
    requiredVisits: 10,
    finalReward: 'Café gratis',
    finalEmoji: '☕',
  });

  assert.equal(result.ok, true);
  if (!result.ok) return;

  assert.deepEqual(
    result.milestones.map(({ visitTarget, reward, emoji, isFinal }) => ({ visitTarget, reward, emoji, isFinal })),
    [
      { visitTarget: 4, reward: 'Agua', emoji: '💧', isFinal: false },
      { visitTarget: 7, reward: 'Postre', emoji: '🍰', isFinal: false },
      { visitTarget: 10, reward: 'Café gratis', emoji: '☕', isFinal: true },
    ],
  );
});

test('buildMilestonesPayloadForSave rejects duplicate final targets from intermediate rows', () => {
  const result = buildMilestonesPayloadForSave({
    milestones: [{ visitTarget: '10', reward: 'Duplicado', emoji: '🎁' }],
    requiredVisits: 10,
    finalReward: 'Premio final',
    finalEmoji: '🏆',
  });

  assert.deepEqual(result, {
    ok: false,
    message: 'Solo puede existir un premio final en la visita 10.',
  });
});
