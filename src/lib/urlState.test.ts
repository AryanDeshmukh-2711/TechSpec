import { describe, expect, it } from 'vitest'
import { parseUrl } from './urlState'

describe('parseUrl', () => {
  it('reads screen, category, selection and weights', () => {
    const state = parseUrl('?v=compare&c=laptops&p=a,b,c&w=cpu:9,value:2')
    expect(state).toEqual({
      screen: 'compare',
      category: 'laptops',
      selection: ['a', 'b', 'c'],
      priorities: { cpu: 9, value: 2 },
    })
  })

  it('falls back to home for an unknown screen', () => {
    expect(parseUrl('?v=nonsense').screen).toBe('home')
    expect(parseUrl('').screen).toBe('home')
  })

  it('caps the selection at five products', () => {
    expect(parseUrl('?p=a,b,c,d,e,f,g').selection).toHaveLength(5)
  })

  it('drops empty ids from a trailing or doubled comma', () => {
    expect(parseUrl('?p=a,,b,').selection).toEqual(['a', 'b'])
  })

  it('clamps weights into the 0-10 range', () => {
    expect(parseUrl('?w=a:99,b:-4').priorities).toEqual({ a: 10, b: 0 })
  })

  it('ignores malformed weight pairs rather than throwing', () => {
    expect(parseUrl('?w=broken,a:3,:9').priorities).toEqual({ a: 3 })
  })

  it('treats a missing category as null', () => {
    expect(parseUrl('?v=picker').category).toBeNull()
  })
})

describe('buildSearch round trip', () => {
  it('survives a parse of its own output', async () => {
    const { buildSearch } = await import('./urlState')
    const original = {
      screen: 'compare' as const,
      category: 'mobiles' as const,
      selection: ['iphone-16-pro', 'galaxy-s25'],
      priorities: { camera: 9, battery: 1 },
    }
    expect(parseUrl(buildSearch(original))).toEqual(original)
  })

  it('omits neutral weights so a default link stays clean', async () => {
    const { buildSearch } = await import('./urlState')
    const search = buildSearch({
      screen: 'compare',
      category: 'mobiles',
      selection: ['a'],
      priorities: { camera: 5, battery: 5 },
    })
    expect(search).not.toContain('w=')
  })
})
