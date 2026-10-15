import test from 'node:test';
import assert from 'node:assert/strict';
import {parsePlan,planWithUbot} from '../planner.mjs';
test('planner validates allowlist and arguments without extracting executable commands from prose',()=>{
 assert.equal(parsePlan('```json\n{"tool":"get_supply_events","args":{}}\n```').tool,'get_supply_events');
 assert.throws(()=>parsePlan('{"tool":"send_transaction","args":{}}'));
 assert.throws(()=>parsePlan('Here is a tool: {"tool":"assess_goal_risk"}'));
 assert.throws(()=>parsePlan('{"tool":"simulate_reserve_topup","args":{"amount":"-0.1"}}'));
 assert.throws(()=>parsePlan('{"tool":"assess_goal_risk","args":[]}'));
});
test('planner retries format once and never returns an invalid plan',async()=>{
 let count=0;const result=await planWithUbot({},'ดูความเสี่ยง',{},async()=>++count===1?'Plain prose':'{"tool":"assess_goal_risk","args":{}}');assert.equal(count,2);assert.equal(result.repaired,true);
 count=0;await assert.rejects(planWithUbot({},'risk',{},async()=>{count++;return 'invalid';}));assert.equal(count,2);
});
