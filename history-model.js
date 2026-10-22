import {analyze,rank} from './engine.js';
export const ENGINE_VERSION='1.3';
export function localDate(){return new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Shanghai',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date())}
export function makeRecord({rows,textCol,productCol,source,brand,collectedAt},id,now=new Date().toISOString()){
 const comments=rows.flatMap(r=>{const text=String(r[textCol]??'').trim();return text?[{text,product:productCol?String(r[productCol]||'未标注产品'):'未标注产品',platform:String(r.来源||'未标注')}]:[]});
 if(!comments.length)throw Error('没有有效评论可保存。');
 return {id,savedAt:now,collectedAt:collectedAt||localDate(),brand:String(brand||'未标注品牌').trim()||'未标注品牌',source:String(source),engineVersion:ENGINE_VERSION,comments};
}
export function analyzeRecord(record,filters={}){return analyze(record.comments.filter(c=>(!filters.product||filters.product==='全部'||c.product===filters.product)&&(!filters.platform||filters.platform==='全部'||c.platform===filters.platform)).map(c=>({产品:c.product,评论:c.text})),'评论','产品')}
export function compareRecords(before,after,filters={}){
 const a=analyzeRecord(before,filters),b=analyzeRecord(after,filters);const pct=(n,total)=>total?n/total*100:null;
 const metrics=[...['正面','负面','混合','未识别'].map(name=>({name,group:'情绪',a:a.filter(r=>r.sentiment===name).length,b:b.filter(r=>r.sentiment===name).length})),...['痛点','需求'].flatMap(group=>{const ar=rank(a,group),br=rank(b,group);return ar.map(x=>({name:x.name,group,a:x.count,b:br.find(y=>y.name===x.name)?.count||0})).filter(x=>x.a||x.b)})].map(m=>({...m,aRate:pct(m.a,a.length),bRate:pct(m.b,b.length),delta:a.length&&b.length?pct(m.b,b.length)-pct(m.a,a.length):null}));
 const scoped=r=>r.comments.filter(c=>(!filters.product||filters.product==='全部'||c.product===filters.product)&&(!filters.platform||filters.platform==='全部'||c.platform===filters.platform));
 const key=c=>JSON.stringify([c.product,c.platform,c.text.replace(/\s+/g,'')]);const keys=new Set(scoped(before).map(key));const overlap=new Set(scoped(after).map(key).filter(k=>keys.has(k))).size;
 return {a,b,metrics,overlap};
}
export function validateBackup(value){
 if(value?.format!=='dongjian-history'||value.schema!==1||!Array.isArray(value.records)||value.records.length>200)throw Error('备份格式不正确，或超过 200 条分析记录。');
 return value.records.map(r=>{if(!r||typeof r.id!=='string'||r.id.length>100||typeof r.savedAt!=='string'||!Number.isFinite(Date.parse(r.savedAt))||typeof r.collectedAt!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(r.collectedAt)||typeof r.brand!=='string'||r.brand.length>100||!Array.isArray(r.comments)||r.comments.length>20000)throw Error('备份包含无效的记录信息。');
 const comments=r.comments.map(c=>{if(!c||typeof c.text!=='string'||c.text.length>200000||typeof c.product!=='string'||c.product.length>1000||typeof c.platform!=='string'||c.platform.length>100)throw Error('备份评论格式不正确。');return {text:c.text,product:c.product,platform:c.platform}});
 return {id:r.id,savedAt:r.savedAt,collectedAt:r.collectedAt,brand:r.brand,source:String(r.source||'导入备份').slice(0,500),engineVersion:String(r.engineVersion||'未知').slice(0,20),comments};});
}
