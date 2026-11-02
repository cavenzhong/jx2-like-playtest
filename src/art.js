const svg = (body, viewBox = '0 0 64 64', cls = '') => `<svg class="${cls}" viewBox="${viewBox}" fill="none" aria-hidden="true">${body}</svg>`;
export function itemArt(item) {
  const line = 'stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"';
  let art;
  if (item.id.endsWith('_pen')) art = '<path d="m21 48 21-31 4 3-20 32-8 4Z" fill="#b3c6be"/><path d="m37 22 9 6m-8-12 10 6M18 56l3-8" stroke="#ddbe7e" stroke-width="3"/>';
  else if (item.id.includes('dart')) art = '<path d="m14 49 20-22-4-9 12 4 12-13-5 18 4 10-10-4-25 20Z" fill="#b8c9c3"/><path d="m32 37 9-10" stroke="#657973" stroke-width="3"/>';
  else if (item.id.includes('staff')) art = '<path d="m17 54 30-45" stroke="#a99771" stroke-width="5"/><g stroke="#d8c690" stroke-width="2"><ellipse cx="43" cy="15" rx="7" ry="4" transform="rotate(30 43 15)"/><ellipse cx="38" cy="22" rx="7" ry="4" transform="rotate(30 38 22)"/></g>';
  else if (item.kind === 'weapon') art = '<path d="m25 40 22-29 5-3 1 7-23 30Z" fill="#b7d3cb"/><path d="m24 38 9 8M17 53l9-13" stroke="#d4b67b" stroke-width="4"/><path d="m16 52 4 3" stroke="#657b74" stroke-width="4"/>';
  else if (item.kind === 'manual') art = '<path d="m15 15 30-5 6 38-30 6Z" fill="#475c60" '+line+'/><path d="m22 14 6 38M30 23l12-2m-10 8 8-1m-7 8 9-1" stroke="#c9c6a0" stroke-width="2"/><path d="m15 22 6-1m-4 9 6-1m-5 9 6-1m-5 9 6-1" stroke="#d4bc83" stroke-width="2"/>';
  else if (item.kind.includes('consumable')) art = '<path d="M25 15h14v9q12 6 11 21c-1 12-35 12-36 0q-1-14 11-21Z" fill="#9cbbac" '+line+'/><path d="M24 14h16v7H24Z" fill="#bc8d69"/><path d="m21 32 22-1 2 15-25 1Z" fill="#d6c89a"/><path d="M32 34v10m-5-5h10" stroke="#92604b" stroke-width="2"/>';
  else if (item.kind === 'armor') art = '<path d="m23 12-14 15 8 10 7-6-4 23h26l-5-23 7 6 8-10-15-15-9 8Z" fill="#819f9a" '+line+'/><path d="m24 13 12 18-4 23m-9-15h22" stroke="#d8cda6" stroke-width="2"/>';
  else if (item.id.includes('pouch')) art = '<path d="M23 17h18l-4 9q17 15 12 24c-3 7-31 7-34 0q-5-9 12-24Z" fill="#ad8b67" '+line+'/><path d="M23 26h18M32 34v14m-7-7h14" stroke="#e6d4a2" stroke-width="2"/>';
  else if (item.kind === 'talisman') art = '<path d="m23 9 24 7-11 41-24-7Z" fill="#cab585" '+line+'/><path d="m29 19 8 2-7 7 9 3-12 4 7 8-10 1" stroke="#935843" stroke-width="2"/>';
  else art = '<circle cx="32" cy="32" r="19" fill="#7eaaa0" '+line+'/><path d="M32 13a9.5 9.5 0 0 1 0 19 9.5 9.5 0 0 0 0 19 19 19 0 0 0 0-38Z" fill="#d5ceaa"/><circle cx="32" cy="23" r="3" fill="#496c67"/><circle cx="32" cy="42" r="3" fill="#e2d4a7"/>';
  return svg(art, '0 0 64 64', 'item-art');
}
export function fighterArt(enemy) {
  if (enemy && /boar|fox/.test(enemy.id)) {
    const fox = enemy.id.includes('fox');
    return svg(`<ellipse cx="72" cy="163" rx="57" ry="8" fill="#081316" opacity=".5"/><g fill="${fox ? '#bb8b61' : '#7f7970'}" stroke="#353f3d" stroke-width="2"><path d="m32 126-6 33h13l10-23 35 1 6 23h13l-4-40Z"/><path d="M111 112q-3-39-52-30L24 98 11 120l27 19 64-4Z"/><path d="m39 89-1-21 19 15m-33 23-13-3-6 18 17 7"/><path d="M105 100q38-30 32 9l-13 15-20-7"/></g><circle cx="30" cy="110" r="3" fill="#e6c18b"/><path d="m18 126-1 11 13-6" fill="#e4d3a6"/>`, '0 0 150 180', 'fighter-art beast');
  }
  const foe = !!enemy;
  return svg(`<ellipse cx="64" cy="170" rx="48" ry="7" fill="#081316" opacity=".6"/><path d="m45 120-10 47h21l9-36 13 36h22l-23-53" fill="${foe ? '#3e3234' : '#243b46'}"/><path d="m45 62-23 39 16 9 15-23-15 59 56-5-17-53 20 18 13-13-34-33Z" fill="${foe ? '#9a6b57' : '#69918d'}" stroke="#253a3d" stroke-width="2"/><path d="m55 64 9 54 12-56-10 11Z" fill="#dfd2ac"/><path d="m40 115 45-5" stroke="#c9b57e" stroke-width="6"/><path d="m51 35 1 25 14 11 14-15-2-25" fill="#ccae8c"/><path d="m47 40 3-18 28 1 8 23-19-9-6 11Z" fill="#23323a"/><path d="m55 24 3-13h13l6 14M49 44l-10 40" fill="#23323a"/><path d="m28 97-8 10m78-9 10 9" stroke="#ccae8c" stroke-width="8" stroke-linecap="round"/><path d="m78 82 12 47" stroke="#cbdbc8" stroke-width="4"/><path d="m88 126 6 15" stroke="#bfaa77" stroke-width="4"/><path d="m44 68-9 53 9-5" stroke="${foe ? '#bf8b67' : '#89b5a9'}" stroke-width="2"/>`, '0 0 128 184', 'fighter-art');
}
export function campArt() {
  return svg('<path d="M0 170 120 53l66 60 98-81 140 111 81-73 126 100 95-56 134 56" fill="#304b49"/><path d="M0 200 168 106l110 69 103-65 163 72 95-28 221 46" fill="#233b3b"/><path d="m100 200 82-115 78 115M182 85l18 115" fill="#798177" stroke="#9b9c7b" stroke-width="2"/><path d="m200 200-17-79-33 79" fill="#354847"/><path d="m635 200 15-69 15 69m-30-45h44M650 131v-16h21v16Z" fill="#b5a26e" stroke="#8b815e" stroke-width="2"/><circle cx="661" cy="124" r="18" fill="#e0b868" opacity=".15"/><path d="m491 199 24-20m-29 0 34 20" stroke="#9a7e58" stroke-width="5"/><path d="M499 188q-12-16 2-35 18 20 9 35" fill="#c49a61"/><path d="M498 145q-9-14 4-29m-2-11q-7-10 1-18" stroke="#78928a" opacity=".5" stroke-width="2"/>', '0 0 860 210', 'camp-art');
}

export function enemyItemArt(enemy) {
  if (/boar|fox/.test(enemy.id)) return svg('<path d="M12 49q30-2 37-38 13 40-19 43Z" fill="#dfd4b6" stroke="#8f8c74" stroke-width="2"/>', '0 0 64 64', 'item-art');
  return itemArt({id: enemy.id === 'oil_thrower' ? 'fire_oil' : enemy.id.includes('crossbow') ? 'sleeve_dart' : enemy.attribute === 'yin' ? 'black_talisman' : 'enemy_sword', kind: enemy.id === 'oil_thrower' ? 'consumable' : enemy.attribute === 'yin' ? 'talisman' : 'weapon'});
}
