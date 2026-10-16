import test from 'node:test';
import assert from 'node:assert/strict';
import {guardianMascotState} from '../public/guardian-mascot-state.js';

test('mascot follows real request, response, completion and cancellation events', () => {
  let state = guardianMascotState({type:'ready'});
  assert.equal(state, 'idle');
  state = guardianMascotState({type:'request_start'}, state);
  assert.equal(state, 'thinking');
  state = guardianMascotState({type:'status',state:'thinking'}, state);
  assert.equal(state, 'thinking');
  state = guardianMascotState({type:'answer_start'}, state);
  assert.equal(state, 'answering');
  assert.equal(guardianMascotState({type:'complete'},state), 'idle');
  assert.equal(guardianMascotState({type:'ready'},state), 'idle');
});

test('searching requires explicit search event', () => {
  assert.equal(guardianMascotState({type:'tool_start',tool:'other'},'thinking'),'thinking');
  assert.equal(guardianMascotState({type:'tool_start',tool:'search'},'thinking'),'searching');
  assert.equal(guardianMascotState({type:'tool_end'},'searching'),'thinking');
});
