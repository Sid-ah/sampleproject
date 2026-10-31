import { chromium } from '@playwright/test';

const browser = await chromium.launch();
try {
  const page = await browser.newPage({ locale: 'en-US' });
  const cid = BigInt('0x122350c0b36513d3').toString();
  await page.goto(`https://www.google.com/maps?cid=${cid}&hl=en`, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForTimeout(10000);
  console.log('MAPS_BROWSER_PUBLIC_TEXT', (await page.locator('body').innerText()).slice(0, 13000));
} catch (error) {
  console.warn('Public Google review content could not be verified in the browser:', error.message);
} finally {
  await browser.close();
}
