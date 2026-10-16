// Resolve deployment credentials for each request. Shared keys never enter visitor records.
const fields={ELEVENLABS_API_KEY:'elevenKey',AVALANCHE_DATA_API_KEY:'avalancheKey',TOKENOMIST_API_KEY:'tokenomistKey',ELEVENLABS_VOICE_ID:'voiceId',ELEVENLABS_TTS_MODEL:'ttsModel',ELEVENLABS_STT_MODEL:'sttModel'};
export function cloudConfig(env,stored={}){
 const managed=env.GUARDIAN_USE_SERVER_KEYS==='1';
 const config={...stored};
 for(const [name,key]of Object.entries(fields))config[key]=managed?(env[name]||''):(config[key]||env[name]||'');
 config.ttsModel ||= 'eleven_v3';config.sttModel ||= 'scribe_v2';
 delete config.ubotToken;delete config.ubotTemplate;
 if(managed){
  for(const key of ['elevenStatus','avalancheStatus','tokenomistStatus'])config[key]='untested';
  return {managed,config,persist:next=>({mode:next.mode,ubotStatus:next.ubotStatus})};
 }
 return {managed,config,persist:next=>({...next})};
}
