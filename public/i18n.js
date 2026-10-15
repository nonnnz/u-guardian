import {translate, normalizeLanguage} from './messages.js';

export const LANGUAGE_KEY = 'guardian-language';
export const language = (() => {
 try { return normalizeLanguage(localStorage.getItem(LANGUAGE_KEY)); }
 catch { return 'en'; }
})();
export const locale = language === 'th' ? 'th-TH' : 'en-US';
export const t = (source, ...values) => translate(source, language, values);

// Bind only marked, authored UI copy. Never walk chat, API evidence or user inputs.
export function localize(root) {
 for (const element of root.querySelectorAll('[data-i18n]')) element.textContent = t(element.dataset.i18n);
 for (const attribute of ['aria-label', 'placeholder', 'title', 'data-prompt']) {
  for (const element of root.querySelectorAll(`[data-i18n-${attribute}]`)) {
   element.setAttribute(attribute, t(element.getAttribute(`data-i18n-${attribute}`)));
  }
 }
}
