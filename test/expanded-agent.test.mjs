import test from 'node:test';
import assert from 'node:assert/strict';
import {createGuardian} from '../guardian-service.mjs';
import {createState} from '../domain.mjs';
import {createLiveState} from '../live-wallet.mjs';
import {withLanguage} from '../locale.mjs';
import {parseAgentStep,validateWatchIntent,unsupportedWatchReason,walletChanges,runAgent,createAgentState} from '../agent.mjs';
import {validateWatchWallet,extendedEvents,priceChanges,transferKey} from '../monitoring.mjs';
import {normalizeToken,indexedUnitPrice,normalizeTransfer} from '../avalanche.mjs';
import {marketOverview,searchMarket,marketToken,tokenNews,parseNews,clearMarketCache} from '../market.mjs';
import {clearTokenCache} from '../tokenomist.mjs';

const now=Date.now(),at=new Date(now).toISOString(),owner='0x'+'1'.repeat(40),contract='0x'+'2'.repeat(40);
const wallet=(price=10)=>({address:owner,chainId:'43114',fetchedAt:at,assets:[{address:contract,symbol:'TOK',units:'10',decimals:0,rawBalance:'10',priceUsd:price}],transfers:[]});
const priceArgs={kind:'price_change',label:'Price drop',assetId:contract,percent:10,direction:'down'};
const guardian=()=>{const demo=createState(),g=createGuardian({config:{mode:'demo'},live:createLiveState(),getDemo:()=>demo,getMode:()=> 'demo',refresh:async()=>{},persist:async()=>{},cloud:true});return {demo,g};};

test('numeric watch schema is strict and message numbers/directions cannot be silently changed',()=>{
 for(const args of [{...priceArgs,percent:0},{...priceArgs,usd:100},{...priceArgs,percent:101},{kind:'transfer_value',label:'transfer',usd:0,direction:'any'}])assert.throws(()=>parseAgentStep(JSON.stringify({type:'tool',tool:'propose_watch',args})));
 assert.doesNotThrow(()=>validateWatchIntent(priceArgs,'Alert me if TOK price drops 10% from activation.'));
 assert.throws(()=>validateWatchIntent({...priceArgs,percent:20},'Alert me if TOK price drops 10%.'));
 assert.throws(()=>validateWatchIntent({...priceArgs,direction:'up'},'Alert me if TOK price drops 10%.'));
 assert.throws(()=>validateWatchIntent(priceArgs,'Alert me if TOK price drops 10% in 24h.'));
 assert.throws(()=>validateWatchIntent({kind:'wallet_change',label:'Wallet'},'Alert me if TOK price drops 10%.'));
 assert.doesNotThrow(()=>validateWatchIntent({kind:'transfer_value',label:'Transfers',usd:100,direction:'outgoing'},'Notify me about outgoing transfers over $100.'));
 assert.throws(()=>validateWatchIntent({kind:'transfer_value',label:'Transfers',usd:100,direction:'incoming'},'Notify me about outgoing transfers over $100.'));
 assert.ok(unsupportedWatchReason('Send a fake phone call when AVAX price drops 10% while the app is closed.'));
 assert.equal(unsupportedWatchReason('Show a fake phone call when AVAX price drops 10%.'),null);
 for(const text of ['Notify me of transfers below $100.','Notify me of only TOK transfers over $100.'])assert.throws(()=>validateWatchIntent({kind:'transfer_value',label:'Transfers',usd:100,direction:'any'},text));
});
test('price watches bind exact asset, require usable quotes and reject Fuji',()=>{
 assert.throws(()=>validateWatchWallet(priceArgs,{...wallet(),chainId:'43113'}));
 assert.throws(()=>validateWatchWallet(priceArgs,wallet(null)));
 assert.throws(()=>validateWatchWallet({...priceArgs,assetId:'native'},wallet()));
 assert.throws(()=>validateWatchWallet(priceArgs,wallet(),'Watch AVAX price down 10%'));
 assert.equal(validateWatchWallet(priceArgs,wallet(),'Watch TOK price down 10%').quote,10);
});
test('price thresholds use activation quote, suppress repeats, rearm and ignore stale/missing quotes',()=>{
 const rule={...priceArgs,referencePrice:10,symbol:'TOK',breached:false};
 assert.equal(extendedEvents(rule,wallet(9.5),now).length,0);
 assert.equal(extendedEvents(rule,wallet(8.9),now).length,1);
 assert.equal(extendedEvents(rule,wallet(8),now).length,0);
 extendedEvents(rule,wallet(9.5),now);assert.equal(extendedEvents(rule,wallet(8.9),now).length,1);
 rule.breached=false;assert.equal(extendedEvents(rule,{...wallet(8),fetchedAt:new Date(now-130000).toISOString()},now).length,0);
 assert.equal(extendedEvents(rule,wallet(null),now).length,0);
 assert.equal(extendedEvents(rule,{...wallet(8),fetchedAt:'bad'},now).length,0);
 assert.equal(extendedEvents(rule,wallet(9),now).length,1);
});
test('quantity changes cannot masquerade as price changes; exact chain and asset identity are required',()=>{
 const a=wallet(),b=wallet();b.assets[0].units='5';b.assets[0].rawBalance='5';assert.equal(priceChanges(a,b).length,0);
 b.assets[0].priceUsd=8;assert.equal(walletChanges(a,b).priceChanges[0].percent,-19.999999999999996);
 assert.equal(priceChanges(a,{...b,chainId:'43113'}).length,0);
});
test('indexed unit price uses the same indexed balance rather than an unrelated RPC balance',()=>{
 const x={address:contract,decimals:6,balance:'2000000',balanceValue:{currencyCode:'usd',value:'10'}};
 assert.equal(normalizeToken(x).priceUsd,5);assert.equal(indexedUnitPrice({...x,balance:'0'}),null);
 assert.equal(indexedUnitPrice({price:{currencyCode:'usd',value:'Infinity'}}),null);
 const transfer=normalizeTransfer({txHash:'0x'+'a'.repeat(64),erc20Token:{address:contract,decimals:6,symbol:'TOK'},value:'2000000',txStatus:'1',logIndex:4},'erc20');assert.equal(transfer.assetId,contract);assert.equal(transfer.amount,'2');
});
test('transfer alerts only consider new successful post-activation transfers, exact asset identity and direction',()=>{
 const make=()=>({kind:'transfer_value',usd:20,direction:'outgoing',createdAt:new Date(now-1000).toISOString(),observedTransfers:[]});
 const tx={hash:'hash',assetId:contract,symbol:'TOK',amount:'3',from:owner,to:'other',timestamp:at,status:'success'};
 const w={...wallet(),transfers:[tx]},r=make();assert.equal(extendedEvents(r,w,now).length,1);assert.equal(extendedEvents(r,w,now).length,0);
 for(const change of [{status:'failed'},{timestamp:new Date(now-2000).toISOString()},{timestamp:null},{assetId:'fake'},{from:'other',to:owner},{amount:'0'}])assert.equal(extendedEvents(make(),{...w,transfers:[{...tx,...change}]},now).length,0);
 const existing=make();existing.observedTransfers=[transferKey(tx)];assert.equal(extendedEvents(existing,w,now).length,0);
 const pending=make();assert.equal(extendedEvents(pending,{...w,transfers:[{...tx,status:'pending'}]},now).length,0);assert.equal(extendedEvents(pending,w,now).length,1);
 const below=make();assert.equal(extendedEvents(below,{...w,assets:[{...w.assets[0],priceUsd:1}]},now).length,0);assert.equal(extendedEvents(below,w,now).length,0);
});
test('English and Thai demo create numeric drafts; confirmation takes the current quote and simulated events notify',async()=>{
 for(const lang of ['en','th'])await withLanguage(lang,async()=>{
  const {g,demo}=guardian();const r=await g.message(lang==='en'?'Alert me when AVAX price drops 10%.':'เตือนเมื่อราคา AVAX ลดลง 10%');assert.equal(r.proposals[0].kind,'price_change');assert.equal(g.agent.rules.length,0);
  demo.assets[0].price=20;await g.confirm(r.proposals[0].id);assert.equal(g.agent.rules[0].referencePrice,20);demo.assets[0].price=17.5;const check=await g.check();assert.equal(check.newNotifications.length,1);assert.equal((await g.check()).newNotifications.length,0);
  const tx=await g.message(lang==='en'?'Alert me about outgoing transfers over $20.':'เตือนเมื่อโอนออกเกิน 20 USD');await g.confirm(tx.proposals[0].id);
  demo.history.unshift({kind:'agent-demo',id:'transfer',at:new Date().toISOString()});assert.equal((await g.check()).newNotifications.length,1);
 });
});
test('market tools separate search interest, bounded market sample and partial failures',async()=>{
 clearMarketCache();const fetcher=async url=>url.includes('trending')?new Response('',{status:429}):Response.json([{id:'a',name:'A',symbol:'A',current_price:5,price_change_percentage_24h:10},{id:'b',name:'B',symbol:'B',current_price:2,price_change_percentage_24h:-5}]);
 const r=await marketOverview(fetcher);assert.equal(r.gainers24h[0].id,'a');assert.equal(r.decliners24h[0].id,'b');assert.equal(r.warnings.length,1);assert.match(r.sample,/50/);
 clearMarketCache();await assert.rejects(marketOverview(async()=>new Response('',{status:503})),/unavailable/);
});
test('project lookup and news have bounded source evidence, reject invalid IDs/links and disclose empty coverage',async()=>{
 clearMarketCache();const search=await searchMarket('AVAX',async()=>Response.json({coins:[{id:'avalanche-2',name:'Avalanche',symbol:'AVAX'}]}));assert.equal(search.tokens[0].id,'avalanche-2');
 clearMarketCache();await assert.rejects(marketToken('avalanche-2',async()=>Response.json({id:'wrong'})),/identity/);
 const xml=`<rss><channel><item><title><![CDATA[AVAX &amp; Avalanche update]]></title><link>https://example.com/news</link><pubDate>${new Date().toUTCString()}</pubDate></item><item><title>Bad</title><link>javascript:alert(1)</link></item></channel></rss>`;
 assert.equal(parseNews(xml,'Fixture').length,1);clearMarketCache();const news=await tokenNews({id:'avalanche-2',name:'Avalanche',symbol:'AVAX'},async()=>new Response(xml));assert.equal(news.articles.length,1);assert.match(news.note,/not an exhaustive/);assert.equal(news.articles[0].title,'AVAX & Avalanche update');
});

test('name plus ticker search retries literal provider search and search-only failure never requests an invented explanation',async()=>{
 clearMarketCache();const queries=[];const found=await searchMarket('Avalanche AVAX',async url=>{queries.push(url);return Response.json({coins:url.includes('%20')?[]:[{id:'avalanche-2',name:'Avalanche',symbol:'AVAX'}]});});assert.equal(found.tokens[0].id,'avalanche-2');assert.equal(queries.length,2);
 await withLanguage('en',async()=>{let calls=0;const r=await runAgent({message:'Explain AVAX',config:{},agent:createAgentState(),context:{dataMode:'demo'},tools:{search_market_tokens:()=>({tokens:[]})},call:async(_config,prompt)=>{assert.doesNotMatch(prompt,/EXPLAINER/);calls++;return '{"type":"tool","tool":"search_market_tokens","args":{"query":"AVAX"},"finishAfterTool":true}';}});assert.equal(calls,2);assert.match(r.text,/could not retrieve/);assert.equal(r.proposals.length,0);});
});

test('configured Tokenomist research is real provider data even with a Demo wallet',async t=>{
 clearTokenCache();const original=globalThis.fetch;t.after(()=>{globalThis.fetch=original;clearTokenCache();});const paths=[];
 globalThis.fetch=async url=>{paths.push(url);return Response.json({status:true,data:url.endsWith('/list')?[{id:'real-project',name:'Avalanche',symbol:'AVAX'}]:{fixture:'provider data'}});};
 let calls=0;const g=createGuardian({config:{mode:'ubot',tokenomistKey:'fixture-expanded'},live:createLiveState(),getMode:()=> 'demo',getDemo:()=>createState(),persist:async()=>{},refresh:async()=>{},cloud:true,call:async()=>{calls++;return calls===1?' could-not-parse ':calls===2?'{"type":"tool","tool":"search_tokens","args":{"query":"AVAX"}}':calls===3?'{"type":"tool","tool":"research_token","args":{"tokenId":"real-project"},"finishAfterTool":true}':'Provider evidence retrieved.';}});
 const r=await g.message('Research AVAX allocations.');assert.equal(r.evidence[1].result.source,'Tokenomist v5');assert.equal(r.evidence[1].result.datasets.length,4);assert.equal(paths.length,5);assert.ok(paths.every(p=>p.startsWith('https://api.tokenomist.ai/v5/')));
});
