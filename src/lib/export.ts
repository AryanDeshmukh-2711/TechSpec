import type { Category, PersonaVerdict, ScoredProduct } from '@/types'
import { formatSpec } from './format'

/** CSV escaping: quote anything containing a delimiter, quote or newline. */
function csvCell(value: string): string {
  return /[",\n\r]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value
}

export function buildCsv(
  category: Category,
  scored: ScoredProduct[],
  verdicts: PersonaVerdict[],
): string {
  const rows: string[][] = []
  const names = scored.map((s) => s.product.name)

  rows.push(['TechSpec comparison', category.label])
  rows.push(['Generated', new Date().toISOString().slice(0, 10)])
  rows.push([])

  rows.push(['Spec', ...names])
  rows.push(['Brand', ...scored.map((s) => s.product.brand)])
  rows.push(['Price (USD)', ...scored.map((s) => String(s.product.price))])
  rows.push(['Overall score', ...scored.map((s) => String(s.overall))])
  rows.push(['Value index', ...scored.map((s) => String(s.value))])
  rows.push([])

  rows.push(['— Pillars —', ...names.map(() => '')])
  for (const pillar of category.pillars) {
    rows.push([pillar.label, ...scored.map((s) => String(Math.round(s.pillars[pillar.id] ?? 0)))])
  }
  rows.push([])

  let currentGroup = ''
  for (const def of category.specs) {
    if (def.internal) continue
    if (def.group !== currentGroup) {
      currentGroup = def.group
      rows.push([])
      rows.push([`— ${currentGroup.toUpperCase()} —`, ...names.map(() => '')])
    }
    rows.push([def.label, ...scored.map((s) => formatSpec(def, s.specs[def.key]?.raw ?? null))])
  }

  rows.push([])
  rows.push(['— Best for —', ...names.map(() => '')])
  for (const verdict of verdicts) {
    rows.push([verdict.persona.label, verdict.winner.product.name, verdict.reason])
  }

  return rows.map((row) => row.map((cell) => csvCell(cell ?? '')).join(',')).join('\r\n')
}

export function downloadFile(filename: string, content: string, mime: string): void {
  const blob = new Blob([content], { type: `${mime};charset=utf-8;` })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  // Give the browser a tick to start the download before revoking.
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

/** Plain-text summary — the format people actually paste into chat. */
export function buildTextSummary(
  category: Category,
  scored: ScoredProduct[],
  verdicts: PersonaVerdict[],
  url: string,
): string {
  const ranked = [...scored].sort((a, b) => b.overall - a.overall)
  const lines: string[] = []

  lines.push(`TechSpec — ${category.label} comparison`)
  lines.push('')
  ranked.forEach((s, i) => {
    lines.push(
      `${i + 1}. ${s.product.name} — ${s.overall}/100 · $${s.product.price.toLocaleString('en-US')}${
        s.onFrontier ? ' · best-in-price-class' : ''
      }`,
    )
  })
  lines.push('')
  lines.push('Best for:')
  for (const v of verdicts) {
    lines.push(`  • ${v.persona.label}: ${v.winner.product.name}`)
  }
  lines.push('')
  lines.push(url)

  return lines.join('\n')
}

export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text)
      return true
    }
  } catch {
    // Fall through to the legacy path below (clipboard API needs a secure
    // context and can be blocked by permissions policy).
  }

  try {
    const area = document.createElement('textarea')
    area.value = text
    area.setAttribute('readonly', '')
    area.style.position = 'fixed'
    area.style.opacity = '0'
    document.body.appendChild(area)
    area.select()
    const ok = document.execCommand('copy')
    document.body.removeChild(area)
    return ok
  } catch {
    return false
  }
}
