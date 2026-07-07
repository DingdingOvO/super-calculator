import type { Meta, StoryObj } from '@storybook/react';
import { Display } from '../../src/components/Display';
import type { I18nPack } from '../../src/i18n/types';
import zhCN from '../../src/i18n/zh-CN';

const meta: Meta<typeof Display> = {
  title: 'Components/Display',
  component: Display,
};
export default meta;

type Story = StoryObj<typeof Display>;

export const Default: Story = {
  args: { expression: '', display: '0', hasError: false, i18n: zhCN },
};

export const WithExpression: Story = {
  args: { expression: '12 + 34', display: '46', hasError: false, i18n: zhCN },
};

export const LongNumber: Story = {
  args: { expression: '', display: '12345678.9012345', hasError: false, i18n: zhCN },
};

export const Error: Story = {
  args: { expression: '5 ÷ 0', display: '除数不能为零', hasError: true, i18n: zhCN },
};
