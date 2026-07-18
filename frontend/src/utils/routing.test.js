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
      const { page, recordId } = parseRoute();
      expect(page).toBe('landing');
      expect(recordId).toBeNull();
    });

    it('should parse /create route', () => {
      window.location.pathname = '/create';
      const { page, recordId } = parseRoute();
      expect(page).toBe('create');
      expect(recordId).toBeNull();
    });

    it('should parse /receipt/:recordId route', () => {
      window.location.pathname = '/receipt/0';
      const { page, recordId } = parseRoute();
      expect(page).toBe('receipt');
      expect(recordId).toBe(0);
    });

    it('should parse /receipt/:recordId with multi-digit ID', () => {
      window.location.pathname = '/receipt/12345';
      const { page, recordId } = parseRoute();
      expect(page).toBe('receipt');
      expect(recordId).toBe(12345);
    });

    it('should parse /attach/:recordId route', () => {
      window.location.pathname = '/attach/1';
      const { page, recordId } = parseRoute();
      expect(page).toBe('attach');
      expect(recordId).toBe(1);
    });

    it('should return landing for unknown routes', () => {
      window.location.pathname = '/unknown/path';
      const { page, recordId } = parseRoute();
      expect(page).toBe('landing');
      expect(recordId).toBeNull();
    });

    it('should handle empty pathname', () => {
      window.location.pathname = '';
      const { page, recordId } = parseRoute();
      expect(page).toBe('landing');
      expect(recordId).toBeNull();
    });

    it('should reject non-numeric recordIds in receipt', () => {
      window.location.pathname = '/receipt/abc';
      const { page, recordId } = parseRoute();
      // Should not match, so returns landing
      expect(page).toBe('landing');
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
});
