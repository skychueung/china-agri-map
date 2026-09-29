// hover 浮层抽查脚本（单独文件避免引号转义问题）
const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({
    executablePath:
      'C:\\Users\\33319\\AppData\\Local\\ms-playwright\\chromium_headless_shell-1223\\chrome-headless-shell-win64\\chrome-headless-shell.exe',
  });
  const page = await (await browser.newContext({ viewport: { width: 1440, height: 900 } })).newPage();
  await page.goto('http://127.0.0.1:7100/', { waitUntil: 'networkidle' });
  await page.waitForTimeout(4000);
  await page.evaluate(() => document.querySelector('#map').scrollIntoView({ block: 'center' }));
  await page.waitForTimeout(1200);
  const canvas = await page.$('#map canvas');
  if (!canvas) {
    console.log('HOVER TOOLTIP: SKIPPED (no canvas)');
    await browser.close();
    return;
  }
  const box = await canvas.boundingBox();
  let tooltip = null;
  outer: for (const fx of [0.5, 0.55, 0.45, 0.6, 0.4, 0.52, 0.48, 0.58, 0.42, 0.62, 0.38]) {
    for (const fy of [0.5, 0.45, 0.55, 0.4, 0.6, 0.35, 0.65, 0.3]) {
      await page.mouse.move(box.x + box.width * fx, box.y + box.height * fy);
      await page.waitForTimeout(350);
      const found = await page.evaluate(() => {
        // ECharts tooltip 通常渲染为绝对定位的 div（pointer-events: none）
        const els = Array.from(document.querySelectorAll('#map div'));
        const el = els.find((e) => {
          const cs = getComputedStyle(e);
          const text = e.textContent || '';
          return (
            cs.position === 'absolute' &&
            e.querySelector('canvas') === null &&
            text.length > 8 &&
            text.length < 500 &&
            /官网|大学|学院/.test(text)
          );
        });
        return el ? el.textContent.slice(0, 120) : null;
      });
      if (found) {
        tooltip = found;
        break outer;
      }
    }
  }
  console.log('HOVER TOOLTIP:', tooltip ? 'FOUND' : 'NOT FOUND', tooltip || '');
  await browser.close();
})().catch((e) => {
  console.error('HOVER CHECK FAILED:', e.message);
  process.exit(1);
});
