export function setupMobile() {
  const root = document.documentElement;
  const update = () => {
    const width = document.documentElement.clientWidth, height = document.documentElement.clientHeight;
    const compact = Math.min(width, height) <= 500 && Math.max(width, height) <= 1100;
    const rotated = compact && height > width;
    root.classList.toggle('mobile-game', compact);
    root.classList.toggle('rotated-game', rotated);
    root.classList.toggle('short-game', compact && (rotated ? width : height) < 350);
    root.style.setProperty('--game-width', (rotated ? height : width) + 'px');
    root.style.setProperty('--game-height', (rotated ? width : height) + 'px');
  };
  update();
  window.addEventListener('resize', update);
  window.visualViewport?.addEventListener('resize', update);
  // iOS can reject native orientation lock; the rotated layout remains playable.
  const lock = () => screen.orientation?.lock?.('landscape').catch(() => {});
  lock();
  document.addEventListener('pointerup', lock, {once: true});
  if ('serviceWorker' in navigator && location.protocol !== 'file:' && document.querySelector('link[rel="manifest"]')) {
    navigator.serviceWorker.register(new URL('../sw.js', import.meta.url)).catch(() => {});
  }
}

export function gamePoint(x, y) {
  return document.documentElement.classList.contains('rotated-game') ? {x: y, y: document.documentElement.clientWidth - x} : {x, y};
}

let installOpen = false, installDismissed = false;
try { installDismissed = localStorage.getItem('jx2like.install.dismissed') === 'yes'; } catch {}
export function isIphoneWeb() {
  const ios = /iPhone|iPad|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  return ios && !navigator.standalone && !window.matchMedia('(display-mode: standalone)').matches && location.protocol !== 'file:' && !!document.querySelector('link[rel="manifest"]');
}
export function installDialogOpen() { return installOpen; }
export function installAction(action) {
  if (!action) return false;
  if (action === 'show') installOpen = true;
  if (action === 'close' || action === 'dismiss') {
    installOpen = false; installDismissed = true;
    try { localStorage.setItem('jx2like.install.dismissed', 'yes'); } catch {}
  }
  return true;
}
export function installView() {
  if (!isIphoneWeb()) return '';
  if (installOpen) return `<div class="install-shade"><section class="install-guide" role="dialog" aria-modal="true" aria-labelledby="install-title" tabindex="-1"><button class="install-close quiet" data-install="close" aria-label="关闭安装引导">×</button><div class="install-identity"><img src="./icons/icon-180.png" width="60" height="60" alt="江湖行囊录桌面图标"><div><small>为 iPhone 主屏幕而设</small><h2 id="install-title">把江湖放在桌面</h2><p>江湖行囊录 · 横屏全屏游玩</p></div></div><ol><li><b>1</b><span>在 <strong>Safari</strong> 中打开本页，轻点<strong>分享</strong>按钮 <svg viewBox="0 0 24 24" aria-label="分享图标"><path d="M8 5l4-4 4 4M12 1v14M7 9H3v13h18V9h-4"/></svg>。部分布局需先点“更多”。</span></li><li><b>2</b><span>选择<strong>添加到主屏幕</strong>。没有此项时，滑到分享菜单底部“编辑操作”中添加。</span></li><li><b>3</b><span>保留名称<strong>江湖行囊录</strong>；若出现<strong>打开为网页 App</strong>，请开启，然后点“添加”。</span></li></ol><p class="install-footnote">以后点桌面图标即可独立全屏打开，自动横向铺开。首次联网载入后可离线继续；存档保存在当前设备中。</p><button class="primary" data-install="close">知道了，继续游玩</button></section></div>`;
  return installDismissed ? '' : `<div class="install-banner" role="region" aria-label="添加到 iPhone 主屏幕"><img src="./icons/icon-180.png" width="36" height="36" alt=""><span><b>江湖行囊录</b><small>添加到主屏幕，全屏闯江湖</small></span><button data-install="show" class="primary">如何添加</button><button data-install="dismiss" class="quiet" aria-label="暂不显示安装提示">×</button></div>`;
}
