import type { I18nPack } from './types';

// Windows 官方繁体中文修正版
// "程序员" → "程式設計師" 等精确术语
const zhTW: I18nPack = {
  app: { title: '計算機' },
  modes: {
    standard: '標準',
    scientific: '工程型',
    programmer: '程式設計師',
    dateCalculation: '日期計算',
  },
  buttons: {
    mc: 'MC',
    mr: 'MR',
    mPlus: 'M+',
    mMinus: 'M-',
    ms: 'MS',
    percent: '%',
    clear: 'C',
    clearEntry: 'CE',
    backspace: '退格',
    reciprocal: '1/x',
    square: 'x²',
    sqrt: '√',
    divide: '÷',
    multiply: '×',
    subtract: '−',
    add: '+',
    equals: '=',
    negate: '±',
    decimal: '.',
    zero: '0',
    one: '1',
    two: '2',
    three: '3',
    four: '4',
    five: '5',
    six: '6',
    seven: '7',
    eight: '8',
    nine: '9',
  },
  errors: {
    divideByZero: '除數不能為零',
    overflow: '結果超出範圍',
    invalidInput: '無效輸入',
  },
  theme: {
    light: '淺色',
    dark: '深色',
  },
  history: {
    title: '計算記錄',
    empty: '暫無記錄',
  },
};

export default zhTW;
