/**
 * URL routing utilities for STATED SPA
 * Parses window.location.pathname and manages browser history
 */

export function parseRoute() {
  const pathname = window.location.pathname;

  // Root path
  if (pathname === '/' || pathname === '') {
    return { page: 'landing', recordId: null, error: null };
  }

  // /create
  if (pathname === '/create') {
    return { page: 'create', recordId: null, error: null };
  }

  // /receipt/:recordId
  const receiptMatch = pathname.match(/^\/receipt\/(.+)$/);
  if (receiptMatch) {
    const recordId = Number(receiptMatch[1]);
    if (Number.isInteger(recordId) && recordId >= 0) {
      return { page: 'receipt', recordId, error: null };
    } else {
      // Invalid record ID format
      return { page: 'invalid-receipt', recordId: receiptMatch[1], error: `Invalid record ID: ${receiptMatch[1]}` };
    }
  }

  // /attach/:recordId
  const attachMatch = pathname.match(/^\/attach\/(.+)$/);
  if (attachMatch) {
    const recordId = Number(attachMatch[1]);
    if (Number.isInteger(recordId) && recordId >= 0) {
      return { page: 'attach', recordId, error: null };
    } else {
      // Invalid record ID format
      return { page: 'invalid-attach', recordId: attachMatch[1], error: `Invalid record ID: ${attachMatch[1]}` };
    }
  }

  // Unknown route
  return { page: 'not-found', recordId: null, error: `Route not found: ${pathname}` };
}

export function pushRoute(page, recordId = null) {
  let pathname = '/';

  if (page === 'create') {
    pathname = '/create';
  } else if (page === 'attach' && recordId !== null) {
    pathname = `/attach/${recordId}`;
  } else if (page === 'receipt' && recordId !== null) {
    pathname = `/receipt/${recordId}`;
  }

  // Update browser history without reloading
  if (window.history && window.history.pushState) {
    window.history.pushState(
      { page, recordId },
      '',
      pathname
    );
  }
}

export function replaceRoute(page, recordId = null) {
  let pathname = '/';

  if (page === 'create') {
    pathname = '/create';
  } else if (page === 'attach' && recordId !== null) {
    pathname = `/attach/${recordId}`;
  } else if (page === 'receipt' && recordId !== null) {
    pathname = `/receipt/${recordId}`;
  }

  // Replace current history entry without reloading
  if (window.history && window.history.replaceState) {
    window.history.replaceState(
      { page, recordId },
      '',
      pathname
    );
  }
}

export function useInitialRoute() {
  const { page, recordId } = parseRoute();
  return { initialPage: page, initialRecordId: recordId };
}
