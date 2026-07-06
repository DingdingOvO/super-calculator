import type { I18nPack } from './types';

const zhCN: I18nPack = {
  app: { title: '计算器' },
  modes: {
    standard: '标准',
    scientific: '科学',
    programmer: '程序员',
    dateCalculation: '日期计算',
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
    divideByZero: '除数不能为零',
    overflow: '结果超出范围',
    invalidInput: '无效输入',
  },
  theme: {
    light: '浅色',
    dark: '深色',
  },
  history: {
    title: '计算历史',
    empty: '暂无历史记录',
  },
};

export default zhCN;
