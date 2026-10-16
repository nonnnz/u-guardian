import test from 'node:test';
import assert from 'node:assert/strict';
import {Readable} from 'node:stream';
import {codec,privateSessions,sessionPath,SessionBusy} from '../cloud-store.mjs';
import {createApplication} from '../application.mjs';

function fakeBlob(){
 const files=new Map();let counter=0;
 return {files,async get(path){const f=files.get(path);return f?{stream:new Blob([f.text]).stream(),blob:{etag:f.etag}}:null;},async put(path,text,options){const prior=files.get(path);if((options.ifMatch&&prior?.etag!==options.ifMatch)||(!options.ifMatch&&prior))throw new Error('Precondition failed');const etag=String(++counter);files.set(path,{text,etag});return {etag};}};
}
async function request(app,path,body){const req=Readable.from(body===undefined?[]:[Buffer.from(JSON.stringify(body))]);req.method=body===undefined?'GET':'POST';req.url=path;req.headers={host:'guardian.vercel.app',origin:'https://guardian.vercel.app','content-type':'application/json','x-guardian-client':'local-poc'};let code,data;await app.handler(req,{setHeader(){},writeHead(n){code=n;},end(value){data=JSON.parse(value);}});return {code,data};}
test('cloud encryption authenticates ciphertext and never stores plaintext keys',()=>{const c=codec('storage-secret'),sealed=c.seal({key:'fixture-private-key'});assert.ok(!sealed.includes('fixture-private-key'));assert.equal(c.open(sealed).key,'fixture-private-key');assert.throws(()=>codec('other').open(sealed));const b=Buffer.from(sealed,'base64');b[30]^=1;assert.throws(()=>c.open(b.toString('base64')));});
test('cloud storage isolates browsers and prevents concurrent mutation across instances',async()=>{
 const blob=fakeBlob(),sessions=privateSessions(blob,'secret');const a=await sessions.workspace(sessionPath('a'),true);
 await a.saveConfig({ubotToken:'only-a'});await assert.rejects(sessions.workspace(sessionPath('a'),true),SessionBusy);
 const b=await sessions.workspace(sessionPath('b'),false);assert.deepEqual(b.record.config,{});await a.release();
 const reloaded=await sessions.workspace(sessionPath('a'),true);assert.equal(reloaded.record.config.ubotToken,'only-a');await reloaded.release();
 assert.ok([...blob.files.values()].every(f=>!f.text.includes('only-a')));
});
test('two workers racing to create a session cannot both acquire the lease',async()=>{
 const sessions=privateSessions(fakeBlob(),'secret');const result=await Promise.allSettled([sessions.workspace('race',true),sessions.workspace('race',true)]);assert.equal(result.filter(r=>r.status==='fulfilled').length,1);assert.equal(result.filter(r=>r.status==='rejected').length,1);
});
test('compressed legacy Blob reads preserve conditional writes after weak ETag normalization',async()=>{
 const blob=fakeBlob(),originalGet=blob.get;blob.get=async path=>{const r=await originalGet(path);if(r)r.blob.etag='W/'+r.blob.etag;return r;};
 const sessions=privateSessions(blob,'secret');let w=await sessions.workspace('legacy',true);await w.saveConfig({key:'fixture'});await w.release();
 w=await sessions.workspace('legacy',true);await w.saveConfig({key:''});await w.release();assert.equal((await sessions.workspace('legacy',false)).record.config.key,'');
});
test('serverless app survives recreation, redacts credentials and rejects background auto calls',async()=>{
 const sessions=privateSessions(fakeBlob(),'secret'),path=sessionPath('browser');let w=await sessions.workspace(path,true);
 let app=await createApplication({cloud:true,host:'guardian.vercel.app',env:{},store:w.store,config:w.record.config,saveConfig:w.saveConfig});
 assert.equal((await request(app,'/api/integrations',{elevenKey:'private-fixture',mode:'demo'})).code,200);
 await request(app,'/api/profile',{goal:'ค่าเทอม',target:1500,due:'2026-12-01',callEnabled:false});await app.persist();await w.saveConfig(app.config);await w.release();
 w=await sessions.workspace(path,true);app=await createApplication({cloud:true,host:'guardian.vercel.app',env:{},store:w.store,config:w.record.config,saveConfig:w.saveConfig});
 const r=await request(app,'/api/state');assert.equal(r.data.profile.goal,'ค่าเทอม');assert.equal(r.data.integration.ubotConfigured,false);assert.equal(r.data.integration.elevenConfigured,true);assert.equal(r.data.integration.storage,'private-session');assert.ok(!JSON.stringify(r.data).includes('private-fixture'));
 assert.equal((await request(app,'/api/phone/settings',{enabled:true,consent:true})).code,400);
 await request(app,'/api/disconnect',{});await w.release();assert.equal((await sessions.workspace(path,false)).record.config.ubotToken,'');
});
