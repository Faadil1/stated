import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  parseRoute,
  pushRoute,
  replaceRoute,
  useInitialRoute,
} from './routing';

describe('Routing Utilities', () => {
  beforeEach(() => {
    // Reset window.location mock
    delete window.location;
    window.location = { pathname: '/' };
    window.history = {
      pushState: vi.fn(),
      replaceState: vi.fn(),
    };
  });

  describe('parseRoute', () => {
    it('should parse root path as landing', () => {
      window.location.pathname = '/';
      const { page, recordId, error } = parseRoute();
      expect(page).toBe('landing');
      expect(recordId).toBeNull();
      expect(error).toBeNull();
    });

    it('should parse /create route', () => {
      window.location.pathname = '/create';
      const { page, recordId, error } = parseRoute();
      expect(page).toBe('create');
      expect(recordId).toBeNull();
      expect(error).toBeNull();
    });

    it('should parse /receipt/0 as valid (zero bug regression)', () => {
      window.location.pathname = '/receipt/0';
      const { page, recordId, error } = parseRoute();
      expect(page).toBe('receipt');
      expect(recordId).toBe(0); // Must be numeric 0, not falsy
      expect(recordId).not.toBeUndefined();
      expect(error).toBeNull();
    });

    it('should parse /receipt/:recordId with multi-digit ID', () => {
      window.location.pathname = '/receipt/12345';
      const { page, recordId, error } = parseRoute();
      expect(page).toBe('receipt');
      expect(recordId).toBe(12345);
      expect(error).toBeNull();
    });

    it('should parse /attach/0 as valid (zero bug regression)', () => {
      window.location.pathname = '/attach/0';
      const { page, recordId, error } = parseRoute();
      expect(page).toBe('attach');
      expect(recordId).toBe(0); // Must be numeric 0, not falsy
      expect(error).toBeNull();
    });

    it('should parse /attach/:recordId route', () => {
      window.location.pathname = '/attach/1';
      const { page, recordId, error } = parseRoute();
      expect(page).toBe('attach');
      expect(recordId).toBe(1);
      expect(error).toBeNull();
    });

    it('should reject non-numeric recordId in /receipt/abc', () => {
      window.location.pathname = '/receipt/abc';
      const { page, recordId, error } = parseRoute();
      expect(page).toBe('invalid-receipt');
      expect(error).toBe('Invalid record ID: abc');
    });

    it('should reject non-numeric recordId in /attach/xyz', () => {
      window.location.pathname = '/attach/xyz';
      const { page, recordId, error } = parseRoute();
      expect(page).toBe('invalid-attach');
      expect(error).toBe('Invalid record ID: xyz');
    });

    it('should reject negative recordIds', () => {
      window.location.pathname = '/receipt/-1';
      const { page, error } = parseRoute();
      expect(page).toBe('invalid-receipt');
      expect(error).toBeTruthy();
    });

    it('should handle empty pathname', () => {
      window.location.pathname = '';
      const { page, recordId, error } = parseRoute();
      expect(page).toBe('landing');
      expect(recordId).toBeNull();
      expect(error).toBeNull();
    });

    it('should return not-found for unknown routes', () => {
      window.location.pathname = '/unknown/path';
      const { page, error } = parseRoute();
      expect(page).toBe('not-found');
      expect(error).toBeTruthy();
    });
  });

  describe('pushRoute', () => {
    it('should push landing page', () => {
      pushRoute('landing');
      expect(window.history.pushState).toHaveBeenCalledWith(
        expect.objectContaining({ page: 'landing', recordId: null }),
        '',
        '/'
      );
    });

    it('should push create page', () => {
      pushRoute('create');
      expect(window.history.pushState).toHaveBeenCalledWith(
        expect.objectContaining({ page: 'create', recordId: null }),
        '',
        '/create'
      );
    });

    it('should push receipt page with recordId', () => {
      pushRoute('receipt', 5);
      expect(window.history.pushState).toHaveBeenCalledWith(
        expect.objectContaining({ page: 'receipt', recordId: 5 }),
        '',
        '/receipt/5'
      );
    });

    it('should push attach page with recordId', () => {
      pushRoute('attach', 3);
      expect(window.history.pushState).toHaveBeenCalledWith(
        expect.objectContaining({ page: 'attach', recordId: 3 }),
        '',
        '/attach/3'
      );
    });

    it('should default to landing for receipt without recordId', () => {
      pushRoute('receipt');
      expect(window.history.pushState).toHaveBeenCalledWith(
        expect.objectContaining({ page: 'receipt', recordId: null }),
        '',
        '/'
      );
    });

    it('should handle missing history gracefully', () => {
      global.window.history = undefined;
      // Should not throw
      expect(() => pushRoute('landing')).not.toThrow();
    });
  });

  describe('replaceRoute', () => {
    it('should replace receipt route with recordId', () => {
      replaceRoute('receipt', 0);
      expect(window.history.replaceState).toHaveBeenCalledWith(
        expect.objectContaining({ page: 'receipt', recordId: 0 }),
        '',
        '/receipt/0'
      );
    });

    it('should replace attach route with recordId', () => {
      replaceRoute('attach', 7);
      expect(window.history.replaceState).toHaveBeenCalledWith(
        expect.objectContaining({ page: 'attach', recordId: 7 }),
        '',
        '/attach/7'
      );
    });

    it('should handle missing history gracefully', () => {
      global.window.history = undefined;
      // Should not throw
      expect(() => replaceRoute('landing')).not.toThrow();
    });
  });

  describe('useInitialRoute', () => {
    it('should return landing for root path', () => {
      window.location.pathname = '/';
      const { initialPage, initialRecordId } = useInitialRoute();
      expect(initialPage).toBe('landing');
      expect(initialRecordId).toBeNull();
    });

    it('should return receipt page for /receipt/0', () => {
      window.location.pathname = '/receipt/0';
      const { initialPage, initialRecordId } = useInitialRoute();
      expect(initialPage).toBe('receipt');
      expect(initialRecordId).toBe(0);
    });

    it('should return attach page with recordId', () => {
      window.location.pathname = '/attach/42';
      const { initialPage, initialRecordId } = useInitialRoute();
      expect(initialPage).toBe('attach');
      expect(initialRecordId).toBe(42);
    });

    it('should return create page', () => {
      window.location.pathname = '/create';
      const { initialPage, initialRecordId } = useInitialRoute();
      expect(initialPage).toBe('create');
      expect(initialRecordId).toBeNull();
    });
  });

  describe('Record ID Zero Regression (Critical)', () => {
    it('recordId 0 must not be falsy in conditionals', () => {
      window.location.pathname = '/receipt/0';
      const { recordId } = parseRoute();
      // This is the critical regression test
      // recordId 0 must pass `recordId !== null` but fail `recordId || ...`
      expect(recordId).toBe(0);
      expect(!!recordId).toBe(false); // recordId is falsy
      expect(recordId !== null).toBe(true); // but not null
      expect(recordId ?? undefined).toBe(0); // nullish coalescing works
    });

    it('should use nullish coalescing (??) not logical OR (||)', () => {
      const recordId = 0;
      const fallback = 42;

      // WRONG: logical OR loses zero
      const wrongResult = recordId || fallback;
      expect(wrongResult).toBe(42); // BUG: zero got overwritten

      // CORRECT: nullish coalescing preserves zero
      const correctResult = recordId ?? fallback;
      expect(correctResult).toBe(0); // GOOD: zero is preserved
    });

    it('null should still fall back to default', () => {
      const recordId = null;
      const fallback = 42;

      const result = recordId ?? fallback;
      expect(result).toBe(42); // Correctly falls back when null
    });

    it('undefined should still fall back to default', () => {
      const recordId = undefined;
      const fallback = 42;

      const result = recordId ?? fallback;
      expect(result).toBe(42); // Correctly falls back when undefined
    });
  });

  describe('Direct URL access', () => {
    it('should support /receipt/0 from incognito browser', () => {
      window.location.pathname = '/receipt/0';
      const { page, recordId } = parseRoute();
      expect(page).toBe('receipt');
      expect(recordId).toBe(0);
    });

    it('should support /attach/0 from direct link', () => {
      window.location.pathname = '/attach/0';
      const { page, recordId } = parseRoute();
      expect(page).toBe('attach');
      expect(recordId).toBe(0);
    });

    it('should support /create from direct link', () => {
      window.location.pathname = '/create';
      const { page, recordId } = parseRoute();
      expect(page).toBe('create');
      expect(recordId).toBeNull();
    });

    it('should support / from direct link', () => {
      window.location.pathname = '/';
      const { page, recordId } = parseRoute();
      expect(page).toBe('landing');
      expect(recordId).toBeNull();
    });
  });

  describe('Invalid routes return error state', () => {
    it('/receipt/abc returns invalid-receipt page', () => {
      window.location.pathname = '/receipt/abc';
      const { page, error } = parseRoute();
      expect(page).toBe('invalid-receipt');
      expect(error).toBeTruthy();
    });

    it('/attach/xyz returns invalid-attach page', () => {
      window.location.pathname = '/attach/xyz';
      const { page, error } = parseRoute();
      expect(page).toBe('invalid-attach');
      expect(error).toBeTruthy();
    });

    it('/unknown returns not-found page', () => {
      window.location.pathname = '/unknown';
      const { page, error } = parseRoute();
      expect(page).toBe('not-found');
      expect(error).toBeTruthy();
    });

    it('malformed receipt does not silently fall back to landing', () => {
      window.location.pathname = '/receipt/abc';
      const { page } = parseRoute();
      expect(page).not.toBe('landing');
      expect(page).toBe('invalid-receipt'); // Honest error state
    });
  });
});
