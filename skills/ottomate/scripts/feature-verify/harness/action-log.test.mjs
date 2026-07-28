import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ActionLog } from './action-log.mjs';

test('records ordered steps with an injected clock; detail is optional', () => {
  let n = 0;
  const log = new ActionLog({ now: () => `t${n++}` });
  log.step('goto', { url: '/?m=buffalo' }).step('click', { role: 'button', name: 'CHANGE INDICATOR' }).step('assert-url');
  assert.deepEqual(log.toJSON(), [
    { seq: 0, at: 't0', action: 'goto', detail: { url: '/?m=buffalo' } },
    { seq: 1, at: 't1', action: 'click', detail: { role: 'button', name: 'CHANGE INDICATOR' } },
    { seq: 2, at: 't2', action: 'assert-url' },
  ]);
});

test('a fresh log is empty and step() is chainable', () => {
  const log = new ActionLog({ now: () => 'x' });
  assert.deepEqual(log.toJSON(), []);
  assert.equal(log.step('a'), log);
});
