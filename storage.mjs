import {readFile,mkdir,writeFile,rename} from 'node:fs/promises';
import {randomBytes} from 'node:crypto';
import {join} from 'node:path';
import {parseEnv} from 'node:util';
export const envFields={ubotToken:'UBOT_TOKEN',elevenKey:'ELEVENLABS_API_KEY',avalancheKey:'AVALANCHE_DATA_API_KEY',tokenomistKey:'TOKENOMIST_API_KEY',voiceId:'ELEVENLABS_VOICE_ID',ttsModel:'ELEVENLABS_TTS_MODEL',sttModel:'ELEVENLABS_STT_MODEL',mode:'GUARDIAN_AGENT_MODE'};
export async function loadEnv(path){try{return parseEnv(await readFile(path,'utf8'));}catch(e){if(e.code==='ENOENT')return {};throw e;}}
export async function saveProviderEnv(path,config){
 const existing=await loadEnv(path);for(const [field,key] of Object.entries(envFields))existing[key]=config[field]||'';
 existing.UBOT_TEMPLATE_BASE64=Buffer.from(config.ubotTemplate||'','utf8').toString('base64');delete existing.UBOT_TEMPLATE;
 const lines=['# U-Guardian local credentials. Never commit or share this file.'];
 for(const [key,value] of Object.entries(existing)){if(!/^[A-Z_][A-Z0-9_]*$/.test(key))continue;if(/[\r\n']/.test(value))throw new Error(`ค่า ${key} มีอักขระที่ไม่รองรับใน .env`);lines.push(`${key}='${value}'`);}
 const contents=lines.join('\n')+'\n',roundtrip=parseEnv(contents);
 for(const [field,key] of Object.entries(envFields))if(roundtrip[key]!==String(config[field]||''))throw new Error('ตรวจ .env roundtrip ไม่ผ่าน');
 const temp=String(path)+'.tmp';await writeFile(temp,contents,{mode:0o600});await rename(temp,path);
}
export async function suppliedCredentials(path=new URL('../env.txt',import.meta.url)){
  if(process.env.GUARDIAN_IGNORE_SUPPLIED_KEYS==='1')return {};
  let text;try{text=await readFile(path,'utf8');}catch(e){if(e.code==='ENOENT')return {};throw e;}
  const mapping={'elevenlabs':'elevenKey','avalanche - data':'avalancheKey','u-bot':'ubotToken','tokenomics':'tokenomistKey','tokenomist':'tokenomistKey'};
  const out={};for(const line of text.split(/\r?\n/)){const m=line.match(/^\s*([^:=]+)\s*[:=]\s*(.+)$/);if(m&&mapping[m[1].trim().toLowerCase()])out[mapping[m[1].trim().toLowerCase()]]=m[2].trim().replace(/^Bearer\s+/i,'');}return out;
}
export function localStore(directory){
 let queue=Promise.resolve();
 return {
  async load(){try{return JSON.parse(await readFile(join(directory,'state.json'),'utf8'));}catch(e){if(e.code==='ENOENT')return null;throw new Error('อ่าน local state ไม่สำเร็จ ตรวจ .local/state.json ก่อนเริ่ม server');}},
  save(value){const data=JSON.stringify(value);const work=queue.then(async()=>{await mkdir(directory,{recursive:true});await writeFile(join(directory,'state.tmp'),data,{mode:0o600});await rename(join(directory,'state.tmp'),join(directory,'state.json'));});queue=work.catch(()=>{});return work;},
  async secret(){await mkdir(directory,{recursive:true});try{return await readFile(join(directory,'phone-secret'),'utf8');}catch(e){if(e.code!=='ENOENT')throw e;const value=randomBytes(32).toString('hex');await writeFile(join(directory,'phone-secret'),value,{mode:0o600,flag:'wx'});return value;}}
 };
}
