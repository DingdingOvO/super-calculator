import type { CalculatorPlugin, CalculatorPluginRender } from '@plugins/types';
import type { I18nPack } from '@i18n/types';

export function createScientificPlaceholder(): CalculatorPlugin {
  return {
    meta: {
      id: 'scientific',
      name: '科学',
      icon: null,
      enabled: false,
    },
    render: (_i18n: I18nPack, _theme: 'light' | 'dark'): CalculatorPluginRender => ({
      buttons: (
        <div className="calc-placeholder">
          <p>{_i18n.modes.scientific} — Coming Soon</p>
        </div>
      ),
    }),
  };
}
