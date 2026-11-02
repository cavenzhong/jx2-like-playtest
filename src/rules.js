export const prices = [36,36,34,38,50,28,44,48,30,32,24,22,12,10,14,22,40,28];
export const tuning = {startingGold:60,betweenBattleHeal:18,supplyHeal:25,refreshCost:8,bossHpMultiplier:1.65,deepHpMultiplier:1.2,deepDamageMultiplier:1.1};
export const elementNames = {wood:'木',water:'水',metal:'金',earth:'土',fire:'火',none:'无'};
export const counters = {metal:'wood',wood:'earth',earth:'water',water:'fire',fire:'metal'};
export const triggerNames = {constant:'常驻',interval:'间隔',on_hit:'命中',low_health:'低血',adjacent:'相邻',battle_start:'开场',map_effect:'舆图'};
export const rumors = {bianjing:'武林盟运图队失约未至。循着驿道，去东郊问一问。',chenliu:'昨夜三骑带着湿布包，没走官道，往林子里去了。',yezhulin:'林中有人在找一块带朱砂印的旧布。',zhuxian:'南来的货队不怕山贼，只怕货单上的暗记。',pomiao:'庙里没有佛，只有一盏不该亮的灯。',hedu:'渡船少了一条，船底却多了一道刀痕。',heifengzhai:'寨门没有旗，门后挂着一面倒写的黑字。'};
export const notes = {chenliu:['赵行简：林中有血迹。','商路向南，运图队曾在朱仙镇改道。','马贼只是门，门后还有人。'],yezhulin:['林中有虎踪，车辙尚新。','染血的车绳旁，落着武林盟铜扣。','韩小乙：破庙里的印泥是黑的。'],zhuxian:['高顺：他们改走了水路。','河风夹着火油味。','有人从水路把货送往东边。'],pomiao:['香灰是冷的，灯芯却刚换过。','韩小乙的伤与黑印有关。','沈青萝：这是天阴教的外线。'],hedu:['断箭浮水，船缆已断。','水贼的货箱有武林盟暗记。','水路上的线索已查尽。'],heifengzhai:['韩烈倒下，黑印犹在。','残图所指，似是东面的山脉。','东郊残页的线索已录入舆图。']};
export function describe(i) {
 const e=i.effect || {}, t=i.trigger || {}, s=[];
 if(i.mapEffect) return '通关揭开黑风寨并消耗；已开放时保留，对寨中敌人伤害 +20%。';
 if(e.damage) s.push('每 '+t.cooldown+' 秒造成 '+e.damage+' 点'+(e.useHostWeaponElement?'主武器属性':'')+'伤害');
 if(e.shield) s.push('获得 '+e.shield+' 护盾');
 if(e.poisonDamagePerSecond) s.push((t.firstWeaponHitOnly?'首次武器命中':'武器命中（冷却 '+t.cooldown+' 秒）')+'施毒 '+e.poisonDamagePerSecond+'/秒，持续 '+e.poisonDuration+' 秒');
 if(e.heal) s.push('生命 ≤'+t.hpRatioAtMost*100+'%'+(e.cleanse?' 且中毒时解毒并':'')+'回复 '+e.heal+'；每战一次');
 if(e.maxHp) s.push('生命上限 +'+e.maxHp);
 if(e.flatDamageReduction) s.push('每次受伤 -'+e.flatDamageReduction);
 if(e.dodgeCount) s.push('开场 '+e.dodgeWindow+' 秒内闪避 '+e.dodgeCount+' 次');
 if(e.healingBonus) s.push('正交相邻药品治疗 +'+e.healingBonus);
 if(e.advantageDamageBonus) s.push('正交相邻水武器，克制倍率额外 +0.2');
 if(e.damageToAttribute) s.push('对阴敌伤害 +30%，受阴敌伤害 -20%');
 if(e.damageToTags) s.push('对马贼、天阴教伤害 +10%');
 if(i.synergy) s.push('邻接武当武器时冷却 ×0.8');
 return s.join('；')+'。';
}

// v0.35: all new progression numbers live here; battle count means completed fights.
export const expeditionRules = {
  bagSize: 5, fieldLimit: 6, startingGold: 60, winHeal: 6, campHeal: 12, refreshCost: 12,
  weaponFieldMultiplier: 1.35, mergeBonuses: [0, .25, .45, .60], mergeBattles: 10,
  end: 80, checkpoints: [30, 60], storyAt: 50, maxSpeed: 4,
  emptyChance: .40, tenStepReduction: .01, maxTenReduction: .08, chainMultiplier: 1.3,
  maxEmptyReduction: .16, progressPerCard: 25, progressPity: 4,
  cardWeights: {progress: .40, research: .30, story: .15, reward: .15},
  researchCap: 2, storyCap: 4,
  researchEnemyHp: 1.12, researchEnemyDamage: 1.05,
  hpScale: .78, damageScale: .88, bossHpScale: 1.65, bossDamageScale: 1.45,
  returnPressure: .90, tierPressure: .16, normalEnemyMin: 2, normalEnemyMax: 3, medicineBattles: 10
};
export const mapDevelopment = {
  chenliu: {difficulty: .95, shard: '驿路纹片', item: 'relay_blade', name: '驿路短剑', base: 'wudang_qingfeng_sword', enemy: '驿道伏兵'},
  yezhulin: {difficulty: 1, shard: '青木纹片', item: 'forest_bow', name: '青木猎弩', base: 'tangmen_sleeve_dart', enemy: '林中猎首'},
  zhuxian: {difficulty: 1.03, shard: '朱砂纹片', item: 'cinnabar_pen', name: '朱砂判笔', base: 'wudang_five_element_pen', enemy: '暗记镖客'},
  pomiao: {difficulty: 1.06, shard: '玄阴纹片', item: 'temple_staff', name: '古庙镇魂棍', base: 'shaolin_ring_staff', enemy: '黑灯守卫'},
  hedu: {difficulty: 1.06, shard: '沧水纹片', item: 'river_dart', name: '沧水袖箭', base: 'tangmen_sleeve_dart', enemy: '断缆水寇'},
  heifengzhai: {unitHp: .85, unitDamage: .80, bossHp: .75, bossDamage: 1.0, difficulty: 1.05, shard: '黑铁纹片', item: 'black_blade', name: '黑铁寨刃', base: 'wudang_qingfeng_sword', enemy: '黑印亲卫'}
};
export const fragmentRecipes = {
  trail: {name: '行旅护心', shards: {chenliu: 2, yezhulin: 2}, iron: 4, cap: 3, hp: 2, description: '每层起手气血 +2'},
  river: {name: '渡水养元', shards: {zhuxian: 2, hedu: 2}, iron: 4, cap: 3, hp: 2, description: '每层起手气血 +2'},
  seal: {name: '破印淬锋', shards: {pomiao: 2, heifengzhai: 2}, iron: 6, cap: 2, edge: 1, description: '每层起手剑伤害 +1'}
};

// Fourth visits conclude the local thread rather than repeating the third clue.
const finalNotes = {
  chenliu: '驿丞对齐三份口供：运图队不是失踪，而是被持黑令者接走。',
  yezhulin: '韩小乙认出车绳的结法，押货的人曾在破庙过夜。',
  zhuxian: '高顺交出半张货单，暗记与渡口的油桶编号相同。',
  pomiao: '沈青萝从灯座取出黑印拓片，证实天阴外线正追查残图。',
  hedu: '船夫藏下的断缆上有黑铁屑，货最终运往黑风寨。',
  heifengzhai: '寨中账册与东郊残页相合，运图队留下了通向东岭的证据。'
};
for (const [id, line] of Object.entries(finalNotes)) notes[id].push(line);
