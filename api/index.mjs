import {translate} from '../public/messages.js';
import * as blob from '@vercel/blob';
import {randomBytes} from 'node:crypto';
import {Readable} from 'node:stream';
import {createApplication} from '../application.mjs';
import {privateSessions,sessionPath,callPath,SessionBusy} from '../cloud-store.mjs';

export const config={api:{bodyParser:false}};
function error(res,status,message,language='en'){res.setHeader('Cache-Control','private, no-store');res.writeHead(status,{'Content-Type':'application/json'});res.end(JSON.stringify({error:translate(message,language)}));}
export default async function handler(req,res){
 const token=process.env.BLOB_READ_WRITE_TOKEN;
 if(!token)return error(res,503,'Cloud storage ยังไม่พร้อม กรุณาติดต่อผู้ดูแล',req.headers['x-guardian-language']);
 const host=req.headers.host,pathname=new URL(req.url,'https://'+host).pathname;
 const callback=pathname==='/phone/tool';
 if(!callback&&req.headers.origin&&req.headers.origin!=='https://'+host)return error(res,403,'Cross-origin request rejected');
 if(req.method!=='GET'&&req.method!=='POST')return error(res,405,'Method not allowed');
 if(!callback&&req.method==='POST'&&req.headers['x-guardian-client']!=='local-poc')return error(res,403,'Missing client header');
 if(req.method==='GET'&&pathname!=='/api/state')return error(res,404,'Not found');
 const sessions=privateSessions(blob,token);let workspace;
 const cancellation=new AbortController();res.on('close',()=>cancellation.abort());req.guardianSignal=cancellation.signal;
 try{
  let path;
  if(callback){
   const session=req.headers['x-guardian-session'];
   if(req.method!=='POST'||! /^[a-f0-9]{64}$/.test(session||''))return error(res,403,'Unauthorized call');
   const index=await sessions.read(callPath(session));
   if(!index||index.value.expiresAt<Date.now())return error(res,403,'Expired call');
   path=index.value.path;
  }else{
   let id=req.headers.cookie?.split(';').map(s=>s.trim()).find(s=>s.startsWith('guardian_session='))?.slice(17);
   if(!/^[a-f0-9]{64}$/.test(id||'')){id=randomBytes(32).toString('hex');res.setHeader('Set-Cookie',`guardian_session=${id}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=2592000`);}
   path=sessionPath(id);
  }
  workspace=await sessions.workspace(path,req.method==='POST');
  const app=await createApplication({cloud:true,host,env:{},store:workspace.store,config:{...workspace.record.config,
   avalancheKey:workspace.record.config.avalancheKey||process.env.AVALANCHE_DATA_API_KEY||'',
   elevenKey:workspace.record.config.elevenKey||process.env.ELEVENLABS_API_KEY||'',
   tokenomistKey:workspace.record.config.tokenomistKey||process.env.TOKENOMIST_API_KEY||''},saveConfig:workspace.saveConfig});
  // Keep the application's raw-body contract if the platform parsed a JSON body.
  if(req.body!==undefined){const stream=Readable.from([Buffer.isBuffer(req.body)?req.body:Buffer.from(typeof req.body==='string'?req.body:JSON.stringify(req.body))]);stream.headers=req.headers;stream.url=req.url;stream.method=req.method;stream.guardianSignal=req.guardianSignal;req=stream;}
  const result={status:200,headers:{},body:null};
  const buffer={setHeader:(k,v)=>{result.headers[k]=v;},writeHead:(code,headers)=>{result.status=code;Object.assign(result.headers,headers);},end:body=>{result.body=body;}};
  await (callback?app.callback:app.handler)(req,buffer);
  if(req.method==='POST'){await app.persist();await workspace.saveConfig(app.config);await workspace.release();workspace=null;}
  for(const [key,value] of Object.entries(result.headers))res.setHeader(key,value);
  res.setHeader('Cache-Control','private, no-store');res.writeHead(result.status);res.end(result.body);
 }catch(e){
  if(workspace)await workspace.release().catch(()=>{});
  error(res,e instanceof SessionBusy?409:503,e instanceof SessionBusy?e.message:'บันทึกหรืออ่าน session ไม่สำเร็จ กรุณาลองใหม่ หากเพิ่งส่งคำขอโทรให้ตรวจประวัติสายก่อนส่งซ้ำ',req.headers['x-guardian-language']);
 }
}
