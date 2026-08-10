import type { CategoryId, Screen } from '@/types'

/**
 * The URL *is* the app state. Every comparison is a link you can paste into
 * Slack and have someone land on the exact same view, priorities included.
 *
 *   /?v=compare&c=mobiles&p=iphone-16-pro-max,galaxy-s25-ultra&w=camera:9,battery:2
 */

export interface UrlState {
  screen: Screen
  category: CategoryId | null
  selection: string[]
  priorities: Record<string, number>
}

export const DEFAULT_URL_STATE: UrlState = {
  screen: 'home',
  category: null,
  selection: [],
  priorities: {},
}

const VALID_SCREENS: Screen[] = ['home', 'picker', 'compare']

export function parseUrl(search: string = window.location.search): UrlState {
  const params = new URLSearchParams(search)

  const screenParam = params.get('v') as Screen | null
  const screen = screenParam && VALID_SCREENS.includes(screenParam) ? screenParam : 'home'
  const category = (params.get('c') as CategoryId | null) || null

  const selection = (params.get('p') ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 5)

  const priorities: Record<string, number> = {}
  for (const pair of (params.get('w') ?? '').split(',')) {
    const [key, value] = pair.split(':')
    const n = Number(value)
    if (key && Number.isFinite(n)) priorities[key] = Math.min(10, Math.max(0, n))
  }

  return { screen, category, selection, priorities }
}

export function buildSearch(state: UrlState): string {
  const params = new URLSearchParams()
  if (state.screen !== 'home') params.set('v', state.screen)
  if (state.category) params.set('c', state.category)
  if (state.selection.length) params.set('p', state.selection.join(','))

  // Only serialise priorities the user actually moved off the default.
  const moved = Object.entries(state.priorities).filter(([, v]) => v !== 5)
  if (moved.length) params.set('w', moved.map(([k, v]) => `${k}:${v}`).join(','))

  const qs = params.toString()
  return qs ? `?${qs}` : window.location.pathname
}

export function shareUrl(state: UrlState): string {
  const { origin, pathname } = window.location
  const search = buildSearch(state)
  return `${origin}${pathname}${search.startsWith('?') ? search : ''}`
}

/** Push into history (new entry) or replace (no entry) without a router. */
export function writeUrl(state: UrlState, mode: 'push' | 'replace' = 'push'): void {
  const search = buildSearch(state)
  const url = search.startsWith('?') ? search : window.location.pathname
  if (mode === 'push') window.history.pushState(state, '', url)
  else window.history.replaceState(state, '', url)
}
