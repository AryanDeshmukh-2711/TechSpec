import { StrictMode, act, useEffect } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import type { CategoryId } from '@/types'
import { byId } from '@/lib/__fixtures__/category'
import { ProfileProvider, useProfile } from './ProfileProvider'
import { emptyProfile, loadProfile, recordComparison, saveProfile } from './profile'

/**
 * Hydration ordering.
 *
 * React runs effects child-first, so a consumer's mount effect fires *before*
 * `ProfileProvider` has read localStorage. Anything it writes in that window is
 * overwritten by the load, and anything it reads comes back empty — which is
 * how remembered slider weights were silently replaced by neutral defaults.
 *
 * These tests pin the flag that fixed it, so the next refactor of the provider
 * fails here rather than in a user's browser.
 */

declare global {
  // eslint-disable-next-line no-var
  var IS_REACT_ACT_ENVIRONMENT: boolean
}

const CATEGORY = 'mobiles' as CategoryId

let container: HTMLDivElement
let root: Root

beforeEach(() => {
  globalThis.IS_REACT_ACT_ENVIRONMENT = true
  window.localStorage.clear()
  container = document.createElement('div')
  document.body.appendChild(container)
  root = createRoot(container)
})

afterEach(() => {
  act(() => root.unmount())
  container.remove()
})

/** A consumer that writes on mount, optionally waiting for hydration first. */
function Recorder({ gated }: { gated: boolean }) {
  const profile = useProfile()
  useEffect(() => {
    if (gated && !profile.ready) return
    profile.noteComparison(CATEGORY, [byId('fast'), byId('slow')])
    // Mirrors the real consumer: record once per settled comparison.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gated ? profile.ready : false])
  return null
}

// StrictMode, because `main.tsx` renders inside it and its double-invoked
// effects are what interleave the provider's load with a consumer's write.
const mount = (gated: boolean) =>
  act(() => {
    root.render(
      <StrictMode>
        <ProfileProvider>
          <Recorder gated={gated} />
        </ProfileProvider>
      </StrictMode>,
    )
  })

describe('ProfileProvider hydration order', () => {
  it('reports not-ready until the stored profile has been read', () => {
    let seen: boolean[] = []
    function Probe() {
      seen.push(useProfile().ready)
      return null
    }
    act(() => {
      root.render(
        <StrictMode>
          <ProfileProvider>
            <Probe />
          </ProfileProvider>
        </StrictMode>,
      )
    })
    // False on the first render, true once the mount effect has loaded.
    expect(seen[0]).toBe(false)
    expect(seen.at(-1)).toBe(true)
  })

  it('keeps a write made after hydration', () => {
    mount(true)
    expect(loadProfile().comparisons).toHaveLength(1)
  })

  it('reads back empty before hydration — the hazard `ready` exists to close', () => {
    // Not a wish for this behaviour: it is the reason consumers must wait.
    // A one-shot read taken here sees nothing and cannot recover.
    let firstRead: number | null = null
    function EarlyReader() {
      const { profile, ready } = useProfile()
      if (firstRead === null && !ready) firstRead = profile.comparisons.length
      return null
    }
    saveProfile(recordComparison(emptyProfile(), CATEGORY, [byId('fast'), byId('slow')]))
    act(() => {
      root.render(
        <StrictMode>
          <ProfileProvider>
            <EarlyReader />
          </ProfileProvider>
        </StrictMode>,
      )
    })
    expect(firstRead).toBe(0)
    expect(loadProfile().comparisons).toHaveLength(1)
  })

  it('does not overwrite a returning visitor with the empty initial profile', () => {
    saveProfile(recordComparison(emptyProfile(), CATEGORY, [byId('fast'), byId('slow')]))
    mount(true)
    // One stored plus the one just recorded, de-duplicated to a single entry —
    // crucially, the stored profile was not wiped by the empty initial state.
    expect(loadProfile().comparisons).toHaveLength(1)
    expect(loadProfile().comparisons[0].ids).toEqual(['fast', 'slow'])
  })
})
