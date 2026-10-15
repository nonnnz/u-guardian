import {AsyncLocalStorage} from 'node:async_hooks';

const budgets=new AsyncLocalStorage();
export function withinBudget(deadline,fn){return budgets.run(Math.min(deadline,budgets.getStore()??Infinity),fn);}
export function providerSignal(timeout){
 const remaining=Math.min(timeout,(budgets.getStore()??Infinity)-Date.now());
 if(remaining<=0)throw new DOMException('Agent time budget exhausted','TimeoutError');
 return AbortSignal.timeout(Math.max(1,Math.floor(remaining)));
}
