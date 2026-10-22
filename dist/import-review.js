// Review units are user-selectable; no platform-specific scraping or identity inference.
export function prepareComments(raw, mode='line', deduplicate=true) {
  if(raw.length>200000)throw new Error('内容超过 20 万字，请分批导入。');
  const normalized=raw.replace(/\r\n?/g,'\n');
  const parts=mode==='paragraph'?normalized.split(/\n\s*\n/):normalized.split('\n');
  const seen=new Set();let blanks=0,duplicates=0,metadata=0;
  const items=[];
  for(const [index,part] of parts.entries()){
    const text=part.trim();if(!text){blanks++;continue;}
    const key=text.replace(/\s+/g,' ');const duplicate=seen.has(key);seen.add(key);
    // Flag only standalone interface/time lines. Never guess that a name is a nickname.
    const noise=/^(?:回复|展开(?:\s*\d+\s*条)?回复|查看更多(?:回复|评论)?|收起|点赞|分享|收藏|置顶|作者|\d+\s*(?:分钟前|小时前|天前)|刚刚|昨天|今天|\d{1,2}:\d{2}|\d{4}[-/.年]\d{1,2}[-/.月]\d{1,2}日?|\d+\s*赞)$/.test(text);
    if(duplicate)duplicates++;if(noise)metadata++;
    items.push({id:index+1,text,duplicate,noise,keep:!noise&&(!deduplicate||!duplicate)});
  }
  if(items.length>2000)throw new Error('单次最多预览 2,000 条，请分批粘贴或使用文件上传。');
  return {items,blanks,duplicates,metadata};
}
