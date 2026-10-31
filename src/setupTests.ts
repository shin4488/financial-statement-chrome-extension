/// <reference types="vitest/globals" />
import '@testing-library/jest-dom/vitest';

Object.assign(global, { ANALYTICS_ENABLED: false, EXTENSION_VERSION: 'test' });

// jsdomはレイアウトを持たないため、監視する要素はすべて表示範囲にあるものとして扱う。表示範囲との関係で変わる動きは、各テストで差し替えて確かめる
class InViewIntersectionObserver {
  constructor(private callback: IntersectionObserverCallback) {}
  observe(target: Element) {
    this.callback(
      [{ target, isIntersecting: true } as IntersectionObserverEntry],
      this as unknown as IntersectionObserver,
    );
  }
  unobserve() {}
  disconnect() {}
}
Object.assign(global, { IntersectionObserver: InViewIntersectionObserver });
