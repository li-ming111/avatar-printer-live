import {test} from 'node:test';import assert from 'node:assert/strict';import {DemoRules} from './demo-rules.mjs';
for(const [type,count,size] of [['like',1,'small'],['heart',3,'large'],['beer',1,'large'],['rose',10,'large'],['lollipop',99,'large'],['other',1,'large']])test(type+'数量与尺寸',()=>{let r=new DemoRules();r.event(type,{name:'测试'},'1');assert.equal(r.queue.length,count);assert.ok(r.queue.every(x=>x.size===size))});
test('单次礼物上限99张',()=>{let r=new DemoRules();r.event('lollipop',{name:'测试'},'1',2);assert.equal(r.queue.length,99)});
test('事件去重',()=>{let r=new DemoRules();r.event('beer',{name:'测试'},'same');const dup=r.event('beer',{name:'测试'},'same');assert.equal(dup.duplicate,true);assert.equal(r.queue.length,1)});
test('拒绝旧规则',()=>{let r=new DemoRules();assert.throws(()=>r.event('small66',{name:'测试'},'1'))});
test('礼物优先于普通任务，礼物之间保持先来先打印',()=>{
 const r=new DemoRules();
 r.event('like',{name:'普通A'},'a');r.event('like',{name:'普通B'},'b');
 const first=r.event('beer',{name:'礼物A'},'gift-a');
 const second=r.event('heart',{name:'礼物B'},'gift-b');
 assert.deepEqual(r.queue.map(j=>j.name),['礼物A','礼物B','礼物B','礼物B','普通A','普通B']);
 assert.equal(first.index,0);assert.equal(second.index,1);
});
test('同人同类型冷却，挡住连刷但放行不同互动',()=>{
 const r=new DemoRules();const realNow=Date.now;let now=1000000;Date.now=()=>now;
 try{
  const a=r.event('like',{name:'甲'},'c1',1,{}, {source:'评论'});assert.equal(a.added,1);
  const b=r.event('like',{name:'甲'},'c2',1,{}, {source:'评论'});assert.equal(b.added,0);assert.equal(b.cooldown,true);
  const c=r.event('like',{name:'乙'},'c3',1,{}, {source:'评论'});assert.equal(c.added,1);
  const d=r.event('like',{name:'甲'},'l1',1,{}, {source:'点赞'});assert.equal(d.added,1,'同一人换一种互动不受限制');
  now+=60000;const e=r.event('like',{name:'甲'},'c4',1,{}, {source:'评论'});assert.equal(e.added,1,'冷却结束后恢复');
 }finally{Date.now=realNow}
});
test('队列封顶120，礼物按剩余空位截断',()=>{
 const r=new DemoRules();r.queue.push(...Array(100).fill({name:'占位'}));
 const a=r.event('lollipop',{name:'礼物'},'g1');assert.equal(a.added,20);assert.equal(a.full,true);assert.equal(r.queue.length,120);
 const b=r.event('like',{name:'新观众'},'c1');assert.equal(b.added,0);assert.equal(b.full,true);
});
test('插队任务的直播标记不污染普通队列，重连后仍保留礼物',()=>{
 const r=new DemoRules();r.event('like',{name:'演示'},'demo');
 const result=r.event('lollipop',{name:'礼物'},'gift');
 for(let i=result.index;i<result.index+result.added;i++){r.queue[i].live=true;r.queue[i].source='礼物·棒棒糖'}
 assert.equal(r.queue.at(-1).live,undefined);
 assert.equal(r.queue.filter(j=>j.live).length,99);
 assert.ok(result.jobs.every(j=>j.priority&&j.live));
});
