import type { CalculatorPlugin, CalculatorPluginRender } from '@plugins/types';
import type { I18nPack } from '@i18n/types';

export function createDateCalculationPlaceholder(): CalculatorPlugin {
  return {
    meta: {
      id: 'date-calculation',
      name: '日期計算',
      icon: null,
      enabled: false,
    },
    render: (_i18n: I18nPack, _theme: 'light' | 'dark'): CalculatorPluginRender => ({
      buttons: (
        <div className="calc-placeholder">
          <p>{_i18n.modes.dateCalculation} — Coming Soon</p>
        </div>
      ),
    }),
  };
}
