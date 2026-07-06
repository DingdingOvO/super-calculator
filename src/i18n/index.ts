export type { I18nPack, Language, I18nKey } from './types';

import zhCN from './zh-CN';
import zhTW from './zh-TW';
import en from './en';
import type { Language } from './types';

const packs: Record<Language, I18nPack> = {
  'zh-CN': zhCN,
  'zh-TW': zhTW,
  'en': en,
};

export function getI18nPack(lang: Language): I18nPack {
  return packs[lang] ?? en;
}

export type I18nPack = typeof zhCN;
