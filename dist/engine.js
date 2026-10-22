import {matchPhrases,phraseRules,normalizeText} from './phrases.js';
export const categories={需求:{保湿:['保湿','补水','干燥'],温和:['温和','敏感','刺激','泛红'],肤感:['清爽','油腻','黏','吸收','搓泥'],功效:['提亮','暗沉','美白','抗老','细纹'],性价比:['价格','贵','性价比','优惠'],包装:['包装','泵头','漏液']},痛点:{刺激不适:['刺痛','过敏','泛红','刺激'],肤感不佳:['油腻','黏腻','搓泥','难吸收'],价格偏高:['太贵','价格高','不划算'],包装问题:['漏液','泵头坏','包装破损'],效果不佳:['没效果','无效','不保湿','不补水']},场景:{日常护理:['早上','晚上','日常','睡前'],妆前护理:['妆前','上妆','化妆'],换季护理:['换季','秋冬','冬天'],出行携带:['旅行','出差','携带']},障碍:{预算顾虑:['太贵','价格高','不划算'],安全顾虑:['担心','过敏','刺痛'],效果顾虑:['没效果','无效','观望'],体验顾虑:['油腻','搓泥','漏液']}};
const positive=['好用','喜欢','满意','推荐','舒服','清爽','温和','保湿','补水','提亮','划算','吸收快'];const negative=['不好用','不喜欢','不满意','不推荐','不舒服','不清爽','不温和','不保湿','不补水','不提亮','不划算','不吸收','油腻','黏腻','搓泥','刺痛','过敏','泛红','太贵','价格高','漏液','没效果','无效','包装破损','泵头坏','难吸收'];
// Add phrase-backed categories to the same ranking/filter interface.
for(const rule of phraseRules)for(const [group,names] of Object.entries(rule.tags))for(const name of names)if(!categories[group][name])categories[group][name]=[];
export function analyze(rows,textCol,productCol){return rows.flatMap((row,i)=>{
 const text=String(row[textCol]??'').trim();if(!text)return[];
 const phrases=matchPhrases(text);let rest=text.replace(/不刺激|无刺激|不过敏|不油腻|不搓泥|不泛红/g,' ');
 let neg=phrases.filter(p=>p.sentiment==='负面').length;
 for(const w of negative)if(rest.includes(w)){neg++;rest=rest.split(w).join(' ')}
 const pos=positive.filter(w=>rest.includes(w)).length+phrases.filter(p=>p.sentiment==='正面').length;
 const tags={};for(const [group,rules] of Object.entries(categories))tags[group]=Object.entries(rules).filter(([,words])=>words.some(w=>(group==='痛点'||group==='障碍'?text.replace(/不刺激|无刺激|不过敏|不油腻|不搓泥|不泛红/g,' '):text).includes(w))).map(([name])=>name);
 for(const p of phrases)for(const [group,names] of Object.entries(p.tags))for(const name of names)if(!tags[group].includes(name))tags[group].push(name);
 return[{id:i+1,text,product:productCol?String(row[productCol]||'未标注产品'):'未标注产品',sentiment:pos&&neg?'混合':neg?'负面':pos?'正面':'未识别',tags,phrases}]
})}
export function rank(data,group){return Object.keys(categories[group]).map(name=>({name,count:data.filter(r=>r.tags[group].includes(name)).length})).sort((a,b)=>b.count-a.count)}
export const demo=[['水润精华','补水保湿很好用，吸收快，日常早上用很舒服。'],['修护面霜','换季皮肤敏感，用完有点刺痛和泛红，担心过敏。'],['轻透防晒','妆前用很清爽，上妆也不卡粉，喜欢。'],['水润精华','价格高，虽然保湿但有些黏腻，晚上用。'],['修护面霜','秋冬用很保湿，温和不刺激，敏感肌也舒服。'],['轻透防晒','化妆前使用搓泥，不推荐。'],['水润精华','用了一周没效果，提亮暂时还在观望。'],['修护面霜','包装破损还有漏液，出差携带不方便。'],['轻透防晒','旅行携带方便，清爽好用，性价比不错。'],['水润精华','吸收快，补水满意，会推荐给朋友。'],['修护面霜','冬天睡前用舒服，干燥有改善，喜欢。'],['轻透防晒','太贵了，等优惠再买。'],['水润精华','不保湿，也不推荐，感觉油腻。'],['修护面霜','泵头坏了，但面霜保湿效果满意。'],['轻透防晒','今天刚收到，还没使用。'],['水润精华','日常护肤很温和，保湿好用。'],['修护面霜','质地油腻又难吸收，不喜欢。'],['轻透防晒','清爽，妆前使用喜欢。'],['水润精华','想改善暗沉和细纹，暂时没效果。'],['修护面霜','敏感时期用着舒服，补水满意。'],['轻透防晒','不清爽，容易搓泥。'],['水润精华','包装精致，出差携带方便。'],['修护面霜','价格高，不划算，等促销。'],['轻透防晒','温和好用，早上出门很方便。']].map(([产品,评论])=>({产品,评论}));
export const strategy=(data)=>{const demand=rank(data,'需求').find(x=>x.count),pain=rank(data,'痛点').find(x=>x.count),scene=rank(data,'场景').find(x=>x.count);return [{title:'核心消费者洞察',text:demand?`当前 ${data.length} 条有效评论中，${demand.count} 条提及「${demand.name}」；${pain?`${pain.count} 条命中「${pain.name}」痛点。`:'暂未命中既定痛点。'}提及频次代表样本关注度，不代表市场需求规模。`:"未识别到预设需求，请补充评论或调整词表。",group:'需求',tag:demand?.name},{title:'目标人群建议',text:demand?`优先访谈关注「${demand.name}」的潜在使用者，确认其购买动机。当前评论不足以推断年龄、性别或人群规模。`:'信息不足，请补充评论后再制定人群假设。',group:'需求',tag:demand?.name},{title:'产品价值主张',text:demand?`围绕「${demand.name}」组织可验证的产品利益点；结合使用测试和合规证据确认后，再写入传播文案。`:'暂无法识别价值主张。',group:'需求',tag:demand?.name},{title:'营销传播方向',text:scene?`可测试「${scene.name}」情境内容，说明使用步骤与适用条件；${pain?`针对「${pain.name}」提供真实答疑，避免无依据承诺。`:'持续收集使用反馈。'}`:'场景信息不足，先补充使用情境调研。',group:'场景',tag:scene?.name},{title:'小红书内容创意',text:demand?`选题假设：《挑选${demand.name}产品前，我会看这三个细节》。用真实体验、质地展示和适用条件构成内容，先小样测试再扩大投入。`:'请先增加消费者需求相关评论。',group:'需求',tag:demand?.name},{title:'KOL 合作建议',text:demand?`筛选持续产出「${demand.name}」相关内容的护肤创作者，核验受众与互动质量。小规模试投，要求披露商业合作，并保留不适用情形。`:'需求信息不足，暂不推荐具体达人方向。',group:'需求',tag:demand?.name},{title:'营销 KPI 建议',text:'建议跟踪收藏率、有效咨询率、点击转化率与负面反馈率；先建立基线，再用对照测试设定目标。当前数据不支持预测销量或承诺增长。'}]};

// Transparent dictionary extraction. Longest phrases take precedence at each
// position, and a term counts at most once per review. No inferred sentiment.
export const keywordDictionary = [...new Set([
  ...Object.values(categories).flatMap(group => Object.values(group).flat()),
  ...positive, ...negative,
  '不刺激','无刺激','不过敏','不油腻','不搓泥','不泛红','不黏腻',
  '不清爽','不保湿','不补水','不提亮','不推荐','不喜欢',
  '敏感肌','不卡粉','卡粉','质地','护肤','促销','回购','香味','防晒',
  '控油','痘痘','闭口','成分','酒精','香精','美妆','面霜','精华','精华水','面膜','睡眠面膜','超级面膜','滋养面膜','即时变白','角质','每星期','每天用','收购','营销'
])].sort((a,b)=>b.length-a.length || a.localeCompare(b,'zh-CN'));
export function reviewKeywords(text) {
  const matched=matchPhrases(text);
  const found = new Set(matched.map(p=>p.cloud));
  text=normalizeText(text);
  // Reserve phrase spans so a negative phrase cannot also yield its positive substring.
  for(const p of matched)for(const m of p.matches)text=text.split(m.text).join(' '.repeat(m.text.length));
  for (let i=0;i<text.length;) {
    const word = keywordDictionary.find(w=>text.startsWith(w,i));
    if (word) { found.add(word); i+=word.length; } else i++;
  }
  return [...found];
}
export function keywordStats(reviews) {
  const terms = new Map();
  for (const review of reviews) for (const name of reviewKeywords(review.text)) {
    if (!terms.has(name)) terms.set(name,{name,count:0,ids:[]});
    const term=terms.get(name); term.count++;term.ids.push(review.id);
  }
  return [...terms.values()].sort((a,b)=>b.count-a.count || a.name.localeCompare(b.name,'zh-CN'));
}
