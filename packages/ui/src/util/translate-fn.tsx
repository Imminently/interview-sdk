import en from '../i18n/en.json';
import { get } from 'lodash-es';

/**
 * Translate function type definition.
 * It takes a key and optional parameters to replace in the string.
 * Parameters are in the form of an object where keys are the placeholders in the string.
 * For example, if the string is "Hello {{name}}", you can pass { name: "World" } to replace it with "Hello World".
 * 
 * Returns the translated string.
 */
type TranslateFn = (key?: string, params?: Record<string, any>) => string;

let translateFn: TranslateFn = (key, params) => {
  if (!key) return '';
  let str = get(en, key, key);
  if (params) {
    Object.keys(params).forEach(key => {
      str = str.replace(`{{${key}}}`, params[key]);
    });
  }
  return str;
}

/**
 * The `t` function is a simple wrapper around the set translation function.
 */
export const t: TranslateFn = (key, params) => translateFn(key, params);

/**
 * Sets the translation function to be used by the `t` function.
 * This allows you to override the default translation function with your own implementation.
 * @param fn The translation function to set. It should match the `TranslateFn` type definition.
 */
export const setTranslateFn = (fn: TranslateFn) => {
  translateFn = fn;
}