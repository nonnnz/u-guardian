import {AsyncLocalStorage} from 'node:async_hooks';
import {randomUUID} from 'node:crypto';

// Request-scoped, opt-in diagnostics. Never persisted or printed to server logs.
const scope=new AsyncLocalStorage();
const sensitive=/^(authorization|proxyauthorization|cookie|setcookie|.*apikey|.*secret|.*password|ubottoken|ubotbearer|elevenkey|avalanchekey|tokenomistkey|accesstoken|refreshtoken|authtoken|token|privatekey|mnemonic|seedphrase)$/i;
export function createDebug(config={}){
 const secrets=Object.entries(config).filter(([key,value])=>sensitive.test(key.replace(/[-_]/g,''))&&typeof value==='string'&&value).flatMap(([,v])=>[v,encodeURIComponent(v),JSON.stringify(v).slice(1,-1)]).sort((a,b)=>b.length-a.length);
 const started=Date.now(),events=[];let size=0,limited=false;
 const cleanText=value=>{
  let text=String(value);for(const secret of secrets)text=text.replaceAll(secret,'[REDACTED]');
  return text.replace(/Bearer\s+[^\s"'<>]+/gi,'Bearer [REDACTED]').replace(/eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/g,'[REDACTED JWT]')
   .replace(/((?:["']?\b(?:authorization|[\w-]{0,40}api[_-]?key|[\w-]{0,40}secret|password|ubot[_-]?(?:token|bearer)|access[_-]?token|refresh[_-]?token)["']?)\s*[:=]\s*)("(?:\\.|[^"\\])*"|'[^']*'|[^\s,;}]+)/gi,'$1[REDACTED]');
 };
 function clean(value,depth=0){
  if(depth>18)return '[Depth limit]';
  if(typeof value==='string')return cleanText(value);
  if(typeof value==='bigint')return String(value);
  if(Array.isArray(value))return value.slice(0,300).map(v=>clean(v,depth+1)).concat(value.length>300?['[More items omitted]']:[]);
  if(value&&typeof value==='object')return Object.fromEntries(Object.entries(value).slice(0,300).map(([k,v])=>[cleanText(k),sensitive.test(k.replace(/[-_]/g,''))?'[REDACTED]':clean(v,depth+1)]));
  return value;
 }
 const trace={id:randomUUID(),startedAt:new Date(started).toISOString(),events,run:fn=>scope.run(trace,fn),
  add(type,label,data={}){
   if(events.length>=160){limited=true;return;}
   let payload=clean(data),serialized=JSON.stringify(payload)??'';let truncated=false;
   if(serialized.length>40000){payload={preview:serialized.slice(0,40000),note:'Payload truncated at 40,000 characters'};truncated=true;}
   if(size+serialized.length>600000){payload={note:'Payload omitted: request log size limit'};limited=true;truncated=true;}else size+=Math.min(serialized.length,40000);
   events.push({seq:events.length+1,at:new Date().toISOString(),elapsedMs:Date.now()-started,type,label:cleanText(label),data:payload,...(truncated?{truncated:true}:{})});
  },
  finish(status){return {id:trace.id,startedAt:trace.startedAt,durationMs:Date.now()-started,status,limited,events};}
 };
 return trace;
}
export function debugEvent(type,label,data){scope.getStore()?.add(type,label,data);}
export async function debugStep(kind,label,input,fn){
 const trace=scope.getStore();if(!trace)return fn();
 const spanId=randomUUID(),started=Date.now();debugEvent(kind+'.start',label,{spanId,input});
 try{const result=await fn();debugEvent(kind+'.result',label,{spanId,durationMs:Date.now()-started,result});return result;}
 catch(error){debugEvent(kind+'.error',label,{spanId,durationMs:Date.now()-started,error:error.message});throw error;}
}
