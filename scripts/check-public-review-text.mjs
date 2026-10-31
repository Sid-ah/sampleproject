import { chromium } from '@playwright/test';
const browser = await chromium.launch();
try {
  const page = await browser.newPage({ locale: 'en-US' });
  await page.goto('https://www.google.com/maps?cid=1306977105441264595&hl=en', { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForTimeout(6000);
  console.log('PUBLIC_REVIEW_LINKS', JSON.stringify(await page.locator('a,button').evaluateAll((elements) => elements.filter((element) => /review|see more/i.test(`${element.textContent} ${element.getAttribute('aria-label')}`)).map((element) => ({ text: element.textContent, label: element.getAttribute('aria-label'), href: element.getAttribute('href') })))));
  const seeMore = page.getByText('See more', { exact: true });
  if (await seeMore.count() && await seeMore.first().isVisible()) {
    await seeMore.first().click();
    await page.waitForTimeout(6000);
  }
  console.log('PUBLIC_REVIEW_URL', page.url());
  console.log('PUBLIC_REVIEW_TEXT', (await page.locator('body').innerText()).slice(0, 16000));
} catch (error) { console.warn('Customer review text could not be verified:', error.message); }
finally { await browser.close(); }
