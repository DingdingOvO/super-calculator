import { test, expect } from '@playwright/test';

test.describe('标准计算器模式', () => {
  test('2 + 3 = 5', async ({ page }) => {
    await page.goto('/');

    // 等待 WASM 加载完成（预加载器消失）
    await page.waitForSelector('#preloader', { state: 'hidden', timeout: 30000 }).catch(() => {});
    await page.waitForTimeout(500);

    // 按 2
    await page.click('button[aria-label="2"]');
    // 按 +
    await page.click('button[aria-label="add"]');
    // 按 3
    await page.click('button[aria-label="3"]');
    // 按 =
    await page.click('button[aria-label="equals"]');

    // 验证结果显示 5
    const result = page.locator('.calc-result');
    await expect(result).toHaveText('5', { timeout: 5000 });
  });
});

test.describe('科学计算器模式', () => {
  test('sin(30) = 0.5', async ({ page }) => {
    await page.goto('/');

    // 等待 WASM 加载
    await page.waitForSelector('#preloader', { state: 'hidden', timeout: 30000 }).catch(() => {});
    await page.waitForTimeout(500);

    // 打开侧边栏
    await page.click('button[aria-label="切换菜单"]');
    await page.waitForTimeout(300);

    // 点击科学模式
    await page.click('text=科学');
    await page.waitForTimeout(300);

    // 在输入框中输入 sin(30)
    const input = page.locator('.sci-input');
    await input.click();
    await input.fill('sin(30)');

    // 按回车计算
    await input.press('Enter');
    await page.waitForTimeout(500);

    // 验证结果
    const result = page.locator('.sci-result');
    await expect(result).toHaveText('0.5', { timeout: 5000 });
  });
});
