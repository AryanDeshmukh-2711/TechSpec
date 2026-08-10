import { useEffect, useState } from 'react'

/** Subscribe to a media query. Used to switch the spec table between a
 *  column grid and a stacked layout rather than duplicating it in CSS. */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(() =>
    typeof window === 'undefined' ? false : window.matchMedia(query).matches,
  )

  useEffect(() => {
    const list = window.matchMedia(query)
    const onChange = (event: MediaQueryListEvent) => setMatches(event.matches)
    setMatches(list.matches)
    list.addEventListener('change', onChange)
    return () => list.removeEventListener('change', onChange)
  }, [query])

  return matches
}

/** True from the Tailwind `lg` breakpoint up. */
export function useIsDesktop(): boolean {
  return useMediaQuery('(min-width: 1024px)')
}
