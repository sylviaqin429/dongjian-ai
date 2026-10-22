// Explicit phrase rules, not an LLM. Labels describe expressed feedback, not verified product facts.
export const phraseRules = [
 {id:'unfelt',label:'未感受到价值',cloud:'get不到',pattern:/(?:没(?:有)?get到|(?:完全|真的)?get不(?:太)?到|没感受到(?:效果|价值)|感受不到(?:效果|价值)|没觉得有什么(?:效果|用)|无功无过)/g,sentiment:'负面',tags:{需求:['体验价值'],痛点:['体验未达预期'],障碍:['效果顾虑']},examples:'get 不到、没 get 到、感受不到效果、无功无过',note:'表达未感受到效果或价值，不能据此断言产品无效。',action:'补充真实使用情境、适用人群与合理预期，用体验对照验证价值点。'},
 {id:'marketing',label:'营销感过强',cloud:'营销感过强',pattern:/(?:大肆营销|过度营销|营销(?:太|过于|过分)(?:大|多|猛|重)|营销(?:过头|太过|太夸张)|全靠营销|营销大于(?:产品|效果)|广告(?:太多|太夸张)|吹得(?:太过|太厉害)|吹过头)/g,sentiment:'负面',tags:{需求:['传播可信度'],痛点:['营销感过强'],障碍:['传播信任顾虑']},examples:'大肆营销、营销太大、营销过头、全靠营销、广告太多',note:'记录消费者对传播强度的感受，不核实收购、虚假宣传等事实。',action:'检查宣传承诺与体验是否一致；增加具体使用证据、适用边界，测试降低夸张表达。'},
 {id:'consumption',label:'消耗快 / 不经用',cloud:'不经用',pattern:/(?:不(?:太)?经用|用得(?:太)?快|用的(?:太)?快|消耗(?:太)?快|用量(?:太|很)大|没(?:用)?几次就(?:用完|没了))/g,sentiment:'负面',tags:{需求:['使用成本'],痛点:['消耗快'],障碍:['预算顾虑']},examples:'太不经用了、不太经用、用得快、用量太大',note:'表达使用成本或消耗速度的不满，不从少量评论推算统一使用周期。',action:'说明建议单次用量、容量与可比的单次使用成本，验证是否需要规格调整。'},
 {id:'ingredient_question',label:'成分与即时效果疑问',cloud:'成分疑问',pattern:/(?:是不是|是否|会不会|有没有|有那种)[^。！？!?\n]{0,35}(?:成分|即时变白|即刻变白|假白)|(?:成分|即时变白|即刻变白|假白)[^。！？!?\n]{0,18}(?:吗|么|\?|？)/g,sentiment:null,tags:{需求:['成分透明'],障碍:['成分信息顾虑']},examples:'是不是有即时变白的成分？、成分安全吗？',note:'仅标为咨询或疑问，不代表存在该成分，也不默认判为负面。',action:'核验配方及效果证据后回应疑问，区分即时外观变化与长期效果，避免未经证实的解释。'},
 {id:'channel',label:'购买渠道咨询',cloud:'哪里买',pattern:/(?:在哪(?:里|个地方)?买|哪个地方买|哪里买|哪儿买|在哪里买|购买渠道)/g,sentiment:null,tags:{需求:['购买渠道']},examples:'哪个地方买的、哪里买、购买渠道',note:'表示渠道信息需求，不推断实际购买或转化。',action:'提供可核验的官方购买渠道与规格信息，减少寻找商品的成本。'},
 {id:'usage',label:'使用方式 / 搭配咨询',cloud:'使用搭配',pattern:/(?:什么[^。！？!?\n]{0,12}都可以吗|怎么用|如何使用|怎么搭配|可以[^。！？!?\n]{0,12}一起用吗)/g,sentiment:null,tags:{需求:['使用指导']},examples:'什么精华水都可以吗、怎么用、怎么搭配',note:'表达使用方法需求，不自动给出成分兼容性判断。',action:'根据产品说明提供步骤、用量与搭配边界，无法确认的兼容性问题交由品牌核实。'},
 {id:'approval',label:'明确喜爱 / 认可',cloud:'爱用',pattern:/(?:爱死了|超级好用|挺好用|长久用下来觉得还是不错|终于get到了|get到了)/g,sentiment:'正面',tags:{需求:['体验价值']},examples:'爱死了、超级好用、挺好用、终于 get 到了',note:'表示评论者的主观认可，不等同于功效验证。',action:'邀请用户补充具体使用条件和喜欢的原因，形成可核实的体验素材。'}
];
export const normalizeText = text=>String(text).toLowerCase().replace(/\s+/g,'');
export function matchPhrases(text){
 const normalized=normalizeText(text);const matches=[];
 for(const rule of phraseRules){rule.pattern.lastIndex=0;const accepted=[];for(const m of normalized.matchAll(rule.pattern)){
   const prefix=normalized.slice(Math.max(0,m.index-8),m.index);
   if(/(?:不是|并非|不算|不觉得|没觉得|没有觉得|没有|并没有)$/.test(prefix))continue;
   if(rule.id==='approval'&&/(?:没|未|没有)$/.test(prefix))continue;
   // Uncertainty about a quoted complaint is not asserted negative experience.
   if(rule.sentiment==='负面'&&/^(?:吗|么|\?|？)/.test(normalized.slice(m.index+m[0].length)))continue;
   accepted.push({text:m[0],index:m.index});
 }if(accepted.length)matches.push({...rule,matches:accepted});}
 return matches;
}
export function phraseStats(reviews){return phraseRules.map(rule=>{const ids=reviews.filter(r=>(r.phrases||matchPhrases(r.text)).some(p=>p.id===rule.id)).map(r=>r.id);return {...rule,count:ids.length,ids}}).filter(x=>x.count).sort((a,b)=>b.count-a.count)}
