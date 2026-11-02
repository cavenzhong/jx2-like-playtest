// 矢量地形和可交互地标；复用已有存档与揭幕规则。
const locations={bianjing:[23,73,'city'],chenliu:[44,51,'inn'],yezhulin:[43,25,'forest'],pomiao:[15,26,'temple'],zhuxian:[67,72,'village'],hedu:[81,89,'dock'],heifengzhai:[80,36,'fort']};
const paths={
 'bianjing-chenliu':'M221 453 C235 401 353 391 422 316',
 'chenliu-yezhulin':'M422 316 C464 274 375 219 413 155',
 'yezhulin-pomiao':'M413 155 C326 177 227 126 144 161',
 'chenliu-zhuxian':'M422 316 C505 330 568 425 643 446',
 'zhuxian-hedu':'M643 446 C711 453 708 527 778 552',
 'chenliu-heifengzhai':'M422 316 C544 337 635 237 768 223'
};
const definitions='<defs>'+
 '<linearGradient id="land" x2=".7" y2="1"><stop stop-color="#e8dcb8"/><stop offset=".55" stop-color="#d8d1a7"/><stop offset="1" stop-color="#c9c69a"/></linearGradient>'+
 '<linearGradient id="water"><stop stop-color="#789f9a"/><stop offset=".6" stop-color="#95b2a4"/><stop offset="1" stop-color="#71968c"/></linearGradient>'+
 '<linearGradient id="hill" x2=".3" y2="1"><stop stop-color="#718572"/><stop offset="1" stop-color="#a9b092" stop-opacity=".1"/></linearGradient>'+
 '<filter id="paper-grain"><feTurbulence type="fractalNoise" baseFrequency=".65" numOctaves="3" stitchTiles="stitch"/><feColorMatrix type="saturate" values="0"/><feComponentTransfer><feFuncA type="linear" slope=".09"/></feComponentTransfer><feBlend in="SourceGraphic" mode="multiply"/></filter>'+
 '<symbol id="pine" viewBox="0 0 30 45"><path d="M15 1 4 18h6L1 31h11v11h5V31h12L20 18h6Z" fill="#6d8066"/><path d="m15 5 1 34M15 17l-6 7m6-1 7 5" stroke="#475e4f" stroke-width="1.2" fill="none"/></symbol>'+
 '<symbol id="city" viewBox="0 0 100 90"><path d="m8 69 40 16 44-19V40L48 23 8 41Z" fill="#ae9b72" stroke="#5b6048" stroke-width="2"/><path d="m8 48 40 16 44-19M48 64v21M16 42v-8m11 13v-9m42 9v-9m12 4v-9" fill="none" stroke="#5e654b" stroke-width="3"/><path d="M38 65q10-14 20-1v17l-20-1Z" fill="#4b5844"/><path d="M33 45V26h30v18M45 27V12h8v15" fill="#c0ab7d" stroke="#606348" stroke-width="2"/><path d="m25 28 23-14 24 14-10 5-28-1ZM35 12 49 4l15 9-13 4Z" fill="#566b58" stroke="#455543" stroke-width="2"/><path d="m1 40 12-8 24 12-10 7Zm67 4 18-12 13 8-17 11Z" fill="#697b5c" stroke="#4c604c" stroke-width="2"/></symbol>'+
 '<symbol id="inn" viewBox="0 0 100 90"><path d="m17 43 34-14 31 14v31L50 86 17 73Z" fill="#b6a67b" stroke="#625f45" stroke-width="2"/><path d="M50 52v34M23 59l14 5V49m28 12 12-5v13l-12 5ZM42 68v15" fill="none" stroke="#6a6247" stroke-width="3"/><path d="m8 42 40-27 44 26-39 18Z" fill="#6e7960" stroke="#4d604e" stroke-width="2"/><path d="m48 15 5 43M16 42l35-19 32 18" stroke="#9ca184" fill="none"/><path d="M85 22v61m0-54h13v24H85" fill="#aa6245" stroke="#665b40" stroke-width="2"/></symbol>'+
 '<symbol id="forest" viewBox="0 0 100 90"><ellipse cx="51" cy="74" rx="41" ry="12" fill="#8f9d74" opacity=".5"/><use href="#pine" x="8" y="24" width="35" height="53"/><use href="#pine" x="28" y="3" width="42" height="65"/><use href="#pine" x="54" y="24" width="38" height="58"/><path d="m38 84 15-15-1-12" fill="none" stroke="#bbaa7a" stroke-width="5"/></symbol>'+
 '<symbol id="temple" viewBox="0 0 100 90"><path d="m19 48 32-13 30 13v26L49 86 19 73Z" fill="#b3a17a" stroke="#726447" stroke-width="2"/><path d="M49 56v28m-23-28v18m45-21v21M40 75V60l9-3" fill="none" stroke="#695b40" stroke-width="3"/><path d="m5 43 15-3 30-24 29 23 16 5-44 17Z" fill="#65705b" stroke="#4d5b48" stroke-width="2"/><path d="m26 28 26 9 19-8M50 17l1 43" fill="none" stroke="#a7a483"/><path d="m8 73-4 8m81-6 9 9" stroke="#7b8965" stroke-width="4"/></symbol>'+
 '<symbol id="village" viewBox="0 0 100 90"><use href="#inn" x="0" y="21" width="62" height="60"/><use href="#inn" x="44" y="6" width="52" height="58"/><path d="m53 78 26 8 16-7-24-9Z" fill="#927b53"/><path d="m55 73 25 8 13-5-24-9Z" fill="#b58c62" stroke="#786347"/></symbol>'+
 '<symbol id="dock" viewBox="0 0 100 90"><path d="m14 63 53 12 21-11-53-12Z" fill="#aa8c60" stroke="#6a654b" stroke-width="2"/><path d="m24 58 53 12m-43-16 52 12M21 65v14m48-5v11" stroke="#655e42" stroke-width="2"/><path d="m35 42 47 9-11 12-38-9Z" fill="#6b7052" stroke="#4f5c48" stroke-width="2"/><path d="M55 49V8L29 38Z" fill="#ddd0a7" stroke="#756e4e" stroke-width="2"/><path d="m7 84 21 3m55-1 14-4" stroke="#638b85" stroke-width="2"/></symbol>'+
 '<symbol id="fort" viewBox="0 0 100 90"><path d="m8 76 12-43 19 7 8-19 18 17 16-4 13 42-41 13Z" fill="#7c8060" stroke="#5b624d" stroke-width="2"/><path d="m22 63 31-14 29 13v18L53 91 22 79Z" fill="#93845d" stroke="#5c5840" stroke-width="2"/><path d="M46 88V70q8-13 15-1v17M27 61V49m9 8V44m34 11V43m9 15V47" fill="none" stroke="#5a5541" stroke-width="4"/><path d="m39 49 14-17 17 16-16 7Z" fill="#5c634c" stroke="#454e3b" stroke-width="2"/><path d="M53 32V4m0 1 22 4-7 7-15-3" stroke="#584d3b" stroke-width="2" fill="#8c5141"/></symbol></defs>';
function ridge(x,y,s){return '<g transform="translate('+x+' '+y+') scale('+s+')"><path d="M-65 80-34 18-18 40 15-42 48 13 62-1 110 80Z" fill="url(#hill)"/><path d="m-65 80 31-62 16 22 33-82 33 55 14-14 48 81M15-42 7 18l21-9 9 29m-71-20 4 31-13 20" fill="none" stroke="#71816a" stroke-width="1.5" opacity=".65"/></g>';}
function terrain(){
 const trees=[[305,124,.8],[351,105,.9],[460,123,.7],[477,170,.8],[340,208,.6],[377,213,.8],[95,320,.8],[131,344,.7],[79,374,.6],[841,274,.7],[865,303,.6],[850,480,.5],[875,467,.6],[542,392,.5],[566,405,.4]];
 return '<svg class="terrain-art" viewBox="0 0 960 620" preserveAspectRatio="none" aria-hidden="true">'+definitions+
 '<rect width="960" height="620" fill="url(#land)"/>'+
 '<g fill="none" stroke="#a9ae83" opacity=".3"><path d="M-40 177Q183-80 343 88T691 128T1030 47M-30 193Q180-60 342 107T692 146T1040 63M-30 210Q180-43 340 125T694 162T1040 81M70 620Q190 400 412 415T1020 349M45 620Q190 380 412 396T1020 331M25 620Q190 360 412 377T1020 314"/></g>'+
 '<path d="M0 448C120 412 181 529 330 531S517 486 646 505 790 570 960 487L960 559C804 630 729 576 634 562S438 605 310 590 110 484 0 505Z" fill="#b6ba91"/>'+
 '<path d="M-20 448C110 422 183 547 330 548S527 500 654 521 793 589 980 500L980 544C808 622 736 563 642 547S435 595 316 571 101 471-20 490Z" fill="url(#water)"/>'+
 '<g fill="none" stroke="#d4dfc3" opacity=".65"><path d="M0 463C110 442 187 562 329 561S506 512 615 531M668 541q98 49 194 14M724 564q92 29 169-13M103 482l38 22m52 31 35 12m130 22 47-5m87-21 36-9"/></g>'+
 '<g fill="#9da77c" opacity=".3"><ellipse cx="399" cy="186" rx="126" ry="85"/><ellipse cx="120" cy="353" rx="82" ry="100"/><ellipse cx="830" cy="245" rx="100" ry="120"/></g>'+
 ridge(60,62,.85)+ridge(181,23,1.1)+ridge(296,38,.65)+ridge(692,64,.8)+ridge(805,90,1.15)+ridge(910,148,.9)+
 '<g opacity=".62">'+trees.map(([x,y,s])=>'<use href="#pine" x="'+x+'" y="'+y+'" width="'+30*s+'" height="'+45*s+'"/>').join('')+'</g>'+
 '<g stroke="#87916a" fill="none" opacity=".4"><path d="m272 352 54-12 15 37-52 10Zm-25 52 49-11 8 27-44 12m231-91 52 10-4 31-60-7m12-24 45 7m-277-1 7 30m9-32 7 29M543 453l45-9 10 33-47 8m-3-22 44-9"/></g>'+
 '<g fill="#e9e2c6" opacity=".3"><ellipse cx="540" cy="150" rx="145" ry="35"/><ellipse cx="202" cy="304" rx="137" ry="37"/></g>'+
 '<rect width="960" height="620" fill="transparent" filter="url(#paper-grain)"/></svg>';
}
export function renderWorldMap(region,world,selected){
 const open=id=>['here','open','passed'].includes(world.points[id]?.state)&&world.points[id].progress>=100;
 const roads=region.roads;
 const visible=region.points.filter(p=>open(p.id)||world.points[p.id]?.state==='developing'&&world.points[p.id].progress>0);
 const tracks=roads.filter(([a,b])=>open(a)&&open(b)).map(([a,b])=>'<path class="route-shadow" d="'+paths[a+'-'+b]+'"/><path class="route-track" d="'+paths[a+'-'+b]+'"/>').join('');
 const nodes=visible.map(p=>{
  const [x,y,icon]=locations[p.id];
  return '<button class="landmark'+(selected===p.id?' is-selected':'')+'" style="--x:'+x+'%;--y:'+y+'%" data-action="select:'+p.id+'" aria-label="'+p.name+'" aria-pressed="'+(selected===p.id)+'"><span class="landmark-art"><svg viewBox="0 0 100 90" aria-hidden="true"><use href="#'+icon+'"/></svg></span><span class="landmark-name">'+p.name+(world.points[p.id]?.state==='developing'?' · '+world.points[p.id].progress+'%':'')+'</span></button>';
 }).join('');
 return '<div class="illustrated-map" role="group" aria-label="汴京东郊探索地图">'+terrain()+
  '<svg class="route-art" viewBox="0 0 960 620" preserveAspectRatio="none" aria-hidden="true">'+tracks+'</svg>'+
  '<span class="geography mountain-label">太 行 山 脉</span><span class="geography ridge-label">东 岭</span><span class="geography river-label">汴 水</span><span class="geography plain-label">汴 京 平 原</span>'+
  '<div class="map-cartouche"><span>大宋 · 东京道</span><strong>东郊行旅图</strong><small>山川为引，驿路为脉</small></div>'+
  '<div class="map-compass" aria-hidden="true"><span>北</span><svg viewBox="0 0 40 50"><path d="M20 3 30 36 20 29 10 36Z" fill="#647157"/><path d="M20 3v26L10 36Z" fill="#d4c6a0" stroke="#647157"/></svg></div>'+nodes+
  '<div class="map-scale" aria-hidden="true"><span>十里驿路</span><i></i></div></div>'+
  '';
}
