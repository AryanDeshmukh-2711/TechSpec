import { StrictMode, act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { ProfileProvider } from '@/personalisation/ProfileProvider'
import { emptyProfile, loadProfile, rememberPriorities, saveProfile } from '@/personalisation/profile'
import { AppStateProvider, useAppState } from './useAppState'

/**
 * The consumer half of the hydration contract.
 *
 * `AppStateProvider` sits inside `ProfileProvider`, so its mount effects run
 * first — before the stored profile exists. Priority seeding is one-shot per
 * category, so reading an empty profile there was unrecoverable: the weights
 * the user set last visit were replaced by neutral defaults and could not be
 * re-read. Deleting the `profile.ready` guard fails the second test below.
 *
 * The history test pins user-visible behaviour rather than that guard — the
 * recording survives without it, because the profile is persisted whenever it
 * settles. It is here to catch a future change that breaks the outcome.
 */

declare global {
  // eslint-disable-next-line no-var
  var IS_REACT_ACT_ENVIRONMENT: boolean
}

const A = 'iphone-16-pro-max'
const B = 'galaxy-s25-ultra'

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
  window.history.replaceState(null, '', '/')
})

let latest: ReturnType<typeof useAppState> | null = null

function Probe() {
  latest = useAppState()
  return null
}

/**
 * Boot the app at a URL, the way a shared link arrives.
 *
 * Inside `StrictMode`, because `main.tsx` renders inside it and the extra
 * mount/unmount/remount is precisely what shuffles these effects past each
 * other. Without it the bug this file guards does not reproduce.
 */
function openAt(search: string) {
  window.history.replaceState(null, '', search)
  act(() => {
    root.render(
      <StrictMode>
        <ProfileProvider>
          <AppStateProvider>
            <Probe />
          </AppStateProvider>
        </ProfileProvider>
      </StrictMode>,
    )
  })
}

describe('opening a comparison from a URL', () => {
  it('records it in history rather than dropping it on hydration', () => {
    openAt(`?v=compare&c=mobiles&p=${A},${B}`)

    const stored = loadProfile().comparisons
    expect(stored).toHaveLength(1)
    expect(stored[0].ids).toEqual([A, B])
    expect(stored[0].category).toBe('mobiles')
  })

  it('restores remembered weights instead of seeding neutral defaults', () => {
    saveProfile(
      rememberPriorities(emptyProfile(), 'mobiles', {
        display: 9,
        performance: 2,
        camera: 10,
        battery: 1,
        storage: 3,
        build: 4,
        value: 8,
      }),
    )

    openAt(`?v=compare&c=mobiles&p=${A},${B}`)

    // Seeding is one-shot per category: if it ran against an unhydrated
    // profile these would all be 5 and the real weights would be unreachable.
    expect(latest?.priorities.camera).toBe(10)
    expect(latest?.priorities.battery).toBe(1)
  })

  it('lets an explicit weight in the URL win over the remembered one', () => {
    saveProfile(rememberPriorities(emptyProfile(), 'mobiles', { camera: 10 }))
    openAt(`?v=compare&c=mobiles&p=${A},${B}&w=camera:1`)
    expect(latest?.priorities.camera).toBe(1)
  })
})
