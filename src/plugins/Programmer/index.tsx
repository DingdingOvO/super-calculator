import type { CalculatorPlugin, CalculatorPluginRender } from '@plugins/types';
import type { I18nPack } from '@i18n/types';

export function createProgrammerPlaceholder(): CalculatorPlugin {
  return {
    meta: {
      id: 'programmer',
      name: '程式設計師',
      icon: null,
      enabled: false,
    },
    render: (_i18n: I18nPack, _theme: 'light' | 'dark'): CalculatorPluginRender => ({
      buttons: (
        <div className="calc-placeholder">
          <p>{_i18n.modes.programmer} — Coming Soon</p>
        </div>
      ),
    }),
  };
}
