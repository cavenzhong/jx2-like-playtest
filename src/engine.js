import { prices, tuning, counters, expeditionRules } from './rules.js';
export function catalog(data) { return Object.fromEntries(data.items.map((i,n)=>[i.id,{...i,price:prices[n] || 0}])); }
let serial=0;
export function instance(id,x=0,y=0) { return {id,uid:'i'+Date.now()+'-'+serial++,x,y}; }
export function freshWorld(region) { return {version:1,regionId:region.regionId,points:Object.fromEntries(region.points.map(p=>[p.id,{state:p.state,probe:0}])),gold:tuning.startingGold,bag:[instance('wudang_qingfeng_sword'),instance('golden_creation_pill',1,0)],stats:{runs:0,totalProbes:0},discoveries:[],rescueShield:false}; }
export function fits(bag,entry,x,y,items,size=6) { const [w,h]=items[entry.id].shape; return x>=0&&y>=0&&x+w<=size&&y+h<=size&&!bag.some(b=>b.uid!==entry.uid&&x<b.x+items[b.id].shape[0]&&x+w>b.x&&y<b.y+items[b.id].shape[1]&&y+h>b.y); }
export function place(bag,entry,items,size=6) { for(let y=0;y<size;y++)for(let x=0;x<size;x++)if(fits(bag,entry,x,y,items,size)){entry.x=x;entry.y=y;bag.push(entry);return true;}return false; }
export function adjacent(a,b,items) {const [w,h]=items[a.id].shape,[v,k]=items[b.id].shape;return ((a.x+w===b.x||b.x+v===a.x)&&a.y<b.y+k&&a.y+h>b.y)||((a.y+h===b.y||b.y+k===a.y)&&a.x<b.x+v&&a.x+w>b.x);}
export function maxHp(bag,items){return 100+bag.reduce((n,b)=>n+(items[b.id].effect?.maxHp||0),0);}
export function reveal(world,region,pointId,outcome,bag) {
 const next=structuredClone(world),p=next.points[pointId],opened=[]; next.stats.runs++;
 if(outcome==='defeat') return {world:next,opened,consumed:[]};
 p.probe=Math.min(3,p.probe+1);next.stats.totalProbes++;
 if(outcome==='victory')p.state='passed';
 const card=bag.find(b=>b.id==='bounty_post_east_bandits'),target='heifengzhai',consumed=[];
 if(card&&outcome==='victory'&&['hidden','rumor'].includes(world.points[target].state)){next.points[target].state='open';opened.push(target);consumed.push(card.uid);}
 for(const child of region.points.filter(c=>c.parent===pointId))if(opened.length<2&&['hidden','rumor'].includes(next.points[child.id].state)&&p.probe>=child.probeReq){next.points[child.id].state='open';opened.push(child.id);}
 return {world:next,opened,consumed};
}
export function encounter(region,point,round,boss,depth,rng=Math.random) {
 const pool=region.encounters.find(e=>e.id===point.encounterPools[round%point.encounterPools.length]);
 const spawn=(id,hpMul=1)=>{const e=region.enemies.find(e=>e.id===id);return {...structuredClone(e),hp:Math.ceil(e.hp*hpMul*(depth===2?tuning.deepHpMultiplier:1)),damage:e.damage*(depth===2?tuning.deepDamageMultiplier:1)};};
 if(boss)return [point.id==='heifengzhai'?spawn('han_lie'):spawn(pool.enemies[0].enemyId,tuning.bossHpMultiplier)];
 return pool.enemies.flatMap(e=>Array.from({length:e.min+Math.floor(rng()*(e.max-e.min+1))},()=>spawn(e.enemyId)));
}
export function createBattle(bag,items,enemies,hp,{pointId='',bountyOpen=false,rescueShield=false,foundationEdge=0}={}) {
 const usable=bag.filter(i=>i.protected||i.durability===undefined||i.durability>0);
 const ordered=[...usable].sort((a,b)=>a.y-b.y||a.x-b.x).map(b=>({...b,def:b.starter&&foundationEdge?{...items[b.id],effect:{...items[b.id].effect,damage:items[b.id].effect.damage+foundationEdge}}:items[b.id],next:0,used:false}));
 for(const i of ordered) {
  const effect={...i.def.effect};
  const field=i.field&&!i.protected&&i.def.kind==='weapon' ? expeditionRules.weaponFieldMultiplier : 1;
  const bonus=expeditionRules.mergeBonuses[Math.min(i.mergeLevel||0,expeditionRules.mergeBonuses.length-1)];
  if(effect.damage)effect.damage=Math.round(effect.damage*field*(1+bonus));
  i.def={...i.def,name:i.def.name+(i.mergeLevel?' +'+i.mergeLevel:''),effect};
 }
 const b={time:0,hp,maxHp:maxHp(usable,items),shield:rescueShield?5:0,enemies:enemies.map((e,n)=>({...e,maxHp:e.hp,uid:n,next:e.attackInterval,shield:0,poisons:[]})),items:ordered,logs:[],damage:{},consumed:[],result:null,pointId,bountyOpen,dodges:[],poison:0};
 for(const i of ordered){const e=i.def.effect||{};if(e.dodgeCount)b.dodges.push({uid:i.uid,until:e.dodgeWindow,count:e.dodgeCount});i.next=i.def.triggerType==='interval'?(i.def.trigger.cooldown||0):0;if(i.def.synergy&&ordered.some(j=>j!==i&&j.def.kind==='weapon'&&j.def.tags.includes('wudang')&&adjacent(i,j,items)))i.next*=i.def.synergy.cooldownMultiplier;i.cooldown=i.next;}
 for(const i of ordered)if(i.def.triggerType==='battle_start')log(b,i.def.name,'自身',0,'开场护持',0,'护持',i.uid,null);
 return b;
}
function log(b,item,target,raw,bonus,result,move='出招',sourceUid=null,targetUid=null,element='none'){b.logs.push({id:b.logs.length,time:+b.time.toFixed(1),source:item,item,move,target,raw,bonus,result,sourceUid,targetUid,element});}
export function tick(b,dt,items,region){
 if(b.result)return b;
 b.time=+(b.time+dt).toFixed(4);
 const live=()=>b.enemies.filter(e=>e.hp>0);
 const has=id=>b.items.some(i=>i.id===id&&!i.used);
 const hit=(i,e,raw,element,move='出招')=>{
  let mult=counters[element]===e.element?1.2:counters[e.element]===element?0.85:1;const why=[mult===1?'平势':mult>1?'五行克制 ×1.2':'五行受克 ×0.85'];
  if(mult>1&&b.items.some(j=>j.def.effect?.advantageDamageBonus&&element==='water'&&i.def.kind==='weapon'&&adjacent(i,j,items))){mult+=.2;why.push('水印 +0.2');}
  if(e.attribute==='yin'&&has('evil_repelling_talisman')){mult*=1.3;why.push('辟邪 ×1.3');}
  if(e.tags?.some(t=>['bandit','tianyin'].includes(t))&&has('wulin_alliance_token')){mult*=1.1;why.push('腰牌 ×1.1');}
  if(b.pointId==='heifengzhai'&&b.bountyOpen&&has('bounty_post_east_bandits')){mult*=1.2;why.push('悬赏 ×1.2');}
  const dmg=Math.round(raw*mult),blocked=Math.min(e.shield,dmg);e.shield-=blocked;const actual=Math.min(e.hp,dmg-blocked);e.hp-=actual;b.damage[i.def.name]=(b.damage[i.def.name]||0)+actual;log(b,i.def.name,e.name,raw,why.join(' / '),actual,move,i.uid,e.uid,element);
 };
 for(const e of live())for(const p of e.poisons){if(b.time<=p.until+1e-6&&b.time+1e-6>=p.next){hit(p.item,e,p.damage,'wood','毒伤');p.next+=1;}}
 for(const i of b.items){if(i.used||i.def.triggerType!=='interval'||b.time+1e-6<i.next)continue;const e=live()[0];if(!e)break;i.next+=i.cooldown;
 const effect=i.def.effect;let el=i.def.element;if(effect.useHostWeaponElement)el=b.items.find(j=>j.def.kind==='weapon')?.def.element||el;
 hit(i,e,effect.damage||0,el);b.shield+=effect.shield||0;if(effect.shield)log(b,i.def.name,'自身',effect.shield,'护盾',effect.shield,'护持',i.uid,null);
 if(i.def.kind==='weapon')for(const j of b.items){if(j.used||j.def.triggerType!=='on_hit'||b.time<j.next)continue;const ef=j.def.effect;e.poisons=e.poisons.filter(p=>p.item.uid!==j.uid);e.poisons.push({item:j,damage:ef.poisonDamagePerSecond,until:b.time+ef.poisonDuration,next:b.time+1});j.next=b.time+(j.def.trigger.cooldown||0);log(b,j.def.name,e.name,ef.poisonDamagePerSecond,'施毒 3 秒',0,'命中',j.uid,e.uid);if(j.def.charges){j.used=true;if(!Number.isFinite(j.durability))b.consumed.push(j.uid);}}
 }
 for(const e of live()){
  if(e.phaseAtHpRatio&&!e.phased&&e.hp/e.maxHp<=e.phaseAtHpRatio){e.phased=true;e.shield=12;const def=region.enemies.find(j=>j.id==='tianyin_runner');const scale=e.reinforcementScale||Math.pow(1.20,e.depth||0),summonHp=Math.ceil(def.hp*.72*scale);b.enemies.push({...def,hp:summonHp,maxHp:summonHp,damage:def.damage*.75*Math.pow(1.17,e.depth||0),uid:b.enemies.length,next:b.time+def.attackInterval,shield:0,poisons:[]});log(b,e.name,e.name,12,'黑印护盾 + 召来跑腿者',12,'黑印压制',e.uid,e.uid);}
  if(b.time+1e-6<e.next)continue;e.next+=e.attackInterval;
  const dodge=b.dodges.find(d=>d.count>0&&b.time<=d.until);if(dodge){dodge.count--;log(b,'玄门身法','自身',e.damage,'闪避',0,'闪避',dodge.uid,null);continue;}
  let dmg=e.damage;if(e.attribute==='yin'&&has('evil_repelling_talisman'))dmg*=.8;
  dmg=Math.max(0,Math.round(dmg)-b.items.reduce((s,i)=>s+(i.def.effect?.flatDamageReduction||0),0));const absorb=Math.min(b.shield,dmg);b.shield-=absorb;b.hp-=dmg-absorb;log(b,e.name,'自身',e.damage,'护盾吸收 '+absorb,dmg-absorb,'敌袭',e.uid,null,e.element);b.lastAttacker=e.name;
  for(const i of b.items){const t=i.def.trigger,ef=i.def.effect||{};if(i.used||i.def.triggerType!=='low_health'||b.hp<=0||b.hp/b.maxHp>t.hpRatioAtMost||(t.requiresStatus&&!b.poison))continue;let heal=ef.heal||0;for(const j of b.items)if(j.def.effect?.healingBonus&&adjacent(i,j,items))heal+=j.def.effect.healingBonus;const actual=Math.min(heal,b.maxHp-b.hp);b.hp+=actual;if(ef.cleanse)b.poison=0;i.used=true;if(!Number.isFinite(i.durability))b.consumed.push(i.uid);log(b,i.def.name,'自身',ef.heal,heal>ef.heal?'药囊 +10':'低血自动用药',actual,'治疗',i.uid,null);}
  if(b.hp<=0)break;
 }
 if(b.hp<=0){b.hp=0;b.result='defeat';b.reason='被'+b.lastAttacker+'击倒；检查减伤、药品和输出搭配。';}
 else if(!live().length){b.result='victory';b.reason='敌人已清，背包中所有武器与秘籍自动生效。';}
 else if(b.time>=30){b.result='defeat';b.reason='30 秒未清敌，按败退结算；需要提高输出或调整五行。';}
 return b;
}
export function simulate(bag,items,enemies,hp,options,region){const b=createBattle(bag,items,enemies,hp,options);while(!b.result)tick(b,.1,items,region);return b;}
