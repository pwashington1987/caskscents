import { test } from 'node:test';
import assert from 'node:assert/strict';
import { closest, checkLabel, vocabMessage } from './vocab.ts';

const accords = ['Vanilla', 'Sweet', 'Powdery', 'Amber', 'Musky', 'Cherry'];

test('an exact label passes', () => {
  assert.deepEqual(checkLabel('Vanilla', accords), { ok: true });
});

test('labels are case sensitive, and the right casing is suggested', () => {
  assert.deepEqual(checkLabel('vanilla', accords), { ok: false, suggestion: 'Vanilla' });
});

test('a near miss gets the closest valid label', () => {
  assert.equal(closest('Vanila', accords), 'Vanilla');
  assert.equal(closest('Powdry', accords), 'Powdery');
});

test('something unrelated gets no suggestion', () => {
  assert.equal(closest('Petrichor', accords), undefined);
  assert.deepEqual(checkLabel('Petrichor', accords), { ok: false });
});

test('the message names the kind, the value, the fix and the file', () => {
  const msg = vocabMessage('accord', 'Vanila', accords, 'src/data/accords.ts');
  assert.match(msg, /Unknown accord "Vanila"/);
  assert.match(msg, /Did you mean "Vanilla"\?/);
  assert.match(msg, /src\/data\/accords\.ts/);
});

test('the message still helps when nothing is close', () => {
  const msg = vocabMessage('accord', 'Petrichor', accords, 'src/data/accords.ts');
  assert.match(msg, /Unknown accord "Petrichor"/);
  assert.doesNotMatch(msg, /Did you mean/);
  assert.match(msg, /add it to src\/data\/accords\.ts/);
});
