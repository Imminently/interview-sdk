import en from '../i18n/en.json';
import get from 'lodash/get';

let translateFn: (key: string, params?: Record<string, any>) => string = (key: string, params?: Record<string, any>) => {
  let str = get(en, key, key);
  if (params) {
    Object.keys(params).forEach(key => {
      str = str.replace(`{{${key}}}`, params[key]);
    });
  }
  return str;
}

export const t = (key: string, params?: Record<string, any>) => translateFn(key, params);
export const setTranslateFn = (fn: (key: string) => string) => {
  translateFn = fn;
}