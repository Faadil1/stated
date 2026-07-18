/**
 * URL routing utilities for STATED SPA
 * Parses window.location.pathname and manages browser history
 */

export function parseRoute() {
  const pathname = window.location.pathname;

  // Root path
  if (pathname === '/' || pathname === '') {
    return { page: 'landing', recordId: null };
  }

  // /create
  if (pathname === '/create') {
    return { page: 'create', recordId: null };
  }

  // /receipt/:recordId
  const receiptMatch = pathname.match(/^\/receipt\/(\d+)$/);
  if (receiptMatch) {
    return { page: 'receipt', recordId: Number(receiptMatch[1]) };
  }

  // /attach/:recordId
  const attachMatch = pathname.match(/^\/attach\/(\d+)$/);
  if (attachMatch) {
    return { page: 'attach', recordId: Number(attachMatch[1]) };
  }

  // Unknown route, default to landing
  return { page: 'landing', recordId: null };
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
