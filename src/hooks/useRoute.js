import { useCallback, useEffect, useState } from 'react';

/**
 * Tiny History-API router that keeps the existing `navigateTo('dashboard/chat')`
 * contract, but adds real URLs, back/forward support, refresh persistence and
 * query params (`navigateTo('dashboard/quiz?skill=dl')`).
 */
const toRoute = (pathname) => {
  const p = pathname.replace(/^\/+|\/+$/g, '');
  return p === '' ? 'landing' : p;
};
const toPath = (route) => (route === 'landing' ? '/' : `/${route}`);
const read = () => ({ route: toRoute(window.location.pathname), search: window.location.search });

export function useRoute() {
  const [loc, setLoc] = useState(read);

  useEffect(() => {
    const onPop = () => setLoc(read());
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  const navigateTo = useCallback((next) => {
    const [route, query = ''] = String(next).split('?');
    const target = toPath(route) + (query ? `?${query}` : '');
    if (target !== window.location.pathname + window.location.search) {
      window.history.pushState({}, '', target);
    }
    setLoc({ route, search: query ? `?${query}` : '' });
    window.scrollTo(0, 0);
  }, []);

  const goBack = useCallback(() => {
    if (window.history.state !== null && window.history.length > 1) {
      window.history.back();
    } else {
      navigateTo('dashboard');
    }
  }, [navigateTo]);

  return { route: loc.route, params: new URLSearchParams(loc.search), navigateTo, goBack };
}
