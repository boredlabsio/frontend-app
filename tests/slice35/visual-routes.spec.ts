import { expect, test, type Page } from '@playwright/test';

const routes = ['/', '/discover', '/launch/create', '/activity', '/rewards/dashboard', '/rewards/claim', '/launch/0'];

function rgb(value: string) {
  const match = value.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
  return match ? match.slice(1).map(Number) : null;
}

function relativeLuminance([r, g, b]: number[]) {
  const linear = [r, g, b].map((channel) => {
    const value = channel / 255;
    return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * linear[0] + 0.7152 * linear[1] + 0.0722 * linear[2];
}

function ratio(foreground: number[], background: number[]) {
  const a = relativeLuminance(foreground);
  const b = relativeLuminance(background);
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
}

async function assertReadable(page: Page) {
  const styles = await page.locator('body').evaluate((body) => {
    const bodyStyle = getComputedStyle(body);
    const samples = Array.from(document.querySelectorAll('h1,h2,h3,p,label,button,a'))
      .filter((node) => (node.textContent || '').trim())
      .slice(0, 80)
      .map((node) => {
        const style = getComputedStyle(node);
        let parent: Element | null = node;
        let background = 'rgba(0, 0, 0, 0)';
        while (parent && background.endsWith(', 0)')) {
          background = getComputedStyle(parent).backgroundColor;
          parent = parent.parentElement;
        }
        return { text: (node.textContent || '').trim().slice(0, 80), color: style.color, background, opacity: style.opacity };
      });
    return { bodyColor: bodyStyle.color, bodyBackground: bodyStyle.backgroundColor, samples };
  });

  expect(styles.bodyBackground).toBe('rgb(2, 6, 23)');
  expect(styles.bodyColor).toBe('rgb(248, 250, 252)');
  for (const sample of styles.samples) {
    const foreground = rgb(sample.color);
    const background = rgb(sample.background) ?? rgb(styles.bodyBackground);
    expect(Number(sample.opacity), `${sample.text} has low opacity`).toBeGreaterThanOrEqual(0.4);
    if (foreground && background) expect(ratio(foreground, background), sample.text).toBeGreaterThanOrEqual(3);
  }
}

for (const route of routes) {
  test(`${route} has deterministic readable styles`, async ({ page }, testInfo) => {
    const errors: string[] = [];
    page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()); });
    page.on('pageerror', (error) => errors.push(error.message));
    const response = await page.goto(route, { waitUntil: 'networkidle' });
    expect(response?.status()).toBeLessThan(500);
    await assertReadable(page);
    await page.screenshot({ path: testInfo.outputPath(`${route.replaceAll('/', '_') || 'dashboard'}.png`), fullPage: true });
    expect(errors).toEqual([]);
  });
}
