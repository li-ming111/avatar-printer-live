import {test} from 'node:test';
import assert from 'node:assert/strict';
import {DemoRules} from './demo-rules.mjs';
import {PRINT_DEFAULTS,printOptions,commentMatches} from './print-settings.mjs';
test('评论自定义数量与大小对新任务生效',()=>{
 const r=new DemoRules();const settings={...PRINT_DEFAULTS,commentCount:3,commentSize:'large'};
 r.event('like',{name:'观众'},'comment',1,printOptions(settings,'like','评论'));
 assert.equal(r.queue.length,3);assert.ok(r.queue.every(j=>j.size==='large'&&!j.priority));
});
test('礼物按每个数量倍增，可关闭插队并保留旧任务',()=>{
 const r=new DemoRules();r.event('like',{name:'旧任务'},'old');
 const settings={...PRINT_DEFAULTS,beerCount:3,giftPriority:false,giftSize:'small'};
 r.event('beer',{name:'礼物'},'gift',2,printOptions(settings,'beer','礼物·啤酒'));
 assert.equal(r.queue[0].name,'旧任务');assert.equal(r.queue.length,7);assert.ok(r.queue.every(j=>!j.priority&&j.size==='small'));
});
test('保留演示规则，支持英文事件及异常数量回退',()=>{
 assert.deepEqual(printOptions(PRINT_DEFAULTS,'like','演示'),{});
 assert.equal(printOptions({...PRINT_DEFAULTS,commentCount:999},'like','comment').count,1);
 assert.equal(printOptions({...PRINT_DEFAULTS,followCount:5},'like','follow').count,5);
});
test('评论关键词默认只认 888，留空则全部打印',()=>{
 assert.equal(PRINT_DEFAULTS.commentKeyword,'888');
 assert.equal(commentMatches(PRINT_DEFAULTS,'来了888'),true);
 assert.equal(commentMatches(PRINT_DEFAULTS,'666'),false);
 assert.equal(commentMatches(PRINT_DEFAULTS,'999'),false);
 assert.equal(commentMatches({commentKeyword:''},'随便说点什么'),true);
 assert.equal(commentMatches({commentKeyword:'  '},'随便说点什么'),true);
 assert.equal(commentMatches({commentKeyword:'  666 '},'发666'),true);
});
