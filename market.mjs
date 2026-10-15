import {providerSignal} from './agent-budget.mjs';
import {debugStep} from './debug.mjs';

const cache=new Map();
export const clearMarketCache=()=>cache.clear();
const number=value=>value!=null&&Number.isFinite(Number(value))?Number(value):null;
const plain=text=>String(text||'').replace(/<[^>]*>/g,' ').replace(/\s+/g,' ').trim();
export async function publicData(url,fetcher=fetch,xml=false){
 const cached=cache.get(url);if(cached&&Date.now()-cached.at<300000)return cached.value;
 return debugStep('provider','Public market/news data',{url},async()=>{
  const r=await fetcher(url,{headers:{Accept:xml?'application/rss+xml,application/xml':'application/json'},signal:providerSignal(12000),redirect:'error'});
  if(!r.ok)throw new Error(`Public data HTTP ${r.status}; data unavailable, not zero. Try again later.`);
  const body=await r.text();if(body.length>2500000)throw new Error('Public feed exceeded size limit');
  const data=xml?body:JSON.parse(body),value={data,fetchedAt:new Date().toISOString()};
  if(cache.size>=40)cache.delete(cache.keys().next().value);cache.set(url,{at:Date.now(),value});return value;
 });
}
const cg=(path,fetcher)=>publicData('https://api.coingecko.com/api/v3'+path,fetcher);
const coinRow=x=>({id:x.id,name:plain(x.name).slice(0,120),symbol:String(x.symbol||'').toUpperCase(),priceUsd:number(x.current_price),change24hPercent:number(x.price_change_percentage_24h),change7dPercent:number(x.price_change_percentage_7d_in_currency),marketCapUsd:number(x.market_cap),volume24hUsd:number(x.total_volume),updatedAt:x.last_updated||null,sourceUrl:'https://www.coingecko.com/en/coins/'+encodeURIComponent(x.id)});
export async function marketOverview(fetcher=fetch){
 const rows=await Promise.allSettled([cg('/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=50&page=1&sparkline=false&price_change_percentage=24h,7d',fetcher),cg('/search/trending',fetcher)]);
 const markets=rows[0].status==='fulfilled'&&Array.isArray(rows[0].value.data)?rows[0].value.data.map(coinRow):[];
 const trend=rows[1].status==='fulfilled'&&Array.isArray(rows[1].value.data.coins)?rows[1].value.data.coins.slice(0,8).map(({item:x})=>({id:x.id,name:plain(x.name),symbol:x.symbol,searchRank:x.score+1,sourceUrl:'https://www.coingecko.com/en/coins/'+encodeURIComponent(x.id)})):[];
 if(!markets.length&&!trend.length)throw new Error('Market feeds unavailable. No ranking can be established.');
 return {source:'CoinGecko public API',fetchedAt:new Date().toISOString(),sample:'Top 50 by market cap, not all coins',searchTrending:trend,gainers24h:markets.filter(x=>x.change24hPercent>0).sort((a,b)=>b.change24hPercent-a.change24hPercent).slice(0,5),decliners24h:markets.filter(x=>x.change24hPercent<0).sort((a,b)=>a.change24hPercent-b.change24hPercent).slice(0,5),warnings:rows.filter(r=>r.status==='rejected').map(r=>r.reason.message),note:'Search popularity and price momentum are different measures. Neither is a buy recommendation, future return forecast, or proof a project is losing popularity. Quotes may be delayed; public endpoints may be rate limited.'};
}
export async function searchMarket(query,fetcher=fetch){
 let r=await cg('/search?query='+encodeURIComponent(query),fetcher);const searchedQueries=[query];
 if(!Array.isArray(r.data.coins))throw new Error('Unsupported market search response');
 // Name + ticker is natural input but the provider searches a literal string.
 if(!r.data.coins.length){for(const term of [...new Set(query.split(/[\s()]+/).filter(x=>/^[a-z0-9-]{2,60}$/i.test(x)))].slice(0,2)){if(term===query)continue;searchedQueries.push(term);r=await cg('/search?query='+encodeURIComponent(term),fetcher);if(!Array.isArray(r.data.coins))throw new Error('Unsupported market search response');if(r.data.coins.length)break;}}
 return {source:'CoinGecko',fetchedAt:r.fetchedAt,searchedQueries,tokens:r.data.coins.slice(0,8).map(x=>({id:x.id,name:plain(x.name),symbol:x.symbol,marketCapRank:x.market_cap_rank})),note:'Confirm the project identity. A symbol match is not a wallet contract match; CoinGecko IDs and Tokenomist IDs are separate.'};
}
export async function marketToken(id,fetcher=fetch){
 const r=await cg('/coins/'+encodeURIComponent(id)+'?localization=false&tickers=false&community_data=false&developer_data=false',fetcher),x=r.data;
 if(x.id!==id)throw new Error('Market token identity mismatch');
 const m=x.market_data||{};
 return {source:'CoinGecko',sourceUrl:'https://www.coingecko.com/en/coins/'+encodeURIComponent(id),fetchedAt:r.fetchedAt,id:x.id,name:plain(x.name),symbol:String(x.symbol).toUpperCase(),description:plain(x.description?.en).slice(0,4500),categories:x.categories||[],homepage:(x.links?.homepage||[]).filter(u=>/^https:\/\//.test(u)).slice(0,2),platforms:x.platforms||{},priceUsd:number(m.current_price?.usd),marketCapUsd:number(m.market_cap?.usd),volume24hUsd:number(m.total_volume?.usd),change24hPercent:number(m.price_change_percentage_24h),change7dPercent:number(m.price_change_percentage_7d),change30dPercent:number(m.price_change_percentage_30d),updatedAt:x.last_updated||null,note:'Project description is provider-supplied information, not an audit. Historical price change does not forecast returns. No guaranteed savings or trading signal.'};
}
const feeds=[['CoinDesk','https://www.coindesk.com/arc/outboundfeeds/rss'],['Cointelegraph','https://cointelegraph.com/rss']];
function decode(text){return plain(text.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g,'$1')).replace(/&amp;/g,'&').replace(/&quot;/g,'"').replace(/&apos;|&#39;/g,"'").replace(/&lt;/g,'<').replace(/&gt;/g,'>');}
export function parseNews(xml,source){
 // Bounded RSS extraction; no XML entity expansion, script or remote document evaluation.
 return [...xml.matchAll(/<item(?:\s[^>]*)?>([\s\S]*?)<\/item>/g)].slice(0,60).map(([,item])=>{
  const get=tag=>decode(item.match(new RegExp('<'+tag+'(?:\\s[^>]*)?>([\\s\\S]*?)<\\/'+tag+'>','i'))?.[1]||'');
  const title=get('title'),url=get('link'),publishedAt=get('pubDate');
  return {title:title.slice(0,350),url,source,publishedAt:Number.isFinite(Date.parse(publishedAt))?new Date(publishedAt).toISOString():null};
 }).filter(x=>x.title&&/^https:\/\//i.test(x.url));
}
export async function tokenNews(token,fetcher=fetch){
 const rows=await Promise.allSettled(feeds.map(async([source,url])=>{const r=await publicData(url,fetcher,true);return {...r,articles:parseNews(r.data,source)};}));
 const terms=[token.name,token.symbol].filter(x=>typeof x==='string'&&x.length>=3).map(x=>x.toLowerCase());
 const articles=rows.flatMap(r=>r.status==='fulfilled'?r.value.articles:[]).filter(x=>x.publishedAt&&Date.parse(x.publishedAt)<=Date.now()+60000&&Date.now()-Date.parse(x.publishedAt)<7*86400000&&terms.some(term=>new RegExp('(^|[^a-z0-9])'+term.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+'([^a-z0-9]|$)','i').test(x.title))).sort((a,b)=>Date.parse(b.publishedAt)-Date.parse(a.publishedAt)).filter((x,i,all)=>all.findIndex(y=>y.url===x.url)===i).slice(0,8);
 if(rows.every(r=>r.status==='rejected'))throw new Error('News feeds unavailable. This does not mean there is no news.');
 return {source:'Publisher RSS headlines',identity:{id:token.id,name:token.name,symbol:token.symbol},fetchedAt:new Date().toISOString(),articles,warnings:rows.filter(r=>r.status==='rejected').map(r=>r.reason.message),note:'Only recent feed headlines matching the project name/symbol, not an exhaustive news search. Headlines are unverified publisher claims, may be ambiguous, and must be attributed with source/date/link. No full article analysis or factual good/bad score; no match does not establish no news.'};
}
