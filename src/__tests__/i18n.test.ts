import { describe, it, expect } from 'vitest';

describe('i18n', () => {
  it('should load Chinese pack', async () => {
    const zhCN = await import('@i18n/zh-CN');
    expect(zhCN.default.app.title).toBe('计算器');
  });

  it('should load Traditional Chinese pack', async () => {
    const zhTW = await import('@i18n/zh-TW');
    expect(zhTW.default.modes.programmer).toBe('程式設計師');
  });

  it('should load English pack', async () => {
    const en = await import('@i18n/en');
    expect(en.default.modes.scientific).toBe('Scientific');
  });
});
