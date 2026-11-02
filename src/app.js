import {itemData, region} from './data.js';
import {renderWorldMap} from './world-map.js';
import {catalog, fits, maxHp, createBattle, tick} from './engine.js';
import {elementNames, describe, expeditionRules as rules, mapDevelopment, fragmentRecipes, rumors} from './rules.js';
import {newWorld, upgrades, upgradeCost, forge, defaultBag, beginRun, planAdvance, runEnemies, rewardRun, collectLoot, recordExploration, BAG_SIZE, prepareItems, durabilityFor, fieldItem, packItem, wearEquipment, returnCost, beginReturn, canSettle, passageAt, crossPassage, encounterPosition, returnLeg, settleRun, sellItem, saleValue, fieldCount, itemName, nextMaps, speedCap, endpointChance, drawEndpoint, meetStoryNpc, availableItem, craftRecipe, recipeBonus, migrateWorld} from './expedition.js';
import {itemArt, fighterArt, campArt, enemyItemArt} from './art.js';
import {journeyGoals, tenStepProgress} from './journey-ui.js';
import {setupMobile, gamePoint, isIphoneWeb, installView, installAction, installDialogOpen} from './mobile.js';

setupMobile();

const items = prepareItems(catalog(itemData)), key = 'jx2like.v035.world', app = document.querySelector('#app');
let world = newWorld(region), stage = 'map', run = null, battle = null;
let selected = 'chenliu', chosen = null, stock = [], refreshed = false, notice = '';
let validPermanent = false;
let speed = 1, paused = false, help = false, returnConfirm = false, result = null, seenLog = 0, nextFightAt = 0;
const point = id => region.points.find(p => p.id === id);
const known = id => ['open', 'passed', 'here'].includes(world.points[id]?.state);
const bag = () => run ? run.bag : world.bag;
const editable = () => stage === 'camp';
const esc = s => String(s).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');
const btn = (label, action, disabled = false, cls = '') => `<button class="${cls}" data-action="${action}" ${disabled ? 'disabled' : ''}>${label}</button>`;

try {
  let saved = JSON.parse(localStorage.getItem(key) || 'null');
  let previous = null;
  if (!saved || !saved.mapProgressRevision) {
    try { previous = JSON.parse(localStorage.getItem('jx2like.v03.world') || localStorage.getItem('jx2like.v02.world') || 'null'); } catch { /* A valid 0.35 save can load independently of a damaged legacy key. */ }
  }
  if (!saved) {
    if (previous) {
      saved = migrateWorld(previous, region);
      notice = '已承接旧版库藏与合炼；地图从汴京、陈留重新开拓，旧存档保留。';
    }
  }
  if (saved) {
    if (saved.version !== 35 || saved.regionId !== region.regionId || !Number.isInteger(saved.fragments) || saved.fragments < 0 ||
      !Object.keys(upgrades).every(id => Number.isInteger(saved.upgrades?.[id]) && saved.upgrades[id] >= 0 && saved.upgrades[id] <= upgrades[id].cap) ||
      !region.points.every(p => ['here', 'open', 'passed', 'hidden', 'rumor', 'developing'].includes(saved.points?.[p.id]?.state)) ||
      !Array.isArray(saved.unlocks) || !saved.stats) throw Error('Invalid world');
    world = migrateWorld(saved, region, previous); validPermanent = true;
    if (saved.version === 35 && !saved.mapProgressRevision && Object.keys(world.points).some(id => world.points[id].progress < (saved.points[id]?.progress || 0))) {
      let backedUp = false;
      try { if (!localStorage.getItem('jx2like.v035.before-map-fix')) localStorage.setItem('jx2like.v035.before-map-fix', JSON.stringify(saved)); backedUp = true; } catch { /* Saving the repaired world still follows the normal save path. */ }
      notice = '已修正旧版地图提前开放：仅保留实际刷出的开拓进度，库藏与合炼不变。' + (backedUp ? '修正前记录已留存备份。' : '');
    }
    ({speed = 1, paused = false, selected = 'chenliu', result = null} = world.ui || {});
    if (!point(selected) || (!known(selected) && world.points[selected]?.state !== 'developing')) selected = 'chenliu';
    if (result) stage = 'settlement';
    defaultBag(world, items);
    if (world.activeRun) {
      const active = world.activeRun;
      if (!['camp', 'battle', 'defeat'].includes(active.stage) || !point(active.run?.pointId)?.encounterPools ||
        !Array.isArray(active.run.bag) || !active.run.bag.every(b => items[b.id] && fits(active.run.bag, b, b.x, b.y, items, BAG_SIZE)) ||
        !['outbound', 'return'].includes(active.run.direction) || !Number.isInteger(active.run.returnLeft) || active.run.returnLeft < 0 ||
        !Number.isFinite(active.run.hp) || !Number.isInteger(active.run.cleared) || active.run.cleared < 0 ||
        !Number.isInteger(active.run.fragments) || active.run.fragments < 0 || !Number.isFinite(active.run.gold) || active.run.gold < 0 ||
        !Array.isArray(active.stock) || !active.stock.every(id => id === null || items[id]) ||
        (active.stage !== 'camp' && !active.battle?.enemies?.length) ||
        active.run.cleared > rules.end || !Number.isInteger(active.run.tenSteps) || active.run.tenSteps < 0 ||
        !active.run.bag.every(b => Number.isInteger(b.mergeLevel || 0) && (b.mergeLevel || 0) >= 0 && (b.mergeLevel || 0) <= 3 && (!b.mergeLevel || (Number.isInteger(b.mergeLeft) && b.mergeLeft > 0 && b.mergeLeft <= rules.mergeBattles)))) throw Error('Invalid expedition');
      ({run, battle, stage, stock, refreshed} = active);
      if (battle?.result === 'defeat') stage = 'defeat';
      if (battle?.result === 'victory' && battle.settled === undefined) battle.settled = true;
      selected = run.pointId; speed = Math.min(Math.max(1, speed), speedCap(run));
      seenLog = battle?.logs.length || 0;
    }
  }
} catch {
  world = validPermanent ? world : newWorld(region); delete world.activeRun;
  stage = 'map'; run = null; battle = null; result = null; speed = 1; paused = false; selected = 'chenliu';
  notice = validPermanent ? '本趟记录未能读取，已返城；永久成长与开拓进度仍保留。' : '记录未能读取，已重新整备。';
}
if (!run) world.bag = defaultBag(world, items);

function save() {
  world.ui = {speed, paused, selected, result};
  if (run) world.activeRun = {run, battle, stage, stock, refreshed};
  else delete world.activeRun;
  try { localStorage.setItem(key, JSON.stringify(world)); }
  catch { notice = '暂时无法保存，此页仍可继续游玩。'; }
}
function commit() { save(); render(); }
function notify(s) { notice = s; render(); }
function resale(b) { return saleValue(b, items); }
function generateShop() {
  const pool = Object.values(items).filter(i => i.contentStatus === 'active-v0.1' && i.availability.includes('shop') && availableItem(run, i) && !i.mapEffect && i.id !== 'antidote_pill');
  const pick = list => list[Math.floor(Math.random() * list.length)].id;
  stock = [pick(pool.filter(i => i.kind === 'weapon')), pick(pool.filter(i => ['manual', 'accessory', 'armor', 'talisman'].includes(i.kind))), 'golden_creation_pill'];
  run.purchases = 0;
  refreshed = false;
}
function heading(kicker, title, right = '') {
  return `<div class="section-heading"><div><small>${kicker}</small><h2>${title}</h2></div>${right}</div>`;
}
function mapView() {
  return heading('第一卷 · 山川为引，驿路为脉', '东郊行旅图', btn('汴京 · 百炼坊 ↗', 'forge', false, 'quiet')) +
    renderWorldMap(region, world, selected) +
    `<div class="scene-bottom"><div><span class="eyebrow">行旅所向</span><h3>${point(selected).name}</h3>${selected !== 'bianjing' ? '<small class="map-checkpoints">30/60 · 免费回城与解锁战速　／　50 · 访谈　／　80 · 抽卡</small>' : ''}</div>${btn(selected === 'bianjing' ? '入城整备 →' : known(selected) ? '整装出发 →' : '开拓中 · ' + world.points[selected].progress + '%', selected === 'bianjing' ? 'forge' : 'depart', !known(selected), 'primary')}</div>`;
}
function forgeView() {
  return heading('汴京 · 百炼坊', '积寸铁，淬青锋', btn('返回舆图', 'map', false, 'quiet')) +
    `<div class="forge-intro"><div class="forge-mark">炼</div><div><span class="eyebrow">城中底蕴 · 长久留存</span><h1>把走过的路，<br>炼进下一次出发。</h1><p>玄铁打底，异地纹片组合成配方。</p></div><span class="forge-bank"><b>${world.fragments}</b>库藏残片</span></div>` +
    `<div class="forge-grid">${Object.entries(upgrades).map(([id, d]) => `<article class="forge-card"><div class="forge-icon">${itemArt(items[id === 'edge' ? 'wudang_qingfeng_sword' : 'foundation_charm'])}</div><div><small>起手${id === 'edge' ? '青锋剑' : '护符'}</small><h2>${d.name}</h2><p>${d.description} · 最多 ${d.cap} 层</p><div class="pips" aria-label="已合炼 ${world.upgrades[id]} 层">${Array.from({length: d.cap}, (_, n) => `<i class="${n < world.upgrades[id] ? 'lit' : ''}"></i>`).join('')}</div></div>${btn(world.upgrades[id] === d.cap ? '已炼至上限' : upgradeCost(world, id) + ' 残片 · 合炼', 'upgrade:' + id, world.upgrades[id] >= d.cap || world.fragments < upgradeCost(world, id), 'primary')}</article>`).join('')}</div>` +
    recipeView() + `<div class="scene-bottom"><span class="muted">${world.unlocks.includes('courier') ? '韩小乙的旧信，已妥善收在城中。' : '炉火未熄，江湖尚远。'}</span>${btn('展开舆图 →', 'map')}</div>`;
}
function recipeView() {
  return `<div class="recipe-grid">${Object.entries(fragmentRecipes).map(([id, r]) => {
    const level = world.recipes[id] || 0;
    const enough = level < r.cap && world.fragments >= r.iron && Object.entries(r.shards).every(([s, n]) => (world.shardBank[s] || 0) >= n);
    return `<article><h3>${r.name} · ${level}/${r.cap}</h3><p>${r.description}</p><small>${Object.entries(r.shards).map(([s, n]) => mapDevelopment[s].shard + ' ' + (world.shardBank[s] || 0) + '/' + n).join(' ＋ ')} ＋ ${r.iron} 玄铁</small>${btn(level >= r.cap ? '已圆满' : '合炼配方', 'recipe:' + id, !enough, 'small')}</article>`;
  }).join('')}</div>`;
}
function selectedReplacement() { return bag().find(b => b.uid === chosen && !b.protected); }
function durabilityText(b) {
  const base = b.protected ? '起手 · 可出售 · 回城恢复' : items[b.id].kind === 'weapon' ? '本趟有效 · 基础不磨损' : b.durability === undefined ? '剧情物件' : '耐久 ' + b.durability + ' / ' + b.maxDurability + ' 战';
  return base + (b.mergeLevel ? ' · 增伤 ' + Math.round(rules.mergeBonuses[b.mergeLevel] * 100) + '% / 剩 ' + b.mergeLeft + ' 战' : '');
}
function shopCard(id, n) {
  if (!id) return '<article class="shop-card sold"><span class="sold-mark">讫</span><span>已收入行囊</span></article>';
  const i = items[id], replacement = selectedReplacement();
  return `<article class="shop-card ${i.element}"><div class="card-top"><span>${elementNames[i.element]} · ${i.shape.join('×')}</span><span>${i.kind === 'weapon' ? '同名自动合并' : durabilityFor(i) + ' 战'}</span></div><div class="shop-art">${itemArt(i)}</div><h3>${i.name}</h3><p title="${esc(describe(i))}">${describe(i)}</p><small class="quality">${i.kind === 'weapon' ? (run.bag.some(b => b.id === id && b.protected) ? '合并起手：仅叠层，不变基础伤害' : '基础伤害 ×1.35 · 最多 +3 / 10 战') : '每战耐久 −1 · 耗尽即失'}</small>${btn(i.price + ' 钱 · ' + (i.kind === 'weapon' && run.bag.some(b => b.id === id) ? '合并' : replacement ? '替换所选' : '购入'), 'buy:' + n, run.gold < i.price || run.purchases >= 2 || run.bag.some(b => b.id === id && b.mergeLevel >= 3))}</article>`;
}
function travelView() {
  const goals = journeyGoals(run), progress = tenStepProgress(run);
  const chance = endpointChance(world, region, run), reduction = (rules.emptyChance - chance) * 100;
  const playing = stage === 'battle' && !paused && !battle.result && !help && !installDialogOpen();
  return `<div id="journey-hud" class="journey-hud ${playing ? 'is-playing' : ''}" aria-label="行程目标">` +
    `<div class="journey-summary"><span><b>${run.cleared}</b> / ${rules.end} 步${run.direction === 'return' ? ' · 返航' : ''}</span><span class="combo-count">十步 Combo <b>×${run.tenSteps || 0}</b>${progress ? `<small>本程 ${progress.done}/10</small>` : ''}</span><span class="empty-chance">空卡 <b>${(chance * 100).toFixed(1)}%</b><small>${chance === 0 ? '开拓保底' : '已减 ' + reduction.toFixed(1) + ' 个百分点'}</small></span></div>` +
    `<ol class="journey-goals">${goals.length ? goals.map((g, n) => `<li class="${n === 0 ? 'nearest-goal' : ''}"><span class="goal-step">${run.direction === 'return' ? '归' : g.step}<small>${run.direction === 'return' ? '城' : '步'}</small></span><span><b>${g.label}</b><small>还差 ${g.left} 步</small></span></li>`).join('') : `<li class="nearest-goal"><span class="goal-step">80<small>步</small></span><span><b>${run.endpointCard ? '续行邻图 / 免费回城' : '翻开终点卡'}</b><small>已抵达终点</small></span></li>`}</ol></div>`;
}
function campView() {
  const gate = passageAt(run), replacement = selectedReplacement(), endpoint = run.cleared === rules.end;
  const paths = nextMaps(world, region, run);
  const flavor = run.storyMessage || (run.cleared === 0 ? rumors[run.pointId] : '每 30 步可免费回家，也可继续赶路；解锁的战速保留到本趟结束。');
  return heading(point(run.pointId).name + ' · 驿路整顿', endpoint ? '路尽，翻一张江湖' : '添新物，留归路', btn('换一批 · 12 钱', 'refresh', refreshed || run.gold < rules.refreshCost || run.purchases >= 2, 'quiet')) +
    `<div class="camp-vista">${campArt()}<div><span class="eyebrow">每站至多添置两件 · 同名武器自动合并</span><p>已添置 <b>${run.purchases} / 2</b> 件 · 研发 ${run.research}/2 · 随身纹片 ${Object.values(run.shards).reduce((a,b) => a+b,0)}</p></div><div class="camp-cargo"><small>随身玄铁残片</small><strong>${run.fragments}<em>枚</em></strong><span>安全返城入库</span></div></div>` +
    `<div class="shop-grid">${stock.map(shopCard).join('')}</div>` +
    `<div class="camp-finds">${endpoint ? `<div class="endpoint-card" role="status">${run.endpointCard ? `<small>终点卡 · ${run.endpointCard.pity ? '开拓保底' : '已揭晓'}</small><b>${esc(run.endpointCard.text)}</b>${run.pending ? btn('收取末战遗物', 'loot', false, 'small') + btn('舍弃遗物', 'discardLoot', false, 'quiet small') : ''}` : `<span>终点只抽一次 · 空卡 ${(endpointChance(world, region, run)*100).toFixed(1)}%</span>${btn('翻开终点卡', 'draw', false, 'primary')}`}</div>` : run.pending ? `<div class="loot-choice"><span><small>首领遗物 · ${durabilityText(run.pending)}</small><b>${items[run.pending.id].name}</b></span>${btn(replacement ? '收入 / 合并 / 替换' : '收入 / 合并', 'loot', false, 'small')}${btn('舍弃', 'discardLoot', false, 'quiet small')}</div>` : `<div class="camp-flavour">${esc(flavor)}</div>`}</div>` +
    travelView() + `<div class="scene-bottom camp-actions"><div>${endpoint ? paths.map(id => btn('续行 ' + point(id).name + ' →', 'cross:' + id, false, 'primary')).join('') : btn('前进 5 步', 'advance:5', false, 'primary') + btn('前进 10 步 · 减空卡', 'advance:10')}${speedCap(run) > 1 ? btn(speed + '× 战速', 'campSpeed', false, 'quiet') : ''}${btn(returnCost(run) ? '返航 · ' + returnCost(run) + ' 连战' : '免费回城', 'retreat', endpoint && !gate, 'quiet')}</div></div>`;
}
function backpack() {
  const list = bag(), b = list.find(b => b.uid === chosen), i = b && items[b.id];
  const hp = battle && ['battle', 'defeat'].includes(stage) ? battle.hp : run ? run.hp : maxHp(list, items);
  return `<div class="traveler"><div class="traveler-seal">武</div><div><small>武当 · 道家</small><h3>无名行者</h3></div><span class="traveler-state">${run ? '在途' : '城中'}</span></div><div class="vitals"><span>气血</span><div id="bag-hp">${health(hp, maxHp(list, items))}</div></div>` +
    heading(run ? '随身之物 · 此行有效' : '每次启程 · 重新整备', run ? '此行行囊' : '起手行囊', `<span>5×5 · ${fieldCount({bag: list}, items)} / 6 行装</span>`) +
    `<div class="bag-wrap"><div class="bag-cells">${Array.from({length: BAG_SIZE * BAG_SIZE}, (_, n) => `<button class="bag-cell" data-cell="${n}" aria-label="第${n % BAG_SIZE + 1}列，第${Math.floor(n / BAG_SIZE) + 1}行"></button>`).join('')}</div><div class="bag-items">${list.map(b => `<button data-item="${b.uid}" draggable="${editable()}" class="bag-item ${items[b.id].element}${b.uid === chosen ? ' chosen' : ''}" style="grid-column:${b.x + 1} / span ${items[b.id].shape[0]};grid-row:${b.y + 1} / span ${items[b.id].shape[1]}" title="${esc(itemName(b, items) + '：' + describe(items[b.id]) + durabilityText(b))}" aria-label="${itemName(b, items)}"><i class="cooldown"></i>${itemArt(items[b.id])}<small class="durability ${!b.protected && b.durability <= 2 ? 'low' : ''}">${b.mergeLevel ? '+' + b.mergeLevel + '·' + b.mergeLeft : b.protected || items[b.id].kind === 'weapon' ? '∞' : b.durability ?? '契'}</small><span>${itemName(b, items).replace('武当', '').replace('少林', '').replace('唐门', '')}</span><i class="slot-corner"></i></button>`).join('')}</div></div>` +
    `<div class="item-detail">${i ? `<span class="eyebrow">${elementNames[i.element]} · ${i.shape.join('×')} 格</span><h3>${itemName(b, items)}</h3><p><strong class="durability-detail">${durabilityText(b)}${b.field && i.kind === 'weapon' ? ' · 伤害 ×1.35' : ''}</strong><br>${describe(i)}${b.starter && (world.upgrades.edge || recipeBonus(world, 'edge')) ? ' 起手淬锋 +' + (world.upgrades.edge * 2 + recipeBonus(world, 'edge')) + '。' : ''}</p>${editable() && i.price ? btn('拆售 · ' + resale(b) + ' 钱', 'sell', false, 'quiet small') : ''}` : `<span class="eyebrow">行囊百物，自有章法</span><h3>以物成招</h3><p>${editable() ? '选中旧行装后购入或拾取，可直接替换。相邻物件互相呼应。' : '点选物件，细看其中门道。'}</p>`}</div>` +
    `<div class="bag-foot"><span>城中库藏</span><b>${world.fragments} <small>残片</small></b></div>`;
}
function health(hp, max, cls = '') {
  return `<div class="health ${cls}"><i style="width:${Math.max(0, Math.min(100, hp / max * 100))}%"></i><span>${Math.ceil(hp)} / ${max}</span></div>`;
}
function enemyHtml(e) {
  return `<div class="combatant enemy ${e.hp <= 0 ? 'dead' : ''}" data-actor="enemy-${e.uid}"><div class="actor-label">${e.name} · ${elementNames[e.element] || '无'}${e.attribute === 'yin' ? '·阴' : ''}</div><div data-hp="${e.uid}">${health(e.hp, e.maxHp, 'enemy-hp')}</div>${fighterArt(e)}<span class="satchel enemy-satchel">${e.id === 'oil_thrower' ? '油' : /boar|fox/.test(e.id) ? '牙' : '囊'}</span><div class="npc-slots"><i>${enemyItemArt(e)}</i><i>◇</i></div></div>`;
}
function combatView() {
  const returning = run.direction === 'return', current = battle.round || encounterPosition(run);
  const location = returning ? returnLeg(run).pointId : run.pointId;
  return heading(point(location).name + (returning ? ' · 返航路上' : ' · 深入 ' + current + ' 步'), returning ? '归途连战 · 不可整顿' : current % 5 === 0 ? '拦路的首领' : '驿路交锋', `<span id="clock">${battle.time.toFixed(1)} 秒</span>`) +
    travelView() +
    `<div class="battle-scene"><div class="battle-moon"></div><div class="distant-hills"></div><div class="near-hills"></div><div class="battle-tree"></div><div class="ground"></div><div class="battle-center"><span>交锋</span><i></i></div><div class="combatant player" data-actor="player"><div class="actor-label">无名行者</div><div id="player-hp">${health(battle.hp, battle.maxHp)}</div>${fighterArt()}<span class="satchel">囊</span></div><div class="enemy-line">${battle.enemies.map(enemyHtml).join('')}</div><div id="effects" aria-hidden="true"></div><span class="scene-caption">风起青萍，百物成招。</span></div>` +
    `<div class="battle-strip"><span id="battle-note" role="status">${stage === 'defeat' ? '此行止步，随身残片未能带回。' : battle.result === 'victory' ? '行囊已收妥，继续赶路……' : '行囊中的物件，正蓄势待发。'}</span><span>随身残片 <b>${run.fragments}</b></span></div>` +
    `<div class="scene-bottom"><span class="muted">${stage === 'defeat' ? '败退' : returning ? '返航剩余 ' + run.returnLeft + ' / ' + run.returnTotal + ' 步 · 中途无补给' : '深入 ' + run.cleared + ' 步 · 本程至 ' + run.target + ' 步'}${paused ? ' · 已暂停' : ''}</span><div>${btn(paused ? '继续' : '暂停', 'pause', !!battle.result)}${btn(speed + '×', 'speed', !!battle.result)}${stage === 'defeat' ? btn('返回汴京 →', 'defeat', false, 'primary') : ''}</div></div>`;
}
function settlementView() {
  const safe = result.outcome === 'retreat';
  return heading('汴京 · 城门', safe ? '平安归来' : '风尘落定') +
    `<div class="return-screen"><div class="return-mark">${safe ? '归' : '憩'}</div><span class="eyebrow">${point(result.pointId).name} · 深入 ${result.cleared} 步${result.returnTotal ? ' · 返航 ' + result.returnDone + ' / ' + result.returnTotal + ' 步' : ''}</span><h1>${safe ? '把江湖带回来。' : '人归来，再启程。'}</h1><div class="return-reward"><strong>${result.fragments}</strong><span>枚玄铁残片<br><em>${safe ? '已入城中库藏' : '遗落在来时路上'}</em></span></div><p>纹片 ${Object.entries(result.shards || {}).map(([id, n]) => mapDevelopment[id].shard + ' ×' + n).join('、') || '无'} · ${safe ? '已入库' : '已遗失'}。<br>行囊与盘缠已重新整备。</p>${btn('展开舆图 →', 'map', false, 'primary')}</div>`;
}
function render() {
  const views = {map: mapView, forge: forgeView, camp: campView, battle: combatView, defeat: combatView, settlement: settlementView};
  app.innerHTML = `<div class="game-shell"><header><a class="brand" href="./" aria-label="江湖行囊录">江湖<span>行囊录</span><i>卷一</i></a><nav><span>山河无尽</span><i>／</i>汴京东郊</nav><div class="header-resource"><span>${run ? '此行盘缠' : '城中库藏'}</span><b>${run ? run.gold : world.fragments}</b><small>${run ? '铜钱' : '残片'}</small></div>${btn('行旅手记', 'help', false, 'quiet')}</header><main class="layout"><section class="main-panel ${stage}-panel">${(views[stage] || mapView)()}</section><aside>${backpack()}</aside></main><footer><span>江湖行囊录 <i>·</i> 可玩原型 0.38</span><span>${run ? '一程山水，一程取舍' : '山川不语，行者自知'}</span><span class="save-state">本地记行 <i></i></span></footer></div>` +
    (notice ? `<div class="notice" role="status">${esc(notice)}${btn('×', 'dismiss', false, 'quiet')}</div>` : '') +
    (help ? `<div class="dialog-shade"><dialog aria-label="行旅手记"><span class="eyebrow">只在翻开时，诉说江湖的规矩</span><h2>行旅手记</h2><p>每图 80 步终点。30/60 步可免费回城；每累计前进 30 步解锁 +1× 战速，上限 4×，本趟保留。50 步会见引路人推进故事。普通位置返航仍须沿路连续战斗，无补给/回复/收益。</p><p>5×5 行囊，起手之外最多 6 件。同名武器购入或拾取自动合并：+1/+2/+3 伤害提高 25%/45%/60%，首次合并起限 10 场，继续合并不续期，到期保留基础武器。途中武器基础伤害 ×1.35，本趟不磨损；其他药械每战扣 1 耐久，耗尽消失。起手无限装备可以出售，回城恢复默认。</p><p>终点只翻一张卡：空卡基础 40%；非空中开拓/研发/故事/奖励权重 40/30/15/15%。完整走完一次 10 步，空卡减 1 个百分点，本图最多减 8。抽完后可免费回城，或续行已开放相邻地图；续行使下一图减免 ×1.3，逐图累计，最多减 16 个百分点，空卡最低 24%。跨图保留上一图减免 ×1.3；本图 10 步次数重新积累，与继承减免取较高值，不相加。</p><p>开拓卡给相邻未开放地区 +25%，优先已积累进度的地区；100% 才可进入。连续 3 次终点没开拓卡，下一次必得开拓卡（有可开拓邻图时）。研发一级开本图新武器与首领纹片；二级开新敌人、纹片翻倍。已满研发/故事或没有可开拓邻图，对应权重转奖励。</p><p>纹片须安全带回，和不同地区纹片及玄铁组合成永久配方；死亡遗失随身材料，已取得的开图/研发/剧情保留。百炼坊展示配方成本及上限。培元每层 +4 气血（2/3/4/5/6 玄铁）；淬锋每层 +2 起手剑伤（3/4/5 玄铁）。</p><p>每 5 步首领，掉玄铁和一件待选遗物。每战限 30 秒，超时判负；前进胜场回 6，整顿回 12。每站三个货位、最多买两件，刷新一次 12 钱。五行金克木、木克土、土克水、水克火、火克金：克制 ×1.2，受克 ×0.85。</p><p class="muted">0.35 保留旧版库藏与合炼，旧版开图不折算开拓进度；起始仅显示汴京和陈留。旧远征保留在原键。刷新保留本趟、暂停、战速与结算。</p>${btn('合上手记', 'closeHelp', false, 'primary')}</dialog></div>` : '') +
    (returnConfirm ? `<div class="dialog-shade"><dialog aria-label="返航确认"><span class="eyebrow">返程也是行程</span><h2>连续打回 ${returnCost(run)} 步</h2><p>途中不能整顿或购物，药械继续磨损。随身 ${run.fragments} 枚残片，只有活着到城门才入库。</p><p>当前气血 ${Math.ceil(run.hp)}，低耐久行装 ${run.bag.filter(b => !b.protected && b.durability <= 2).length} 件。仅在各图 30/60/80 步可直接回城。</p>${btn('启程返航 · ' + returnCost(run) + ' 连战', 'confirmReturn', false, 'primary')}${btn('再整备一下', 'cancelReturn', false, 'quiet')}</dialog></div>` : '') +
    '<div class="orientation-note"><span>江湖行囊录</span><strong>横过屏幕，再行江湖。</strong><p>此处的行囊和战场，需并肩铺开。</p></div>' + installView();
  if (isIphoneWeb()) document.querySelector('header').insertAdjacentHTML('beforeend', '<button class="quiet install-trigger" data-install="show">装到桌面</button>');
  if (installDialogOpen()) document.querySelector('.install-guide')?.focus();
  if (help || returnConfirm) document.querySelector('dialog').showModal();
  updateCooldowns();
}
function startBattle() {
  stage = 'battle'; nextFightAt = 0;
  battle = createBattle(run.bag, items, runEnemies(region, run), run.hp, {pointId: run.pointId, foundationEdge: world.upgrades.edge * 2 + recipeBonus(world, 'edge')});
  battle.round = encounterPosition(run); battle.settled = false;
  seenLog = 0;
  commit();
}
function finishBattle() {
  run.hp = battle.hp;
  battle.settled = true; nextFightAt = performance.now() + 1000;
  const broken = wearEquipment(run, items);
  if (broken.length) notice = broken.length + ' 件行装耐久耗尽。';
  if (battle.result === 'defeat') { save(); return; }
  const reward = rewardRun(run);
  if (run.direction === 'outbound') run.hp = Math.min(maxHp(run.bag, items), run.hp + rules.winHeal);
  collectLoot(run, items, reward.boss);
  recordExploration(world, run);
  const hud = document.querySelector('#journey-hud');
  if (hud) hud.outerHTML = travelView();
  // Keep the last throw visible. The saved settled flag prevents duplicate rewards.
  save();
}
function settle(outcome) {
  result = {shards: structuredClone(run.shards), outcome, pointId: run.pointId, cleared: run.cleared, fragments: run.fragments, returnTotal: run.returnTotal, returnDone: run.returnTotal - run.returnLeft};
  world = settleRun(world, region, run, outcome);
  world.bag = defaultBag(world, items);
  run = null; battle = null; chosen = null; returnConfirm = false; speed = 1; paused = false; stage = 'settlement'; commit();
}
app.addEventListener('click', e => {
  if (installAction(e.target.closest('[data-install]')?.dataset.install)) { render(); return; }
  const action = e.target.closest('[data-action]')?.dataset.action;
  const item = e.target.closest('[data-item]');
  if (item) { chosen = item.dataset.item; render(); return; }
  const cell = e.target.closest('[data-cell]');
  if (cell && chosen && editable()) {
    const b = bag().find(b => b.uid === chosen), n = +cell.dataset.cell;
    if (b && fits(bag(), b, n % BAG_SIZE, Math.floor(n / BAG_SIZE), items, BAG_SIZE)) { b.x = n % BAG_SIZE; b.y = Math.floor(n / BAG_SIZE); commit(); }
    else notify('这里放不下。');
    return;
  }
  if (!action) return;
  const [type, value] = action.split(':'); notice = '';
  if (type === 'select' && stage === 'map' && (known(value) || world.points[value]?.state === 'developing')) { selected = value; commit(); }
  if (type === 'map' && !run) { stage = 'map'; result = null; commit(); }
  if (type === 'forge' && !run) { stage = 'forge'; result = null; commit(); }
  if (type === 'upgrade' && stage === 'forge' && forge(world, value)) { world.bag = defaultBag(world, items); chosen = null; commit(); }
  if (type === 'depart' && stage === 'map' && selected !== 'bianjing' && known(selected)) {
    result = null; speed = 1; paused = false; run = beginRun(world, selected, items); stage = 'camp'; generateShop(); chosen = null; commit();
  }
  if (type === 'recipe' && stage === 'forge' && craftRecipe(world, value)) { world.bag = defaultBag(world, items); chosen = null; commit(); }
  if (type === 'draw' && stage === 'camp' && drawEndpoint(world, region, run)) { notice = run.endpointCard.text; commit(); }
  if (type === 'advance' && stage === 'camp' && planAdvance(run, +value)) startBattle();
  if (type === 'buy' && stage === 'camp') {
    const id = stock[+value];
    if (!id || run.gold < items[id].price) return;
    if (run.purchases >= 2) return;
    const entry = fieldItem(id, items);
    if (!packItem(run, entry, items, selectedReplacement()?.uid)) return notify('强化已达 +3，或空间/行装额度不足；可选旧行装替换。');
    run.purchases++; chosen = null;
    run.gold -= items[id].price; stock[+value] = null; commit();
  }
  if (type === 'sell' && editable() && sellItem(run, chosen, items)) { chosen = null; commit(); }
  if (type === 'refresh' && stage === 'camp' && !refreshed && run.gold >= rules.refreshCost && run.purchases < 2) { const bought = run.purchases; run.gold -= rules.refreshCost; generateShop(); run.purchases = bought; refreshed = true; commit(); }
  if (type === 'loot' && stage === 'camp' && run.pending) {
    if (!packItem(run, {...run.pending}, items, selectedReplacement()?.uid)) return notify('选中一件旧行装后，可用遗物替换。');
    run.pending = null; chosen = null; commit();
  }
  if (type === 'discardLoot' && stage === 'camp') { run.pending = null; commit(); }
  if (type === 'cross' && stage === 'camp' && crossPassage(world, run, items, region, value)) { selected = run.pointId; generateShop(); chosen = null; commit(); }
  if (type === 'retreat' && stage === 'camp' && (run.cleared !== rules.end || run.endpointCard)) {
    if (returnCost(run) === 0) { beginReturn(run); settle('retreat'); }
    else { returnConfirm = true; render(); }
  }
  if (type === 'confirmReturn' && stage === 'camp' && returnConfirm) { returnConfirm = false; beginReturn(run); startBattle(); }
  if (type === 'cancelReturn') { returnConfirm = false; render(); }
  if (type === 'defeat' && stage === 'defeat') settle('defeat');
  if (type === 'pause' && stage === 'battle' && !battle.result) { paused = !paused; commit(); }
  if (type === 'campSpeed' && stage === 'camp') { speed = speed >= speedCap(run) ? 1 : speed + 1; commit(); }
  if (type === 'speed' && stage === 'battle' && !battle.result) { speed = speed >= speedCap(run) ? 1 : speed + 1; commit(); }
  if (type === 'help') { help = true; render(); }
  if (type === 'closeHelp') { help = false; render(); }
  if (type === 'dismiss') { notice = ''; render(); }
});
app.addEventListener('dragstart', e => {
  const el = e.target.closest('[data-item]');
  if (!el || !editable()) { e.preventDefault(); return; }
  e.dataTransfer.setData('text/plain', el.dataset.item);
});
app.addEventListener('dragover', e => { if (e.target.closest('.bag-wrap') && editable()) e.preventDefault(); });
app.addEventListener('drop', e => {
  const wrap = e.target.closest('.bag-wrap');
  if (!wrap || !editable()) return;
  e.preventDefault();
  const r = wrap.getBoundingClientRect(), rotated = document.documentElement.classList.contains('rotated-game');
  const origin = gamePoint(rotated ? r.right : r.left, r.top), cursor = gamePoint(e.clientX, e.clientY);
  const x = Math.floor((cursor.x - origin.x) / (rotated ? r.height : r.width) * BAG_SIZE), y = Math.floor((cursor.y - origin.y) / (rotated ? r.width : r.height) * BAG_SIZE);
  const b = bag().find(b => b.uid === e.dataTransfer.getData('text/plain'));
  if (b && fits(bag(), b, x, y, items, BAG_SIZE)) { b.x = x; b.y = y; commit(); }
  else notify('这里放不下。');
});
document.addEventListener('keydown', e => {
  if (installDialogOpen() && e.key === 'Tab') {
    const buttons = [...document.querySelectorAll('.install-guide button')];
    if (e.shiftKey && (document.activeElement === buttons[0] || document.activeElement.classList.contains('install-guide'))) { e.preventDefault(); buttons.at(-1).focus(); }
    else if (!e.shiftKey && document.activeElement === buttons.at(-1)) { e.preventDefault(); buttons[0].focus(); }
    return;
  }
  if (e.key === 'Escape' && installDialogOpen()) { e.preventDefault(); installAction('close'); render(); document.querySelector('.install-trigger')?.focus(); return; }
  if (e.key === 'Escape') { e.preventDefault(); help = false; returnConfirm = false; chosen = null; notice = ''; render(); }
  if (e.code === 'Space' && stage === 'battle' && !battle.result && !help && e.target === document.body) { e.preventDefault(); paused = !paused; commit(); }
});
function updateCooldowns() {
  if (!['battle', 'defeat'].includes(stage) || !battle) return;
  for (const i of battle.items) {
    const el = document.querySelector(`[data-item="${i.uid}"]`);
    if (!el) continue;
    el.classList.toggle('spent', i.used);
    el.style.setProperty('--cooldown', i.cooldown ? Math.max(0, Math.min(1, (i.next - battle.time) / i.cooldown)) : 0);
  }
}
function playAnimation(el, frames, options, remove = false) {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) options = {...options, duration: 100, delay: 0};
  el.animate(frames, options).finished.then(() => { if (remove) el.remove(); }).catch(() => {});
}
function animateEvents() {
  const layer = document.querySelector('#effects');
  if (!layer) return;
  for (const log of battle.logs.slice(seenLog)) {
    const attack = log.move === '敌袭', self = !attack && log.target === '自身', enemyBuff = log.move === '黑印压制';
    const from = document.querySelector(`[data-actor="${attack || enemyBuff ? 'enemy-' + log.sourceUid : 'player'}"]`);
    const to = document.querySelector(`[data-actor="${attack || self ? 'player' : 'enemy-' + log.targetUid}"]`);
    if (!from || !to) continue;
    const r = layer.getBoundingClientRect(), a = from.getBoundingClientRect(), b = to.getBoundingClientRect();
    const rotated = document.documentElement.classList.contains('rotated-game');
    const center = rect => gamePoint(rect.left + rect.width / 2, rect.top + rect.height / 2);
    const origin = gamePoint(rotated ? r.right : r.left, r.top), start = center(a), end = center(b);
    const sourceItem = battle.items.find(i => i.uid === log.sourceUid)?.def;
    const element = ['metal', 'wood', 'water', 'fire', 'earth'].includes(log.element) ? log.element : 'none';
    const colors = {metal: '#ffe096', wood: '#93eaa1', water: '#80dfff', fire: '#ff9a70', earth: '#d9b183', none: '#e6d8b5'};
    const color = colors[element];
    const el = document.createElement('span');
    el.className = 'projectile element-' + element + ' ' + (self || enemyBuff ? 'boon' : attack ? 'hostile' : '');
    el.style.setProperty('--hit-color', color);
    el.innerHTML = attack ? enemyItemArt(battle.enemies.find(e => e.uid === log.sourceUid)) : sourceItem ? itemArt(sourceItem) : '<span>印</span>';
    const x = start.x - origin.x, y = start.y - origin.y;
    const tx = end.x - origin.x, ty = end.y - origin.y;
    el.style.left = x + 'px'; el.style.top = y + 'px'; layer.append(el);
    playAnimation(el, [{transform: 'translate(0,0) rotate(0deg)', opacity: 1}, {transform: `translate(${(tx - x) / 2}px,${(ty - y) / 2 - (self ? 95 : 65)}px) rotate(160deg)`, opacity: 1, offset: .5}, {transform: `translate(${tx - x}px,${ty - y}px) rotate(320deg)`, opacity: .2}], {duration: 600 / speed, easing: 'ease-in'}, true);
    const flash = document.createElement('span');
    flash.className = 'floating-number ' + (self || enemyBuff ? 'heal' : '');
    if (!self && !enemyBuff) flash.style.color = color;
    flash.textContent = log.move === '闪避' ? '闪避' : log.move === '护持' ? (log.result ? '护盾 +' + log.result : '护持') : log.move === '命中' ? '施毒' : (self || enemyBuff ? '+' : '−') + log.result;
    to.append(flash);
    playAnimation(flash, [{transform: 'translateY(0)', opacity: 0}, {transform: 'translateY(-10px)', opacity: 1, offset: .2}, {transform: 'translateY(-48px)', opacity: 0}], {duration: 1100 / speed, delay: 550 / speed}, true);
    const slot = attack ? from.querySelector('.npc-slots i') : document.querySelector(`[data-item="${log.sourceUid}"]`);
    if (slot) playAnimation(slot, [{filter: 'brightness(2.4)', boxShadow: '0 0 20px #d9c48c', transform: 'scale(1.06)'}, {filter: 'brightness(1)', boxShadow: 'none', transform: 'scale(1)'}], {duration: 650 / speed});
    const art = to.querySelector('.fighter-art');
    if (art) playAnimation(art, [{filter: `brightness(1.6) sepia(.5) drop-shadow(0 0 14px ${self || enemyBuff ? '#99d5ad' : color})`, translate: '4px 0'}, {filter: 'none', translate: '0 0'}], {duration: 400 / speed, delay: 550 / speed});
    if (!self && !enemyBuff) {
      const impact = document.createElement('span');
      impact.className = 'element-impact element-' + element;
      impact.style.setProperty('--hit-color', color);
      impact.innerHTML = `<i></i><i></i><i></i><i></i><b>${element === 'none' ? '击' : elementNames[element]}</b>`;
      to.append(impact);
      playAnimation(impact, [{opacity: 0, transform: 'scale(.3) rotate(-15deg)'}, {opacity: 1, transform: 'scale(1) rotate(0)', offset: .25}, {opacity: 0, transform: 'scale(1.45) rotate(15deg)'}], {duration: 650 / speed, delay: 550 / speed}, true);
    }
    document.querySelector('#battle-note').textContent = log.item + ' · ' + (log.move === '敌袭' ? '掷来一击 ' : log.move === '治疗' ? '回复 ' : self ? log.move + ' ' : '命中 ') + (log.result || '');
  }
  seenLog = battle.logs.length;
}
setInterval(() => {
  if (stage !== 'battle' || paused || help || returnConfirm || installDialogOpen() || document.hidden) return;
  if (battle.result) {
    if (!battle.settled) finishBattle();
    if (!nextFightAt) nextFightAt = performance.now() + 1000;
    if (performance.now() >= nextFightAt) {
      if (battle.result === 'defeat') { stage = 'defeat'; commit(); }
      else if (canSettle(run)) settle('retreat');
      else if (run.direction === 'outbound' && run.cleared >= run.target) {
        stage = 'camp'; run.hp = Math.min(maxHp(run.bag, items), run.hp + rules.campHeal);
        meetStoryNpc(world, run);
        generateShop(); chosen = null; commit();
      } else startBattle();
    }
    return;
  }
  for (let n = 0; n < speed && !battle.result; n++) tick(battle, .1, items, region);
  const line = document.querySelector('.enemy-line');
  for (const e of battle.enemies) if (!document.querySelector(`[data-actor="enemy-${e.uid}"]`)) line.insertAdjacentHTML('beforeend', enemyHtml(e));
  document.querySelector('#player-hp').innerHTML = health(battle.hp, battle.maxHp);
  document.querySelector('#bag-hp').innerHTML = health(battle.hp, battle.maxHp);
  for (const e of battle.enemies) {
    document.querySelector(`[data-hp="${e.uid}"]`).innerHTML = health(e.hp, e.maxHp, 'enemy-hp');
    document.querySelector(`[data-actor="enemy-${e.uid}"]`).classList.toggle('dead', e.hp <= 0);
  }
  document.querySelector('#clock').textContent = battle.time.toFixed(1) + ' 秒';
  animateEvents(); updateCooldowns();
  if (battle.result) finishBattle();
  else if (Math.round(battle.time * 10) % 10 === 0) save();
}, 100);
window.addEventListener('pagehide', save);
render(); save();
