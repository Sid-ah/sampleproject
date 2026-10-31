import { chromium } from '@playwright/test';

const browser = await chromium.launch();
try {
  const page = await browser.newPage({ locale: 'en-US' });
  await page.goto('https://maps.app.goo.gl/QqQdj9EkkHDancpk8?g_st=ic', { waitUntil: 'domcontentloaded', timeout: 90000 });
  await page.waitForTimeout(7000);
  console.log('NEW_REVIEW_URL', page.url());
  console.log('NEW_REVIEW_TEXT', (await page.locator('body').innerText()).slice(0, 20000));
  for (let attempt = 0; attempt < 3; attempt++) {
    const dismiss = page.getByRole('button', { name: 'Dismiss', exact: true });
    if (await dismiss.count() && await dismiss.first().isVisible()) await dismiss.first().click();
    const reviews = page.getByRole('tab', { name: /reviews/i });
    const more = page.getByText('See more', { exact: true });
    if (await reviews.count() && await reviews.first().isVisible()) await reviews.first().click();
    else if (await more.count() && await more.first().isVisible()) await more.first().click();
    else break;
    await page.waitForTimeout(5000);
    console.log('REVIEW_ATTEMPT', attempt, page.url(), (await page.locator('body').innerText()).slice(0, 25000));
  }
  console.log('REVIEW_CONTROLS', JSON.stringify(await page.locator('button,a').evaluateAll((elements) => elements.filter((element) => /review|more|sign in/i.test(`${element.textContent} ${element.getAttribute('aria-label')}`)).map((element) => ({ text: element.textContent, label: element.getAttribute('aria-label'), href: element.getAttribute('href') })))));
} finally { await browser.close(); }
