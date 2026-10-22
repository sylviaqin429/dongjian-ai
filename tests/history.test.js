import test from 'node:test';
import assert from 'node:assert/strict';
import {makeRecord,compareRecords,validateBackup} from '../dist/history-model.js';
const record=(id,texts)=>makeRecord({rows:texts.map(t=>({评论:t,产品:'超级面膜',来源:'小红书'})),textCol:'评论',productCol:'产品',source:'测试',brand:'伊菲丹',collectedAt:'2026-10-20'},id,'2026-10-20T00:00:00Z');
test('snapshot preserves brand, products, platform and original comments',()=>{const a=record('a',['没 get 到','大肆营销']);assert.equal(a.brand,'伊菲丹');assert.equal(a.comments[0].text,'没 get 到');assert.equal(a.comments[0].platform,'小红书');assert.deepEqual(validateBackup({format:'dongjian-history',schema:1,records:[a]}),[a]);});
test('comparison uses sample denominators, percentage points and duplicate warning',()=>{const a=record('a',['好用','大肆营销']),b=record('b',['好用','爱死了','超级好用','太不经用了']);const c=compareRecords(a,b);const m=c.metrics.find(x=>x.group==='情绪'&&x.name==='正面');assert.equal(m.a,1);assert.equal(m.b,3);assert.equal(m.delta,25);assert.equal(c.overlap,1);assert.equal(c.metrics.find(x=>x.name==='消耗快').b,1);const z=compareRecords(a,b,{platform:'京东'});assert.equal(z.a.length,0);assert.ok(z.metrics.every(m=>m.delta===null));});
test('invalid backups rejected',()=>assert.throws(()=>validateBackup({format:'dongjian-history',schema:1,records:[{id:'bad'}]})));
