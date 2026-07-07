export type Language = 'zh-CN' | 'zh-TW' | 'en';

export interface I18nPack {
  app: {
    title: string;
    language: string;
    comingSoon: string;
  };
  modes: {
    standard: string;
    scientific: string;
    programmer: string;
    dateCalculation: string;
  };
  buttons: {
    mc: string;
    mr: string;
    mPlus: string;
    mMinus: string;
    ms: string;
    percent: string;
    clear: string;
    clearEntry: string;
    backspace: string;
    reciprocal: string;
    square: string;
    sqrt: string;
    divide: string;
    multiply: string;
    subtract: string;
    add: string;
    equals: string;
    negate: string;
    decimal: string;
    zero: string;
    one: string;
    two: string;
    three: string;
    four: string;
    five: string;
    six: string;
    seven: string;
    eight: string;
    nine: string;
  };
  errors: {
    divideByZero: string;
    overflow: string;
    invalidInput: string;
  };
  theme: {
    light: string;
    dark: string;
  };
  history: {
    title: string;
    empty: string;
  };
  scientific: {
    sin: string;
    cos: string;
    tan: string;
    log: string;
    ln: string;
    sqrt: string;
    power: string;
    factorial: string;
    angleDeg: string;
    angleRad: string;
    expressionPlaceholder: string;
  };
}

export type I18nKey = keyof I18nPack;
