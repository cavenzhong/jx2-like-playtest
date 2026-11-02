import {freshWorld, instance, place, maxHp, encounter} from './engine.js?v=83da3ff56c3c';
import {expeditionRules as rules, mapDevelopment, fragmentRecipes, notes} from './rules.js?v=83da3ff56c3c';

export const BAG_SIZE = rules.bagSize;
export const MAX_FIELD_ITEMS = rules.fieldLimit;
export const upgrades = {
  vitality: {name: '培元', cap: 5, description: '起手护符气血 +4', unit: '气血'},
  edge: {name: '淬锋', cap: 3, description: '起手青锋剑伤害 +2', unit: '剑伤'}
};
const forgeCosts = {vitality: [2, 3, 4, 5, 6], edge: [3, 4, 5]};
export const foundationCharm = {id: 'foundation_charm', name: '培元护符', kind: 'accessory', shape: [1, 1], element: 'earth', triggerType: 'constant', effect: {maxHp: 0}, price: 0};
export const travelRoutes = Object.fromEntries(Object.keys(mapDevelopment).map(id => [id, {safe: rules.checkpoints, end: rules.end}]));
export const fieldCount = (run, items) => run.bag.filter(b => !b.protected && !items[b.id].mapEffect).length;
export const itemName = (b, items) => items[b.id].name + (b.mergeLevel ? ' +' + b.mergeLevel : '');
export function saleValue(b, items) {
  const fraction = Number.isFinite(b.durability) ? b.durability / b.maxDurability : 1;
  return Math.floor(items[b.id].price * .25 * Math.max(0, fraction));
}
export function sellItem(run, uid, items) {
  const b = run.bag.find(b => b.uid === uid);
  if (!b || !items[b.id]?.price) return false;
  run.gold += saleValue(b, items);
  run.bag = run.bag.filter(i => i.uid !== uid);
  run.hp = Math.min(run.hp, maxHp(run.bag, items));
  return true;
}
export function prepareItems(items) {
  for (const def of Object.values(mapDevelopment)) {
    const base = items[def.base];
    items[def.item] = {...base, id: def.item, name: def.name, researchMap: Object.keys(mapDevelopment).find(id => mapDevelopment[id] === def),
      effect: {...base.effect, damage: Math.round(base.effect.damage * 1.1)}, price: base.price + 4};
  }
  for (const i of Object.values(items)) if (i.kind === 'weapon') i.shape = [2, 2];
  return items;
}
export function durabilityFor(item) {
  if (item.kind === 'weapon' || item.mapEffect || ['task_card', 'story_item', 'story_relic'].includes(item.kind)) return null;
  return item.kind === 'armor' ? 10 : item.kind.includes('consumable') ? rules.medicineBattles : item.kind === 'manual' || item.kind === 'talisman' ? 6 : 8;
}
export function fieldItem(id, items) {
  const b = {...instance(id), field: true}, life = durabilityFor(items[id]);
  if (life !== null) { b.durability = life; b.maxDurability = life; }
  return b;
}
export function packItem(run, entry, items, replaceUid = null) {
  if (!items[entry.id]) return false;
  const same = items[entry.id].kind === 'weapon' && run.bag.find(b => b.id === entry.id);
  if (same) {
    if ((same.mergeLevel || 0) >= rules.mergeBonuses.length - 1) return false;
    same.mergeLevel = (same.mergeLevel || 0) + 1;
    if (!same.mergeLeft) same.mergeLeft = rules.mergeBattles;
    return true; // Auto-merge takes priority; a selected replacement is left untouched.
  }
  const old = run.bag.find(b => b.uid === replaceUid);
  if (replaceUid && (!old || old.protected)) return false;
  const next = run.bag.filter(b => b.uid !== replaceUid);
  if (!entry.protected && fieldCount({bag: next}, items) >= MAX_FIELD_ITEMS) return false;
  if (!place(next, entry, items, BAG_SIZE)) return false;
  run.bag = next;
  run.hp = Math.min(run.hp, maxHp(next, items));
  return true;
}
export function wearEquipment(run, items) {
  const broken = [];
  for (const b of run.bag) {
    if (b.mergeLeft > 0 && --b.mergeLeft === 0) b.mergeLevel = 0;
    if (b.protected || durabilityFor(items[b.id]) === null) continue;
    b.durability = (b.durability ?? durabilityFor(items[b.id])) - 1;
    if (b.durability <= 0) broken.push(b.uid);
  }
  run.bag = run.bag.filter(b => !broken.includes(b.uid));
  run.hp = Math.min(run.hp, maxHp(run.bag, items));
  return broken;
}
export function newWorld(region) {
  const base = freshWorld(region);
  for (const [id, p] of Object.entries(base.points)) {
    p.state = id === 'bianjing' ? 'here' : id === 'chenliu' ? 'open' : 'hidden';
    p.progress = ['bianjing', 'chenliu'].includes(id) ? 100 : 0;
  }
  return {...base, version: 35, mapProgressRevision: 1, fragments: 0, upgrades: {vitality: 0, edge: 0}, unlocks: [], development: {}, shardBank: {}, recipes: {}, progressDry: 0};
}
export function upgradeCost(world, id) { return forgeCosts[id]?.[world.upgrades[id] || 0] ?? Infinity; }
export function forge(world, id) {
  const def = upgrades[id];
  if (!def || world.upgrades[id] >= def.cap || world.fragments < upgradeCost(world, id)) return false;
  world.fragments -= upgradeCost(world, id); world.upgrades[id]++;
  return true;
}
export function defaultBag(world, items) {
  prepareItems(items);
  const bag = [];
  items.foundation_charm = {...foundationCharm, effect: {maxHp: world.upgrades.vitality * 4 + recipeBonus(world, 'hp')}};
  for (const id of ['wudang_qingfeng_sword', 'wudang_five_element_pen']) {
    const b = instance(id); b.protected = true;
    if (id === 'wudang_qingfeng_sword') b.starter = true;
    place(bag, b, items, BAG_SIZE);
  }
  place(bag, fieldItem('golden_creation_pill', items), items, BAG_SIZE);
  if (world.upgrades.vitality || recipeBonus(world, 'hp')) { const b = instance('foundation_charm'); b.protected = true; place(bag, b, items, BAG_SIZE); }
  return bag;
}
export function beginRun(world, pointId, items) {
  if (!['open', 'passed'].includes(world.points[pointId]?.state) || (world.points[pointId].progress ?? 100) < 100) throw Error('Map development must reach 100%');
  const bag = defaultBag(world, items);
  return {pointId, bag, hp: maxHp(bag, items), gold: rules.startingGold, fragments: 0, cleared: 0, target: 0, recorded: 0,
    tenSteps: 0, chain: 0, totalForward: 0, shards: {}, research: world.development?.[pointId]?.research || 0, researchLevels: Object.fromEntries(Object.entries(world.development || {}).map(([id, d]) => [id, d.research])), endpointCard: null,
    direction: 'outbound', returnTotal: 0, returnLeft: 0, pending: null, purchases: 0, lastGold: 0, lastFragments: 0};
}
export function returnCost(run) {
  return (rules.checkpoints.includes(run.cleared) || run.cleared === rules.end) ? 0 : run.cleared + (run.journey || []).reduce((n, p) => n + p.cleared, 0);
}
export function beginReturn(run) {
  if (run.direction !== 'outbound') return false;
  run.returnTotal = returnCost(run); run.returnLeft = run.returnTotal; run.direction = 'return'; run.pending = null;
  return true;
}
export function canSettle(run) { return run.direction === 'return' && run.returnLeft === 0; }
export function adjacentMaps(region, id) {
  return region.roads.flatMap(([a, b]) => a === id ? [b] : b === id ? [a] : []).filter(id => id !== 'bianjing');
}
export function passageAt(run) {
  return run.direction === 'outbound' && run.cleared === rules.end && run.endpointCard ? {at: rules.end} : null;
}
export function nextMaps(world, region, run) {
  return passageAt(run) ? adjacentMaps(region, run.pointId).filter(id => ['open', 'passed'].includes(world.points[id].state)) : [];
}
export function crossPassage(world, run, items, region, to) {
  if (!nextMaps(world, region, run).includes(to)) return false;
  run.journey = [...(run.journey || []), {pointId: run.pointId, cleared: run.cleared}];
  run.pointId = to; run.cleared = 0; run.target = 0; run.recorded = 0; run.pending = null;
  run.inheritedReduction = Math.min(rules.maxEmptyReduction, (rules.emptyChance - emptyChance(run)) * rules.chainMultiplier);
  run.tenSteps = 0; run.chain = (run.chain || 0) + 1; run.endpointCard = null; run.npcSeen = false; run.npcPending = false; delete run.storyMessage;
  run.research = world.development?.[to]?.research || 0;
  run.returnLeft = 0; run.returnTotal = 0; run.purchases = 0;
  run.hp = Math.min(run.hp, maxHp(run.bag, items));
  return true;
}
export function planAdvance(run, count) {
  if (run.direction !== 'outbound' || run.cleared >= rules.end || ![5, 10].includes(count) || run.cleared < run.target) return false;
  const stop = [...rules.checkpoints, rules.storyAt, rules.end].sort((a, b) => a - b).find(n => n > run.cleared);
  run.target = Math.min(run.cleared + count, stop);
  run.plan = {start: run.cleared, count, target: run.target};
  run.pending = null;
  return true;
}
export function speedCap(run) {
  return Math.min(rules.maxSpeed, 1 + Math.floor((run?.totalForward || 0) / 30));
}
export function returnLeg(run) {
  const route = [...(run.journey || []), {pointId: run.pointId, cleared: run.cleared}];
  let end = route.reduce((sum, leg) => sum + leg.cleared, 0);
  for (let i = route.length - 1; i >= 0; i--) {
    const leg = route[i], start = end - leg.cleared;
    if (run.returnLeft > start && run.returnLeft <= end) return {pointId: leg.pointId, position: run.returnLeft - start};
    end = start;
  }
  return {pointId: route[0]?.pointId || run.pointId, position: 0};
}
export function encounterPosition(run) { return run.direction === 'return' ? returnLeg(run).position : run.cleared + 1; }
export function difficultyAt(position, returning = false) {
  // Tense first stretch, relief after building, then rising pressure in each 30-step leg.
  const local = (position - 1) % 30 + 1, tier = Math.floor((position - 1) / 30);
  const wave = local <= 5 ? 1.1 : local <= 15 ? .78 : .9 + (local - 15) * .025;
  return wave * (1 + tier * rules.tierPressure) * (returning ? rules.returnPressure : 1);
}
export function runEnemies(region, run, rng = Math.random) {
  const n = encounterPosition(run), boss = n % 5 === 0, returning = run.direction === 'return';
  const point = region.points.find(p => p.id === (returning ? returnLeg(run).pointId : run.pointId)), pressure = difficultyAt(n, returning) * mapDevelopment[point.id].difficulty;
  const enemies = encounter(region, point, n - 1, boss, 1, rng);
  if (!boss) {
    const count = rules.normalEnemyMin + Math.floor(rng() * (rules.normalEnemyMax - rules.normalEnemyMin + 1));
    while (enemies.length < count) enemies.push(structuredClone(enemies[enemies.length - 1]));
    enemies.splice(count);
  }
  if ((run.researchLevels?.[point.id] ?? run.research ?? 0) >= 2 && !boss && n % 4 === 0) {
    enemies[0] = {...enemies[0], id: 'developed_' + point.id, name: mapDevelopment[point.id].enemy,
      hp: Math.ceil(enemies[0].hp * rules.researchEnemyHp), damage: enemies[0].damage * rules.researchEnemyDamage};
  }
  return enemies.map(e => ({
    ...e, name: boss && e.id !== 'han_lie' ? e.name + '·头领' : e.name,
    hp: Math.ceil(e.hp * rules.hpScale * (boss ? (e.id === 'han_lie' ? mapDevelopment[point.id].bossHp : rules.bossHpScale) : (mapDevelopment[point.id].unitHp || 1)) * pressure),
    damage: Math.max(1, e.damage * rules.damageScale * (boss ? (e.id === 'han_lie' ? mapDevelopment[point.id].bossDamage : rules.bossDamageScale) : (mapDevelopment[point.id].unitDamage || 1)) * pressure),
    depth: Math.floor((n - 1) / 30), reinforcementScale: pressure
  }));
}
export function rewardRun(run) {
  if (run.direction === 'return') {
    if (run.returnLeft <= 0) throw Error('Return is already complete');
    run.returnLeft--; run.lastGold = 0; run.lastFragments = 0;
    return {boss: false, fragments: 0, gold: 0};
  }
  if (run.cleared >= rules.end) throw Error('Map endpoint reached');
  run.cleared++; run.totalForward = (run.totalForward || 0) + 1;
  if (run.plan && run.cleared === run.plan.target && run.plan.count === 10 && run.cleared - run.plan.start === 10) run.tenSteps = (run.tenSteps || 0) + 1;
  if (run.cleared === rules.storyAt && !run.npcSeen) { run.npcSeen = true; run.npcPending = true; }

  const boss = run.cleared % 5 === 0, depth = Math.floor((run.cleared - 1) / 30);
  run.lastGold = Math.round((boss ? 26 : 6) * (1 + depth * .3)); run.gold += run.lastGold;
  run.lastFragments = boss ? 1 + Math.floor(run.cleared / 30) : 0; run.fragments += run.lastFragments;
  if (boss && run.research >= 1) run.shards[run.pointId] = (run.shards[run.pointId] || 0) + (run.research >= 2 ? 2 : 1);
  return {boss, fragments: run.lastFragments, gold: run.lastGold};
}
export function collectLoot(run, items, boss, rng = Math.random) {
  if (run.direction === 'return' || !boss) return null;
  const pool = Object.values(items).filter(i => i.contentStatus === 'active-v0.1' &&
    (i.availability.includes('boss_drop') || i.availability.includes('field_drop')) && availableItem(run, i) && !i.mapEffect && i.id !== 'antidote_pill');
  if (!pool.length) return null;
  run.pending = fieldItem(pool[Math.floor(rng() * pool.length)].id, items);
  return run.pending;
}
export function recordExploration(world, run) {
  if (run.direction === 'return') return;
  const reached = Math.floor(run.cleared / 5), delta = reached - (run.recorded || 0);
  if (delta <= 0) return;
  run.recorded = reached;
  const p = world.points[run.pointId], before = p.probe;
  p.probe = Math.min(3, p.probe + delta); world.stats.totalProbes += p.probe - before;
}
// Route purchases no longer bypass 100% development.
export function routeOffer() { return null; }
export function buyRoute() { return false; }
export function availableItem(run, i) { return !i.researchMap || (i.researchMap === run.pointId && run.research >= 1); }
export function recipeBonus(world, stat) {
  return Object.entries(fragmentRecipes).reduce((n, [id, r]) => n + (world.recipes?.[id] || 0) * (r[stat] || 0), 0);
}
export function craftRecipe(world, id) {
  const r = fragmentRecipes[id], level = world.recipes?.[id] || 0;
  if (!r || level >= r.cap || world.fragments < r.iron || !Object.entries(r.shards).every(([s, count]) => (world.shardBank?.[s] || 0) >= count)) return false;
  world.fragments -= r.iron;
  for (const [s, count] of Object.entries(r.shards)) world.shardBank[s] -= count;
  (world.recipes ||= {})[id] = level + 1;
  return true;
}
function localDevelopment(world, id) { return (world.development[id] ||= {research: 0, story: 0, npcVisits: 0}); }
export function meetStoryNpc(world, run) {
  if (!run.npcPending) return null;
  run.npcPending = false;
  const d = localDevelopment(world, run.pointId); d.npcVisits++;
  d.story = Math.min(rules.storyCap, d.story + 1);
  const line = notes[run.pointId][Math.min(d.story - 1, notes[run.pointId].length - 1)];
  run.storyMessage = '第 50 步 · 引路人：' + line;
  return run.storyMessage;
}
export function emptyChance(run) {
  const reduction = Math.min(rules.maxEmptyReduction, Math.max(run.inheritedReduction || 0, Math.min(rules.maxTenReduction, (run.tenSteps || 0) * rules.tenStepReduction) * rules.chainMultiplier ** Math.min(10, run.chain || 0)));
  return rules.emptyChance - reduction;
}
export function progressTargets(world, region, run) {
  return adjacentMaps(region, run.pointId).filter(id => !['open', 'passed'].includes(world.points[id].state));
}
export function endpointChance(world, region, run) {
  return progressTargets(world, region, run).length && world.progressDry >= rules.progressPity - 1 ? 0 : emptyChance(run);
}
export function drawEndpoint(world, region, run, rng = Math.random) {
  if (run.direction !== 'outbound' || run.cleared !== rules.end || run.endpointCard) return null;
  const targets = progressTargets(world, region, run), d = localDevelopment(world, run.pointId);
  const weights = {...rules.cardWeights};
  if (!targets.length) { weights.reward += weights.progress; delete weights.progress; }
  if (d.research >= rules.researchCap) { weights.reward += weights.research; delete weights.research; }
  if (d.story >= rules.storyCap) { weights.reward += weights.story; delete weights.story; }
  const chance = emptyChance(run), roll = rng();
  let type = 'empty';
  const pity = targets.length && world.progressDry >= rules.progressPity - 1;
  if (pity) type = 'progress';
  else if (roll >= chance) {
    let value = (roll - chance) / (1 - chance);
    for (const [id, weight] of Object.entries(weights)) { value -= weight; if (value < 1e-9) { type = id; break; } }
  }
  const card = {type, emptyChance: pity ? 0 : chance, pity: !!pity, text: '谢谢惠顾 · 本次空卡'};
  if (type === 'progress') {
    const to = targets.sort((a, b) => (world.points[b].progress || 0) - (world.points[a].progress || 0))[0];
    const p = world.points[to]; p.progress = Math.min(100, (p.progress || 0) + rules.progressPerCard);
    p.earnedProgress = p.progress;
    p.state = p.progress >= 100 ? 'open' : 'developing';
    card.to = to; card.text = region.points.find(p => p.id === to).name + ' 开拓 +' + rules.progressPerCard + '% · ' + p.progress + '%' + (p.progress === 100 ? '，已开放' : '，筹备中');
  }
  if (type === 'research') {
    d.research++; run.research = d.research; (run.researchLevels ||= {})[run.pointId] = d.research;
    card.text = d.research === 1 ? '研发：' + mapDevelopment[run.pointId].name + ' 加入本图商店/掉落；首领开始掉落' + mapDevelopment[run.pointId].shard : '生态研发：' + mapDevelopment[run.pointId].enemy + ' 加入本图；纹片产量翻倍';
  }
  if (type === 'story') { d.story++; card.text = '故事推进：' + notes[run.pointId][Math.min(d.story - 1, notes[run.pointId].length - 1)]; }
  if (type === 'reward') { run.gold += 45; run.fragments += 2; run.shards[run.pointId] = (run.shards[run.pointId] || 0) + 2; card.text = '行旅馈赠：45 钱、2 玄铁、2 ' + mapDevelopment[run.pointId].shard + '（安全返城入库）'; }
  if (targets.length) world.progressDry = type === 'progress' ? 0 : (world.progressDry || 0) + 1;
  run.endpointCard = card;
  return card;
}
export function migrateWorld(saved, region, legacy = null) {
  if (!saved || saved.regionId !== region.regionId || ![2, 3, 35].includes(saved.version)) throw Error('Invalid world');
  const next = structuredClone(saved), oldVersion = saved.version !== 35;
  if (oldVersion) { next.version = 35; delete next.activeRun; }
  next.development ||= {}; next.shardBank ||= {}; next.recipes ||= {}; next.progressDry ||= 0;
  const prior = legacy?.regionId === region.regionId && [2, 3].includes(legacy.version) ? legacy : null;
  const reset = [];
  for (const [id, p] of Object.entries(next.points)) {
    if (['bianjing', 'chenliu'].includes(id)) { p.state = id === 'bianjing' ? 'here' : 'open'; p.progress = 100; continue; }
    // The first 0.35 build incorrectly promoted legacy open states to 100%.
    // A map already open in that source could not have earned development cards in 0.35.
    const inherited = !saved.mapProgressRevision && prior && ['open', 'passed', 'here'].includes(prior.points?.[id]?.state) && !p.earnedProgress;
    const progress = oldVersion || inherited ? 0 : Number.isFinite(p.progress) ? Math.max(0, Math.min(100, p.progress)) : 0;
    if ((oldVersion || inherited) && (p.progress > 0 || ['open', 'passed', 'here'].includes(p.state))) reset.push(id);
    p.progress = progress; p.state = progress >= 100 ? 'open' : progress > 0 ? 'developing' : 'hidden';
  }
  next.mapProgressRevision = 1;
  if (next.activeRun && reset.some(id => next.activeRun.run?.pointId === id || next.activeRun.run?.journey?.some(leg => leg.pointId === id))) delete next.activeRun;
  if (reset.length && next.ui) { next.ui.selected = 'chenliu'; next.ui.result = null; }
  return next;
}
export function settleRun(world, region, run, outcome) {
  if (!['retreat', 'defeat'].includes(outcome)) throw Error('Unknown expedition outcome');
  if (outcome === 'retreat' && !canSettle(run)) throw Error('Must survive the entire return journey');
  const next = structuredClone(world);
  recordExploration(next, run);
  if (outcome === 'retreat') {
    next.fragments += run.fragments;
    for (const [id, count] of Object.entries(run.shards || {})) next.shardBank[id] = (next.shardBank[id] || 0) + count;
  }
  next.stats.runs++; next.gold = rules.startingGold; next.bag = []; delete next.activeRun;
  return next;
}
