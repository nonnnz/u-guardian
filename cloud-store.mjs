import {createHash,randomBytes,createCipheriv,createDecipheriv} from 'node:crypto';

export const sessionPath=id=>'sessions/'+createHash('sha256').update(id).digest('hex')+'.json';
export const callPath=id=>'calls/'+createHash('sha256').update(id).digest('hex')+'.json';
export function codec(secret){
 const key=createHash('sha256').update('guardian-cloud-v1:'+secret).digest();
 return {
  seal(value){const iv=randomBytes(12),cipher=createCipheriv('aes-256-gcm',key,iv);const data=Buffer.concat([cipher.update(JSON.stringify(value),'utf8'),cipher.final()]);return Buffer.concat([iv,cipher.getAuthTag(),data]).toString('base64');},
  open(text){const b=Buffer.from(text,'base64');const decipher=createDecipheriv('aes-256-gcm',key,b.subarray(0,12));decipher.setAuthTag(b.subarray(12,28));return JSON.parse(Buffer.concat([decipher.update(b.subarray(28)),decipher.final()]).toString());}
 };
}
export class SessionBusy extends Error {}
export function privateSessions(blob,token){
 const crypt=codec(token);
 async function read(path){const result=await blob.get(path,{access:'private',useCache:false,token});if(!result)return null;return {value:crypt.open(await new Response(result.stream).text()),etag:result.blob.etag};}
 async function write(path,value,etag){return blob.put(path,crypt.seal(value),{access:'private',token,addRandomSuffix:false,contentType:'text/plain',cacheControlMaxAge:60,...(etag?{ifMatch:etag}:{allowOverwrite:false})});}
 return {
  read,
  async workspace(path,mutating){
   let loaded=await read(path),record=loaded?.value||{version:1,state:null,config:{},secret:randomBytes(32).toString('hex')},etag=loaded?.etag;
   if(mutating){
    if(record.leaseUntil>Date.now())throw new SessionBusy('ระบบกำลังทำงาน กรุณาลองอีกครั้ง');
    record.leaseUntil=Date.now()+360000;
    try{etag=(await write(path,record,etag)).etag;}catch(e){if(/already exists|precondition|etag/i.test(e.message))throw new SessionBusy('คำขอซ้อนกัน กรุณาลองอีกครั้ง');throw e;}
   }
   async function flush(){if(!mutating)return;etag=(await write(path,record,etag)).etag;}
   return {
    record,
    store:{load:async()=>record.state,secret:async()=>record.secret,save:async state=>{
     record.state=state;await flush();
     for(const [session,context] of Object.entries(state.phone?.sessions||{})){
      if(context.expiresAt<Date.now())continue;
      const index=callPath(session);const old=await read(index);
      if(!old)await write(index,{path,expiresAt:context.expiresAt});
     }
    }},
    saveConfig:async config=>{record.config={...config};await flush();},
    async release(){record.leaseUntil=0;await flush();}
   };
  }
 };
}
