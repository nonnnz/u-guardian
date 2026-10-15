// Optional visual/e2e QA. Run with PLAYWRIGHT_MODULE pointing to an installed Playwright package.
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const assert = require('node:assert/strict');
(async () => {
  const browser = await chromium.launch({ headless: true, channel: 'msedge' });
  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 1100 }, deviceScaleFactor: 1 });
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    await page.goto(process.env.BASE_URL || 'http://127.0.0.1:4173');
    await page.waitForSelector('#holdings-body tr');
    await page.screenshot({ path: 'artifacts/desktop.png', fullPage: true });
    await page.getByRole('button', { name: 'จำลองเหตุการณ์', exact: true }).click();
    await page.waitForSelector('#call-dialog[open]');
    await page.getByRole('button', { name: 'เปิดบทสนทนา', exact: true }).click();
    await page.waitForSelector('.message.assistant .trace');
    await page.getByRole('button', { name: 'ถ้าเติม 180 ล่ะ?', exact: true }).click();
    await page.getByRole('button', { name: 'เตรียมเติม 180 demo USDC', exact: true }).click();
    await page.getByRole('button', { name: 'ยืนยันการโอนจำลอง', exact: true }).click();
    await page.waitForFunction(() => document.querySelector('#reserve-value').textContent === '500');
    await page.screenshot({ path: 'artifacts/completed.png', fullPage: true });
    await page.getByRole('button', { name: /เริ่มใหม่/ }).click();
    await page.waitForFunction(() => document.querySelector('#reserve-value').textContent === '620');
    await page.setViewportSize({ width: 390, height: 844 });
    await page.locator('#toast').waitFor({ state: 'hidden' });
    await page.screenshot({ path: 'artifacts/mobile.png', fullPage: true });
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > innerWidth);
    assert.equal(overflow, false);
    assert.deepEqual(errors, []);
    await page.getByRole('button', { name: 'Connections', exact: true }).click();
    await page.waitForSelector('#settings-dialog[open]');
    await page.locator('#test-ubot').click();
    await page.waitForFunction(() => document.querySelector('#ubot-result').textContent.includes('ยังไม่ได้ตั้ง'));
    await page.locator('[data-close="settings-dialog"]').click();
    await page.getByRole('button', { name: 'My goal', exact: true }).click();
    await page.locator('#target-input').fill('700');
    await page.getByRole('button', { name: 'บันทึกเป้าหมาย', exact: true }).click();
    await page.waitForFunction(() => document.querySelector('#reserve-summary').textContent.includes('80'));
    await page.getByRole('button', { name: /เริ่มใหม่/ }).click();
    await page.waitForFunction(() => document.querySelector('#reserve-value').textContent === '620');
    console.log(JSON.stringify({ errors, mobileOverflow: overflow, endToEnd: 'passed' }));
  } finally { await browser.close(); }
})().catch(e => { console.error(e.message); process.exit(1); });
