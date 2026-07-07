import zhCN from './zh-CN';
import zhTW from './zh-TW';
import en from './en';
import type { Language, I18nPack, I18nKey } from './types';

export type { Language, I18nPack, I18nKey };

const packs: Record<Language, I18nPack> = {
  'zh-CN': zhCN,
  'zh-TW': zhTW,
  'en': en,
};

export function getI18nPack(lang: Language): I18nPack {
  return packs[lang] ?? en;
}
