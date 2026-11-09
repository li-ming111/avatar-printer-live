export const PRINT_DEFAULTS={giftPriority:true,idleSeconds:30,commentKeyword:'888',commentCount:1,commentSize:'small',joinCount:1,joinSize:'small',likeCount:1,likeSize:'small',followCount:1,followSize:'large',giftSize:'large',heartCount:3,beerCount:1,roseCount:10,lollipopCount:99,otherCount:1};
export function commentMatches(settings,text){const k=String(settings?.commentKeyword??'').trim();return !k||String(text??'').includes(k)}
export function printOptions(settings,type,source){
 const key=type!=='like'?type:({'评论':'comment','进场':'join','点赞':'like','关注':'follow',comment:'comment',join:'join',like:'like',follow:'follow',Comment:'comment',Join:'join',Like:'like',Follow:'follow'}[source]);
 if(!key)return {};
 const gift=type!=='like';const count=Number(settings[key+'Count']);
 return {count:Number.isInteger(count)&&count>=1&&count<=99?count:PRINT_DEFAULTS[key+'Count'],size:settings[(gift?'gift':key)+'Size']==='large'?'large':'small',priority:gift&&settings.giftPriority!==false};
}
export function renderPrintSettings(body,settings,save){
 body.replaceChildren();
 const section=title=>{const group=document.createElement('section');group.className='print-setting-group';const h=document.createElement('h4');h.textContent=title;group.append(h);body.append(group);return group};
 const toggle=(group,key,title,description)=>{const label=document.createElement('label');label.className='print-setting-toggle';const text=document.createElement('span');text.textContent=title;if(description){const small=document.createElement('small');small.textContent=description;text.append(small)}const input=document.createElement('input');input.type='checkbox';input.checked=!!settings[key];input.onchange=()=>{settings[key]=input.checked;save()};label.append(text,input);group.append(label)};
 const select=(group,key,title,options)=>{const label=document.createElement('label');label.className='print-setting-field';const span=document.createElement('span');span.textContent=title;const input=document.createElement('select');for(const [value,text] of options){const o=document.createElement('option');o.value=String(value);o.textContent=text;input.append(o)}input.value=String(settings[key]);input.onchange=()=>{settings[key]=key.endsWith('Count')||key==='idleSeconds'?Number(input.value):input.value;save()};label.append(span,input);group.append(label)};
 const text=(group,key,title,placeholder)=>{const label=document.createElement('label');label.className='print-setting-field';const span=document.createElement('span');span.textContent=title;const input=document.createElement('input');input.type='text';input.value=settings[key]??'';input.placeholder=placeholder||'';input.onchange=()=>{settings[key]=input.value.trim();save()};label.append(span,input);group.append(label)};
 const sizes=[['small','小头像'],['large','大头像']];const counts=[1,2,3,5,10,20,50,99].map(n=>[n,n+' 张']);
 const trigger=section('打印触发');
 for(const [key,title] of [['comment','评论打印'],['join','进场打印'],['like','点赞打印'],['follow','关注打印']]){const card=document.createElement('div');card.className='print-setting-card';trigger.append(card);toggle(card,key,title);select(card,key+'Count','每次张数',counts);select(card,key+'Size','头像大小',sizes);if(key==='comment')text(card,'commentKeyword','只打印含','留空则每条都打')}
 const gifts=section('礼物打印');toggle(gifts,'gift','礼物触发打印');toggle(gifts,'giftPriority','礼物优先插队','排在普通任务前，当前打印完成后处理');select(gifts,'giftSize','头像大小',sizes);
 for(const [key,title] of [['heart','小心心'],['beer','啤酒'],['rose','玫瑰'],['lollipop','棒棒糖'],['other','其他礼物']])select(gifts,key+'Count',title+' / 每个',counts);
 const voice=section('语音播报');toggle(voice,'giftVoice','礼物答谢');toggle(voice,'joinVoice','进场欢迎');
 const idle=section('空闲补位');toggle(idle,'idleFill','无互动时补测试头像');select(idle,'idleSeconds','等待时间',[15,30,60,120].map(n=>[n,n+' 秒']));
 const note=document.createElement('p');note.className='print-setting-note';note.textContent='自动保存 · 打印规则对新收到的互动生效，已排队任务保持不变。';body.append(note);
}
