import type { SearchEngineDescriptor } from './types';

export const ENGINES: readonly SearchEngineDescriptor[] = [
  {
    id: 'google',
    name: 'Google',
    hostnames: ['www.google.com'],
    queryParam: 'q',
    isResultsPage: (url) =>
      url.pathname === '/search' && url.searchParams.has('q'),
  },
  {
    id: 'bing',
    name: 'Bing',
    hostnames: ['www.bing.com'],
    queryParam: 'q',
    isResultsPage: (url) =>
      url.pathname === '/search' && url.searchParams.has('q'),
  },
  {
    id: 'duckduckgo',
    name: 'DuckDuckGo',
    hostnames: ['duckduckgo.com'],
    queryParam: 'q',
    isResultsPage: (url) => {
      if (!url.searchParams.has('q')) return false;
      return url.pathname === '/' || url.pathname.startsWith('/html');
    },
  },
  {
    id: 'yahoo',
    name: 'Yahoo',
    hostnames: ['search.yahoo.com'],
    queryParam: 'p',  // Yahoo uses ?p= instead of ?q=
    isResultsPage: (url) =>
      url.pathname === '/search' && url.searchParams.has('p'),
  },
  {
    id: 'ecosia',
    name: 'Ecosia',
    hostnames: ['www.ecosia.org'],
    queryParam: 'q',
    isResultsPage: (url) =>
      url.pathname === '/search' && url.searchParams.has('q'),
  },
  {
    id: 'brave',
    name: 'Brave Search',
    hostnames: ['search.brave.com'],
    queryParam: 'q',
    isResultsPage: (url) =>
      url.pathname === '/search' && url.searchParams.has('q'),
  },
];

export function findEngine(url: URL): SearchEngineDescriptor | null {
  for (const engine of ENGINES) {
    if (engine.hostnames.includes(url.hostname) && engine.isResultsPage(url)) {
      return engine;
    }
  }
  return null;
}
