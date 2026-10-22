import {test} from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import vm from 'node:vm';import {analyze,rank,strategy,demo} from '../dist/engine.js';
const run=t=>analyze([{评论:t}], '评论','')[0];
test('empty, negation, mixed, unmatched',()=>{assert.equal(analyze([{评论:' '}],'评论','').length,0);assert.equal(run('不保湿，不推荐').sentiment,'负面');assert.equal(run('温和不刺激，保湿好用').sentiment,'正面');assert.deepEqual(run('温和不刺激').tags.痛点,[]);assert.equal(run('保湿但太贵').sentiment,'混合');assert.equal(run('今天收到').sentiment,'未识别')});
test('ranks match evidence and templates handle empty sets',()=>{const d=analyze(demo,'评论','产品');for(const g of ['需求','痛点','场景','障碍'])for(const r of rank(d,g))assert.equal(r.count,d.filter(x=>x.tags[g].includes(r.name)).length);assert.equal(strategy([]).length,7);assert.ok(!JSON.stringify(strategy([])).includes('undefined'))});
test('real CSV and Excel round trips via bundled parser',()=>{const ctx={console};vm.createContext(ctx);vm.runInContext(fs.readFileSync('dist/vendor/xlsx.full.min.js','utf8'),ctx);const X=ctx.XLSX;const csv='产品,评论\r\n精华,"保湿好用，含逗号,也可解析"\r\n面霜,"太贵\n不推荐"';const w=X.read(csv,{type:'string',raw:true});assert.equal(X.utils.sheet_to_json(w.Sheets[w.SheetNames[0]]).length,2);const book=X.utils.book_new();X.utils.book_append_sheet(book,X.utils.json_to_sheet(demo),'评论');for(const bookType of ['xlsx','xls']){const binary=X.write(book,{type:'base64',bookType});const read=X.read(binary,{type:'base64'});assert.equal(X.utils.sheet_to_json(read.Sheets['评论']).length,24)}});

import {keywordStats,reviewKeywords} from '../dist/engine.js';
test('word cloud counts unique reviews and preserves negative phrases',()=>{
 const d=analyze([{评论:'保湿保湿，好用好用'},{评论:'不保湿，不推荐'},{评论:'保湿好用'}],'评论','');
 const terms=keywordStats(d);assert.equal(terms.find(t=>t.name==='保湿').count,2);assert.equal(terms.find(t=>t.name==='不保湿').count,1);assert.deepEqual(terms.find(t=>t.name==='不保湿').ids,[2]);
 assert.deepEqual(reviewKeywords('温和不刺激'),['温和','不刺激']);assert.ok(!reviewKeywords('不推荐').includes('推荐'));assert.deepEqual(keywordStats([]),[]);assert.deepEqual(reviewKeywords('abcdef'),[]);
});
test('word cloud evidence stays within filtered product and sentiment',()=>{
 const d=analyze(demo,'评论','产品').filter(r=>r.product==='水润精华'&&r.sentiment==='负面');
 for(const t of keywordStats(d)){assert.equal(t.count,t.ids.length);assert.ok(t.ids.every(id=>d.some(r=>r.id===id&&reviewKeywords(r.text).includes(t.name))))}
});
