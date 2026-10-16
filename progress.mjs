import {AsyncLocalStorage} from 'node:async_hooks';
const progress=new AsyncLocalStorage();
export const withProgress=(emit,fn)=>progress.run(emit,fn);
// Only public state names cross this channel, never prompts, arguments or results.
export function reportProgress(type,label=''){
 const phase=type==='tool.start'||(type==='process.start'&&label==='Refresh wallet and supply')?'search':type==='model.start'?(label.includes('final explanation')?'answer':'thinking'):type==='agent.answer'?'answer':type==='tool.result'||type==='tool.error'?'thinking':null;
 if(phase)progress.getStore()?.({type:'phase',phase});
}
