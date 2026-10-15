import {AsyncLocalStorage} from 'node:async_hooks';
import {translate,normalizeLanguage} from './public/messages.js';

const scope = new AsyncLocalStorage();
// Direct legacy library callers keep Thai; HTTP requests explicitly default to English.
export const language = () => scope.getStore() ?? 'th';
export const withLanguage = (value, fn) => scope.run(normalizeLanguage(value), fn);
export const t = (source, ...values) => translate(source, language(), values);
