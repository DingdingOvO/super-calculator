import type { ReactNode } from 'react';
import type { Language, I18nPack } from '@i18n/types';

/** 插件元数据 */
export interface CalculatorPluginMeta {
  id: string;
  name: string;
  icon: ReactNode;
  /** 是否可用（第一阶段只有标准模式可用） */
  enabled: boolean;
}

/** 插件渲染结果 */
export interface CalculatorPluginRender {
  /** 按钮网格布局 */
  buttons: ReactNode;
  /** 额外渲染内容（如科学模式的函数面板） */
  extra?: ReactNode;
}

/** 计算器插件接口 */
export interface CalculatorPlugin {
  meta: CalculatorPluginMeta;
  render: (i18n: I18nPack, theme: 'light' | 'dark') => CalculatorPluginRender;
}
