// 集成验收脚本：console 错误收集 / 整页截图 / 横向溢出检查 / 交互抽查
/* eslint-disable no-console */
const { chromium } = require('playwright');
const path = require('path');

const BASE = 'http://127.0.0.1:7100/';
const SHOT_DIR = path.resolve(__dirname, '..', '..', 'screenshots');

const VIEWPORTS = [
  { name: 'desktop-1920', width: 1920, height: 1080 },
  { name: 'desktop-1440', width: 1440, height: 900 },
  { name: 'tablet-1024', width: 1024, height: 768 },
  { name: 'tablet-768', width: 768, height: 1024 },
  { name: 'mobile-390', width: 390, height: 844 },
  { name: 'mobile-375', width: 375, height: 812 },
];

(async () => {
  // 使用本机已缓存的 Chromium headless shell（版本 1223，避免重复下载）
  const browser = await chromium.launch({
    executablePath:
      'C:\\Users\\33319\\AppData\\Local\\ms-playwright\\chromium_headless_shell-1223\\chrome-headless-shell-win64\\chrome-headless-shell.exe',
  });
  const consoleErrors = [];
  const overflowResults = [];

  for (const vp of VIEWPORTS) {
    const ctx = await browser.newContext({ viewport: { width: vp.width, height: vp.height } });
    const page = await ctx.newPage();
    page.on('console', (msg) => {
      if (msg.type() === 'error') consoleErrors.push(`[${vp.name}] ${msg.text()}`);
    });
    page.on('pageerror', (err) => consoleErrors.push(`[${vp.name}] PAGEERROR: ${err.message}`));

    await page.goto(BASE, { waitUntil: 'networkidle' });
    // 等待地图渲染（canvas 出现或回退 UI）
    await page.waitForTimeout(4000);
    // 滚动整页触发懒加载/动画后回到顶部
    await page.evaluate(async () => {
      await new Promise((resolve) => {
        let y = 0;
        const step = () => {
          y += window.innerHeight;
          window.scrollTo(0, y);
          if (y < document.documentElement.scrollHeight) setTimeout(step, 120);
          else resolve();
        };
        step();
      });
    });
    await page.waitForTimeout(800);
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(500);

    const overflow = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      innerWidth: window.innerWidth,
      ok: document.documentElement.scrollWidth <= window.innerWidth,
    }));
    overflowResults.push({ viewport: `${vp.name} (${vp.width}px)`, ...overflow });

    await page.screenshot({ path: path.join(SHOT_DIR, `${vp.name}.png`), fullPage: true });
    await ctx.close();
  }

  // ===== 交互抽查（桌面视口） =====
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  page.on('console', (msg) => {
    if (msg.type() === 'error') consoleErrors.push(`[interaction] ${msg.text()}`);
  });
  page.on('pageerror', (err) => consoleErrors.push(`[interaction] PAGEERROR: ${err.message}`));
  await page.goto(BASE, { waitUntil: 'networkidle' });
  await page.waitForTimeout(4000);

  const interactions = {};

  // 1. 地图容器存在 canvas（或加载失败回退 UI）
  interactions.mapCanvas = await page.evaluate(() => {
    const mapSection = document.querySelector('#map');
    if (!mapSection) return { found: false, reason: 'no #map section' };
    const canvas = mapSection.querySelector('canvas');
    if (canvas) return { found: true };
    const fallbackText = mapSection.textContent || '';
    return { found: false, reason: 'no canvas', fallback: fallbackText.slice(0, 200) };
  });

  // 2. 点击一所学校卡片的「地图定位」按钮 → 滚动位置变化（应滚到 #map）
  interactions.locateButton = await page.evaluate(async () => {
    const btn = Array.from(document.querySelectorAll('#directory button')).find((b) =>
      (b.textContent || '').includes('地图定位'),
    );
    if (!btn) return { clicked: false, reason: 'button not found' };
    const before = window.scrollY;
    btn.click();
    await new Promise((r) => setTimeout(r, 1500));
    return { clicked: true, scrollBefore: before, scrollAfter: window.scrollY, moved: window.scrollY !== before };
  });

  // 3. 搜索框输入"北京"后结果计数变小，清空后恢复 24
  interactions.searchFilter = await page.evaluate(async () => {
    const input = document.getElementById('university-search-input');
    if (!input) return { ok: false, reason: 'search input not found' };
    const countText = () => {
      const m = (document.querySelector('#filter')?.textContent || '').match(/共\s*(\d+)\s*所/);
      return m ? Number(m[1]) : null;
    };
    const initial = countText();
    const setVal = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
    setVal.call(input, '北京');
    input.dispatchEvent(new Event('input', { bubbles: true }));
    await new Promise((r) => setTimeout(r, 600));
    const afterSearch = countText();
    setVal.call(input, '');
    input.dispatchEvent(new Event('input', { bubbles: true }));
    await new Promise((r) => setTimeout(r, 600));
    const afterClear = countText();
    return { initial, afterSearch, afterClear, ok: afterSearch !== null && afterSearch < initial && afterClear === 24 };
  });

  // 4. 点击地图点位（若 canvas 存在）→ 观察是否滚动到卡片（可选验证）
  // 5. hover 地图点位出现浮层（可选）
  interactions.hoverTooltip = 'skipped (canvas 内部点位无法稳定定位，留作人工抽查)';

  // 6. 地图点位点击 → 卡片滚动（尝试点击 canvas 中心附近若干点）
  if (interactions.mapCanvas.found) {
    const mapEl = await page.$('#map canvas');
    if (mapEl) {
      const box = await mapEl.boundingBox();
      const before = await page.evaluate(() => window.scrollY);
      // 在 canvas 上尝试点击若干候选点，观察 scrollY 是否变化
      let clicked = false;
      outer: for (const fx of [0.5, 0.55, 0.45, 0.6, 0.4, 0.65, 0.35]) {
        for (const fy of [0.5, 0.45, 0.55, 0.4, 0.6, 0.35, 0.65]) {
          await page.mouse.click(box.x + box.width * fx, box.y + box.height * fy);
          await page.waitForTimeout(700);
          const after = await page.evaluate(() => window.scrollY);
          if (after !== before) { clicked = true; break outer; }
        }
      }
      interactions.mapClickScroll = { attempted: true, scrolledToCard: clicked };
    }
  }

  await ctx.close();
  await browser.close();

  console.log('===== CONSOLE ERRORS =====');
  console.log(`count: ${consoleErrors.length}`);
  consoleErrors.forEach((e) => console.log('  ' + e));
  console.log('\n===== OVERFLOW CHECK (scrollWidth <= innerWidth) =====');
  overflowResults.forEach((r) =>
    console.log(`  ${r.viewport}: scrollWidth=${r.scrollWidth} innerWidth=${r.innerWidth} => ${r.ok ? 'PASS' : 'FAIL'}`),
  );
  console.log('\n===== INTERACTIONS =====');
  console.log(JSON.stringify(interactions, null, 2));
})().catch((err) => {
  console.error('SCRIPT FAILED:', err);
  process.exit(1);
});
